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

/**
 * A one-line reading for an entry whose numbers say more than who acted: the API's chat
 * moderation summary (`{ showtimeId, flagged: { userId: count } }`, once a minute). Null for
 * everything else.
 */
export function auditSummary(
  action: string,
  metadata: Record<string, unknown> | null,
): string | null {
  if (action !== "CHAT_MODERATION_SUMMARY") return null;
  const flagged = metadata?.flagged;
  if (typeof flagged !== "object" || flagged === null) return null;
  const counts = Object.values(flagged).filter((count) => typeof count === "number");
  const total = counts.reduce((sum, count) => sum + count, 0);
  const messages = total === 1 ? "message" : "messages";
  const members = counts.length === 1 ? "member" : "members";
  return `${total} filtered ${messages} from ${counts.length} ${members}`;
}
