import { useParams, useLocation } from "wouter";
import { useGetJourney, getGetJourneyQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { CheckCircle2, Circle, Compass, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: journey, isLoading, isError } = useGetJourney(id, {
    query: { enabled: !!id, queryKey: getGetJourneyQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !journey) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Journey not found</h2>
        <p className="text-muted-foreground">This link may be invalid or the journey has been deleted.</p>
        <Button onClick={() => setLocation("/")}>Go to Journey AI</Button>
      </div>
    );
  }

  const allTasks = journey.phases.flatMap((p) => p.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.isCompleted).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Minimal header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Compass className="h-4 w-4 text-primary" />
            Journey AI
          </div>
          <Button size="sm" onClick={() => setLocation("/new")}>
            Create your own
          </Button>
        </div>
      </header>

      <div className="container max-w-3xl mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="capitalize">{journey.status}</Badge>
            <span className="text-sm text-muted-foreground">
              Started {format(new Date(journey.createdAt), "MMM d, yyyy")}
            </span>
            <Badge variant="secondary" className="text-xs">Read-only</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{journey.title}</h1>
          <p className="text-muted-foreground">{journey.summary}</p>
        </div>

        {/* Progress */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-primary">Overall Progress</span>
            <span>{progressPercent}% ({completedTasks}/{totalTasks})</span>
          </div>
          <Progress value={progressPercent} className="h-3 bg-primary/20" />
        </div>

        {/* Phases */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Execution Plan</h2>
          {journey.phases
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((phase, idx) => {
              const phaseTasks = phase.tasks.slice().sort((a, b) => a.orderIndex - b.orderIndex);
              const done = phaseTasks.filter((t) => t.isCompleted).length;
              const pct = phaseTasks.length === 0 ? 0 : Math.round((done / phaseTasks.length) * 100);
              return (
                <div key={phase.id} className="border rounded-xl overflow-hidden">
                  <div className="px-6 py-4 bg-muted/30 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Phase {idx + 1} {phase.estimatedDuration && `· ${phase.estimatedDuration}`}
                      </p>
                      <h3 className="font-semibold">{phase.title}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground mb-1">{done}/{phaseTasks.length}</p>
                      <Progress value={pct} className="w-24 h-1.5" />
                    </div>
                  </div>
                  {phase.description && (
                    <p className="px-6 py-3 text-sm text-muted-foreground border-b">{phase.description}</p>
                  )}
                  <ul className="divide-y">
                    {phaseTasks.map((task) => (
                      <li key={task.id} className="px-6 py-3 flex items-start gap-3">
                        {task.isCompleted
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          : <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>

        {/* Footer CTA */}
        <div className="text-center py-6 border-t space-y-4">
          <p className="text-muted-foreground text-sm">Want to build your own structured journey?</p>
          <Button onClick={() => setLocation("/new")}>
            Start for free <span className="ml-1">→</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
