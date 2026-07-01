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
