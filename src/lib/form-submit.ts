import type { BaseSyntheticEvent, SubmitEventHandler } from "react";

export function formSubmit(
  handler: (event?: BaseSyntheticEvent) => Promise<void>,
): SubmitEventHandler<HTMLFormElement> {
  return (event) => {
    void handler(event);
  };
}
