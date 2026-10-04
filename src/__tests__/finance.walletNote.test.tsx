/** @jest-environment jsdom */
/**
 * The wallet holds online provider payments only (product decision,
 * 2026-10-03): the wallet screens say so, so an admin who records cash or
 * confirms a bank transfer isn't surprised that the balance did not move.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import {
  WALLET_SOURCE_NOTE,
  WALLET_SOURCE_NOTE_SHORT,
  WalletSourceNote,
} from "@/components/finance/WalletSourceNote";

describe("WalletSourceNote", () => {
  it("explains on the wallet screens which payments reach the wallet", () => {
    render(<WalletSourceNote />);
    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(WALLET_SOURCE_NOTE);
    expect(note).toHaveTextContent(/Only online payments .* add to the wallet/);
    expect(note).toHaveTextContent(/confirmed bank transfers/);
  });

  it("has a short form where a payment is recorded", () => {
    render(<WalletSourceNote variant="short" />);
    expect(screen.getByRole("note")).toHaveTextContent(WALLET_SOURCE_NOTE_SHORT);
  });
});
