import React from "react";
import { SectionLabel } from "./BalanceSection";
import {
  useContractorStats,
  useMilestoneStats,
  usePaymentRequestStats,
} from "../../hooks/projects/useProjectOverview";

interface Props {
  projectId: string;
}

interface RingProps {
  value: number;
  total: number;
  color: string;
  label: string;
  size?: number;
}

const MiniRing: React.FC<RingProps> = ({
  value,
  total,
  color,
  label,
  size = 48,
}) => {
  const pct = total > 0 ? value / total : 0;
  const r = size / 2 - 4;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <span className="text-[10px] text-center leading-tight">{label}</span>
    </div>
  );
};

const Pill: React.FC<{ label: string; count: number; color: string }> = ({
  label,
  count,
  color,
}) => (
  <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      <span className="text-sm">{label}</span>
    </div>
    <span className="text-sm font-medium tabular-nums">{count}</span>
  </div>
);

const ContractorSection = ({ projectId }: Props) => {
  const { data: cs, isLoading: csLoading } = useContractorStats(projectId);
  const { data: ms, isLoading: msLoading } = useMilestoneStats(projectId);
  const { data: ps, isLoading: psLoading } = usePaymentRequestStats(projectId);

  return (
    <section>
      <SectionLabel icon="⚙" label="Contracts & work" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Contracts card */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <p className="text-[11px] text-black/25 uppercase tracking-widest mb-4">
            Contractors
          </p>
          {csLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-white/5 rounded" />
              ))}
            </div>
          ) : cs ? (
            <>
              <div className="flex justify-center mb-4">
                <MiniRing
                  value={cs.active_contracts}
                  total={cs.total_contracts}
                  color="#34d399"
                  label="active"
                  size={56}
                />
              </div>
              <Pill
                label="Total contracts"
                count={cs.total_contracts}
                color="#60a5fa"
              />
              <Pill
                label="Active"
                count={cs.active_contracts}
                color="#34d399"
              />
              <Pill
                label="Completed"
                count={cs.completed_contracts}
                color="#a78bfa"
              />
              <Pill label="Total bids" count={cs.total_bids} color="#94a3b8" />
              <Pill
                label="Pending bids"
                count={cs.pending_bids}
                color="#fbbf24"
              />
            </>
          ) : null}
        </div>

        {/* Milestones card */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <p className="text-[11px] text-white/25 uppercase tracking-widest mb-4">
            Milestones
          </p>
          {msLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-white/5 rounded" />
              ))}
            </div>
          ) : ms ? (
            <>
              <div className="flex justify-center mb-4">
                <MiniRing
                  value={ms.completed}
                  total={ms.total}
                  color="#a78bfa"
                  label="done"
                  size={56}
                />
              </div>
              <Pill label="Total" count={ms.total} color="#60a5fa" />
              <Pill label="Completed" count={ms.completed} color="#34d399" />
              <Pill
                label="In progress"
                count={ms.in_progress}
                color="#fbbf24"
              />
              <Pill label="Pending" count={ms.pending} color="#94a3b8" />
            </>
          ) : null}
        </div>

        {/* Payment requests card */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <p className="text-[11px] text-white/25 uppercase tracking-widest mb-4">
            Payments
          </p>
          {psLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-white/5 rounded" />
              ))}
            </div>
          ) : ps ? (
            <>
              <div className="flex justify-center mb-4">
                <MiniRing
                  value={ps.approved}
                  total={ps.total}
                  color="#34d399"
                  label="approved"
                  size={56}
                />
              </div>
              <Pill label="Total requests" count={ps.total} color="#60a5fa" />
              <Pill label="Approved" count={ps.approved} color="#34d399" />
              <Pill label="Pending" count={ps.pending} color="#fbbf24" />
              <Pill label="Declined" count={ps.declined} color="#f87171" />
              <div className="pt-2 mt-1 border-t border-white/[0.05]">
                <p className="text-[11px] text-white/25 mb-0.5">
                  Total requested
                </p>
                <p className="text-sm font-medium text-white/70">
                  {ps.total_amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default ContractorSection;
