const FORBIDDEN_CUSTOMER_TERMS =
  /\b(workflow|langgraph|prompt|token|brain runtime|capability id|step id|orchestrat|agent runtime|pipeline node|validationgraph|publicationreadiness|business_fit|legal_claims|validation brain|evaluator)\b/i;

/** Strip internal vocabulary from customer-facing copy. */
export function sanitizeCustomerText(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  if (FORBIDDEN_CUSTOMER_TERMS.test(text)) return null;
  return text.trim();
}

export function customerTextOrFallback(
  text: string | null | undefined,
  fallback: string
): string {
  return sanitizeCustomerText(text) ?? fallback;
}
