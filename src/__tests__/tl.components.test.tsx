/** @jest-environment jsdom */
/**
 * The design system's shared layer (src/components/tl): the sheet is a real
 * modal dialog, tabs and filters say what is selected, states announce
 * themselves, and fields wire their hints and errors.
 */
import React, { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Banner,
  ChipGroup,
  ConfirmSheet,
  CountBadge,
  EmptyNote,
  Field,
  PageHeader,
  PageSkeleton,
  Pill,
  ScreenError,
  ScreenLoading,
  SearchField,
  Segmented,
  Sheet,
  StatTile,
  Tabs,
  Toggle,
  describedByFor,
  initialsOf,
  toneClass,
} from "@/components/tl";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

/**
 * A sheet with a trigger, so focus return can be checked.
 *
 * @param props - Whether the sheet may be dismissed.
 * @param props.dismissible - Passed to the sheet.
 * @returns The harness.
 */
function SheetHarness({ dismissible = true }: { dismissible?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Assign ticket"
        subtitle="Choose who handles it."
        dismissible={dismissible}
        footer={<button type="button">Save</button>}
      >
        <input aria-label="Assignee" />
      </Sheet>
    </>
  );
}

describe("Sheet", () => {
  it("is a modal dialog named by its title and described by its subtitle", async () => {
    const user = userEvent.setup();
    render(<SheetHarness />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog", { name: "Assign ticket" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("Choose who handles it.");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("moves focus in, keeps Tab inside, closes on Escape and returns focus", async () => {
    const user = userEvent.setup();
    render(<SheetHarness />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText("Assignee")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("closes from the overlay", async () => {
    const user = userEvent.setup();
    render(<SheetHarness />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.click(screen.getByTestId("sheet-overlay"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cannot be dismissed while it is busy", async () => {
    const user = userEvent.setup();
    render(<SheetHarness dismissible={false} />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.keyboard("{Escape}");
    fireEvent.click(screen.getByTestId("sheet-overlay"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
  });
});

describe("ConfirmSheet", () => {
  it("confirms, cancels, and disables both while busy", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { rerender } = render(
      <ConfirmSheet
        open
        title="Delete event?"
        body="It is removed for everyone."
        confirmLabel="Delete event"
        danger
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    const dialog = screen.getByRole("dialog", { name: "Delete event?" });
    expect(dialog).toHaveTextContent("It is removed for everyone.");
    await user.click(screen.getByRole("button", { name: "Delete event" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(
      <ConfirmSheet
        open
        busy
        busyLabel="Deleting…"
        title="Delete event?"
        body="x"
        confirmLabel="Delete event"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});

describe("Tabs, Segmented and ChipGroup", () => {
  const options = [
    { value: "open", label: "Open", count: 4 },
    { value: "resolved", label: "Resolved", count: 0 },
    { value: "closed", label: "Closed", disabled: true },
  ] as const;

  it("Tabs is a tab list: the selected tab is marked and arrows move along the enabled tabs", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Tabs options={options} value="open" onChange={onChange} label="Ticket status" />);
    const list = screen.getByRole("tablist", { name: "Ticket status" });
    expect(list).toBeTruthy();
    const open = screen.getByRole("tab", { name: /Open/ });
    expect(open).toHaveAttribute("aria-selected", "true");
    expect(open).toHaveTextContent("4");
    open.focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("resolved");
    await user.keyboard("{ArrowRight}");
    // Closed is disabled, so the selection wraps to Open.
    expect(onChange).toHaveBeenLastCalledWith("open");
  });

  it("Segmented and ChipGroup are named groups of pressed buttons", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <>
        <Segmented
          options={options}
          value="resolved"
          onChange={onChange}
          label="Show tickets that are"
        />
        <ChipGroup options={options} value="open" onChange={onChange} label="Area" />
      </>
    );
    const group = screen.getByRole("group", { name: "Show tickets that are" });
    expect(group.querySelector('[aria-pressed="true"]')).toHaveTextContent("Resolved");
    await user.click(screen.getByRole("group", { name: "Area" }).querySelectorAll("button")[0]);
    expect(onChange).toHaveBeenCalledWith("open");
  });
});

describe("states", () => {
  it("ScreenLoading and PageSkeleton announce what is loading", () => {
    render(
      <>
        <ScreenLoading label="Loading tickets" />
        <PageSkeleton label="Loading payments" tiles={3} />
      </>
    );
    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(screen.getByText("Loading tickets")).toBeTruthy();
    expect(screen.getByRole("status", { name: "Loading payments" })).toHaveAttribute(
      "aria-busy",
      "true"
    );
  });

  it("ScreenError is an alert with a retry", async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(<ScreenError message="Check your connection." onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load this");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("EmptyNote and Banner show their words and action", () => {
    render(
      <>
        <EmptyNote title="No tickets yet" action={<button type="button">New ticket</button>}>
          Tickets parents raise appear here.
        </EmptyNote>
        <Banner tone="warning" title="Waiting on you" role="status">
          Reply within 2 days.
        </Banner>
      </>
    );
    expect(screen.getByText("No tickets yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "New ticket" })).toBeTruthy();
    expect(screen.getByRole("status")).toHaveTextContent("Waiting on you");
  });
});

describe("bits", () => {
  it("Field ties the label, hint and error to the control", () => {
    render(
      <Field id="subject" label="Subject" hint="3 to 140 characters" error="Too short" required>
        <input
          id="subject"
          aria-invalid
          aria-describedby={describedByFor("subject", "hint", "error")}
        />
      </Field>
    );
    const input = screen.getByLabelText(/Subject/);
    expect(input).toHaveAccessibleDescription("Too short 3 to 140 characters");
  });

  it("SearchField clears with its button", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<SearchField value="ada" onChange={onChange} label="Search tickets" />);
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("Toggle is a switch that flips", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Toggle checked={false} onChange={onChange} label="Internal note" />);
    const toggle = screen.getByRole("switch", { name: "Internal note" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await user.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("CountBadge caps at 99+ and hides at zero; Pill shows its words", () => {
    const { container, rerender } = render(<CountBadge count={0} />);
    expect(container.textContent).toBe("");
    rerender(<CountBadge count={250} label="250 unread" />);
    expect(screen.getByText("99+")).toBeTruthy();
    rerender(<Pill tone="success">Resolved</Pill>);
    expect(screen.getByText("Resolved")).toBeTruthy();
  });

  it("initials and tones are stable", () => {
    expect(initialsOf("Ada Student")).toBe("AS");
    expect(initialsOf("  ")).toBe("?");
    expect(toneClass("abc")).toBe(toneClass("abc"));
    expect(toneClass("abc")).toMatch(/^tl-tone-[0-5]$/);
  });

  it("StatTile can be a link; PageHeader renders the page's h1 and actions", () => {
    act(() => {
      render(
        <>
          <PageHeader
            title="Support desk"
            subtitle="Tickets from your school"
            actions={<button type="button">New</button>}
          />
          <StatTile label="Open" value={4} href="/support?status=open" hint="2 unassigned" />
        </>
      );
    });
    expect(screen.getByRole("heading", { level: 1, name: "Support desk" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open/ })).toHaveAttribute(
      "href",
      "/support?status=open"
    );
  });
});
