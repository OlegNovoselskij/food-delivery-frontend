import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authToken } from "@/api/auth-token";
import { API_URL, buildUser } from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const LOGIN_URL = `${API_URL}/api/v1/auth/login`;
const ME_URL = `${API_URL}/api/v1/users/me`;

afterEach(() => {
  authToken.clear();
});

describe("sign in", () => {
  it("shows field errors before calling the API", async () => {
    const user = userEvent.setup();
    renderApp({ path: "/sign-in" });
    await user.click(await screen.findByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter your email")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
  });

  it("shows the server message when the credentials are wrong", async () => {
    server.use(
      http.post(LOGIN_URL, () =>
        HttpResponse.json({ detail: "Incorrect email or password" }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/sign-in" });
    await user.type(await screen.findByLabelText("Email"), "andrii@demo.example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Incorrect email or password")).toBeInTheDocument();
    expect(authToken.get()).toBeNull();
  });

  it("signs in and goes to the page named by next", async () => {
    server.use(
      http.post(LOGIN_URL, () =>
        HttpResponse.json({ access_token: "token-1", token_type: "bearer" }),
      ),
      http.get(ME_URL, () => HttpResponse.json(buildUser())),
    );
    const user = userEvent.setup();
    renderApp({ path: "/sign-in?next=%2Fprofile" });
    await user.type(await screen.findByLabelText("Email"), "andrii@demo.example.com");
    await user.type(screen.getByLabelText("Password"), "Demo12345!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Profile" })).toBeInTheDocument();
    expect(authToken.get()).toBe("token-1");
  });

  it("ignores an external next target", async () => {
    server.use(
      http.post(LOGIN_URL, () =>
        HttpResponse.json({ access_token: "token-2", token_type: "bearer" }),
      ),
      http.get(ME_URL, () => HttpResponse.json(buildUser())),
    );
    const user = userEvent.setup();
    const { router } = renderApp({ path: "/sign-in?next=https%3A%2F%2Fevil.example" });
    await user.type(await screen.findByLabelText("Email"), "andrii@demo.example.com");
    await user.type(screen.getByLabelText("Password"), "Demo12345!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/learning");
    });
  });

  it("disables the form and counts down after a rate limit response", async () => {
    server.use(
      http.post(LOGIN_URL, () =>
        HttpResponse.json(
          { detail: "Too many requests, try again later", retry_after: 42 },
          { status: 429, headers: { "Retry-After": "42" } },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/sign-in" });
    await user.type(await screen.findByLabelText("Email"), "andrii@demo.example.com");
    await user.type(screen.getByLabelText("Password"), "Demo12345!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Too many attempts. Try again in 0:42.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });

  it("does not render the Google button without a client id", async () => {
    renderApp({ path: "/sign-in" });
    await screen.findByRole("heading", { level: 1, name: "Sign in" });
    expect(screen.queryByText("or")).not.toBeInTheDocument();
  });
});

describe("sign up", () => {
  const REGISTER_URL = `${API_URL}/api/v1/auth/register`;
  const VERIFY_URL = `${API_URL}/api/v1/auth/verify-email`;

  async function fillDetails(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText("First name"), "Maria");
    await user.type(screen.getByLabelText("Last name"), "Petrenko");
    await user.type(screen.getByLabelText("Email"), "maria@demo.example.com");
    await user.click(screen.getByRole("button", { name: "Send confirmation code" }));
  }

  it("shows the code step after registering", async () => {
    server.use(
      http.post(REGISTER_URL, () => HttpResponse.json({ message: "sent" }, { status: 202 })),
    );
    const user = userEvent.setup();
    renderApp({ path: "/sign-up" });
    await fillDetails(user);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Check your email" }),
    ).toBeInTheDocument();
    expect(screen.getByText("maria@demo.example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send again in 1:00/ })).toBeDisabled();
  });

  it("reports an already registered email on the email field", async () => {
    server.use(
      http.post(REGISTER_URL, () =>
        HttpResponse.json({ detail: "Email already registered" }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/sign-up" });
    await fillDetails(user);
    expect(await screen.findByText("Email already registered")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the message for a wrong code and signs in after a correct one", async () => {
    let attempts = 0;
    server.use(
      http.post(REGISTER_URL, () => HttpResponse.json({ message: "sent" }, { status: 202 })),
      http.post(VERIFY_URL, () => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json(
            { detail: "The code is invalid or has expired" },
            { status: 400 },
          );
        }
        return HttpResponse.json({ access_token: "token-3", token_type: "bearer" });
      }),
      http.get(ME_URL, () => HttpResponse.json(buildUser({ name: "Maria" }))),
    );
    const user = userEvent.setup();
    renderApp({ path: "/sign-up" });
    await fillDetails(user);
    await screen.findByRole("heading", { level: 1, name: "Check your email" });

    await user.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
    await user.paste("111111");
    await user.type(screen.getByLabelText("Create a password"), "Demo12345!");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("The code is invalid or has expired")).toBeInTheDocument();

    await user.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
    await user.paste("482913");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => {
      expect(authToken.get()).toBe("token-3");
    });
  });
});

describe("route guards", () => {
  it("sends an anonymous visitor to sign in and remembers the page", async () => {
    const { router } = renderApp({ path: "/profile" });
    await screen.findByRole("heading", { level: 1, name: "Sign in" });
    expect(router.state.location.pathname).toBe("/sign-in");
    expect(router.state.location.search).toBe("?next=%2Fprofile");
  });

  it("restores the signed in session after a reload", async () => {
    server.use(http.get(ME_URL, () => HttpResponse.json(buildUser())));
    renderApp({ path: "/profile", token: "stored-token" });
    expect(await screen.findByRole("heading", { level: 1, name: "Profile" })).toBeInTheDocument();
  });

  it("clears an expired token and asks to sign in", async () => {
    server.use(http.get(ME_URL, () => HttpResponse.json({ detail: "Expired" }, { status: 401 })));
    renderApp({ path: "/profile", token: "expired-token" });
    expect(await screen.findByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
    expect(authToken.get()).toBeNull();
  });

  it("keeps signed in users away from the sign-in page", async () => {
    server.use(http.get(ME_URL, () => HttpResponse.json(buildUser())));
    const { router } = renderApp({ path: "/sign-in", token: "stored-token" });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/learning");
    });
  });
});
