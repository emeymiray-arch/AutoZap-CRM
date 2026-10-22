import Image from "next/image";
import { cn } from "@/lib/utils";

export function AutoZapLogo({
  size = 40,
  className,
  withWordmark = false,
}: {
  size?: number;
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/brand/autozap-mark.png"
        alt="AutoZap"
        width={size}
        height={size}
        className="shrink-0 rounded-full"
        priority
      />
      {withWordmark ? (
        <div className="min-w-0 leading-tight">
          <div className="text-base font-semibold tracking-tight text-white">AutoZap OS</div>
          <div className="text-[11px] text-slate-400">Операционная система</div>
        </div>
      ) : null}
    </div>
  );
}
