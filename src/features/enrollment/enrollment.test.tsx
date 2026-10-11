import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authToken } from "@/api/auth-token";
import type { Enrollment } from "@/api/types";
import {
  API_URL,
  buildCourse,
  buildCourseListItem,
  buildEnrollment,
  buildHistoryItem,
  buildProgram,
  buildReviewPage,
  buildUser,
} from "@/test/factories";
import { buildProgressFor } from "@/test/progress-factory";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const API = `${API_URL}/api/v1`;

afterEach(() => {
  authToken.clear();
});

interface CourseState {
  enrollment: Enrollment | null;
}

function mockCoursePage(price: string, state: CourseState) {
  server.use(
    http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 2 }))),
    http.get(`${API}/courses/1`, () => HttpResponse.json(buildCourse({ price }))),
    http.get(`${API}/courses/1/program`, () => HttpResponse.json(buildProgram())),
    http.get(`${API}/courses/1/reviews`, () => HttpResponse.json(buildReviewPage())),
    http.get(`${API}/enrollments/mine`, () =>
      HttpResponse.json(state.enrollment ? [state.enrollment] : []),
    ),
  );
}

async function fillCard(user: ReturnType<typeof userEvent.setup>, number: string) {
  await user.type(screen.getByLabelText("Card number"), number);
  await user.type(screen.getByLabelText("Expiry"), "1299");
  await user.type(screen.getByLabelText("Security code"), "123");
}

describe("enrolling", () => {
  it("enrolls in a free course and switches to continue learning", async () => {
    const state: CourseState = { enrollment: null };
    mockCoursePage("0.00", state);
    server.use(
      http.post(`${API}/courses/1/enroll`, () => {
        state.enrollment = buildEnrollment({ status: "active" });
        return HttpResponse.json(state.enrollment, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses/1", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Enroll for free" }));
    expect(await screen.findByRole("link", { name: "Continue learning" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enroll for free" })).not.toBeInTheDocument();
  });

  it("opens the payment dialog after enrolling in a paid course and activates after paying", async () => {
    const state: CourseState = { enrollment: null };
    mockCoursePage("89.00", state);
    let payBody: unknown = null;
    server.use(
      http.post(`${API}/courses/1/enroll`, () => {
        state.enrollment = buildEnrollment({ status: "pending_payment" });
        return HttpResponse.json(state.enrollment, { status: 201 });
      }),
      http.post(`${API}/enrollments/11/pay`, async ({ request }) => {
        payBody = await request.json();
        state.enrollment = buildEnrollment({ status: "active" });
        return HttpResponse.json(state.enrollment);
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses/1", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Enroll in course" }));

    const dialog = await screen.findByRole("dialog", { name: "Complete your payment" });
    await fillCard(user, "4242424242424242");
    await user.click(within(dialog).getByRole("button", { name: "Pay $89.00" }));

    expect(await screen.findByRole("link", { name: "Continue learning" })).toBeInTheDocument();
    expect(payBody).toEqual({ method: "card", payment_token: "tok_card_4242" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("validates card fields before paying", async () => {
    const state: CourseState = { enrollment: buildEnrollment({ status: "pending_payment" }) };
    mockCoursePage("89.00", state);
    const user = userEvent.setup();
    renderApp({ path: "/courses/1", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Pay now" }));
    await user.click(await screen.findByRole("button", { name: "Pay $89.00" }));
    expect(await screen.findByText("Enter the card number")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid expiry date as MM/YY")).toBeInTheDocument();
    expect(screen.getByText("Enter the 3 or 4 digit security code")).toBeInTheDocument();
  });

  it("shows the decline message and keeps the dialog open", async () => {
    const state: CourseState = { enrollment: buildEnrollment({ status: "pending_payment" }) };
    mockCoursePage("89.00", state);
    server.use(
      http.post(`${API}/enrollments/11/pay`, () =>
        HttpResponse.json({ detail: "Payment was declined" }, { status: 402 }),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses/1", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Pay now" }));
    await fillCard(user, "4000000000000002");
    await user.click(screen.getByRole("button", { name: "Pay $89.00" }));
    expect(await screen.findByText("Payment was declined")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Complete your payment" })).toBeInTheDocument();
  });

  it("counts down after the payment rate limit", async () => {
    const state: CourseState = { enrollment: buildEnrollment({ status: "pending_payment" }) };
    mockCoursePage("89.00", state);
    server.use(
      http.post(`${API}/enrollments/11/pay`, () =>
        HttpResponse.json(
          { detail: "Too many requests, try again later", retry_after: 30 },
          { status: 429, headers: { "Retry-After": "30" } },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses/1", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Pay now" }));
    await fillCard(user, "4242424242424242");
    await user.click(screen.getByRole("button", { name: "Pay $89.00" }));
    expect(await screen.findByText("Too many attempts. Try again in 0:30.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pay $89.00" })).toBeDisabled();
  });

  it("pays with PayPal without card fields", async () => {
    const state: CourseState = { enrollment: buildEnrollment({ status: "pending_payment" }) };
    mockCoursePage("89.00", state);
    let payBody: unknown = null;
    server.use(
      http.post(`${API}/enrollments/11/pay`, async ({ request }) => {
        payBody = await request.json();
        state.enrollment = buildEnrollment({ status: "active" });
        return HttpResponse.json(state.enrollment);
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses/1", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Pay now" }));
    await user.click(await screen.findByRole("radio", { name: "PayPal" }));
    expect(screen.queryByLabelText("Card number")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pay $89.00" }));
    await screen.findByRole("link", { name: "Continue learning" });
    expect(payBody).toEqual({ method: "paypal", payment_token: "tok_paypal" });
  });
});

describe("cancelling", () => {
  it("asks for confirmation and cancels a pending enrollment", async () => {
    const state: CourseState = { enrollment: buildEnrollment({ status: "pending_payment" }) };
    mockCoursePage("89.00", state);
    server.use(
      http.post(`${API}/enrollments/11/cancel`, () => {
        state.enrollment = buildEnrollment({ status: "cancelled" });
        return HttpResponse.json(state.enrollment);
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses/1", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Cancel enrollment" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Cancel enrollment?" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel enrollment" }));
    expect(await screen.findByRole("button", { name: "Enroll in course" })).toBeInTheDocument();
  });

  it("does nothing when the confirmation is dismissed", async () => {
    const state: CourseState = { enrollment: buildEnrollment({ status: "pending_payment" }) };
    mockCoursePage("89.00", state);
    let cancelled = false;
    server.use(
      http.post(`${API}/enrollments/11/cancel`, () => {
        cancelled = true;
        return HttpResponse.json(buildEnrollment({ status: "cancelled" }));
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses/1", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Cancel enrollment" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Keep enrollment" }));
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(cancelled).toBe(false);
    expect(screen.getByRole("button", { name: "Pay now" })).toBeInTheDocument();
  });

  it("mentions the refund for a paid enrollment", async () => {
    const paid = buildEnrollment({
      status: "active",
      payment: {
        id: 1,
        amount: "89.00",
        method: "card",
        status: "succeeded",
        transaction_id: "mock_txn_1",
        created_at: "2026-02-01T09:00:00Z",
      },
    });
    server.use(
      http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 2 }))),
      http.get(`${API}/learning/history`, () => HttpResponse.json([buildHistoryItem(paid)])),
      http.get(`${API}/certificates/mine`, () => HttpResponse.json([])),
      http.get(`${API}/enrollments/11/progress`, () => HttpResponse.json(buildProgressFor([]))),
    );
    const user = userEvent.setup();
    renderApp({ path: "/learning", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Cancel enrollment" }));
    expect(await screen.findByText(/Your payment will be refunded/)).toBeInTheDocument();
  });
});

describe("my learning", () => {
  it("renders every enrollment status with the right actions", async () => {
    const enrollments = [
      buildEnrollment({
        id: 1,
        status: "pending_payment",
        course: buildCourseListItem({ id: 1, title: "Pending course" }),
      }),
      buildEnrollment({
        id: 2,
        status: "active",
        course: buildCourseListItem({ id: 2, title: "Active course" }),
      }),
      buildEnrollment({
        id: 3,
        status: "completed",
        course: buildCourseListItem({ id: 3, title: "Done course" }),
      }),
      buildEnrollment({
        id: 4,
        status: "cancelled",
        course: buildCourseListItem({ id: 4, title: "Dropped course" }),
      }),
    ];
    server.use(
      http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 2 }))),
      http.get(`${API}/learning/history`, () =>
        HttpResponse.json(enrollments.map((enrollment) => buildHistoryItem(enrollment))),
      ),
      http.get(`${API}/certificates/mine`, () => HttpResponse.json([])),
      http.get(`${API}/enrollments/2/progress`, () =>
        HttpResponse.json(buildProgressFor([{ id: 1, lessons: [{ id: 5 }] }])),
      ),
    );
    renderApp({ path: "/learning", token: "t" });
    const pending = (await screen.findByRole("heading", { name: "Pending course" })).closest(
      "article",
    );
    const active = screen.getByRole("heading", { name: "Active course" }).closest("article");
    const done = screen.getByRole("heading", { name: "Done course" }).closest("article");
    const dropped = screen.getByRole("heading", { name: "Dropped course" }).closest("article");
    if (!pending || !active || !done || !dropped) throw new Error("Missing enrollment row");

    expect(within(pending).getByText("Awaiting payment")).toBeInTheDocument();
    expect(within(pending).getByRole("button", { name: "Pay now" })).toBeInTheDocument();
    expect(within(active).getByRole("link", { name: "Continue" })).toHaveAttribute(
      "href",
      "/learning/courses/2",
    );
    expect(within(active).getByRole("button", { name: "Cancel enrollment" })).toBeInTheDocument();
    expect(within(done).getByText("Completed")).toBeInTheDocument();
    expect(
      within(done).queryByRole("button", { name: "Cancel enrollment" }),
    ).not.toBeInTheDocument();
    expect(within(dropped).getByRole("link", { name: "Enroll again" })).toHaveAttribute(
      "href",
      "/courses/4",
    );
  });

  it("explains an empty list and links to the catalog", async () => {
    server.use(
      http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 2 }))),
      http.get(`${API}/learning/history`, () => HttpResponse.json([])),
      http.get(`${API}/certificates/mine`, () => HttpResponse.json([])),
    );
    renderApp({ path: "/learning", token: "t" });
    expect(await screen.findByText("You are not enrolled in any course yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse courses" })).toHaveAttribute(
      "href",
      "/courses",
    );
  });
});
