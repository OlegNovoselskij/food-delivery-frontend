import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authToken } from "@/api/auth-token";
import type { Review } from "@/api/types";
import {
  API_URL,
  buildCourse,
  buildEnrollment,
  buildProgram,
  buildReview,
  buildReviewPage,
  buildUser,
} from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const API = `${API_URL}/api/v1`;

afterEach(() => {
  authToken.clear();
});

interface State {
  reviews: Review[];
}

function mockCourse(state: State, options: { enrolled: boolean }) {
  server.use(
    http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 2 }))),
    http.get(`${API}/courses/1`, () => HttpResponse.json(buildCourse())),
    http.get(`${API}/courses/1/program`, () => HttpResponse.json(buildProgram())),
    http.get(`${API}/enrollments/mine`, () =>
      HttpResponse.json(options.enrolled ? [buildEnrollment({ status: "active" })] : []),
    ),
    http.get(`${API}/courses/1/reviews`, () =>
      HttpResponse.json(
        buildReviewPage({
          items: state.reviews,
          total: state.reviews.length,
          reviews_count: state.reviews.length,
        }),
      ),
    ),
  );
}

const mine = buildReview({ id: 9, student: { id: 2, name: "Andrii", surname: "Kovalenko" } });

describe("course reviews", () => {
  it("hides the form from visitors and students who are not enrolled", async () => {
    mockCourse({ reviews: [buildReview()] }, { enrolled: false });
    renderApp({ path: "/courses/1?tab=reviews", token: "t" });
    expect(await screen.findByText("Maria P.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Write a review" })).not.toBeInTheDocument();
  });

  it("validates the rating before sending", async () => {
    mockCourse({ reviews: [] }, { enrolled: true });
    const user = userEvent.setup();
    renderApp({ path: "/courses/1?tab=reviews", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Publish review" }));
    expect(await screen.findByText("Choose a rating from 1 to 5 stars")).toBeInTheDocument();
  });

  it("publishes a review and shows it as the student's own", async () => {
    const state: State = { reviews: [] };
    mockCourse(state, { enrolled: true });
    let body: unknown = null;
    server.use(
      http.post(`${API}/courses/1/reviews`, async ({ request }) => {
        body = await request.json();
        state.reviews = [mine];
        return HttpResponse.json(mine, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses/1?tab=reviews", token: "t" });
    await user.click(await screen.findByRole("radio", { name: "5 stars" }));
    await user.type(screen.getByLabelText("Comment (optional)"), "Great course");
    await user.click(screen.getByRole("button", { name: "Publish review" }));

    expect(await screen.findByRole("region", { name: "Your review" })).toBeInTheDocument();
    expect(body).toEqual({ rating: 5, comment: "Great course" });
  });

  it("shows the API message when the student has not started learning", async () => {
    mockCourse({ reviews: [] }, { enrolled: true });
    server.use(
      http.post(`${API}/courses/1/reviews`, () =>
        HttpResponse.json(
          { detail: "Start learning the course before reviewing it" },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses/1?tab=reviews", token: "t" });
    await user.click(await screen.findByRole("radio", { name: "4 stars" }));
    await user.click(screen.getByRole("button", { name: "Publish review" }));
    expect(
      await screen.findByText("Start learning the course before reviewing it"),
    ).toBeInTheDocument();
  });

  it("edits an existing review", async () => {
    const state: State = { reviews: [mine] };
    mockCourse(state, { enrolled: true });
    let body: unknown = null;
    server.use(
      http.patch(`${API}/reviews/9`, async ({ request }) => {
        body = await request.json();
        state.reviews = [{ ...mine, rating: 3 }];
        return HttpResponse.json(state.reviews[0]);
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses/1?tab=reviews", token: "t" });
    const own = await screen.findByRole("region", { name: "Your review" });
    await user.click(within(own).getByRole("button", { name: "Edit review" }));
    await user.click(screen.getByRole("radio", { name: "3 stars" }));
    await user.click(screen.getByRole("button", { name: "Save review" }));
    await waitFor(() => {
      expect(
        within(screen.getByRole("region", { name: "Your review" })).getByRole("img", {
          name: "Rated 3.0 out of 5",
        }),
      ).toBeInTheDocument();
    });
    expect(body).toEqual({ rating: 3, comment: mine.comment });
  });

  it("deletes a review only after confirmation", async () => {
    const state: State = { reviews: [mine] };
    mockCourse(state, { enrolled: true });
    let deleted = 0;
    server.use(
      http.delete(`${API}/reviews/9`, () => {
        deleted += 1;
        state.reviews = [];
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses/1?tab=reviews", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Delete review" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Keep review" }),
    );
    expect(deleted).toBe(0);

    await user.click(screen.getByRole("button", { name: "Delete review" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete review" }),
    );
    expect(await screen.findByRole("heading", { name: "Write a review" })).toBeInTheDocument();
    expect(deleted).toBe(1);
  });

  it("supports the keyboard on the star rating", async () => {
    mockCourse({ reviews: [] }, { enrolled: true });
    const user = userEvent.setup();
    renderApp({ path: "/courses/1?tab=reviews", token: "t" });
    const first = await screen.findByRole("radio", { name: "1 star" });
    first.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("radio", { name: "2 stars" })).toBeChecked();
  });
});
