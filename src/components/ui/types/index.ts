import type { ButtonHTMLAttributes, FocusEvent, InputHTMLAttributes, ReactNode } from "react";

export type Status = "advanced" | "stalled" | "overdue" | "scheduled" | "passed" | "update";

export type DataStatus = "todo" | "partial" | "live";

export interface AlertProps {
  variant: "success" | "error" | "info";
  title?: string;
  children: ReactNode;
}

export interface BackButtonProps {
  href: string;
  children: ReactNode;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  loading?: boolean;
  children: ReactNode;
}

export interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: ReactNode;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  label?: string;
  labelClassName?: string;
  id?: string;
  className?: string;
  autoComplete?: string;
  disabled?: boolean;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
}

export interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  dataStatus?: DataStatus;
}
