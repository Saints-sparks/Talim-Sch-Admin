/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@/test-utils/render";
import { Button } from "../button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Submit</Button>);
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: /disabled/i })).toBeDisabled();
  });

  it("does not fire onClick when disabled", () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>
    );
    fireEvent.click(screen.getByRole("button", { name: /disabled/i }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each([
    ["default", "default"],
    ["destructive", "destructive"],
    ["outline", "outline"],
    ["secondary", "secondary"],
    ["ghost", "ghost"],
    ["link", "link"],
  ] as const)("renders variant=%s without throwing", (_, variant) => {
    render(<Button variant={variant}>{variant}</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it.each([
    ["default", "default"],
    ["sm", "sm"],
    ["lg", "lg"],
    ["icon", "icon"],
  ] as const)("renders size=%s without throwing", (_, size) => {
    render(<Button size={size}>btn</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("accepts additional className", () => {
    render(<Button className="custom-class">Styled</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("renders as a child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/home">Go home</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: /go home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/home");
  });
});
