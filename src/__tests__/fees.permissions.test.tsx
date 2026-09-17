/**
 * @jest-environment jsdom
 */

/**
 * Who may act on fees.
 *
 * Every fees route on the backend is behind `@Permissions(MANAGE_FEES)`, so a
 * sub-admin without it must not be shown create, assign, archive or restore
 * controls — this pins the one hook every fees screen asks.
 */
import React from "react";
import { render, screen, mockAdmin, mockSubAdmin } from "@/test-utils/render";
import { useCanManageFees } from "@/hooks/fees/permissions";
import { Permission } from "@/lib/permissions";

function Probe() {
  return <span>{useCanManageFees() ? "can-manage" : "read-only"}</span>;
}

describe("useCanManageFees", () => {
  it("lets the primary school admin manage fees", () => {
    render(<Probe />, { user: mockAdmin });
    expect(screen.getByText("can-manage")).toBeInTheDocument();
  });

  it("lets a sub-admin holding manage:fees manage fees", () => {
    render(<Probe />, {
      user: { ...mockSubAdmin, permissions: [Permission.MANAGE_FEES] },
    });
    expect(screen.getByText("can-manage")).toBeInTheDocument();
  });

  it("keeps a sub-admin without manage:fees read-only", () => {
    render(<Probe />, { user: mockSubAdmin });
    expect(screen.getByText("read-only")).toBeInTheDocument();
  });

  it("is not satisfied by another finance permission", () => {
    render(<Probe />, {
      user: { ...mockSubAdmin, permissions: [Permission.MANAGE_PAYMENTS] },
    });
    expect(screen.getByText("read-only")).toBeInTheDocument();
  });

  it("uses the backend's permission string, not the constant's name", () => {
    expect(Permission.MANAGE_FEES).toBe("manage:fees");
    render(<Probe />, { user: { ...mockSubAdmin, permissions: ["MANAGE_FEES"] } });
    expect(screen.getByText("read-only")).toBeInTheDocument();
  });
});
