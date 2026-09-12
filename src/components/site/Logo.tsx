import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("size-8 text-primary", className)}
    >
      <path
        d="M7 4.5h18a1.5 1.5 0 0 1 1.5 1.5v20.2c0 .6-.7.9-1.2.5l-2.3-1.9a1.5 1.5 0 0 0-1.9 0l-2 1.7a1.5 1.5 0 0 1-1.9 0l-2-1.7a1.5 1.5 0 0 0-1.9 0l-2 1.7a1.5 1.5 0 0 1-1.9 0l-2.3-1.8c-.5-.4-1.2 0-1.2.5V6A1.5 1.5 0 0 1 7 4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M17.6 9.5 12.4 17h3.9l-1.4 5.6 5.4-7.7h-4.1l1.4-5.4Z" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">Executable Receipts</span>
    </span>
  );
}
