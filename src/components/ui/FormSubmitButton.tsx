"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

type Props = Omit<React.ComponentProps<typeof Button>, "type" | "href"> & {
  pendingLabel?: string;
};

/**
 * Кнопка submit для server actions: блокирует повторный клик,
 * чтобы не создавать дубликаты партнёров/магазинов и т.п.
 */
export function FormSubmitButton({
  children = "Сохранить",
  pendingLabel = "Сохранение…",
  disabled,
  onClick,
  ...props
}: Props) {
  const { pending } = useFormStatus();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!pending) setLocked(false);
  }, [pending]);

  const busy = pending || locked;

  return (
    <Button
      type="submit"
      disabled={disabled || busy}
      aria-busy={busy}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        const form = e.currentTarget.form;
        if (form && !form.checkValidity()) return;
        setLocked(true);
      }}
      {...props}
    >
      {busy ? pendingLabel : children}
    </Button>
  );
}
