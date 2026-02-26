import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = "primary", loading = false, className = "", children, disabled, ...props }: ButtonProps) {
  const baseStyles =
    "inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0";

  const variants = {
    primary: "bg-slate-900 text-white shadow-slate-900/30 hover:-translate-y-[1px] hover:shadow-xl",
    secondary: "bg-white text-slate-900 shadow-slate-200/50 hover:-translate-y-[1px] hover:shadow-xl",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? "Loading..." : children}
    </button>
  );
}
