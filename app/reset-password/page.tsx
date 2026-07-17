import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Choose a new password"
      description="Use a strong password you have not used elsewhere."
      footer={
        <Link
          href="/login"
          className="font-medium text-violet-400/90 transition hover:text-violet-300"
        >
          Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
