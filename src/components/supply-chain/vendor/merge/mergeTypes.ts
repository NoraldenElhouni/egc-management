import { VendorsWithSpecializations } from "../../../../types/extended.type";

export interface MergeVendorValues {
  vendor_name: string;
  contact_name: string | null;
  email: string | null;
  phone_number: string | null;
  alt_phone_number: string | null;
  whatsapp_number: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  specialization_id: string | null;
  bank_id: string | null;
  bank_number: string | null;
  bank_holder_name: string | null;
}

export function vendorLabel(v: VendorsWithSpecializations) {
  return `${v.vendor_name}${v.contact_name ? " — " + v.contact_name : ""}${
    v.phone_number ? " — " + v.phone_number : ""
  }`;
}

// Prefers the survivor's value, falling back to the loser's when the
// survivor's is empty — so merging never silently drops data the loser had.
export function defaultMergeVendorValues(
  survivor: VendorsWithSpecializations,
  loser: VendorsWithSpecializations,
): MergeVendorValues {
  const pick = (a: string | null | undefined, b: string | null | undefined) =>
    a && a.trim() !== "" ? a : b && b.trim() !== "" ? b : null;

  const survivorHasBank = Boolean(survivor.bank_id);
  const bankSource = survivorHasBank ? survivor : loser;

  return {
    vendor_name: survivor.vendor_name || loser.vendor_name,
    contact_name: pick(survivor.contact_name, loser.contact_name),
    email: pick(survivor.email, loser.email),
    phone_number: pick(survivor.phone_number, loser.phone_number),
    alt_phone_number: pick(survivor.alt_phone_number, loser.alt_phone_number),
    whatsapp_number: pick(survivor.whatsapp_number, loser.whatsapp_number),
    country: pick(survivor.country, loser.country),
    city: pick(survivor.city, loser.city),
    address: pick(survivor.address, loser.address),
    specialization_id: pick(
      survivor.specialization_id,
      loser.specialization_id,
    ),
    bank_id: bankSource.bank_id,
    bank_number: bankSource.bank_number,
    bank_holder_name: bankSource.bank_holder_name,
  };
}
