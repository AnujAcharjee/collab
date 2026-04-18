import { AppIcon } from "@/components/AppIcon"
import { ThemeToggleButton } from "@/components/theme-toggle"

const features = [
  {
    label: "Real-Time Messaging",
    desc: "Instant message delivery with low latency WebSocket connections — conversations that feel truly live.",
  },
  {
    label: "Reliable Delivery",
    desc: "Backed by a stream-based architecture ensuring ordered, durable, and consistent message delivery.",
  },
  {
    label: "Scalable by Design",
    desc: "Handles thousands of concurrent users with distributed services and horizontal scaling.",
  },
  {
    label: "Presence & Sync",
    desc: "Track online users and keep conversations in sync across devices in real time.",
  },
  {
    label: "Seamless Experience",
    desc: "Fast, responsive UI designed for smooth, uninterrupted communication.",
  },
]

const avatars = [
  { initials: "AK", color: "#7F77DD" },
  { initials: "BT", color: "#1D9E75" },
  { initials: "CM", color: "#D85A30" },
  { initials: "DL", color: "#D4537E" },
  { initials: "EJ", color: "#378ADD" },
]

export default function Page() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background bg-[radial-gradient(circle_at_top,rgba(244,187,68,0.12),transparent_42%),radial-gradient(circle_at_bottom,rgba(125,80,20,0.08),transparent_55%)] font-sans text-foreground dark:bg-[radial-gradient(circle_at_top,rgba(244,187,68,0.10),transparent_40%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_60%)]">
      {/* NAV */}
      <nav className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-card/40 px-14 backdrop-blur-sm max-sm:px-5">
        <a
          href="#"
          className="flex items-center gap-2.5 bg-linear-to-br from-[#F5C842] via-[#e8a825] to-[#C8860A] bg-clip-text font-sans text-xl leading-none font-semibold tracking-[2px] text-transparent"
        >
          <AppIcon />
          {/* COLLAB */}
        </a>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/AnujAcharjee/collab"
            target="_blank"
            className="flex items-center gap-1.5 rounded-full border border-transparent px-3.5 py-1.5 text-[13px] text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
          >
            GitHub
          </a>
          <ThemeToggleButton className="text-muted-foreground hover:bg-muted/40 hover:text-foreground" />
          <a
            href="/auth"
            className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-medium text-primary-foreground transition hover:bg-primary/80"
          >
            Sign in
          </a>
        </div>
      </nav>

      {/* SCROLLABLE BODY */}
      <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        {/* HERO — full width, centered */}
        <section className="flex flex-col items-center justify-center px-14 py-24 text-center max-sm:px-6 max-sm:py-16">
          {/* Beta pill */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] font-medium tracking-[0.18em] text-primary uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Now in open beta
          </div>

          <h1 className="mb-6 font-serif text-[clamp(44px,6vw,72px)] leading-[1.08] font-normal text-foreground">
            Conversations that feel
            <br />
            <em className="text-primary italic">real-time</em>
          </h1>

          <p className="mb-10 max-w-[46ch] text-[15px] leading-[1.8] font-light text-muted-foreground">
            Fast, reliable chat — built for seamless, instant communication.
          </p>

          <a
            href="/"
            className="mb-12 inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-[13px] font-medium tracking-wide text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/80"
          >
            Get started free →
          </a>

          {/* Social proof */}
          <div className="mb-20 flex items-center gap-3">
            <div className="flex">
              {avatars.map((a, i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[11px] font-medium text-white"
                  style={{ background: a.color, marginLeft: i === 0 ? 0 : -8 }}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <p className="text-[13px] font-light text-muted-foreground">
              <span className="font-medium text-foreground">4,200+</span>
              {" already onboard"}
            </p>
          </div>

          {/* FEATURES — horizontal strip */}
          <div className="w-full border-t border-border/60">
            <p className="mb-8 pt-12 text-[11px] font-medium tracking-[0.18em] text-primary uppercase">
              What's included
            </p>
            <div className="grid grid-cols-5 divide-x divide-border/60 max-lg:grid-cols-3 max-sm:grid-cols-1 max-sm:divide-x-0 max-sm:divide-y max-sm:text-left">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center gap-3 px-6 py-6 text-center transition hover:bg-muted/30 max-sm:items-start max-sm:text-left"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-[13px] font-medium text-foreground transition group-hover:text-primary">
                    {f.label}
                  </p>
                  <p className="text-[12px] leading-[1.7] font-light text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="flex h-12 shrink-0 items-center justify-center border-t border-border/60 bg-background">
        <p className="text-xs text-muted-foreground">
          © 2026 Collab. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
