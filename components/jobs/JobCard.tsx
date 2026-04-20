import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Tag, MessageSquare } from "lucide-react";
import { Job, JobStatus } from "@/lib/api";

const STATUS_CONFIG: Record<JobStatus, { label: string; class: string }> = {
  OPEN: { label: "Open", class: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  IN_PROGRESS: { label: "In Progress", class: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
  COMPLETED: { label: "Completed", class: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
  DISPUTED: { label: "Disputed", class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
  CANCELLED: { label: "Cancelled", class: "bg-muted text-muted-foreground border-border" },
};

interface JobCardProps {
  job: Job;
  actionHref?: string;
  actionLabel?: string;
}

export function JobCard({ job, actionHref, actionLabel }: JobCardProps) {
  const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.OPEN;

  return (
    <Card className="gradient-border-card bg-card hover:shadow-md transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-foreground font-medium line-clamp-2 flex-1 leading-snug font-ui">
            {job.title}
          </h3>
          <Badge className={`flex-shrink-0 text-xs border ${status.class}`}>
            {status.label}
          </Badge>
        </div>

        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed font-ui">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-ui">
            <Tag className="w-3.5 h-3.5" />
            <span className="capitalize">{job.categoryRef?.name ?? job.category}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-ui">
            <DollarSign className="w-3.5 h-3.5" />
            ${job.budgetMin}–${job.budgetMax}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-ui">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(job.deadline).toLocaleDateString()}
          </span>
          {job.proposalCount != null && (
            <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-ui">
              <MessageSquare className="w-3.5 h-3.5" />
              {job.proposalCount} proposal{job.proposalCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-ui">
            {new Date(job.createdAt).toLocaleDateString()}
          </span>
          {actionHref && (
            <Link href={actionHref}>
              <Button size="sm" variant="outline" className="border-border text-muted-foreground hover:border-[#b57e04] hover:text-[#b57e04] text-xs font-ui">
                {actionLabel ?? "View"}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
