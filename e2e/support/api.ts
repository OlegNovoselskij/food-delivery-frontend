import { knownMessageIds, waitForCode } from "./mailpit";

const API_URL = "http://localhost:8000/api/v1";

export const SEED_PASSWORD = "Demo12345!";

export const SEED_USERS = {
  student: "andrii@demo.example.com",
  teacher: "olena@demo.example.com",
  admin: "admin@demo.example.com",
} as const;

export interface TestUser {
  email: string;
  password: string;
  token: string;
}

interface TokenResponse {
  access_token: string;
}

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const seedTokens = new Map<string, string>();

export async function seedToken(email: string): Promise<string> {
  const cached = seedTokens.get(email);
  if (cached !== undefined) return cached;
  const response = await postJson("/auth/login", { email, password: SEED_PASSWORD });
  if (!response.ok) throw new Error(`Seed login failed for ${email}: ${response.status}`);
  const { access_token } = (await response.json()) as TokenResponse;
  seedTokens.set(email, access_token);
  return access_token;
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}+${Date.now()}${Math.floor(Math.random() * 1000)}@demo.example.com`;
}

export async function createStudent(prefix: string): Promise<TestUser> {
  const email = uniqueEmail(prefix);
  const password = "Fresh-pass-123";
  const known = await knownMessageIds(email);
  const registered = await postJson("/auth/register", {
    name: "Test",
    surname: "Student",
    email,
    role: "student",
  });
  if (!registered.ok) throw new Error(`Register failed: ${registered.status}`);
  const code = await waitForCode(email, known);
  const verified = await postJson("/auth/verify-email", { email, code, password });
  if (!verified.ok) throw new Error(`Verify failed: ${verified.status}`);
  const { access_token } = (await verified.json()) as TokenResponse;
  return { email, password, token: access_token };
}

export async function statusWithToken(path: string, token: string): Promise<number> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.status;
}

export async function enrollWithToken(token: string, courseId: number): Promise<number> {
  const response = await fetch(`${API_URL}/courses/${courseId}/enroll`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Enroll failed: ${response.status}`);
  const enrollment = (await response.json()) as { id: number };
  return enrollment.id;
}

export async function cancelWithToken(token: string, enrollmentId: number): Promise<void> {
  const response = await fetch(`${API_URL}/enrollments/${enrollmentId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Cancel failed: ${response.status}`);
}

export async function payWithToken(
  token: string,
  enrollmentId: number,
  paymentToken = "tok_card_4242",
): Promise<void> {
  const response = await fetch(`${API_URL}/enrollments/${enrollmentId}/pay`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ method: "card", payment_token: paymentToken }),
  });
  if (!response.ok) throw new Error(`Pay failed: ${response.status}`);
}

export async function createEnrolledStudent(prefix: string, courseId: number): Promise<TestUser> {
  const student = await createStudent(prefix);
  const enrollmentId = await enrollWithToken(student.token, courseId);
  const detail = await fetch(`${API_URL}/enrollments/${enrollmentId}`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const { status } = (await detail.json()) as { status: string };
  if (status === "pending_payment") await payWithToken(student.token, enrollmentId);
  return student;
}
