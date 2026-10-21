import { useState } from "react";
import { AlertTriangle, Pencil, Wallet } from "lucide-react";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useAgreementDetail } from "../../hooks/agreements/useAgreements";
import type { AgreementDetail, AgreementItem } from "../../types/agreements.types";
import {
  changesInVersion,
  currentItems,
  headerChanges,
  itemsAtVersion,
  PAYMENT_STATUS,
} from "../../utils/agreements/versions";
import { formatCurrency, formatDate } from "../../utils/helpper";
import AgreementFormDialog from "./AgreementFormDialog";
import AgreementPaymentDialog from "./AgreementPaymentDialog";
import PenaltyFormDialog from "./PenaltyFormDialog";
import HistoryTimeline from "../logs/HistoryTimeline";
import { useCanViewLogs } from "../../hooks/logs/useActivityLog";

// One agreement: totals on top, then the views — the agreement as it
// stands now (البنود), every version with what it changed (الإصدارات),
// its payments (الدفعات), and — for log readers — its full log (السجل:
// creation, edits, payments, penalties; get_history('agreement')).
// Pay and edit open from here.

type View = "items" | "versions" | "payments" | "history";

type Props = {
  projectId: string;
  agreementId: string | null;
  onClose: () => void;
  canEdit: boolean;
  /** create_contractor_penalty on this project. */
  canPenalty?: boolean;
  /** May the viewer pay this agreement (view_all, or their own). */
  canPay: (createdBy: string) => boolean;
};

export default function AgreementDetailDialog({
  projectId,
  agreementId,
  onClose,
  canEdit,
  canPenalty = false,
  canPay,
}: Props) {
  const { data, isLoading } = useAgreementDetail(agreementId);
  const canViewLogs = useCanViewLogs() === true;
  const [view, setView] = useState<View>("items");
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [penaltyOpen, setPenaltyOpen] = useState(false);

  const a = data?.agreement;
  const payBlocked = !a
    ? null
    : a.has_pending
      ? "توجد دفعة قيد الانتظار"
      : a.remaining <= 0
        ? "تم دفع كامل الاتفاقية"
        : null;

  return (
    <Dialog isOpen={!!agreementId} onClose={onClose}>
      <div dir="rtl" className="space-y-5 max-h-[78vh] overflow-y-auto px-1">
        {isLoading || !data || !a ? (
          <div className="flex justify-center py-12">
            {isLoading ? <LoadingSpinner /> : <span className="text-gray-500">تعذر تحميل الاتفاقية</span>}
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{a.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {a.contractor_name ?? "—"} · أنشأها {a.created_by_name ?? "—"} · {formatDate(a.created_at)}
                </p>
                {a.description && <p className="text-sm text-gray-700 mt-2">{a.description}</p>}
              </div>
              {a.current_version > 1 && <Badge label={`إصدار ${a.current_version}`} variant="info" />}
            </div>

            <div className="grid grid-cols-4 gap-3">
              <Stat label="الإجمالي" value={a.total} />
              <Stat label="المدفوع" value={a.paid} />
              <Stat label="قيد الانتظار" value={a.pending} />
              <Stat label="المتبقي" value={a.remaining} strong />
            </div>
            {a.opening_paid > 0 && (
              <p className="text-sm text-amber-900 bg-amber-50 rounded-lg px-3 py-2">
                منها {formatCurrency(a.opening_paid)} مدفوعة سابقاً كمصروفات ({a.opening_payments} دفعات)
              </p>
            )}
            {a.note && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">ملاحظة: {a.note}</p>}

            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              {(
                [
                  { value: "items", label: "البنود" },
                  { value: "versions", label: `الإصدارات (${data.versions.length})` },
                  { value: "payments", label: `الدفعات (${data.payments.length})` },
                  ...(canViewLogs ? [{ value: "history", label: "السجل" } as const] : []),
                ] as const
              ).map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setView(t.value)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                    view === t.value ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {view === "items" && <ItemsView detail={data} />}
            {view === "versions" && <VersionsView detail={data} />}
            {view === "payments" && <PaymentsView detail={data} />}
            {view === "history" && canViewLogs && (
              <HistoryTimeline refType="agreement" refId={a.id} title="سجل الاتفاقية" />
            )}

            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <span className="text-sm text-gray-500">{canPay(a.created_by) ? (payBlocked ?? "") : ""}</span>
              <div className="flex gap-2">
                {canPenalty && (
                  <Button type="button" variant="error" onClick={() => setPenaltyOpen(true)}>
                    <AlertTriangle className="w-4 h-4 ml-1" /> غرامة
                  </Button>
                )}
                {canEdit && (
                  <Button type="button" variant="primary-outline" onClick={() => setEditOpen(true)}>
                    <Pencil className="w-4 h-4 ml-1" /> تعديل
                  </Button>
                )}
                {canPay(a.created_by) && (
                  <Button type="button" disabled={!!payBlocked} onClick={() => setPayOpen(true)}>
                    <Wallet className="w-4 h-4 ml-1" /> دفعة جديدة
                  </Button>
                )}
              </div>
            </div>

            <AgreementPaymentDialog
              isOpen={payOpen}
              onClose={() => setPayOpen(false)}
              agreementId={a.id}
              contractorId={a.contractor_id}
              contractorName={a.contractor_name}
              title={a.title}
            />
            <PenaltyFormDialog
              isOpen={penaltyOpen}
              onClose={() => setPenaltyOpen(false)}
              projectId={a.project_id}
              presetContractor={{ id: a.contractor_id, name: a.contractor_name }}
            />
            <AgreementFormDialog
              isOpen={editOpen}
              onClose={() => setEditOpen(false)}
              projectId={projectId}
              detail={data}
            />
          </>
        )}
      </div>
    </Dialog>
  );
}

function Stat({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${strong ? "bg-primary text-white" : "bg-gray-50 border border-gray-100"}`}>
      <div className={`text-xs ${strong ? "text-blue-100" : "text-gray-500"}`}>{label}</div>
      <div className="text-base font-bold">{formatCurrency(value)}</div>
    </div>
  );
}

function ItemsTable({ items, total, previousTotal }: { items: AgreementItem[]; total: number; previousTotal?: number }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {items.map((item, i) => (
          <tr key={item.id} className="border-b border-gray-100">
            <td className="py-2 w-8 text-gray-400">{i + 1}</td>
            <td className="py-2">
              {item.description}
              {item.note && <div className="text-xs text-gray-500">{item.note}</div>}
            </td>
            <td className="py-2 text-left font-medium whitespace-nowrap">{formatCurrency(item.price)}</td>
          </tr>
        ))}
        <TotalRow total={total} previousTotal={previousTotal} />
      </tbody>
    </table>
  );
}

function TotalRow({ total, previousTotal }: { total: number; previousTotal?: number }) {
  return (
    <tr>
      <td />
      <td className="pt-3 font-semibold">الإجمالي</td>
      <td className="pt-3 text-left font-bold text-blue-800 whitespace-nowrap">
        {previousTotal != null && previousTotal !== total && (
          <span className="text-gray-400 line-through font-normal ml-2">{formatCurrency(previousTotal)}</span>
        )}
        {formatCurrency(total)}
      </td>
    </tr>
  );
}

function ItemsView({ detail }: { detail: AgreementDetail }) {
  return <ItemsTable items={currentItems(detail.items)} total={detail.agreement.total} />;
}

const CHANGE = {
  added: { label: "مضاف", row: "bg-emerald-50", tag: "text-emerald-700" },
  edited: { label: "معدّل", row: "bg-amber-50", tag: "text-amber-700" },
  removed: { label: "محذوف", row: "bg-red-50", tag: "text-red-700" },
} as const;

function VersionsView({ detail }: { detail: AgreementDetail }) {
  return (
    <div className="space-y-4">
      {detail.versions.map((v, idx) => {
        const prev = idx > 0 ? detail.versions[idx - 1] : null;
        return (
          <div key={v.version_no} className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge
                label={v.version_no === 1 ? "الإصدار 1 · الأصلي" : `الإصدار ${v.version_no}`}
                variant={v.version_no === 1 ? "default" : "info"}
              />
              <span className="text-xs text-gray-500">
                {v.created_by_name ?? "—"} · {formatDate(v.created_at)}
              </span>
            </div>
            {v.change_note && <p className="text-sm text-gray-600">سبب التعديل: {v.change_note}</p>}

            {prev === null ? (
              <ItemsTable items={itemsAtVersion(detail.items, 1)} total={v.total} />
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {headerChanges(prev, v).map((h) => (
                    <tr key={h.label}>
                      <td className="py-1.5 w-16 text-xs font-semibold text-gray-500">{h.label}</td>
                      <td className="py-1.5" colSpan={2}>
                        <span className="line-through text-gray-400">{h.before}</span> ← {h.after}
                      </td>
                    </tr>
                  ))}
                  {changesInVersion(detail.items, v.version_no).map((c) => (
                    <tr key={c.item.id} className={CHANGE[c.kind].row}>
                      <td className={`py-2 px-2 w-16 text-xs font-bold ${CHANGE[c.kind].tag}`}>
                        {CHANGE[c.kind].label}
                      </td>
                      <td className={`py-2 ${c.kind === "removed" ? "line-through text-gray-500" : ""}`}>
                        {c.item.description}
                        {c.kind === "edited" && c.before.description !== c.item.description && (
                          <div className="text-xs text-gray-400 line-through">{c.before.description}</div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-left whitespace-nowrap font-medium">
                        {c.kind === "edited" ? (
                          <>
                            <span className="line-through text-gray-400 ml-2">{formatCurrency(c.before.price)}</span>
                            {formatCurrency(c.item.price)}
                          </>
                        ) : (
                          <span className={c.kind === "removed" ? "line-through text-gray-500" : ""}>
                            {c.kind === "added" ? "+" : "−"}
                            {formatCurrency(c.item.price)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <TotalRow total={v.total} previousTotal={prev.total} />
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PaymentsView({ detail }: { detail: AgreementDetail }) {
  if (detail.payments.length === 0) {
    return <p className="text-center text-sm text-gray-500 py-6">لا توجد دفعات بعد</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="text-gray-500 text-xs">
        <tr>
          <th className="py-2 text-right">رقم</th>
          <th className="py-2 text-right">المبلغ</th>
          <th className="py-2 text-right">الغرامة</th>
          <th className="py-2 text-right">الصافي</th>
          <th className="py-2 text-right">الحالة</th>
          <th className="py-2 text-right">بواسطة</th>
        </tr>
      </thead>
      <tbody>
        {detail.payments.map((p) => {
          const status = PAYMENT_STATUS[p.status] ?? { label: p.status, variant: "default" as const };
          return (
            <tr key={p.id} className="border-t border-gray-100">
              <td className="py-2 font-mono">{p.payments_number}</td>
              <td className="py-2">{formatCurrency(p.amount)}</td>
              <td className="py-2" title={p.penalty_reason ?? undefined}>
                {p.penalty_amount ? formatCurrency(p.penalty_amount) : "-"}
              </td>
              <td className="py-2 font-semibold">{formatCurrency(p.grand_total ?? p.amount - p.penalty_amount)}</td>
              <td className="py-2">
                <Badge label={status.label} variant={status.variant} />
              </td>
              <td className="py-2 text-gray-600">
                {p.created_by_name ?? "—"} · {formatDate(p.created_at)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
