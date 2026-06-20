import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Brain, BarChart2, RefreshCw, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const EXAMPLE_JOURNEYS = [
  { title: "Learn Spanish in 3 months", tag: "Language" },
  { title: "Build a SaaS MVP in 8 weeks", tag: "Product" },
  { title: "Run a half marathon", tag: "Fitness" },
  { title: "Write and publish a book", tag: "Creative" },
  { title: "Master machine learning", tag: "Tech" },
  { title: "Launch a YouTube channel", tag: "Creator" },
];

const FEATURES = [
  {
    icon: <Brain className="h-6 w-6 text-primary" />,
    title: "AI-generated roadmap",
    desc: "Describe your goal in plain English. Get a structured, phase-by-phase execution plan built around your timeline and experience level.",
  },
  {
    icon: <BarChart2 className="h-6 w-6 text-primary" />,
    title: "Progress tracking",
    desc: "Check off tasks, mark phases complete, and watch your progress bar climb. Stay accountable with a daily streak counter.",
  },
  {
    icon: <RefreshCw className="h-6 w-6 text-primary" />,
    title: "Weekly AI adaptation",
    desc: "Submit a weekly check-in and your AI coach reviews your progress, unblocks obstacles, and reprioritizes what matters next.",
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)]">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-primary/5 via-background to-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full">
            <Compass className="h-4 w-4" />
            AI-powered goal execution
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Turn any goal into a{" "}
            <span className="text-primary">structured journey</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop staring at a blank page. Describe what you want to achieve — Journey AI
            breaks it into phases, tasks, and a weekly coaching loop that adapts as you go.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button size="lg" className="text-base px-8" onClick={() => setLocation("/new")}>
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" onClick={() => setLocation("/dashboard")}>
              View dashboard
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Example journeys */}
      <section className="py-16 px-4 border-t bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">
            People are building journeys like these
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EXAMPLE_JOURNEYS.map((j, i) => (
              <motion.div
                key={j.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-background border rounded-xl p-4 flex flex-col gap-2 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => setLocation("/new")}
              >
                <Badge variant="secondary" className="w-fit text-[10px]">{j.tag}</Badge>
                <p className="text-sm font-medium group-hover:text-primary transition-colors leading-snug">{j.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14">Everything you need to follow through</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 border-t bg-primary/5 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl mx-auto space-y-6"
        >
          <h2 className="text-3xl font-bold">Ready to stop planning and start doing?</h2>
          <p className="text-muted-foreground">
            Paste in your goal. In under a minute you'll have a full execution plan.
          </p>
          <Button size="lg" className="px-10 text-base" onClick={() => setLocation("/new")}>
            Build my journey <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
