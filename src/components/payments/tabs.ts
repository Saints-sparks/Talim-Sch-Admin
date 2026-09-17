/** The payments page's tabs, in the order they appear. */
export const PAYMENT_TABS = ["Overview", "Transactions", "Receipts", "Payment Providers"] as const;

/** One of the payments page's tabs. */
export type PaymentTab = (typeof PAYMENT_TABS)[number];

/** Human labels for the provider names the backend returns. */
export const PROVIDER_LABELS: Record<string, string> = {
  paystack: "Paystack",
  opay: "OPay",
  stripe: "Stripe",
};
