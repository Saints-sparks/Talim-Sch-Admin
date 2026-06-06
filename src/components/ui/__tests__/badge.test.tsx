/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@/test-utils/render";
import { Badge } from "../badge";

describe("Badge", () => {
  it("renders its text content", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it.each([["default"], ["secondary"], ["destructive"], ["outline"]] as const)(
    "renders variant=%s without throwing",
    (variant) => {
      render(<Badge variant={variant}>{variant}</Badge>);
      expect(screen.getByText(variant)).toBeInTheDocument();
    }
  );

  it("merges custom className", () => {
    render(<Badge className="my-badge">Label</Badge>);
    expect(screen.getByText("Label")).toHaveClass("my-badge");
  });

  it("passes through arbitrary HTML attributes", () => {
    render(<Badge data-testid="status-badge">Draft</Badge>);
    expect(screen.getByTestId("status-badge")).toBeInTheDocument();
  });
});
