import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CourseCover } from "./course-cover";

describe("CourseCover", () => {
  it("generates a cover with the course label when there is no image", () => {
    render(<CourseCover courseId={1} title="TypeScript from zero" coverUrl={null} />);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("shows the image when the cover url is a web link", () => {
    const { container } = render(
      <CourseCover courseId={1} title="TypeScript" coverUrl="https://cdn.example.com/a.png" />,
    );
    expect(container.querySelector("img")).toHaveAttribute("src", "https://cdn.example.com/a.png");
  });

  it("falls back to the generated cover when the image cannot load", () => {
    const { container } = render(
      <CourseCover
        courseId={2}
        title="FastAPI in Practice"
        coverUrl="https://cdn.example.com/a.png"
      />,
    );
    const image = container.querySelector("img");
    expect(image).not.toBeNull();
    if (image) fireEvent.error(image);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("FastAPI")).toBeInTheDocument();
  });

  it("ignores cover urls with unsafe schemes", () => {
    const { container } = render(
      <CourseCover courseId={3} title="Design Systems" coverUrl="javascript:alert(1)" />,
    );
    expect(container.querySelector("img")).toBeNull();
  });
});
