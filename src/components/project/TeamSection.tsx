import React from "react";
import { SectionLabel, EmptyState } from "./BalanceSection";
import { useAssignmentStats } from "../../hooks/projects/useProjectOverview";

interface Props {
  projectId: string;
}

const getInitials = (first: string, last: string | null) =>
  [first.charAt(0), last?.charAt(0)].filter(Boolean).join("").toUpperCase();

// Simple deterministic color from a string
const getAvatarColor = (name: string): string => {
  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#3b82f6",
    "#f59e0b",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const TeamSection = ({ projectId }: Props) => {
  const { data, isLoading } = useAssignmentStats(projectId);

  return (
    <section>
      <SectionLabel icon="◎" label="Team assignments" />

      {isLoading ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0"
            >
              <div className="w-9 h-9 rounded-full bg-white/10" />
              <div className="flex-1">
                <div className="h-4 bg-white/5 rounded w-32 mb-1" />
                <div className="h-3 bg-white/5 rounded w-20" />
              </div>
              <div className="h-4 bg-white/5 rounded w-10" />
            </div>
          ))}
        </div>
      ) : !data || data.assignments.length === 0 ? (
        <EmptyState message="No team members assigned yet" />
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          {/* Summary bar */}
          <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
            <span className="text-xs text-white/30">
              {data.total_assigned} member{data.total_assigned !== 1 ? "s" : ""}{" "}
              assigned
            </span>
            {/* Stacked avatars preview */}
            <div className="flex -space-x-2">
              {data.assignments.slice(0, 5).map((a) => {
                const color = getAvatarColor(a.first_name);
                return (
                  <div
                    key={a.user_id}
                    title={`${a.first_name} ${a.last_name ?? ""}`}
                    className="w-6 h-6 rounded-full border border-[#0d0d0d] flex items-center justify-center text-[9px] font-medium text-white"
                    style={{ background: color }}
                  >
                    {getInitials(a.first_name, a.last_name)}
                  </div>
                );
              })}
              {data.total_assigned > 5 && (
                <div className="w-6 h-6 rounded-full border border-[#0d0d0d] bg-white/10 flex items-center justify-center text-[9px] text-white/40">
                  +{data.total_assigned - 5}
                </div>
              )}
            </div>
          </div>

          {/* Member rows */}
          <div className="divide-y divide-white/[0.05]">
            {data.assignments.map((member) => {
              const color = getAvatarColor(member.first_name);
              const fullName = [member.first_name, member.last_name]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium text-white"
                    style={{ background: color + "33", color }}
                  >
                    {getInitials(member.first_name, member.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/75 truncate">
                      {fullName}
                    </p>
                    {member.role && (
                      <p className="text-[11px] text-white/30 truncate">
                        {member.role}
                      </p>
                    )}
                  </div>
                  {member.percentage > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-amber-400/80">
                        {member.percentage}%
                      </p>
                      <p className="text-[10px] text-white/20">share</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default TeamSection;
