import { contractorWithSpecializations } from "../../../../types/extended.type";

export interface MergeValues {
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  specialization_id: string | null;
  bank_id: string | null;
  bank_number: string | null;
  bank_holder_name: string | null;
}

export function contractorLabel(c: contractorWithSpecializations) {
  return `${c.first_name}${c.last_name ? " " + c.last_name : ""}${
    c.phone_number ? " — " + c.phone_number : ""
  }`;
}

// Prefers the survivor's value, falling back to the loser's when the
// survivor's is empty — so merging never silently drops data the loser had.
export function defaultMergeValues(
  survivor: contractorWithSpecializations,
  loser: contractorWithSpecializations,
): MergeValues {
  const pick = (a: string | null | undefined, b: string | null | undefined) =>
    a && a.trim() !== "" ? a : b && b.trim() !== "" ? b : null;

  const survivorHasBank = Boolean(survivor.bank_id);
  const bankSource = survivorHasBank ? survivor : loser;

  return {
    first_name: survivor.first_name || loser.first_name,
    last_name: pick(survivor.last_name, loser.last_name),
    email: pick(survivor.email, loser.email),
    phone_number: pick(survivor.phone_number, loser.phone_number),
    whatsapp_number: pick(survivor.whatsapp_number, loser.whatsapp_number),
    specialization_id: pick(
      survivor.specialization_id,
      loser.specialization_id,
    ),
    bank_id: bankSource.bank_id,
    bank_number: bankSource.bank_number,
    bank_holder_name: bankSource.bank_holder_name,
  };
}
