import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RepresentativeCard } from "@/components/representatives/RepresentativeCard";

describe("RepresentativeCard", () => {
  it("shows initials when no photo URL is provided", () => {
    render(<RepresentativeCard rep={{ id: "1", name: "Avery Chen", area: "US House", phone: "202-555-0100" }} />);

    expect(screen.getByText("AC")).toBeInTheDocument();
    expect(screen.getByText("Example profile")).toBeInTheDocument();
  });

  it("renders representative photo and link when available", () => {
    render(
      <RepresentativeCard
        rep={{
          id: "1",
          name: "Jordan Lee",
          area: "US Senate",
          phone: "202-555-0101",
          photoURL: "https://example.com/photo.jpg",
          url: "https://example.com",
        }}
      />,
    );

    expect(screen.getByAltText("Jordan Lee")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Visit Website/i })).toHaveAttribute("href", "https://example.com");
  });

  it("falls back to initials when image fails to load", () => {
    render(
      <RepresentativeCard
        rep={{
          id: "1",
          name: "Samira Patel",
          area: "US Senate",
          photoURL: "https://example.com/bad.jpg",
        }}
      />,
    );

    fireEvent.error(screen.getByAltText("Samira Patel"));
    expect(screen.getByText("SP")).toBeInTheDocument();
  });
});
