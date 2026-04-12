import { IconSparkles } from "@tabler/icons-react"

export function AppIcon({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-13 w-13" }
  const letter = { sm: "text-[18px]", md: "text-[22px]", lg: "text-[30px]" }
  const word = {
    sm: "text-[16px] tracking-[1.5px]",
    md: "text-[20px] tracking-[2px]",
    lg: "text-[26px] tracking-[2px]",
  }
  const spark = { sm: "size-3", md: "size-3.5", lg: "size-4.5" }

  return (
    <div
      className={`flex shrink-0 items-center gap-2 rounded-xl border border-[#926a1f] bg-linear-to-br from-[#7a4f0a] via-[#C8860A] to-[#7a4f0a] px-3 py-1.5 shadow-[inset_0_0_0_1px_rgba(255,220,100,0.15)]`}
    >
      <IconSparkles
        className={`${spark[size]} text-[#fff5d6] opacity-70`}
        stroke={1.75}
      />

      <span
        className={`font-sans ${word[size]} leading-none font-semibold tracking-widest text-[#fff5d6]/90`}
      >
        Cllab
      </span>
    </div>
  )
}
