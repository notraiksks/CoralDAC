import { cn } from "@/lib/utils"

/** Branching-coral mark inside a quadrat frame. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("text-primary", className)}>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="currentColor" />
      <rect x="6" y="6" width="20" height="20" rx="2" fill="none" stroke="white" strokeOpacity=".35" strokeDasharray="2 2" />
      <path
        d="M16 25v-7m0 0-4-4m4 4 4-5m-8 1-2-4m2 4 3-3m5 2 2-4m-2 4-3-2"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
