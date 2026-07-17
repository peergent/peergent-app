import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Start your workspace"
      description="Create your account and organization in one step."
      footer={
        <>
          <span className="text-slate-500">Already have an account? </span>
          <Link
            href="/login"
            className="font-medium text-violet-400/90 transition hover:text-violet-300"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthLayout>
  );
}
