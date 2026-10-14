import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Counter } from "./Counter";

afterEach(cleanup);

describe("Counter", () => {
  it("renders with initial count", () => {
    render(<Counter initial={5} />);
    expect(screen.getByText("Count: 5")).toBeDefined();
  });

  it("increments on click", () => {
    render(<Counter initial={0} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Count: 1")).toBeDefined();
  });
});