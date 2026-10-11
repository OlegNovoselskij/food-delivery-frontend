import { readStorage, removeStorage, writeStorage } from "@/lib/safe-storage";

const TOKEN_KEY = "atrium.token";

type Listener = () => void;

const listeners = new Set<Listener>();
let currentToken: string | null = readStorage(TOKEN_KEY);

function notify(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

export const authToken = {
  get: (): string | null => currentToken,
  set: (token: string): void => {
    currentToken = token;
    writeStorage(TOKEN_KEY, token);
    notify();
  },
  clear: (): void => {
    currentToken = null;
    removeStorage(TOKEN_KEY);
    notify();
  },
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
