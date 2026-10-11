import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";

import type { CourseListItem } from "@/api/types";
import { FormError } from "@/components/feedback/form-error";
import { RateLimitNotice } from "@/components/feedback/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { TextField } from "@/components/ui/text-field";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { formSubmit } from "@/lib/form-submit";
import { formatPrice } from "@/lib/money";

import { usePayMutation } from "../hooks";
import {
  DECLINED_TEST_CARD,
  SUCCESS_TEST_CARD,
  formatCardNumber,
  formatExpiry,
  paymentRequestFrom,
  paymentSchema,
  type PaymentMethod,
  type PaymentValues,
} from "../payment";

const FIELDS = ["method", "cardNumber", "expiry", "cvc"] as const;
const CARD_METHOD: PaymentMethod = "card";
const PAYPAL_METHOD: PaymentMethod = "paypal";

function isPaymentMethod(value: string): value is PaymentMethod {
  return value === CARD_METHOD || value === PAYPAL_METHOD;
}

interface PaymentDialogProps {
  enrollmentId: number;
  course: CourseListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PaymentForm({
  enrollmentId,
  course,
  onPaid,
}: {
  enrollmentId: number;
  course: CourseListItem;
  onPaid: () => void;
}) {
  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: CARD_METHOD, cardNumber: "", expiry: "", cvc: "" },
  });
  const { control, register, handleSubmit, setError, setValue, formState } = form;
  const { errors } = formState;
  const method = useWatch({ control, name: "method" });
  const pay = usePayMutation(enrollmentId);
  const { handleError, cooldown } = useServerFormErrors<PaymentValues>({
    setError,
    fields: FIELDS,
  });
  const price = formatPrice(course.price);

  const onSubmit = handleSubmit((values) => {
    pay.mutate(paymentRequestFrom(values), { onSuccess: onPaid, onError: handleError });
  });

  return (
    <form onSubmit={formSubmit(onSubmit)} noValidate className="mt-5 flex flex-col gap-4">
      <Controller
        control={control}
        name="method"
        render={({ field }) => (
          <RadioGroup
            aria-label="Payment method"
            value={field.value}
            onValueChange={(value) => {
              if (isPaymentMethod(value)) field.onChange(value);
            }}
          >
            <RadioCard id="pay-card" value={CARD_METHOD} label="Card" />
            <RadioCard id="pay-paypal" value={PAYPAL_METHOD} label="PayPal" />
          </RadioGroup>
        )}
      />
      {method === CARD_METHOD ? (
        <div className="flex flex-col gap-3">
          <TextField
            label="Card number"
            inputMode="numeric"
            autoComplete="cc-number"
            icon={CreditCard}
            placeholder={SUCCESS_TEST_CARD}
            error={errors.cardNumber?.message}
            {...register("cardNumber", {
              onChange: (event: { target: { value: string } }) => {
                setValue("cardNumber", formatCardNumber(event.target.value));
              },
            })}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Expiry"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              error={errors.expiry?.message}
              {...register("expiry", {
                onChange: (event: { target: { value: string } }) => {
                  setValue("expiry", formatExpiry(event.target.value));
                },
              })}
            />
            <TextField
              label="Security code"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              error={errors.cvc?.message}
              {...register("cvc")}
            />
          </div>
          <p className="text-small text-muted">
            Payments are simulated. Use {SUCCESS_TEST_CARD} to pay, or {DECLINED_TEST_CARD} to see a
            declined payment.
          </p>
        </div>
      ) : (
        <p className="text-small text-muted">
          Payments are simulated. You will not be redirected anywhere.
        </p>
      )}
      <FormError message={errors.root?.server?.message} />
      <RateLimitNotice secondsLeft={cooldown.secondsLeft} />
      <Button type="submit" size="lg" disabled={pay.isPending || cooldown.active}>
        {pay.isPending ? "Processing payment" : `Pay ${price}`}
      </Button>
    </form>
  );
}

export function PaymentDialog({ enrollmentId, course, open, onOpenChange }: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Complete your payment</DialogTitle>
        <DialogDescription>
          {course.title} for {formatPrice(course.price)}. One-time payment, lifetime access.
        </DialogDescription>
        <PaymentForm
          enrollmentId={enrollmentId}
          course={course}
          onPaid={() => {
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
