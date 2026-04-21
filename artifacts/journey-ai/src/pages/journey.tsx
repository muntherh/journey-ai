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
  Send, Sparkles, AlertCircle
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

function TaskItem({ task, journeyId }: { task: any, journeyId: string }) {
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = (checked: boolean) => {
    // Optimistic update
    queryClient.setQueryData(getGetJourneyQueryKey(journeyId), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        phases: old.phases.map((p: any) => ({
          ...p,
          tasks: p.tasks.map((t: any) => t.id === task.id ? { ...t, isCompleted: checked } : t)
        }))
      };
    });

    updateTask.mutate(
      { id: task.id, data: { isCompleted: checked } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetJourneyQueryKey(journeyId) });
          queryClient.invalidateQueries({ queryKey: getGetJourneySummaryQueryKey(journeyId) });
          queryClient.invalidateQueries({ queryKey: getGetJourneyActivityQueryKey(journeyId) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
        },
        onError: () => {
          // Revert on error
          queryClient.invalidateQueries({ queryKey: getGetJourneyQueryKey(journeyId) });
        }
      }
    );
  };

  const handleSaveEdit = () => {
    if (title !== task.title && title.trim()) {
      updateTask.mutate(
        { id: task.id, data: { title } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetJourneyQueryKey(journeyId) }) }
      );
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 bg-background rounded-md border">
        <Input 
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
          className="h-8"
          autoFocus
        />
      </div>
    );
  }

  return (
    <motion.div 
      initial={false}
      animate={{ opacity: task.isCompleted ? 0.6 : 1 }}
      className={`group flex items-start gap-3 p-3 rounded-md transition-colors hover:bg-background border border-transparent hover:border-border`}
    >
      <Checkbox 
        checked={task.isCompleted} 
        onCheckedChange={handleToggle}
        className="mt-0.5"
      />
      <div className="flex-1 cursor-pointer" onClick={() => !task.isCompleted && setIsEditing(true)}>
        <p className={`text-sm font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
        )}
      </div>
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