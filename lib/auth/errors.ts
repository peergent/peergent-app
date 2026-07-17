export function getAuthErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again.";
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "";

  if (message.includes("Invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  if (message.includes("User already registered")) {
    return "An account with this email already exists.";
  }

  if (message.includes("Password should be at least")) {
    return "Password must be at least 8 characters.";
  }

  if (message.includes("Email not confirmed")) {
    return "Please verify your email before signing in.";
  }

  if (message.includes("Email link is invalid or has expired")) {
    return "This link has expired. Request a new one.";
  }

  return message || "Something went wrong. Please try again.";
}
