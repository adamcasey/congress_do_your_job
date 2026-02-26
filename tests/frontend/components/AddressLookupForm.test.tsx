import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddressLookupForm } from "@/components/forms/AddressLookupForm";

const { useRepresentativeLookupMock, useAddressAutocompleteMock } = vi.hoisted(() => ({
  useRepresentativeLookupMock: vi.fn(),
  useAddressAutocompleteMock: vi.fn(),
}));

vi.mock("@/hooks", () => ({
  useRepresentativeLookup: useRepresentativeLookupMock,
  useAddressAutocomplete: useAddressAutocompleteMock,
}));

describe("AddressLookupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRepresentativeLookupMock.mockReturnValue({
      loading: false,
      representatives: [],
      lookupByAddress: vi.fn().mockResolvedValue(undefined),
    });
    useAddressAutocompleteMock.mockReturnValue({
      predictions: [],
      fetchPredictions: vi.fn(),
      clearPredictions: vi.fn(),
    });
  });

  it("shows autocomplete predictions and applies selected address", async () => {
    const user = userEvent.setup();
    const clearPredictions = vi.fn();
    useAddressAutocompleteMock.mockReturnValue({
      predictions: [{ description: "123 Main St, Springfield, MO", placeId: "1" }],
      fetchPredictions: vi.fn(),
      clearPredictions,
    });

    render(<AddressLookupForm />);

    const input = screen.getByPlaceholderText("123 Main St, City, State ZIP");
    await user.type(input, "123");
    await user.click(screen.getByText("123 Main St, Springfield, MO"));

    expect(clearPredictions).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("123 Main St, Springfield, MO");
  });

  it("submits address lookups", async () => {
    const lookupByAddress = vi.fn().mockResolvedValue(undefined);
    useRepresentativeLookupMock.mockReturnValue({
      loading: false,
      representatives: [],
      lookupByAddress,
    });

    render(<AddressLookupForm />);
    const input = screen.getByPlaceholderText("123 Main St, City, State ZIP");
    fireEvent.change(input, { target: { value: "123 Main St" } });
    fireEvent.submit(input.closest("form")!);

    expect(lookupByAddress).toHaveBeenCalledWith("123 Main St");
  });

  it("shows empty state when no representatives are found after search", () => {
    render(<AddressLookupForm />);
    const input = screen.getByPlaceholderText("123 Main St, City, State ZIP");
    fireEvent.change(input, { target: { value: "123 Main St" } });
    fireEvent.submit(input.closest("form")!);

    expect(screen.getByText(/No representatives found for this address/i)).toBeInTheDocument();
  });

  it("renders representative cards when data is available", () => {
    useRepresentativeLookupMock.mockReturnValue({
      loading: false,
      representatives: [
        {
          id: "1",
          name: "Rep One",
          area: "US House",
          phone: "202-555-0100",
          photoURL: "",
        },
      ],
      lookupByAddress: vi.fn(),
    });

    render(<AddressLookupForm />);
    expect(screen.getByText("Your Representatives")).toBeInTheDocument();
    expect(screen.getByText("Rep One")).toBeInTheDocument();
    expect(screen.getByText("US House")).toBeInTheDocument();
  });
});
