"use client";

import { ChangeEvent, useId } from "react";
import type { SearchBarProps } from "./types";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  isLoading = false,
  label,
  labelClassName = "block text-sm font-medium text-slate-700 mb-1.5",
  id: idProp,
  className = "",
  autoComplete = "off",
  disabled = false,
  onFocus,
}: SearchBarProps) {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);
  const handleClear = () => onChange("");

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className={labelClassName}>
          {label}
        </label>
      )}
      <div className="relative">
        {/* Search icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <svg
            className="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
        </div>

        <input
          id={inputId}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={onFocus}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className="w-full h-12 rounded-lg border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Right slot: loading spinner or clear button */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
              aria-label="Loading"
            />
          ) : value.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="flex items-center justify-center h-6 w-6 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
