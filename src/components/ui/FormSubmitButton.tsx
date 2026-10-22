"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

type Props = Omit<React.ComponentProps<typeof Button>, "type" | "href"> & {
  pendingLabel?: string;
};

/**
 * Кнопка submit для server actions.
 * Нельзя disabled до pending — иначе форма не уходит и навечно «Сохранение…».
 */
export function FormSubmitButton({
  children = "Сохранить",
  pendingLabel = "Сохранение…",
  disabled,
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} aria-busy={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
