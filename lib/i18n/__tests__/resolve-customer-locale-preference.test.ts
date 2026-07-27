import { afterEach, describe, expect, it, vi } from "vitest";

import { PEERGENT_PUBLIC_LOCALE_ENV } from "../resolve-customer-locale-preference";
import {
  customerLocalePreferenceFromEnv,
  readPeergentPublicLocaleEnv,
  resolveCustomerLocalePreference,
} from "../resolve-customer-locale-preference";

describe("resolveCustomerLocalePreference", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses nl when NEXT_PUBLIC_PEERGENT_LOCALE is nl", () => {
    vi.stubEnv(PEERGENT_PUBLIC_LOCALE_ENV, "nl");
    expect(readPeergentPublicLocaleEnv()).toBe("nl");
    expect(resolveCustomerLocalePreference()).toBe("nl");
    expect(customerLocalePreferenceFromEnv()).toBe("nl");
  });

  it("uses en when NEXT_PUBLIC_PEERGENT_LOCALE is en", () => {
    vi.stubEnv(PEERGENT_PUBLIC_LOCALE_ENV, "en");
    expect(resolveCustomerLocalePreference()).toBe("en");
  });

  it("falls back to English for invalid or missing env", () => {
    vi.stubEnv(PEERGENT_PUBLIC_LOCALE_ENV, "fr");
    expect(resolveCustomerLocalePreference()).toBe("en");
    vi.unstubAllEnvs();
    expect(resolveCustomerLocalePreference()).toBe("en");
    vi.stubEnv(PEERGENT_PUBLIC_LOCALE_ENV, "  ");
    expect(resolveCustomerLocalePreference()).toBe("en");
  });

  it("prefers explicit preference over env", () => {
    vi.stubEnv(PEERGENT_PUBLIC_LOCALE_ENV, "nl");
    expect(resolveCustomerLocalePreference("en")).toBe("en");
  });
});
