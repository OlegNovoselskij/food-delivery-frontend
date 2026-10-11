import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { TextField, type TextFieldProps } from "@/components/ui/text-field";

type PasswordFieldProps = Omit<TextFieldProps, "type" | "icon" | "trailing">;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const ToggleIcon = visible ? EyeOff : Eye;

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      icon={Lock}
      trailing={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => {
            setVisible((current) => !current);
          }}
        >
          <ToggleIcon aria-hidden="true" />
        </Button>
      }
    />
  );
}
