import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepresentativeLookup } from "@/components/representatives/RepresentativeLookup";

const { useRepresentativeLookupMock, useAddressAutocompleteMock, representativeCardMock, districtSnapshotCardMock } =
  vi.hoisted(() => ({
    useRepresentativeLookupMock: vi.fn(),
    useAddressAutocompleteMock: vi.fn(),
    representativeCardMock: vi.fn((props: any) => <div data-testid="rep-card">{props.rep.name}</div>),
    districtSnapshotCardMock: vi.fn((props: any) => (
      <div data-testid="district-card">{props.isPlaceholder ? "placeholder" : `${props.state}-${props.district}`}</div>
    )),
  }));

vi.mock("@/hooks", () => ({
  useRepresentativeLookup: useRepresentativeLookupMock,
  useAddressAutocomplete: useAddressAutocompleteMock,
}));

vi.mock("@/components/representatives/RepresentativeCard", () => ({
  RepresentativeCard: representativeCardMock,
}));

vi.mock("@/components/representatives/DistrictSnapshotCard", () => ({
  DistrictSnapshotCard: districtSnapshotCardMock,
}));

describe("RepresentativeLookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRepresentativeLookupMock.mockReturnValue({
      loading: false,
      error: "",
      representatives: [],
      state: "",
      district: "",
      lookupByAddress: vi.fn().mockResolvedValue(undefined),
    });
    useAddressAutocompleteMock.mockReturnValue({
      predictions: [],
      fetchPredictions: vi.fn(),
      clearPredictions: vi.fn(),
    });
  });

  it("shows placeholder cards before first search", () => {
    render(<RepresentativeLookup />);
    expect(screen.getByText("Your Representatives")).toBeInTheDocument();
    expect(screen.getAllByTestId("rep-card")).toHaveLength(3);
    expect(screen.getByTestId("district-card")).toHaveTextContent("placeholder");
  });

  it("handles autocomplete selection", async () => {
    const user = userEvent.setup();
    const clearPredictions = vi.fn();
    const fetchPredictions = vi.fn();
    useAddressAutocompleteMock.mockReturnValue({
      predictions: [{ description: "123 Main St", placeId: "a" }],
      fetchPredictions,
      clearPredictions,
    });

    render(<RepresentativeLookup />);
    const input = screen.getByPlaceholderText("123 Main St, City, State ZIP");
    await user.type(input, "123");
    expect(fetchPredictions).toHaveBeenCalled();

    await user.click(screen.getByText("123 Main St"));
    expect(clearPredictions).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("123 Main St");
  });

  it("submits lookups and shows empty state when no representatives are returned", async () => {
    const lookupByAddress = vi.fn().mockResolvedValue(undefined);
    useRepresentativeLookupMock.mockReturnValue({
      loading: false,
      error: "",
      representatives: [],
      state: "",
      district: "",
      lookupByAddress,
    });

    render(<RepresentativeLookup />);
    const input = screen.getByPlaceholderText("123 Main St, City, State ZIP");
    fireEvent.change(input, { target: { value: "123 Main St" } });
    fireEvent.submit(input.closest("form")!);

    expect(lookupByAddress).toHaveBeenCalledWith("123 Main St");
    expect(screen.getByText(/No representatives found for this address/i)).toBeInTheDocument();
  });

  it("renders lookup errors", () => {
    useRepresentativeLookupMock.mockReturnValue({
      loading: false,
      error: "Unable to lookup",
      representatives: [],
      state: "",
      district: "",
      lookupByAddress: vi.fn(),
    });

    render(<RepresentativeLookup />);
    expect(screen.getByText("Unable to load representatives")).toBeInTheDocument();
    expect(screen.getByText("Unable to lookup")).toBeInTheDocument();
  });

  it("renders live representatives and district snapshot", () => {
    useRepresentativeLookupMock.mockReturnValue({
      loading: false,
      error: "",
      representatives: [
        {
          id: "1",
          name: "Rep One",
          area: "US House",
          phone: "202-555-0100",
        },
      ],
      state: "MO",
      district: "02",
      lookupByAddress: vi.fn(),
    });

    render(<RepresentativeLookup />);
    expect(screen.getByText("Example Results")).toBeInTheDocument();
    expect(screen.getByText("1 results")).toBeInTheDocument();
    expect(screen.getByTestId("district-card")).toHaveTextContent("MO-02");
  });
});
