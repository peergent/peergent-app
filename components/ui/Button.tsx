import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import Loader from "@/components/ui/Loader";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "@/lib/ui/button-variants";
import { cn } from "@/lib/ui/cn";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  asChild?: boolean;
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  asChild = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = buttonVariants({ variant, size, className });

  if (asChild) {
    if (!isValidElement(children)) {
      throw new Error("Button with asChild requires a single React element child.");
    }

    const child = children as ReactElement<{ className?: string; children?: ReactNode }>;

    return cloneElement(child, {
      className: cn(classes, child.props.className),
      children: (
        <>
          {loading ? <Loader size="sm" /> : leftIcon}
          {child.props.children}
          {!loading && rightIcon}
        </>
      ),
    });
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading ? <Loader size="sm" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

export { buttonVariants };
