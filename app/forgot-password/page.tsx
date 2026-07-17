import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      description="We will email you a secure link to choose a new password."
      footer={
        <Link
          href="/login"
          className="font-medium text-violet-400/90 transition hover:text-violet-300"
        >
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
