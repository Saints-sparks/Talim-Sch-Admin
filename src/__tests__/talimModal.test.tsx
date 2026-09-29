/** @jest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import TalimModal from "@/components/ui/TalimModal";

describe("TalimModal", () => {
  it("is a modal dialog named by its title, with a named close button", () => {
    const onClose = jest.fn();
    render(
      <TalimModal isOpen onClose={onClose} title="Create New Assessment" subtitle="Set up a new assessment">
        <p>Body</p>
      </TalimModal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Create New Assessment" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape, but not while it is saving", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <TalimModal isOpen onClose={onClose} title="Edit Assessment" isSubmitting>
        <p>Body</p>
      </TalimModal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    rerender(
      <TalimModal isOpen onClose={onClose} title="Edit Assessment">
        <p>Body</p>
      </TalimModal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when closed", () => {
    render(
      <TalimModal isOpen={false} onClose={jest.fn()} title="Hidden">
        <p>Body</p>
      </TalimModal>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
