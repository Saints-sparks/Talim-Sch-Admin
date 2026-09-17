/** The finance page's tabs, in the order they appear. */
export const FINANCE_TABS = [
  "Overview",
  "Transactions",
  "Withdrawals",
  "Payout Accounts",
  "Settings",
] as const;

/** One of the finance page's tabs. */
export type FinanceTab = (typeof FINANCE_TABS)[number];

/** Rows per page for every finance table; the API caps `limit` at 100. */
export const FINANCE_PAGE_SIZE = 20;
