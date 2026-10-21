// =====================================================================
// Agreements / penalties — HAND-WRITTEN, TEMPORARY
// =====================================================================
//
// The contracts-schema functions added by plans/agreements/migrations
// (01–03). src/lib/supabase.ts doesn't know them yet, so
// src/lib/agreementsDb.ts re-types the same client with this. Same pattern
// as permissionsDb. Kept identical to Fields/types/agreements.types.ts.
//
// Every number on these screens (totals, paid, remaining, payment number,
// penalties to deduct) comes from these functions — the app never adds
// money up itself, so the field app and the desktop app always agree.
//
// Delete once `npm run types` has been re-run against a database that
// has 01–03 applied.
// =====================================================================

export type PaymentMethod = "cash" | "bank";
export type PaymentStatus = "pending" | "approved" | "declined";
export type PenaltyStatus = "pending" | "approved" | "declined";
/** approved + already taken off a payment shows as "deducted". */
export type PenaltyDisplayStatus = PenaltyStatus | "deducted";

/** One row of contracts.project_agreements(). */
export type AgreementSummary = {
  id: string;
  project_id: string;
  contractor_id: string;
  contractor_name: string | null;
  title: string;
  description: string | null;
  total: number;
  current_version: number;
  /** What the contractor took here as expenses before their first
   * agreement (05_round2.sql); included in `paid`. */
  opening_paid: number;
  opening_payments: number;
  paid: number;
  pending: number;
  has_pending: boolean;
  remaining: number;
  payments_count: number;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string | null;
};

export type AgreementVersion = {
  version_no: number;
  title: string;
  description: string | null;
  note: string | null;
  total: number;
  change_note: string | null;
  created_by_name: string | null;
  created_at: string;
};

/** Every item row ever written — removed and replaced ones too. */
export type AgreementItem = {
  id: string;
  description: string;
  note: string | null;
  price: number;
  sort_order: number;
  added_in_version: number;
  removed_in_version: number | null;
  replaces_item_id: string | null;
};

export type AgreementPayment = {
  id: string;
  payments_number: string;
  amount: number;
  prev_amount: number;
  penalty_amount: number;
  penalty_reason: string | null;
  grand_total: number | null;
  payments_reason: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  created_by_name: string | null;
  created_at: string;
};

/** contracts.agreement_detail(). */
export type AgreementDetail = {
  agreement: Omit<AgreementSummary, "payments_count"> & {
    project_name: string;
    note: string | null;
  };
  versions: AgreementVersion[];
  items: AgreementItem[];
  payments: AgreementPayment[];
};

/** contracts.agreement_payment_preview(). */
export type PaymentPreview = {
  agreement_total: number;
  opening_paid: number;
  opening_payments: number;
  next_number: number;
  prev_amount: number;
  pending_amount: number;
  has_pending: boolean;
  remaining: number;
  penalties: { id: string; amount: number; reason: string; created_at: string }[];
  penalty_total: number;
};

/** One row of contracts.penalties_list(). */
export type PenaltyRow = {
  id: string;
  project_id: string;
  project_name: string;
  contractor_id: string;
  contractor_name: string | null;
  amount: number;
  reason: string;
  status: PenaltyStatus;
  display_status: PenaltyDisplayStatus;
  deducted_in_payment_id: string | null;
  payment_number: string | null;
  created_by: string;
  created_by_name: string | null;
  approved_by_name: string | null;
  created_at: string;
  approved_at: string | null;
  /** Photos, in the public "attachments" bucket. */
  attachments: { file_path: string; mime_type: string | null }[];
};

/** contracts.contractor_project_money(): what they already took here. */
export type ContractorProjectMoney = {
  paid: number;
  payments_count: number;
  /** Most frequent expense description (latest on a tie) — a placeholder. */
  title_hint: string | null;
  /** True when a new agreement would start from `paid`. */
  counts_as_opening: boolean;
  has_phone: boolean;
};

/** contracts.project_old_money(). */
export type ProjectOldMoney = {
  /** Took money here as expenses and have no agreement yet. */
  contractors: {
    contractor_id: string;
    contractor_name: string | null;
    paid: number;
    payments_count: number;
    title_hint: string | null;
    last_paid_at: string;
  }[];
  expense_payments: {
    id: string;
    contractor_id: string;
    contractor_name: string | null;
    description: string | null;
    amount: number;
    payment_no: number | null;
    created_at: string;
  }[];
};

/** What the create / edit form sends. `id` = an existing item being kept. */
export type AgreementItemInput = {
  id?: string;
  description: string;
  price: number;
  note?: string | null;
};

export type ContractPaymentListRow = {
  id: string;
  project_id: string;
  contractor_id: string | null;
  new_contractor_name: string | null;
  agreement_id: string | null;
  payments_number: string;
  amount: number;
  penalty_amount: number;
  grand_total: number | null;
  currency: "LYD" | "USD" | "EUR";
  method: PaymentMethod;
  status: string;
  created_at: string;
  created_by: string;
};

export type AgreementsDatabase = {
  // Mirrors the generated Database type's shape. supabase-js keys its
  // generics off __InternalSupabase; without it everything is `never`.
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  contracts: {
    Tables: {
      // Read only — for looking up agreement titles next to payments.
      agreements: {
        Row: { id: string; title: string; project_id: string; contractor_id: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      // Read only — for counting what waits for approval.
      penalties: {
        Row: { id: string; project_id: string; contractor_id: string; status: PenaltyStatus };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      // Read only, the columns payment lists show — here because the
      // generated type has no agreement_id yet.
      payments: {
        Row: ContractPaymentListRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      project_agreements: {
        Args: { p_project_id: string };
        Returns: AgreementSummary[];
      };
      agreement_detail: {
        Args: { p_agreement_id: string };
        Returns: AgreementDetail | null;
      };
      agreement_payment_preview: {
        Args: { p_agreement_id: string };
        Returns: PaymentPreview | null;
      };
      penalties_list: {
        Args: { p_project_id?: string | null };
        Returns: PenaltyRow[];
      };
      create_agreement: {
        Args: {
          p_project_id: string;
          p_contractor_id: string;
          p_title: string;
          p_description: string | null;
          p_note: string | null;
          p_items: AgreementItemInput[];
          p_contractor_phone?: string | null;
        };
        Returns: string;
      };
      contractor_project_money: {
        Args: { p_project_id: string; p_contractor_id: string };
        Returns: ContractorProjectMoney;
      };
      project_old_money: {
        Args: { p_project_id: string };
        Returns: ProjectOldMoney;
      };
      edit_agreement: {
        Args: {
          p_agreement_id: string;
          p_title: string;
          p_description: string | null;
          p_note: string | null;
          p_items: AgreementItemInput[];
          p_change_note: string | null;
        };
        Returns: number;
      };
      create_agreement_payment: {
        Args: {
          p_agreement_id: string;
          p_amount: number;
          p_reason: string | null;
          p_method: PaymentMethod;
          p_bank_name: string | null;
          p_bank_number: string | null;
          p_bank_holder_name: string | null;
        };
        Returns: string;
      };
      create_penalty: {
        Args: {
          p_project_id: string;
          p_contractor_id: string;
          p_amount: number;
          p_reason: string;
        };
        Returns: string;
      };
      /** Desktop accept / decline of a pending penalty. */
      decide_penalty: {
        Args: { p_penalty_id: string; p_approve: boolean };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
