const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

let pendingLoad: Promise<void> | null = null;

function isGoogleReady(): boolean {
  return typeof google !== "undefined" && typeof google.accounts.id.initialize === "function";
}

export function loadGoogleIdentity(): Promise<void> {
  if (isGoogleReady()) return Promise.resolve();
  pendingLoad ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      pendingLoad = null;
      script.remove();
      reject(new Error("Google sign-in could not be loaded. Check your connection and try again."));
    };
    document.head.append(script);
  });
  return pendingLoad;
}
