import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <p className="text-small text-muted">
          Online courses with verifiable certificates. {new Date().getFullYear()} Atrium.
        </p>
      </div>
    </footer>
  );
}
