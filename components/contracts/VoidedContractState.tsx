"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/api";

interface VoidedContractStateProps {
  role: UserRole;
  jobId?: string;
}

export function VoidedContractState({ role, jobId }: VoidedContractStateProps) {
  const isBuyer = role === "BUYER";

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-5">
        <XCircle className="w-9 h-9 text-red-500" />
      </div>

      <h2 className="text-xl font-display font-bold text-foreground mb-2">
        Contract Voided
      </h2>

      {isBuyer ? (
        <>
          <p className="text-muted-foreground font-ui text-sm leading-relaxed mb-6">
            This contract was voided because payment was not received within the 24-hour window.
            Your job has been reopened and is accepting new proposals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {jobId && (
              <Link href={`/jobs/${jobId}`}>
                <Button className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium w-full sm:w-auto">
                  View New Proposals
                </Button>
              </Link>
            )}
            <Link href="/post-task">
              <Button variant="outline" className="border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui w-full sm:w-auto">
                Post a New Task
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground font-ui text-sm leading-relaxed">
          The buyer did not complete payment within the required window. This contract has been
          cancelled. No action is required from you.
        </p>
      )}
    </div>
  );
}
