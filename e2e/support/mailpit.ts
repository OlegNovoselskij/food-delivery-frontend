const MAILPIT_URL = "http://localhost:8025/api/v1";
const POLL_INTERVAL_MS = 400;
const POLL_TIMEOUT_MS = 20_000;
const CODE_PATTERN = /\b\d{6}\b/;

interface SearchResult {
  messages: { ID: string }[];
}

interface MessageResult {
  Text: string;
}

async function messageIdsFor(email: string): Promise<string[]> {
  const response = await fetch(`${MAILPIT_URL}/search?query=${encodeURIComponent(`to:${email}`)}`);
  const result = (await response.json()) as SearchResult;
  return result.messages.map((message) => message.ID);
}

export async function knownMessageIds(email: string): Promise<Set<string>> {
  return new Set(await messageIdsFor(email));
}

export async function waitForCode(email: string, known: ReadonlySet<string>): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const fresh = (await messageIdsFor(email)).filter((id) => !known.has(id));
    for (const id of fresh) {
      const response = await fetch(`${MAILPIT_URL}/message/${id}`);
      const message = (await response.json()) as MessageResult;
      const match = CODE_PATTERN.exec(message.Text);
      if (match) return match[0];
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`No email with a code arrived for ${email} within ${POLL_TIMEOUT_MS} ms`);
}
