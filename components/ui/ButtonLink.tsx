import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "@/lib/ui/button-variants";
import { cn } from "@/lib/ui/cn";

export type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export default function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  leftIcon,
  rightIcon,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
