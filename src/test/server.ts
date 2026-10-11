import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

import { API_URL } from "./factories";

const API = `${API_URL}/api/v1`;

export const defaultHandlers = [
  http.get(`${API}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
  http.post(`${API}/ws/ticket`, () => HttpResponse.json({ ticket: "test-ticket", expires_in: 60 })),
];

export const server = setupServer(...defaultHandlers);
