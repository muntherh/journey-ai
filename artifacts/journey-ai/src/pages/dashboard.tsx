import { useState } from "react";
import { useGetDashboardOverview, useListJourneys } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Activity, Target, CheckCircle2, Flame, Plus, ArrowRight, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CheckinModal from "@/components/CheckinModal";

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useGetDashboardOverview();
  const { data: journeys, isLoading: loadingJourneys } = useListJourneys();

  const [checkinJourney, setCheckinJourney] = useState<{ id: string; title: string } | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Track your momentum across all goals.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Active Journeys" 
          value={stats?.activeJourneys} 
          icon={<Activity className="h-5 w-5 text-blue-500" />} 
          loading={loadingStats} 
        />
        <StatCard 
          title="Completed Goals" 
          value={stats?.completedJourneys} 
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} 
          loading={loadingStats} 
        />
        <StatCard 
          title="Tasks Finished" 
          value={stats?.completedTasks} 
          icon={<Target className="h-5 w-5 text-primary" />} 
          loading={loadingStats} 
        />
        <StatCard 
          title="Current Streak" 
          value={stats ? `${stats.currentStreak} days` : undefined} 
          icon={<Flame className="h-5 w-5 text-orange-500" />} 
          loading={loadingStats} 
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Journeys</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/new">
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Link>
          </Button>
        </div>

        {loadingJourneys ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : !journeys || journeys.length === 0 ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center border shadow-sm">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">No active journeys</h3>
                <p className="text-muted-foreground max-w-sm">
                  Ready to turn an ambition into an execution plan? Start your first journey today.
                </p>
              </div>
              <Button asChild>
                <Link href="/new">Create a Journey</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {journeys.map((j, i) => (
              <motion.div
                key={j.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all group flex flex-col">
                  <Link href={`/journey/${j.id}`} className="flex-1">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="line-clamp-2 text-lg leading-tight group-hover:text-primary transition-colors">
                          {j.title}
                        </CardTitle>
                        <Badge variant={j.status === "completed" ? "secondary" : "default"} className="capitalize shrink-0 ml-2">
                          {j.status}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2 mt-2 text-xs">
                        {j.summary}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span>{j.progressPercent}%</span>
                          <span className="text-muted-foreground">{j.completedTasks} / {j.totalTasks} tasks</span>
                        </div>
                        <Progress value={j.progressPercent} className="h-2" />
                      </div>
                      {j.nextTaskTitle && (
                        <div className="text-xs bg-muted/50 p-2.5 rounded-md flex items-center justify-between">
                          <span className="truncate text-muted-foreground pr-4">
                            Next: <span className="font-medium text-foreground">{j.nextTaskTitle}</span>
                          </span>
                          <ArrowRight className="h-3 w-3 shrink-0 opacity-50" />
                        </div>
                      )}
                    </CardContent>
                  </Link>
                  <div className="px-6 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5 text-muted-foreground hover:text-primary hover:border-primary/50"
                      onClick={(e) => {
                        e.preventDefault();
                        setCheckinJourney({ id: j.id, title: j.title });
                      }}
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      Weekly Check-in
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {checkinJourney && (
        <CheckinModal
          journeyId={checkinJourney.id}
          journeyTitle={checkinJourney.title}
          open={!!checkinJourney}
          onOpenChange={(v) => { if (!v) setCheckinJourney(null); }}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, loading }: { title: string, value?: number | string, icon: React.ReactNode, loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
        <div className="p-2 bg-muted/50 rounded-full">{icon}</div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-16 mx-auto" />
          ) : (
            <p className="text-2xl font-bold">{value ?? 0}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
