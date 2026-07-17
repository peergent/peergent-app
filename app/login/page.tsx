import Link from "next/link";
import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your Peergent workspace."
      footer={
        <>
          <span className="text-slate-500">New here? </span>
          <Link
            href="/signup"
            className="font-medium text-violet-400/90 transition hover:text-violet-300"
          >
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-white/[0.04]" />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
