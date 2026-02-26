import Link from "next/link";
import { ReactNode } from "react";

interface BackButtonProps {
  href: string;
  children: ReactNode;
}

export function BackButton({ href, children }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {children}
    </Link>
  );
}
