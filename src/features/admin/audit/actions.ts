/** Short words kept in capitals when an action is spelt out */
const ACRONYMS = new Set(["KYC", "OTP", "NFVCB"]);

/**
 * An audit action in the API's own words, in sentence case: PASSWORD_CHECK_FAILED is
 * "Password check failed". ADMIN_ is dropped, as the log already says who acted.
 */
export function auditActionLabel(action: string): string {
  const words = action
    .replace(/^ADMIN_/, "")
    .split("_")
    .filter(Boolean)
    .map((word) => (ACRONYMS.has(word) ? word : word.toLowerCase()));
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
