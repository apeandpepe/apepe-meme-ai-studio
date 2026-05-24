import Link from "next/link";
import { Sparkles, ChevronDown } from "lucide-react";

// Coin slots — names removed, shown as "Coming Soon" empty slots.
// First slot is APEPE (active). Rest are placeholders.
const COIN_SLOTS = [
  { id: "apepe", active: true },
  { id: "slot-1", active: false },
  { id: "slot-2", active: false },
  { id: "slot-3", active: false },
  { id: "slot-4", active: false },
  { id: "slot-5", active: false },
  { id: "slot-6", active: false },
  { id: "more", active: false, isMore: true },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[rgb(var(--bg-primary))]">
      {/* Background glow on the right (behind characters) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-glow opacity-60" />
      <div className="bg-grain" />

      {/* Header */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-brand/30">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/40 to-brand/5" />
              <span className="font-display absolute inset-0 flex items-center justify-center text-base font-bold text-brand">
                A
              </span>
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight sm:text-xl">
                Meme <span className="text-brand">AI</span> Studio
              </h1>
              <p className="text-[10px] text-zinc-500 sm:text-xs">
                Powered by <span className="text-brand">APEPE</span>
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <a
              href="https://apepe.lol"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/12 px-5 py-2.5 text-sm text-zinc-200 transition hover:border-white/30 hover:text-white"
            >
              About
            </a>
            <a
              href="https://x.com/APEPE_MEME"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 text-zinc-200 transition hover:border-white/30 hover:text-white"
              aria-label="Twitter / X"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-[1400px] px-6 sm:px-10">
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.05fr]">
          {/* Left: copy + input */}
          <div className="relative z-20 pt-6 lg:pt-10">
            <h2 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Generate Official
              <br />
              Meme Characters
              <br />
              with <span className="text-brand">AI</span>
            </h2>

            <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400 sm:text-lg">
              Meme AI Studio allows you to create official meme characters from
              your favorite projects. Powered by{" "}
              <span className="text-brand">APEPE</span>.
            </p>

            {/* Input bar */}
            <div className="mt-9 max-w-xl">
              <Link href="/studio" className="group block">
                <div className="card-border flex items-center gap-2 rounded-2xl p-2.5 transition group-hover:border-brand/30">
                  <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand/50 to-brand/10 ring-1 ring-brand/30" />
                    <span className="text-sm font-bold">APEPE</span>
                    <ChevronDown size={16} className="text-zinc-500" />
                  </button>
                  <span className="flex-1 px-2 text-sm text-zinc-600 sm:text-base">
                    Describe your meme...
                  </span>
                  <span className="btn-glow flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-black transition group-hover:bg-brand-bright">
                    <Sparkles size={15} />
                    Generate
                  </span>
                </div>
              </Link>
              <p className="mt-3 pl-2 text-xs text-zinc-600">
                Example: APEPE as a cyberpunk warrior in Tokyo
              </p>
            </div>
          </div>

          {/* Right: character group (placeholder until user adds image) */}
          <div className="relative">
            {/* Hexagon glow backdrop */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[420px] w-[420px] rounded-full bg-brand/[0.07] blur-3xl" />
            </div>

            {/*
              CHARACTER IMAGE GOES HERE.
              Drop your character group image at: public/hero-characters.png
              Then uncomment the <img> below and remove the placeholder block.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* <img src="/hero-characters.png" alt="APEPE characters" className="relative w-full" /> */}

            <div className="relative flex aspect-[4/3] items-center justify-center">
              <div className="text-center">
                <div className="animate-float mx-auto mb-4 h-40 w-40 rounded-full bg-gradient-to-br from-brand/30 to-brand/5 ring-1 ring-brand/20" />
                <p className="font-mono text-xs text-zinc-600">
                  Character image goes here
                </p>
                <p className="font-mono mt-1 text-[10px] text-zinc-700">
                  public/hero-characters.png
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Supported slots */}
        <div className="relative z-10 mt-4 pb-16 lg:mt-2">
          <h3 className="font-display mb-6 text-center text-xl font-bold sm:text-2xl">
            Supported Projects
          </h3>
          <div className="mx-auto grid max-w-5xl grid-cols-4 gap-3 sm:grid-cols-8 sm:gap-4">
            {COIN_SLOTS.map((slot) => (
              <div
                key={slot.id}
                className={`flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl border p-4 transition ${
                  slot.active
                    ? "border-brand/50 bg-brand/[0.06]"
                    : "border-white/[0.06] bg-white/[0.015]"
                }`}
              >
                {slot.isMore ? (
                  <>
                    <div className="flex h-11 w-11 items-center justify-center">
                      <span className="text-2xl text-zinc-600">···</span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-500">
                      More
                    </span>
                  </>
                ) : (
                  <>
                    <div
                      className={`h-11 w-11 rounded-full ${
                        slot.active
                          ? "bg-gradient-to-br from-brand/50 to-brand/10 ring-1 ring-brand/40"
                          : "bg-white/[0.04]"
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        slot.active ? "text-brand" : "text-zinc-700"
                      }`}
                    >
                      {slot.active ? "APEPE" : "Soon"}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04]">
        <div className="mx-auto max-w-[1400px] px-6 py-6 text-center text-xs text-zinc-600 sm:px-10">
          © 2026 APEPE Meme AI Studio. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
