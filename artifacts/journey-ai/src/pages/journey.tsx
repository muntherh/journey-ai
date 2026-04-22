import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetJourney, getGetJourneyQueryKey,
  useGetJourneySummary, getGetJourneySummaryQueryKey,
  useGetJourneyActivity, getGetJourneyActivityQueryKey,
  useUpdateTask,
  useCreateTask,
  useUpdateJourney,
  useDeleteJourney,
  useListCoachMessages, getListCoachMessagesQueryKey,
  useSendCoachMessage,
  getGetDashboardOverviewQueryKey,
  getListJourneysQueryKey
} from "@workspace/api-client-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, Circle, MoreVertical, Play, Pause, Trash2, Archive, 
  MessageSquare, Plus, Clock, Target, CalendarDays, Activity, ChevronRight,
  Send, Sparkles, AlertCircle, Youtube, StickyNote, RefreshCw, ExternalLink, X, Pencil, Paperclip, FileText, Image as ImageIcon, File as FileIcon, Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function JourneyDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: journey, isLoading: loadingJourney } = useGetJourney(id, { query: { enabled: !!id, queryKey: getGetJourneyQueryKey(id) } });
  const { data: summary, isLoading: loadingSummary } = useGetJourneySummary(id, { query: { enabled: !!id, queryKey: getGetJourneySummaryQueryKey(id) } });
  const { data: activity, isLoading: loadingActivity } = useGetJourneyActivity(id, { query: { enabled: !!id, queryKey: getGetJourneyActivityQueryKey(id) } });
  
  const updateJourney = useUpdateJourney();
  const deleteJourney = useDeleteJourney();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetJourneyQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetJourneySummaryQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetJourneyActivityQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListJourneysQueryKey() });
  };

  const handleStatusChange = (status: "active" | "paused" | "completed" | "archived") => {
    updateJourney.mutate(
      { id, data: { status } },
      { onSuccess: () => invalidateAll() }
    );
  };

  const handleDelete = () => {
    deleteJourney.mutate(
      { id },
      { 
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListJourneysQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
          setLocation("/dashboard");
        }
      }
    );
  };

  if (loadingJourney || loadingSummary) {
    return <JourneySkeleton />;
  }

  if (!journey || !summary) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Journey Not Found</h2>
        <p className="text-muted-foreground">The journey you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content - Left 2 Columns */}
      <div className="lg:col-span-2 space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={journey.status === "active" ? "default" : "secondary"} className="capitalize">
                  {journey.status}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Started {format(new Date(journey.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{journey.title}</h1>
              <p className="text-muted-foreground mt-2">{journey.summary}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {journey.status !== "active" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("active")}>
                    <Play className="mr-2 h-4 w-4" /> Resume Journey
                  </DropdownMenuItem>
                )}
                {journey.status === "active" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("paused")}>
                    <Pause className="mr-2 h-4 w-4" /> Pause Journey
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusChange("archived")}>
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-primary flex items-center gap-2">
                    <Target className="h-4 w-4" /> Overall Progress
                  </span>
                  <span>{summary.progressPercent}% ({summary.completedTasks}/{summary.totalTasks})</span>
                </div>
                <Progress value={summary.progressPercent} className="h-3 bg-primary/20" />
                {summary.nextTaskTitle && (
                  <p className="text-sm pt-2 border-t border-primary/10">
                    <span className="text-muted-foreground">Up next:</span> <span className="font-medium">{summary.nextTaskTitle}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phases */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Execution Plan</h2>
          
          <Accordion type="multiple" defaultValue={summary.currentPhaseId ? [summary.currentPhaseId] : undefined} className="space-y-4">
            {journey.phases.map((phase, index) => (
              <PhaseItem 
                key={phase.id} 
                phase={phase} 
                journeyId={id}
                index={index}
                isCurrent={phase.id === summary.currentPhaseId}
                progress={summary.phaseBreakdown.find(p => p.phaseId === phase.id)}
              />
            ))}
          </Accordion>
        </div>
      </div>

      {/* Sidebar - Right Column */}
      <div className="space-y-6">
        {/* Coach Widget */}
        <Card className="border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Sparkles className="h-24 w-24 text-primary" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              AI Coach
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your personal project manager is here to help you stay unblocked and on track.
            </p>
            <Drawer open={isCoachOpen} onOpenChange={setIsCoachOpen}>
              <DrawerTrigger asChild>
                <Button className="w-full">Open Chat</Button>
              </DrawerTrigger>
              <DrawerContent className="h-[85vh]">
                <div className="max-w-2xl mx-auto w-full h-full flex flex-col pt-6 pb-4 px-4">
                  <DrawerHeader className="px-0 pt-0 pb-4">
                    <DrawerTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Coach Chat
                    </DrawerTitle>
                  </DrawerHeader>
                  <CoachChat journeyId={id} />
                </div>
              </DrawerContent>
            </Drawer>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !activity || activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {activity.map((event) => (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border bg-background text-muted-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      {event.type === 'task_completed' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {event.type === 'task_added' && <Plus className="h-4 w-4 text-primary" />}
                      {event.type === 'coach_reply' && <Sparkles className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded border bg-card shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-foreground">{event.title}</span>
                      </div>
                      <time className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(event.timestamp))} ago</time>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Journey</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{journey.title}"? This action cannot be undone and will remove all phases, tasks, and coach history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteJourney.isPending}>
              {deleteJourney.isPending ? "Deleting..." : "Delete Journey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Phase & Task Components ---

function PhaseItem({ phase, journeyId, index, isCurrent, progress }: any) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  
  const queryClient = useQueryClient();
  const createTask = useCreateTask();

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    createTask.mutate(
      { id: phase.id, data: { title: newTaskTitle } },
      {
        onSuccess: () => {
          setNewTaskTitle("");
          setIsAddingTask(false);
          queryClient.invalidateQueries({ queryKey: getGetJourneyQueryKey(journeyId) });
          queryClient.invalidateQueries({ queryKey: getGetJourneySummaryQueryKey(journeyId) });
          queryClient.invalidateQueries({ queryKey: getGetJourneyActivityQueryKey(journeyId) });
        }
      }
    );
  };

  return (
    <AccordionItem value={phase.id} className="border bg-card rounded-xl overflow-hidden shadow-sm data-[state=open]:border-primary/30 transition-colors">
      <AccordionTrigger className="px-6 py-4 hover:no-underline group">
        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 text-left">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Phase {index + 1}</span>
              {isCurrent && <Badge variant="default" className="text-[10px] h-5">Current</Badge>}
              {progress?.progressPercent === 100 && <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-100"><CheckCircle2 className="h-3 w-3 mr-1"/>Done</Badge>}
            </div>
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{phase.title}</h3>
          </div>
          
          <div className="w-full md:w-48 space-y-2 shrink-0">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>{progress?.progressPercent || 0}%</span>
              <span>{progress?.completedTasks || 0}/{progress?.totalTasks || phase.tasks.length}</span>
            </div>
            <Progress value={progress?.progressPercent || 0} className="h-1.5" />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6 pt-2 border-t bg-muted/10">
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{phase.description}</p>
        
        <div className="space-y-2 mb-4">
          {phase.tasks.map((task: any) => (
            <TaskItem key={task.id} task={task} journeyId={journeyId} />
          ))}
        </div>

        {isAddingTask ? (
          <form onSubmit={handleAddTask} className="flex gap-2 items-center mt-4">
            <Input 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="flex-1 bg-background"
            />
            <Button type="submit" size="sm" disabled={!newTaskTitle.trim() || createTask.isPending}>Add</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingTask(false)}>Cancel</Button>
          </form>
        ) : (
          <Button variant="outline" size="sm" className="mt-2 text-muted-foreground border-dashed" onClick={() => setIsAddingTask(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  skipped: "Skipped",
};

const STATUS_BADGE: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  skipped: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const NEXT_STATUS: Record<string, "not_started" | "in_progress" | "completed" | "skipped"> = {
  not_started: "in_progress",
  in_progress: "completed",
  completed: "skipped",
  skipped: "not_started",
};

function TaskItem({ task, journeyId }: { task: any, journeyId: string }) {
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState(task.userResource ?? "");
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteValue, setNoteValue] = useState(task.note ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = task.status ?? (task.isCompleted ? "completed" : "not_started");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetJourneyQueryKey(journeyId) });
    queryClient.invalidateQueries({ queryKey: getGetJourneySummaryQueryKey(journeyId) });
    queryClient.invalidateQueries({ queryKey: getGetJourneyActivityQueryKey(journeyId) });
    queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
  };

  const optimisticPatch = (patch: Record<string, unknown>) => {
    queryClient.setQueryData(getGetJourneyQueryKey(journeyId), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        phases: old.phases.map((p: any) => ({
          ...p,
          tasks: p.tasks.map((t: any) => t.id === task.id ? { ...t, ...patch } : t)
        }))
      };
    });
  };

  const handleToggle = (checked: boolean) => {
    const newStatus = checked ? "completed" : "not_started";
    optimisticPatch({ isCompleted: checked, status: newStatus });
    updateTask.mutate(
      { id: task.id, data: { status: newStatus } },
      { onSuccess: invalidate, onError: invalidate }
    );
  };

  const handleCycleStatus = () => {
    const next = NEXT_STATUS[status] ?? "not_started";
    optimisticPatch({ status: next, isCompleted: next === "completed" });
    updateTask.mutate(
      { id: task.id, data: { status: next } },
      { onSuccess: invalidate, onError: invalidate }
    );
  };

  const handleSaveEdit = () => {
    if (title !== task.title && title.trim()) {
      updateTask.mutate(
        { id: task.id, data: { title } },
        { onSuccess: invalidate }
      );
    }
    setIsEditing(false);
  };

  const handleSaveLink = () => {
    const v = linkValue.trim();
    optimisticPatch({ userResource: v || null });
    updateTask.mutate(
      { id: task.id, data: { userResource: v ? v : null } },
      { onSuccess: invalidate }
    );
    setLinkOpen(false);
  };

  const handleClearLink = () => {
    setLinkValue("");
    optimisticPatch({ userResource: null });
    updateTask.mutate(
      { id: task.id, data: { userResource: null } },
      { onSuccess: invalidate }
    );
    setLinkOpen(false);
  };

  const handleSaveNote = () => {
    optimisticPatch({ note: noteValue });
    updateTask.mutate(
      { id: task.id, data: { note: noteValue } },
      { onSuccess: invalidate }
    );
    setNoteOpen(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const reqRes = await fetch(`${import.meta.env.BASE_URL}api/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });
      if (!reqRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await reqRes.json();
      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");
      const data = {
        attachmentUrl: objectPath,
        attachmentName: file.name,
        attachmentType: file.type || "application/octet-stream",
      };
      optimisticPatch(data);
      updateTask.mutate(
        { id: task.id, data },
        { onSuccess: invalidate }
      );
    } catch (err: any) {
      setUploadError(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    const data = { attachmentUrl: null, attachmentName: null, attachmentType: null };
    optimisticPatch(data);
    updateTask.mutate(
      { id: task.id, data },
      { onSuccess: invalidate }
    );
  };

  const fileHref = task.attachmentUrl
    ? `${import.meta.env.BASE_URL}api/storage${task.attachmentUrl}`
    : null;
  const FileTypeIcon = task.attachmentType?.startsWith("image/")
    ? ImageIcon
    : task.attachmentType === "application/pdf"
    ? FileText
    : FileIcon;

  return (
    <motion.div 
      initial={false}
      animate={{ opacity: status === "completed" || status === "skipped" ? 0.7 : 1 }}
      className="group p-3 rounded-md transition-colors hover:bg-background border border-transparent hover:border-border space-y-2"
    >
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={status === "completed"}
          onCheckedChange={handleToggle}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              className="h-8"
              autoFocus
            />
          ) : (
            <div className="cursor-pointer" onClick={() => setIsEditing(true)}>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-medium ${status === "completed" ? 'line-through text-muted-foreground' : ''} ${status === "skipped" ? 'text-muted-foreground italic' : ''}`}>
                  {task.title}
                </p>
                <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_BADGE[status]}`}>
                  {STATUS_LABEL[status]}
                </span>
              </div>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Cycle status" onClick={handleCycleStatus}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${task.userResource ? "text-red-500" : ""}`} title="Add YouTube link" onClick={() => { setLinkValue(task.userResource ?? ""); setLinkOpen(true); }}>
            <Youtube className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${task.note ? "text-amber-500" : ""}`} title="Add note" onClick={() => { setNoteValue(task.note ?? ""); setNoteOpen(true); }}>
            <StickyNote className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${task.attachmentUrl ? "text-blue-500" : ""}`} title="Attach file" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {task.userResource && (
        <a href={task.userResource} target="_blank" rel="noreferrer" className="ml-8 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
          <Youtube className="h-3 w-3" /> Open video <ExternalLink className="h-3 w-3" />
        </a>
      )}

      {task.note && (
        <div className="ml-8 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 rounded p-2 flex gap-2">
          <StickyNote className="h-3 w-3 mt-0.5 shrink-0 text-amber-600" />
          <span className="whitespace-pre-wrap">{task.note}</span>
        </div>
      )}

      {task.attachmentUrl && fileHref && (
        <div className="ml-8 flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 rounded p-2">
          <FileTypeIcon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
          <a href={fileHref} target="_blank" rel="noreferrer" className="text-blue-700 dark:text-blue-300 hover:underline truncate flex-1">
            {task.attachmentName ?? "Attachment"}
          </a>
          <button type="button" onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive shrink-0" title="Remove file">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="ml-8 text-xs text-destructive">{uploadError}</div>
      )}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach a video</DialogTitle>
            <DialogDescription>Paste a YouTube URL to learn this step.</DialogDescription>
          </DialogHeader>
          <Input
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            autoFocus
          />
          <DialogFooter>
            {task.userResource && (
              <Button variant="outline" onClick={handleClearLink}>
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            )}
            <Button variant="ghost" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLink}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note</DialogTitle>
            <DialogDescription>Capture context, links, or reminders for this step.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder="Type a note..."
            rows={5}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNote}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// --- Coach Chat Component ---

function CoachChat({ journeyId }: { journeyId: string }) {
  const { data: messages, isLoading } = useListCoachMessages(journeyId, { query: { enabled: !!journeyId, queryKey: getListCoachMessagesQueryKey(journeyId) } });
  const sendMsg = useSendCoachMessage();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [content, setContent] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMsg.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sendMsg.isPending) return;

    const msg = content;
    setContent("");
    
    sendMsg.mutate(
      { id: journeyId, data: { content: msg } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCoachMessagesQueryKey(journeyId) });
        }
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background rounded-xl border">
      <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4 rounded-xl rounded-tl-sm" />
            <Skeleton className="h-16 w-3/4 rounded-xl rounded-tr-sm ml-auto" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-50">
            <MessageSquare className="h-12 w-12" />
            <p>No messages yet. Ask your coach for advice, motivation, or help breaking down a tough task.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  {msg.role === 'coach' && <Sparkles className="h-3 w-3 text-primary" />}
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {msg.role === 'user' ? 'You' : 'Coach'}
                  </span>
                </div>
                <div className={`px-4 py-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                    : 'bg-muted rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {format(new Date(msg.createdAt), 'h:mm a')}
                </span>
              </div>
            ))}
            {sendMsg.isPending && (
              <div className="flex flex-col max-w-[80%] mr-auto items-start">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Coach</span>
                </div>
                <div className="px-4 py-4 rounded-2xl rounded-tl-sm bg-muted flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
      
      <div className="p-4 border-t bg-card mt-auto">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ask your coach anything..."
            className="flex-1 bg-background"
            disabled={sendMsg.isPending}
          />
          <Button type="submit" size="icon" disabled={!content.trim() || sendMsg.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function JourneySkeleton() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );
}