import { ReactNode } from "react";

interface AlertProps {
  variant: "success" | "error" | "info";
  title?: string;
  children: ReactNode;
}

export function Alert({ variant, title, children }: AlertProps) {
  const variants = {
    success: {
      container: "bg-emerald-50 border-emerald-200 text-emerald-900",
      title: "text-emerald-900",
      text: "text-emerald-700",
    },
    error: {
      container: "bg-red-50 border-red-200 text-red-900",
      title: "text-red-900",
      text: "text-red-700",
    },
    info: {
      container: "bg-blue-50 border-blue-200 text-blue-900",
      title: "text-blue-900",
      text: "text-blue-700",
    },
  };

  const styles = variants[variant];

  return (
    <div className={`rounded-2xl border p-6 ${styles.container}`}>
      {title && <p className={`text-lg font-semibold ${styles.title}`}>{title}</p>}
      <div className={`${title ? "mt-2" : ""} text-sm ${styles.text}`}>{children}</div>
    </div>
  );
}
