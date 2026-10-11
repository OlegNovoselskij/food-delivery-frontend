import { useState } from "react";

import { SignUpDetailsForm } from "../components/sign-up-details-form";
import { VerifyEmailForm } from "../components/verify-email-form";
import type { SignUpDetailsValues } from "../schemas";

type SignUpStep =
  { name: "details"; values: SignUpDetailsValues } | { name: "code"; values: SignUpDetailsValues };

const EMPTY_DETAILS: SignUpDetailsValues = { name: "", surname: "", email: "" };

export function Component() {
  const [step, setStep] = useState<SignUpStep>({ name: "details", values: EMPTY_DETAILS });

  return (
    <>
      <title>Sign up · Atrium</title>
      {step.name === "details" ? (
        <SignUpDetailsForm
          initialValues={step.values}
          onRegistered={(values) => {
            setStep({ name: "code", values });
          }}
        />
      ) : (
        <VerifyEmailForm
          email={step.values.email}
          onChangeEmail={() => {
            setStep({ name: "details", values: step.values });
          }}
        />
      )}
    </>
  );
}
