import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Tag, MessageSquare } from "lucide-react";
import { Job, JobStatus } from "@/lib/api";

const STATUS_CONFIG: Record<JobStatus, { label: string; class: string }> = {
  OPEN: { label: "Open", class: "bg-blue-900/50 text-blue-300 border-blue-800" },
  IN_PROGRESS: { label: "In Progress", class: "bg-amber-900/50 text-amber-300 border-amber-800" },
  COMPLETED: { label: "Completed", class: "bg-emerald-900/50 text-emerald-300 border-emerald-800" },
  DISPUTED: { label: "Disputed", class: "bg-red-900/50 text-red-300 border-red-800" },
  CANCELLED: { label: "Cancelled", class: "bg-gray-800 text-gray-400 border-gray-700" },
};

interface JobCardProps {
  job: Job;
  actionHref?: string;
  actionLabel?: string;
}

export function JobCard({ job, actionHref, actionLabel }: JobCardProps) {
  const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.OPEN;

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-white font-medium line-clamp-2 flex-1 leading-snug">
            {job.title}
          </h3>
          <Badge className={`flex-shrink-0 text-xs border ${status.class}`}>
            {status.label}
          </Badge>
        </div>

        <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          <span className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Tag className="w-3.5 h-3.5" />
            <span className="capitalize">{job.category}</span>
          </span>
          <span className="flex items-center gap-1.5 text-gray-500 text-xs">
            <DollarSign className="w-3.5 h-3.5" />
            ${job.budgetMin}–${job.budgetMax}
          </span>
          <span className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(job.deadline).toLocaleDateString()}
          </span>
          {job.proposalCount != null && (
            <span className="flex items-center gap-1.5 text-gray-500 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              {job.proposalCount} proposal{job.proposalCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-xs">
            {new Date(job.createdAt).toLocaleDateString()}
          </span>
          {actionHref && (
            <Link href={actionHref}>
              <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:border-indigo-500 text-xs">
                {actionLabel ?? "View"}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
