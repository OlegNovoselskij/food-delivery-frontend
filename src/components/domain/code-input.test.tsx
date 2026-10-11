import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { CodeInput } from "./code-input";

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <CodeInput value={value} onChange={setValue} label="Verification code" />
      <output data-testid="value">{value}</output>
    </>
  );
}

function box(position: number): HTMLElement {
  return screen.getByRole("textbox", { name: `Digit ${position} of 6` });
}

describe("CodeInput", () => {
  it("renders six labelled boxes in a group", () => {
    render(<Harness />);
    expect(screen.getByRole("group", { name: "Verification code" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
  });

  it("moves focus forward while typing", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(box(1));
    await user.keyboard("471");
    expect(screen.getByTestId("value")).toHaveTextContent("471");
    expect(box(4)).toHaveFocus();
  });

  it("fills every box from a pasted code and ignores non-digits", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(box(1));
    await user.paste("482 913 77");
    expect(screen.getByTestId("value")).toHaveTextContent("482913");
    expect(box(6)).toHaveFocus();
  });

  it("deletes the previous digit with backspace on an empty box", async () => {
    const user = userEvent.setup();
    render(<Harness initial="47" />);
    await user.click(box(3));
    await user.keyboard("{Backspace}");
    expect(screen.getByTestId("value")).toHaveTextContent("4");
    expect(box(2)).toHaveFocus();
  });

  it("writes into the first empty box when a later box is used", async () => {
    const user = userEvent.setup();
    render(<Harness initial="12" />);
    await user.click(box(6));
    await user.keyboard("9");
    expect(screen.getByTestId("value")).toHaveTextContent("129");
    expect(box(4)).toHaveFocus();
  });
});
