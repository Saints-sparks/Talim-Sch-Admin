/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import { TransferActions } from "@/components/transit/TransferActions";
import {
  transferAbilities,
  type TransferRequest,
  type TransferStatus,
} from "@/app/services/transit.service";

jest.mock("@/hooks/usePermissions");
import { usePermissions } from "@/hooks/usePermissions";

const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

const SOURCE = "school-source";
const TARGET = "school-target";

function withPermission(granted: boolean) {
  mockUsePermissions.mockReturnValue({
    isFullAdmin: granted,
    isSubAdmin: !granted,
    hasPermission: () => granted,
    hasAllPermissions: () => granted,
    hasAnyPermission: () => granted,
    permissions: granted ? ["manage:transit"] : [],
  });
}

function transfer(overrides: Partial<TransferRequest> = {}): TransferRequest {
  return {
    _id: "t1",
    studentId: { _id: "s1", admissionNumber: "ADM-1" },
    sourceSchoolId: { _id: SOURCE, name: "Source High" },
    targetSchoolId: { _id: TARGET, name: "Target High" },
    status: "requested",
    initiatedBy: "target",
    documents: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderActions(
  status: TransferStatus,
  viewerSchoolId: string,
  options: { sourceApprovedAt?: string; onAction?: jest.Mock } = {}
) {
  const onAction = options.onAction ?? jest.fn();
  const abilities = transferAbilities(
    transfer({ status, sourceApprovedAt: options.sourceApprovedAt }),
    viewerSchoolId
  );
  render(<TransferActions abilities={abilities} pending={null} onAction={onAction} />);
  return { onAction };
}

beforeEach(() => {
  jest.clearAllMocks();
  withPermission(true);
});

describe("TransferActions — who may act, and when", () => {
  it("offers the source school the release on a requested transfer", () => {
    renderActions("requested", SOURCE);
    expect(screen.getByRole("button", { name: /approve \(source school\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel transfer/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve \(target school\)/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^reject$/i })).toBeNull();
  });

  it("tells the target school to wait until the student is released", () => {
    renderActions("requested", TARGET);
    expect(screen.getByText(/waiting for the current school to release/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve \(target school\)/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /accept transfer/i })).toBeNull();
    // Rejecting is the one thing the receiving school may always do while open.
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeInTheDocument();
  });

  it("offers the target school approval only once the source school released", () => {
    renderActions("source_approved", TARGET, { sourceApprovedAt: "2025-01-02" });
    expect(screen.getByRole("button", { name: /approve \(target school\)/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept transfer/i })).toBeNull();
  });

  it("leaves the source school nothing but the wait after releasing", () => {
    renderActions("source_approved", SOURCE, { sourceApprovedAt: "2025-01-02" });
    expect(screen.getByText(/waiting for the receiving school to approve/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel transfer/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve \(source school\)/i })).toBeNull();
  });

  it("offers acceptance to the target school after target approval", () => {
    renderActions("target_approved", TARGET, { sourceApprovedAt: "2025-01-02" });
    expect(screen.getByRole("button", { name: /accept transfer/i })).toBeInTheDocument();
  });

  it("gives the source school nothing once the target school has approved", () => {
    const { container } = render(
      <TransferActions
        abilities={transferAbilities(
          transfer({ status: "target_approved", sourceApprovedAt: "2025-01-02" }),
          SOURCE
        )}
        pending={null}
        onAction={jest.fn()}
      />
    );
    // Not its move, and too late to cancel.
    expect(container).toBeEmptyDOMElement();
  });

  it("shows no actions at all once the transfer is terminal", () => {
    for (const status of ["accepted", "rejected", "cancelled"] as TransferStatus[]) {
      const { container } = render(
        <TransferActions
          abilities={transferAbilities(transfer({ status }), TARGET)}
          pending={null}
          onAction={jest.fn()}
        />
      );
      expect(container).toBeEmptyDOMElement();
    }
  });
});

describe("TransferActions — permission gating", () => {
  it("hides every control from an admin without manage:transit", () => {
    withPermission(false);
    renderActions("requested", SOURCE);
    expect(screen.queryByRole("button", { name: /approve \(source school\)/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /cancel transfer/i })).toBeNull();
    expect(screen.getByText(/needs the transit permission/i)).toBeInTheDocument();
  });

  it("explains the empty panel rather than showing buttons the API would refuse", () => {
    withPermission(false);
    render(
      <TransferActions
        abilities={transferAbilities(
          transfer({ status: "target_approved", sourceApprovedAt: "2025-01-02" }),
          TARGET
        )}
        pending={null}
        onAction={jest.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /accept transfer/i })).toBeNull();
    expect(screen.getByText(/needs the transit permission/i)).toBeInTheDocument();
  });

  it("renders nothing for a school that is not a party to the transfer", () => {
    const { container } = render(
      <TransferActions
        abilities={transferAbilities(transfer({ status: "requested" }), "school-other")}
        pending={null}
        onAction={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("TransferActions — running a transition", () => {
  it("reports the release with the action the API expects", async () => {
    const { onAction } = renderActions("requested", SOURCE);
    await userEvent.click(screen.getByRole("button", { name: /approve \(source school\)/i }));
    expect(onAction).toHaveBeenCalledWith({ type: "source-approve" });
  });

  it("collects a reason before rejecting, and passes it on", async () => {
    const { onAction } = renderActions("source_approved", TARGET, {
      sourceApprovedAt: "2025-01-02",
    });

    await userEvent.click(screen.getByRole("button", { name: /^reject$/i }));
    await userEvent.type(screen.getByLabelText(/reason for rejection/i), "No space in JSS 1");
    await userEvent.click(screen.getByRole("button", { name: /confirm reject/i }));

    expect(onAction).toHaveBeenCalledWith({ type: "reject", reason: "No space in JSS 1" });
  });

  it("sends no reason when the box is left empty", async () => {
    const { onAction } = renderActions("requested", SOURCE);
    await userEvent.click(screen.getByRole("button", { name: /cancel transfer/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm cancel/i }));
    expect(onAction).toHaveBeenCalledWith({ type: "cancel", reason: undefined });
  });

  it("disables every control while one action is in flight", () => {
    render(
      <TransferActions
        abilities={transferAbilities(transfer({ status: "requested" }), SOURCE)}
        pending="source-approve"
        onAction={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /approve \(source school\)/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel transfer/i })).toBeDisabled();
  });
});
