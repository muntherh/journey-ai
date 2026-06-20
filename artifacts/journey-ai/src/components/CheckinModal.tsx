import { useState } from "react";
import { useCreateCheckIn, useListCheckIns, getListCheckInsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, ChevronDown, ChevronUp, CalendarCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface CheckinModalProps {
  journeyId: string;
  journeyTitle: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function RatingStars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`transition-colors ${n <= value ? "text-amber-400" : "text-muted-foreground/30 hover:text-amber-300"}`}
        >
          <Star className={`h-7 w-7 ${n <= value ? "fill-amber-400" : ""}`} />
        </button>
      ))}
    </div>
  );
}

function PastCheckin({ c }: { c: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium">{format(new Date(c.createdAt), "MMM d, yyyy")}</span>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((n) => (
              <Star key={n} className={`h-3 w-3 ${n <= c.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
            ))}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t pt-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">What I accomplished</p>
                <p className="text-sm">{c.accomplished}</p>
              </div>
              {c.blockers && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Blockers</p>
                  <p className="text-sm">{c.blockers}</p>
                </div>
              )}
              {c.aiFeedback && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Coach feedback</p>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.aiFeedback}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CheckinModal({ journeyId, journeyTitle, open, onOpenChange }: CheckinModalProps) {
  const queryClient = useQueryClient();
  const { data: history, isLoading: loadingHistory } = useListCheckIns(journeyId, {
    query: { enabled: open && !!journeyId, queryKey: getListCheckInsQueryKey(journeyId) },
  });
  const createCheckIn = useCreateCheckIn();

  const [view, setView] = useState<"form" | "result">("form");
  const [accomplished, setAccomplished] = useState("");
  const [rating, setRating] = useState(0);
  const [blockers, setBlockers] = useState("");
  const [result, setResult] = useState<any>(null);

  const resetForm = () => {
    setAccomplished("");
    setRating(0);
    setBlockers("");
    setResult(null);
    setView("form");
  };

  const handleClose = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accomplished.trim() || rating === 0) return;
    createCheckIn.mutate(
      { id: journeyId, data: { accomplished, rating, blockers } },
      {
        onSuccess: (data) => {
          setResult(data);
          setView("result");
          queryClient.invalidateQueries({ queryKey: getListCheckInsQueryKey(journeyId) });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Weekly Check-in
          </DialogTitle>
          <DialogDescription className="text-xs">{journeyTitle}</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {view === "form" ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label>What did you accomplish this week?</Label>
                <Textarea
                  value={accomplished}
                  onChange={(e) => setAccomplished(e.target.value)}
                  placeholder="Completed the first 3 tasks, set up my workspace, watched 2 tutorials..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>How would you rate your progress?</Label>
                <RatingStars value={rating} onChange={setRating} />
                {rating > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {["", "Behind where I wanted to be", "Made some progress", "Solid week", "Really productive", "Crushed it"][rating]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Any blockers or obstacles? <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  placeholder="Ran out of time on Thursday, unclear on how to approach task X..."
                  rows={2}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!accomplished.trim() || rating === 0 || createCheckIn.isPending}
              >
                {createCheckIn.isPending ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-pulse" /> Getting coach feedback...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Submit & get feedback
                  </span>
                )}
              </Button>

              {history && history.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Past check-ins</p>
                    {history.slice(0, 3).map((c: any) => (
                      <PastCheckin key={c.id} c={c} />
                    ))}
                  </div>
                </>
              )}
            </motion.form>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 rounded-xl p-4 text-center space-y-1">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">Check-in saved</p>
                <div className="flex justify-center gap-0.5">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className={`h-4 w-4 ${n <= (result?.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                  ))}
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-primary">Coach Feedback</p>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{result?.aiFeedback}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={resetForm}>
                  New check-in
                </Button>
                <Button className="flex-1" onClick={() => handleClose(false)}>
                  Done
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loadingHistory && view === "form" && (
          <div className="space-y-2 mt-2">
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
