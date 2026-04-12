import { AppIcon } from "@/components/AppIcon"

const features = [
  {
    label: "Easy Integration",
    desc: "Connect your existing tools in minutes — Slack, Notion, Linear, and 200+ more via our open API.",
  },
  {
    label: "24/7 Support",
    desc: "Human-first support around the clock. Avg. response time under 4 minutes on any plan.",
  },
  {
    label: "Customisable Design",
    desc: "White-label your workspace. Match your brand with custom themes, domains, and logos.",
  },
  {
    label: "Scalable Performance",
    desc: "Built on edge infrastructure with 99.99% uptime SLA. From 5 to 50,000 teammates.",
  },
  {
    label: "Hundreds of Blocks",
    desc: "Drag-and-drop docs, boards, calendars, and embeds. Build the workspace your team needs.",
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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#faf7f2] font-sans">
      {/* NAV */}
      <nav className="flex h-14 shrink-0 items-center justify-between border-b border-[#e2d8c8] bg-[#f0e7d6] px-14 max-sm:px-5">
        <a
          href="#"
          className="flex items-center gap-2.5 bg-linear-to-br from-[#F5C842] via-[#e8a825] to-[#C8860A] bg-clip-text font-sans text-xl leading-none font-semibold tracking-[2px] text-transparent"
        >
          <AppIcon />
          {/* COLLAB */}
        </a>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            className="flex items-center gap-1.5 rounded-full border border-transparent px-3.5 py-1.5 text-[13px] text-[#6b5b42] transition hover:bg-[#f0e8d8] hover:text-[#1a140a]"
          >
            GitHub
          </a>
          <a
            href="/auth"
            className="rounded-full bg-[#1a140a] px-4 py-1.5 text-[13px] font-medium text-[#f5e8c8] transition hover:bg-[#3a2a10]"
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
          <div className="bg-[#b8862e]/06 mb-8 inline-flex items-center gap-2 rounded-full border border-[#b8862e]/30 px-4 py-1.5 text-[11px] font-medium tracking-[0.18em] text-[#b8862e] uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b8862e]" />
            Now in open beta
          </div>

          <h1 className="mb-6 font-serif text-[clamp(44px,6vw,72px)] leading-[1.08] font-normal text-[#1a140a]">
            Where teams
            <br />
            think <em className="text-[#b8862e] italic">together</em>
          </h1>

          <p className="mb-10 max-w-[46ch] text-[15px] leading-[1.8] font-light text-[#6b5b42]">
            A collaboration platform enabling seamless teamwork through
            real-time video and messaging — built for the way modern teams
            actually work.
          </p>

          <a
            href="/"
            className="mb-12 inline-flex items-center gap-2.5 rounded-full bg-[#1a140a] px-7 py-3.5 text-[13px] font-medium tracking-wide text-[#f5e8c8] transition hover:-translate-y-0.5 hover:bg-[#3a2a10]"
          >
            Get started free →
          </a>

          {/* Social proof */}
          <div className="mb-20 flex items-center gap-3">
            <div className="flex">
              {avatars.map((a, i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#faf7f2] text-[11px] font-medium text-white"
                  style={{ background: a.color, marginLeft: i === 0 ? 0 : -8 }}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <p className="text-[13px] font-light text-[#6b5b42]">
              <span className="font-medium text-[#1a140a]">4,200+</span> teams
              already onboard
            </p>
          </div>

          {/* FEATURES — horizontal strip */}
          <div className="w-full border-t border-[#e2d8c8]">
            <p className="mb-8 pt-12 text-[11px] font-medium tracking-[0.18em] text-[#b8862e] uppercase">
              What's included
            </p>
            <div className="grid grid-cols-5 divide-x divide-[#e2d8c8] max-lg:grid-cols-3 max-sm:grid-cols-1 max-sm:divide-x-0 max-sm:divide-y max-sm:text-left">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center gap-3 px-6 py-6 text-center transition hover:bg-[#f0e7d6]/50 max-sm:items-start max-sm:text-left"
                >
                  <div className="bg-[#b8862e]/08 flex h-8 w-8 items-center justify-center rounded-full border border-[#b8862e]/30">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#b8862e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-[13px] font-medium text-[#1a140a] transition group-hover:text-[#b8862e]">
                    {f.label}
                  </p>
                  <p className="text-[12px] leading-[1.7] font-light text-[#6b5b42]">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="flex h-12 shrink-0 items-center justify-center border-t border-[#e2d8c8] bg-[#faf7f2]">
        <p className="text-xs text-[#a08060]">
          © 2025 Collab. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
