import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { formSubmit } from "@/lib/form-submit";

const certificateNumberSchema = z.object({
  number: z.string().trim().min(1, "Enter a certificate number"),
});

type CertificateNumberValues = z.infer<typeof certificateNumberSchema>;

export function VerifyCertificateForm({ initialNumber }: { initialNumber: string }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<CertificateNumberValues>({
    resolver: zodResolver(certificateNumberSchema),
    defaultValues: { number: initialNumber },
  });

  const onSubmit = handleSubmit(({ number }) => {
    void navigate(`/certificates/verify/${encodeURIComponent(number)}`);
  });

  return (
    <form
      onSubmit={formSubmit(onSubmit)}
      noValidate
      className="flex flex-col items-start gap-3 sm:flex-row sm:items-end"
    >
      <div className="w-full sm:max-w-xs">
        <TextField
          label="Certificate number"
          autoComplete="off"
          error={formState.errors.number?.message}
          {...register("number")}
        />
      </div>
      <Button type="submit" variant="secondary">
        Check certificate
      </Button>
    </form>
  );
}
