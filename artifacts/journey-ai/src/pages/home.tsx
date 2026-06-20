import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateJourney } from "@workspace/api-client-react";
import type { CreateJourneyBodyExperienceLevel } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Clock, Target, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  const [, setLocation] = useLocation();
  const createJourney = useCreateJourney();
  
  const [goal, setGoal] = useState("");
  const [timeline, setTimeline] = useState("");
  const [experience, setExperience] = useState<CreateJourneyBodyExperienceLevel>("beginner");
  
  const isGenerating = createJourney.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || goal.length < 4) return;
    
    createJourney.mutate(
      {
        data: {
          goalText: goal,
          timeline: timeline || null,
          experienceLevel: experience,
        },
      },
      {
        onSuccess: (j) => {
          setLocation(`/journey/${j.id}`);
        },
      }
    );
  };

  if (isGenerating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Crafting your execution plan...</h2>
            <p className="text-muted-foreground">The AI project manager is breaking your goal into actionable phases.</p>
          </div>
          
          <div className="space-y-3 text-left bg-card border rounded-xl p-6 shadow-sm">
            <SkeletonRow width="w-3/4" />
            <SkeletonRow width="w-1/2" />
            <SkeletonRow width="w-5/6" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="container max-w-3xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Turn vague ambition into weekly momentum</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground">
              What do you want to achieve?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Tell us your goal. We'll build a structured, step-by-step roadmap and help you execute it to completion.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container max-w-2xl mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-border shadow-lg shadow-black/5">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="goal" className="text-base font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Your Goal
                  </Label>
                  <Textarea
                    id="goal"
                    placeholder="e.g., Run a half marathon, build a SaaS MVP, learn Spanish..."
                    className="min-h-[120px] text-lg resize-none p-4"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="timeline" className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Timeline (Optional)
                    </Label>
                    <Select value={timeline} onValueChange={setTimeline}>
                      <SelectTrigger id="timeline">
                        <SelectValue placeholder="How long?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1 month">1 month</SelectItem>
                        <SelectItem value="3 months">3 months</SelectItem>
                        <SelectItem value="6 months">6 months</SelectItem>
                        <SelectItem value="1 year">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Current Experience
                    </Label>
                    <RadioGroup 
                      value={experience} 
                      onValueChange={(v) => setExperience(v as CreateJourneyBodyExperienceLevel)}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="beginner" id="r1" />
                        <Label htmlFor="r1" className="font-normal cursor-pointer">Beginner</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="intermediate" id="r2" />
                        <Label htmlFor="r2" className="font-normal cursor-pointer">Intermediate</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="advanced" id="r3" />
                        <Label htmlFor="r3" className="font-normal cursor-pointer">Advanced</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-lg h-14"
                  disabled={!goal.trim() || goal.length < 4}
                >
                  Generate My Plan
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}

function SkeletonRow({ width }: { width: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-muted animate-pulse shrink-0" />
      <div className={`h-4 bg-muted rounded animate-pulse ${width}`} />
    </div>
  );
}
