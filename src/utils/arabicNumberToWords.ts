const ONES_MASC = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
];
const ONES_FEM = [
  "",
  "إحدى",
  "اثنتان",
  "ثلاث",
  "أربع",
  "خمس",
  "ست",
  "سبع",
  "ثماني",
  "تسع",
];
const TEENS_MASC = [
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
];
const TEENS_FEM = [
  "عشر",
  "إحدى عشرة",
  "اثنتا عشرة",
  "ثلاث عشرة",
  "أربع عشرة",
  "خمس عشرة",
  "ست عشرة",
  "سبع عشرة",
  "ثماني عشرة",
  "تسع عشرة",
];
const TENS = [
  "",
  "",
  "عشرون",
  "ثلاثون",
  "أربعون",
  "خمسون",
  "ستون",
  "سبعون",
  "ثمانون",
  "تسعون",
];
const HUNDREDS = [
  "",
  "مائة",
  "مئتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

export interface ArabicNounForms {
  singular: string;
  dual: string;
  plural: string;
  feminine?: boolean;
}

const THOUSAND: ArabicNounForms = {
  singular: "ألف",
  dual: "ألفان",
  plural: "آلاف",
};
const MILLION: ArabicNounForms = {
  singular: "مليون",
  dual: "مليونان",
  plural: "ملايين",
};
const BILLION: ArabicNounForms = {
  singular: "مليار",
  dual: "ملياران",
  plural: "مليارات",
};

const DEFAULT_UNIT: ArabicNounForms = {
  singular: "دينار ",
  dual: "ديناران ",
  plural: "دنانير ",
};
const DEFAULT_SUB_UNIT: ArabicNounForms = {
  singular: "درهم",
  dual: "درهمان",
  plural: "دراهم",
};

// Converts 0-999 to words. Only the ones/teens digit changes with gender —
// tens and hundreds are gender-invariant in Arabic.
function convertHundreds(value: number, feminine: boolean): string {
  if (value <= 0) return "";

  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;

  if (hundreds > 0) parts.push(HUNDREDS[hundreds]);

  if (remainder > 0) {
    if (remainder < 10) {
      parts.push(feminine ? ONES_FEM[remainder] : ONES_MASC[remainder]);
    } else if (remainder < 20) {
      parts.push(
        feminine ? TEENS_FEM[remainder - 10] : TEENS_MASC[remainder - 10],
      );
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      if (ones > 0) {
        const onesWord = feminine ? ONES_FEM[ones] : ONES_MASC[ones];
        parts.push(`${onesWord} و${TENS[tens]}`);
      } else {
        parts.push(TENS[tens]);
      }
    }
  }

  return parts.join(" و");
}

// Picks the grammatically correct noun form for a preceding count:
// 1 -> singular, 2 -> dual, 3-10 -> plural, 11+ -> singular.
function countedNounForm(count: number, forms: ArabicNounForms): string {
  if (count === 1) return forms.singular;
  if (count === 2) return forms.dual;
  const lastTwo = count % 100;
  return lastTwo >= 3 && lastTwo <= 10 ? forms.plural : forms.singular;
}

// "Three thousand" style phrase for a scale word (thousand/million/billion),
// which is always masculine regardless of the final currency's gender.
function scaleGroupPhrase(count: number, forms: ArabicNounForms): string {
  if (count === 1) return forms.singular;
  if (count === 2) return forms.dual;
  return `${convertHundreds(count, false)} ${countedNounForm(count, forms)}`;
}

function cardinalToWords(value: number, feminineUnits: boolean): string {
  if (value === 0) return "صفر";

  const billions = Math.floor(value / 1_000_000_000);
  const millions = Math.floor((value % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((value % 1_000_000) / 1_000);
  const units = value % 1_000;

  const segments: string[] = [];
  if (billions > 0) segments.push(scaleGroupPhrase(billions, BILLION));
  if (millions > 0) segments.push(scaleGroupPhrase(millions, MILLION));
  if (thousands > 0) segments.push(scaleGroupPhrase(thousands, THOUSAND));
  if (units > 0) segments.push(convertHundreds(units, feminineUnits));

  return segments.join(" و");
}

// "<count in words> <currency noun>", e.g. "دينار واحد" for 1, "ديناران" for
// 2, "خمسة دنانير" for 5, "مائة وثلاثة وعشرون دينارا" for 123 — noun order
// and gender agreement follow the same rules as scaleGroupPhrase, except 1
// and 2 spell out "واحد"/the dual noun instead of being silent like "ألف".
function currencyPhrase(count: number, forms: ArabicNounForms): string {
  const feminine = forms.feminine ?? false;
  if (count === 0) return `صفر ${forms.singular}`;
  if (count === 1) return `${forms.singular} ${feminine ? "واحدة" : "واحد"}`;
  if (count === 2) return forms.dual;

  const nounForm = countedNounForm(count, forms);
  return `${cardinalToWords(count, feminine)} ${nounForm}`;
}

/** Converts an integer to Arabic cardinal words, e.g. 1502 -> "ألف وخمسمائة واثنان". */
export function numberToArabicWords(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const words = cardinalToWords(rounded, false);
  return value < 0 ? `سالب ${words}` : words;
}

export interface AmountToArabicWordsOptions {
  /** Main currency unit noun forms. Defaults to Libyan dinar. */
  unit?: ArabicNounForms;
  /** Sub-unit noun forms, or null to omit sub-units entirely. Defaults to dirham. */
  subUnit?: ArabicNounForms | null;
  /** Decimal digits that make up one sub-unit (e.g. 2 for cents). Defaults to 2. */
  subUnitDecimals?: number;
  /** Prefix meaning "only", as commonly used in contracts/cheques. Defaults to "فقط ". */
  prefix?: string;
  /** Suffix meaning "no more", as commonly used in contracts/cheques. Defaults to " لا غير". */
  suffix?: string;
}

/**
 * Spells out a currency amount in Arabic words, e.g. 3500.5 (LYD) ->
 * "فقط ثلاثة آلاف وخمسمائة دينار ليبي وخمسون درهما لا غير".
 */
export function amountToArabicWords(
  amount: number,
  options: AmountToArabicWordsOptions = {},
): string {
  const {
    unit = DEFAULT_UNIT,
    subUnit = DEFAULT_SUB_UNIT,
    subUnitDecimals = 2,
    prefix = "فقط ",
    suffix = " لا غير",
  } = options;

  const negative = amount < 0;
  const scale = 10 ** subUnitDecimals;
  const totalSubunits = Math.round(Math.abs(amount) * scale);
  const integerPart = Math.floor(totalSubunits / scale);
  const fractionPart = totalSubunits % scale;

  const parts: string[] = [];
  if (integerPart > 0 || fractionPart === 0) {
    parts.push(currencyPhrase(integerPart, unit));
  }
  if (subUnit && fractionPart > 0) {
    parts.push(currencyPhrase(fractionPart, subUnit));
  }

  return `${prefix}${negative ? "سالب " : ""}${parts.join(" و")}${suffix}`;
}
