import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agreementsDb } from "../../lib/agreementsDb";
import { supabase } from "../../lib/supabaseClient";
import { uploadFile } from "../../lib/storage-client";
import { normalizePhone } from "../../utils/agreements/rules";
import { useAuthUserId } from "../permissions/useCan";
import type {
  AgreementDetail,
  AgreementItemInput,
  AgreementSummary,
  ContractorProjectMoney,
  PaymentMethod,
  PaymentPreview,
  PenaltyRow,
  ProjectOldMoney,
} from "../../types/agreements.types";

// =====================================================================
// Agreements, their payments, and penalties — every read and write.
// =====================================================================
// Same functions the field app calls (plans/agreements/migrations/
// 02_functions.sql), so both apps show the same numbers. Each read is one
// call that already carries names and totals. Every save invalidates the
// whole "agreements" prefix, so lists, totals and the pay form refresh.
// =====================================================================

/** The database raises its refusals in Arabic, ready to show as-is. */
export function agreementErrorMessage(err: unknown): string {
  const message = (err as { message?: string } | null)?.message;
  return message?.trim() || "حدث خطأ، حاول مرة أخرى";
}

async function rpcOrThrow<T>(label: string, call: PromiseLike<{ data: T; error: unknown }>) {
  const { data, error } = await call;
  if (error) {
    console.error(`${label} error:`, error);
    throw error;
  }
  return data;
}

const keys = {
  all: (uid: string) => ["agreements", uid] as const,
  project: (uid: string, projectId: string) => ["agreements", uid, "project", projectId] as const,
  detail: (uid: string, id: string) => ["agreements", uid, "detail", id] as const,
  preview: (uid: string, id: string) => ["agreements", uid, "preview", id] as const,
  penalties: (uid: string, projectId: string | null) =>
    ["agreements", uid, "penalties", projectId ?? "all"] as const,
  contractorMoney: (uid: string, projectId: string, contractorId: string) =>
    ["agreements", uid, "contractor-money", projectId, contractorId] as const,
  oldMoney: (uid: string, projectId: string) => ["agreements", uid, "old-money", projectId] as const,
};

// ─── Reads ───────────────────────────────────────────────────────────────────

export function useProjectAgreements(projectId: string) {
  const { userId } = useAuthUserId();
  return useQuery({
    queryKey: keys.project(userId ?? "", projectId),
    enabled: !!userId && !!projectId,
    queryFn: async () =>
      (await rpcOrThrow(
        "project_agreements",
        agreementsDb.schema("contracts").rpc("project_agreements", { p_project_id: projectId }),
      )) as AgreementSummary[],
  });
}

export function useAgreementDetail(agreementId: string | null) {
  const { userId } = useAuthUserId();
  return useQuery({
    queryKey: keys.detail(userId ?? "", agreementId ?? ""),
    enabled: !!userId && !!agreementId,
    queryFn: async () =>
      (await rpcOrThrow(
        "agreement_detail",
        agreementsDb.schema("contracts").rpc("agreement_detail", { p_agreement_id: agreementId ?? "" }),
      )) as AgreementDetail | null,
  });
}

export function usePaymentPreview(agreementId: string | null) {
  const { userId } = useAuthUserId();
  return useQuery({
    queryKey: keys.preview(userId ?? "", agreementId ?? ""),
    enabled: !!userId && !!agreementId,
    staleTime: 0,
    queryFn: async () =>
      (await rpcOrThrow(
        "agreement_payment_preview",
        agreementsDb
          .schema("contracts")
          .rpc("agreement_payment_preview", { p_agreement_id: agreementId ?? "" }),
      )) as PaymentPreview | null,
  });
}

/** One project's penalties, or every project's when projectId is null. */
export function usePenalties(projectId: string | null) {
  const { userId } = useAuthUserId();
  return useQuery({
    queryKey: keys.penalties(userId ?? "", projectId),
    enabled: !!userId,
    queryFn: async () =>
      (await rpcOrThrow(
        "penalties_list",
        agreementsDb.schema("contracts").rpc("penalties_list", { p_project_id: projectId }),
      )) as PenaltyRow[],
  });
}

/** What a contractor already took in this project as expenses (the old
 * way) — the new-agreement form's banner, placeholder and minimum total. */
export function useContractorProjectMoney(projectId: string, contractorId: string | null) {
  const { userId } = useAuthUserId();
  return useQuery({
    queryKey: keys.contractorMoney(userId ?? "", projectId, contractorId ?? ""),
    enabled: !!userId && !!projectId && !!contractorId,
    staleTime: 0,
    queryFn: async () =>
      (await rpcOrThrow(
        "contractor_project_money",
        agreementsDb.schema("contracts").rpc("contractor_project_money", {
          p_project_id: projectId,
          p_contractor_id: contractorId ?? "",
        }),
      )) as ContractorProjectMoney,
  });
}

/** Contractors who took money here and have no agreement yet, and every
 * old expense payment to a contractor here. */
export function useProjectOldMoney(projectId: string) {
  const { userId } = useAuthUserId();
  return useQuery({
    queryKey: keys.oldMoney(userId ?? "", projectId),
    enabled: !!userId && !!projectId,
    queryFn: async () =>
      (await rpcOrThrow(
        "project_old_money",
        agreementsDb.schema("contracts").rpc("project_old_money", { p_project_id: projectId }),
      )) as ProjectOldMoney,
  });
}

// ─── Writes ──────────────────────────────────────────────────────────────────

function useInvalidateAgreements() {
  const { userId } = useAuthUserId();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: keys.all(userId ?? "") });
}

/** Public URL of an attachment's file (bucket "attachments" is public). */
export const attachmentUrl = (path: string) =>
  supabase.storage.from("attachments").getPublicUrl(path).data.publicUrl;

export type AgreementFormValues = {
  title: string;
  description: string;
  note: string;
  changeNote: string;
  items: AgreementItemInput[];
};

function cleanItems(items: AgreementItemInput[]): AgreementItemInput[] {
  return items.map((i) => ({
    ...(i.id ? { id: i.id } : {}),
    description: i.description.trim(),
    price: i.price,
    note: i.note?.trim() || null,
  }));
}

export function useCreateAgreement(projectId: string) {
  const invalidate = useInvalidateAgreements();
  return useMutation({
    mutationFn: async (v: AgreementFormValues & { contractorId: string; contractorPhone: string }) =>
      (await rpcOrThrow(
        "create_agreement",
        agreementsDb.schema("contracts").rpc("create_agreement", {
          p_project_id: projectId,
          p_contractor_id: v.contractorId,
          p_title: v.title.trim(),
          p_description: v.description.trim() || null,
          p_note: v.note.trim() || null,
          p_items: cleanItems(v.items),
          // only saved by the database when the contractor has no phone
          p_contractor_phone: normalizePhone(v.contractorPhone) || null,
        }),
      )) as string,
    onSuccess: invalidate,
  });
}

export function useEditAgreement(agreementId: string) {
  const invalidate = useInvalidateAgreements();
  return useMutation({
    mutationFn: async (v: AgreementFormValues) =>
      (await rpcOrThrow(
        "edit_agreement",
        agreementsDb.schema("contracts").rpc("edit_agreement", {
          p_agreement_id: agreementId,
          p_title: v.title.trim(),
          p_description: v.description.trim() || null,
          p_note: v.note.trim() || null,
          p_items: cleanItems(v.items),
          p_change_note: v.changeNote.trim() || null,
        }),
      )) as number,
    onSuccess: invalidate,
  });
}

export function useCreateAgreementPayment(agreementId: string) {
  const invalidate = useInvalidateAgreements();
  return useMutation({
    mutationFn: async (v: {
      amount: number;
      reason: string;
      method: PaymentMethod;
      bankName: string;
      bankNumber: string;
      bankHolderName: string;
    }) => {
      const bank = v.method === "bank";
      return (await rpcOrThrow(
        "create_agreement_payment",
        agreementsDb.schema("contracts").rpc("create_agreement_payment", {
          p_agreement_id: agreementId,
          p_amount: v.amount,
          p_reason: v.reason.trim() || null,
          p_method: v.method,
          p_bank_name: bank ? v.bankName.trim() : null,
          p_bank_number: bank ? v.bankNumber.trim() : null,
          p_bank_holder_name: bank ? v.bankHolderName.trim() : null,
        }),
      )) as string;
    },
    onSuccess: invalidate,
  });
}

/**
 * Records the penalty, then uploads its photos. A photo that fails to
 * upload doesn't undo the penalty: the result says how many failed.
 */
export function useCreatePenalty(projectId: string) {
  const invalidate = useInvalidateAgreements();
  return useMutation({
    mutationFn: async (v: { contractorId: string; amount: number; reason: string; photos: File[] }) => {
      const penaltyId = (await rpcOrThrow(
        "create_penalty",
        agreementsDb.schema("contracts").rpc("create_penalty", {
          p_project_id: projectId,
          p_contractor_id: v.contractorId,
          p_amount: v.amount,
          p_reason: v.reason.trim(),
        }),
      )) as string;
      let failedPhotos = 0;
      for (const file of v.photos) {
        try {
          await uploadFile({ file, entityType: "contractor_penalty", entityId: penaltyId });
        } catch (err) {
          console.error("penalty photo upload error:", err);
          failedPhotos += 1;
        }
      }
      return { penaltyId, failedPhotos };
    },
    onSuccess: invalidate,
  });
}

export function useDecidePenalty() {
  const invalidate = useInvalidateAgreements();
  return useMutation({
    mutationFn: async (v: { penaltyId: string; approve: boolean }) => {
      await rpcOrThrow(
        "decide_penalty",
        agreementsDb
          .schema("contracts")
          .rpc("decide_penalty", { p_penalty_id: v.penaltyId, p_approve: v.approve }),
      );
    },
    onSuccess: invalidate,
  });
}
