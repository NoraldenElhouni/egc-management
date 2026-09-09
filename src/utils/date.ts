export const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const getMonthRange = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const to = `${month}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
};

export const yearToDate = (year: string | null | undefined): string | null => {
  if (!year || !year.trim()) return null;
  return `${year.trim()}-01-01`;
};

export const dateToYear = (date: string | null | undefined): string => {
  if (!date) return "";
  return date.slice(0, 4);
};

export const isInMonth = (
  dateStr: string | null | undefined,
  month: string,
) => {
  if (!dateStr || !month) return true;
  const { from, to } = getMonthRange(month);
  const date = new Date(dateStr).getTime();
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to + "T23:59:59").getTime();
  return date >= fromMs && date <= toMs;
};
