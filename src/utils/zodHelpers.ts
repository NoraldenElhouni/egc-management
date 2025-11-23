import { z } from "zod";

type Opts = { min?: number; max?: number } | undefined;

const preprocessNumber = (val: unknown) => {
  if (val === null || val === undefined) return undefined;
  if (typeof val === "string") {
    if (val.trim() === "") return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }
  if (typeof val === "number") {
    return isNaN(val) ? undefined : val;
  }
  return undefined;
};

export function optionalNumber(opts?: Opts) {
  // Base preprocess -> optional number
  const base = z.preprocess(preprocessNumber, z.number().optional());

  if (!opts) return base;

  // Build constrained number schema then wrap with the same preprocess
  let numSchema = z.number();
  if (typeof opts.min === "number") numSchema = numSchema.min(opts.min);
  if (typeof opts.max === "number") numSchema = numSchema.max(opts.max);
  return z.preprocess(preprocessNumber, numSchema.optional());
}
