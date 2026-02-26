"use client";

import { useState, FormEvent } from "react";
import { Alert } from "@/components/ui";
import { useWaitlistSignup } from "@/hooks";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const { loading, success, error, submitEmail } = useWaitlistSignup();

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("");
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      validateEmail(value);
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    await submitEmail(email);
    setEmail("");
  };

  if (success) {
    return (
      <Alert variant="success" title="You're on the list!">
        Check your email for confirmation. We&apos;ll notify you when we launch.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <form className="flex flex-col gap-3 md:flex-row md:items-start" onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            required
            disabled={loading}
            className={`h-12 w-full md:w-96 rounded-full border bg-white px-5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition ${
              emailError
                ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                : "border-slate-200 focus:border-amber-300 focus:ring-amber-200"
            }`}
          />
          {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
        </div>
        <button
          type="submit"
          disabled={loading || !!emailError}
          className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-full bg-slate-900 px-8 text-base font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:-translate-y-[1px] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing up..." : "Notify me"}
        </button>
      </form>

      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
