"use client";

import { useState, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import type { PetitionDetail, SignPetitionRequest, DeliveryMethod, MailAddress } from "@/types/petition";
import type { ApiResponse } from "@/lib/api-response";

interface PetitionSignFormProps {
  petition: PetitionDetail;
  initialHasSigned: boolean;
}

const EMPTY_ADDRESS: MailAddress = { name: "", line1: "", line2: "", city: "", state: "", zip: "" };

async function signPetition(slug: string, body: SignPetitionRequest): Promise<void> {
  const res = await fetch(`/api/v1/petitions/${slug}/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await res.json()) as ApiResponse<{ message: string }>;
  if (!res.ok || !result.success) {
    throw new Error((result as { error?: string }).error ?? "Failed to sign petition");
  }
}

export function PetitionSignForm({ petition, initialHasSigned }: PetitionSignFormProps) {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("email");
  const [customMessage, setCustomMessage] = useState("");
  const [senderAddress, setSenderAddress] = useState<MailAddress>(EMPTY_ADDRESS);
  const [hasSigned, setHasSigned] = useState(initialHasSigned);

  const buildPayload = (): SignPetitionRequest => {
    const base: SignPetitionRequest = {
      deliveryMethod,
      customMessage: customMessage || undefined,
    };
    if (deliveryMethod === "physical_mail") {
      base.senderAddress = {
        name: senderAddress.name.trim(),
        line1: senderAddress.line1.trim(),
        ...(senderAddress.line2?.trim() ? { line2: senderAddress.line2.trim() } : {}),
        city: senderAddress.city.trim(),
        state: senderAddress.state.trim().toUpperCase(),
        zip: senderAddress.zip.trim(),
      };
    }
    return base;
  };

  const { mutate, isPending, error, isSuccess } = useMutation({
    mutationFn: () => signPetition(petition.slug, buildPayload()),
    onSuccess: () => setHasSigned(true),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutate();
  };

  const updateAddress = (field: keyof MailAddress, value: string) =>
    setSenderAddress((prev) => ({ ...prev, [field]: value }));

  if (petition.status !== "active") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-500">
        This petition is no longer accepting signatures.
      </div>
    );
  }

  if (hasSigned || isSuccess) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-5">
        <p className="text-sm font-semibold text-green-800">You&apos;ve signed this petition.</p>
        <p className="mt-1 text-sm text-green-700">Your signature has been recorded. Thank you for making your voice heard.</p>
      </div>
    );
  }

  const availableMethods: DeliveryMethod[] = petition.hasPhysicalMailOption
    ? ["email", "physical_mail"]
    : ["email"];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Delivery method */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">How should your letter be delivered?</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {availableMethods.map((method) => (
            <label
              key={method}
              className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${
                deliveryMethod === method
                  ? "border-amber-400 bg-amber-50 font-medium text-slate-900"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="deliveryMethod"
                value={method}
                checked={deliveryMethod === method}
                onChange={() => setDeliveryMethod(method)}
                className="accent-amber-500"
              />
              {method === "email" ? "Email (free)" : "Physical mail ($2–3)"}
            </label>
          ))}
        </div>
      </div>

      {/* Sender address — only when physical mail is selected */}
      {deliveryMethod === "physical_mail" && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">Your mailing address</p>
          <p className="text-xs text-slate-500">Required so Lob.com can print and mail your letter. It will appear as the return address.</p>

          <input
            type="text"
            placeholder="Full name"
            required
            value={senderAddress.name}
            onChange={(e) => updateAddress("name", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <input
            type="text"
            placeholder="Street address"
            required
            value={senderAddress.line1}
            onChange={(e) => updateAddress("line1", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <input
            type="text"
            placeholder="Apt, suite, etc. (optional)"
            value={senderAddress.line2 ?? ""}
            onChange={(e) => updateAddress("line2", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <input
              type="text"
              placeholder="City"
              required
              value={senderAddress.city}
              onChange={(e) => updateAddress("city", e.target.value)}
              className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 sm:col-span-1"
            />
            <input
              type="text"
              placeholder="State"
              required
              maxLength={2}
              value={senderAddress.state}
              onChange={(e) => updateAddress("state", e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
            <input
              type="text"
              placeholder="ZIP code"
              required
              maxLength={10}
              value={senderAddress.zip}
              onChange={(e) => updateAddress("zip", e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>
        </div>
      )}

      {/* Optional custom message */}
      <div>
        <label htmlFor="custom-message" className="mb-1.5 block text-sm font-medium text-slate-700">
          Personal note <span className="font-normal text-slate-400">(optional — added after the template)</span>
        </label>
        <textarea
          id="custom-message"
          rows={3}
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          maxLength={500}
          placeholder="Add a brief personal note to your letter…"
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
        />
        <p className="mt-1 text-right text-xs text-slate-400">{customMessage.length}/500</p>
      </div>

      {/* Error state */}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : "Failed to sign petition"}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-[1px] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isPending ? "Signing…" : "Sign this petition"}
      </button>

      <p className="text-center text-xs text-slate-400">
        Your name and contact info will be attached to your letter per your account settings.
      </p>
    </form>
  );
}
