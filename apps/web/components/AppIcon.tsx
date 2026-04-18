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
      className={`flex shrink-0 items-center gap-2 p-1 rounded-xl text-[#b99f38]`}
    >
      <IconSparkles
        className={`${spark[size]} opacity-70`}
        stroke={1.75}
      />

      <span
        className={`font-sans ${word[size]} leading-none font-semibold tracking-widest`}
      >
        Cllab
      </span>
    </div>
  )
}
