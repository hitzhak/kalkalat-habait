/**
 * Server-safe helper: extract month/year from searchParams.
 * Can be used in both Server and Client components.
 */
export function getMonthYearFromParams(searchParams: { month?: string; year?: string }) {
  const now = new Date();
  const month = Number(searchParams.month) || (now.getMonth() + 1);
  const year = Number(searchParams.year) || now.getFullYear();
  return { month, year };
}
