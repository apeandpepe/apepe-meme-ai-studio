import Link from "next/link";
import { Sparkles, ChevronDown } from "lucide-react";

// Coin slots — original characters (user-made), shown as upcoming projects.
const COIN_SLOTS = [
  { id: "apepe", active: true, img: "/apepe-icon.png" },
  { id: "slot-1", active: false, img: "/coins/coin-1.png" },
  { id: "slot-2", active: false, img: "/coins/coin-2.png" },
  { id: "slot-3", active: false, img: "/coins/coin-3.png" },
  { id: "slot-4", active: false, img: "/coins/coin-4.png" },
  { id: "slot-5", active: false, img: "/coins/coin-5.png" },
  { id: "slot-6", active: false, img: "/coins/coin-6.png" },
  { id: "more", active: false, isMore: true },
];

export default function HomePage() {
  return (
    <main className="relative flex h-dvh min-h-[680px] flex-col overflow-hidden bg-[rgb(var(--bg-primary))]">
      {/* Background glow on the right (behind characters) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-glow opacity-60" />
      <div className="bg-grain" />

      {/* Header */}
      <header className="relative z-10 shrink-0">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 sm:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-full ring-1 ring-brand/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/apepe-icon.png"
                alt="APEPE"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                Meme <span className="text-brand">AI</span> Studio
              </h1>
              <p className="text-[11px] text-zinc-500 sm:text-xs">
                Powered by <span className="text-brand">APEPE</span>
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href="https://apepe.lol"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/12 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/30 hover:text-white"
            >
              About
            </a>
            <a
              href="https://x.com/APEPE_MEME"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 text-zinc-200 transition hover:border-white/30 hover:text-white"
              aria-label="Twitter / X"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Hero (flex-1 to fill, content centered) */}
      <section className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-6 sm:px-10">
        <div className="relative flex flex-1 items-center pt-2 lg:pt-6">
          {/* Right: character group */}
          <div className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[46%] items-center justify-end lg:flex">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-[420px] w-[420px] rounded-full bg-brand/[0.10] blur-3xl" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-characters.png"
              alt="APEPE characters"
              className="animate-fade-in relative h-[84%] w-auto max-w-none translate-x-8 object-contain object-right"
            />
          </div>

          {/* Left: copy + input */}
          <div className="relative z-20 w-full">
            <h2 className="font-display text-[2.2rem] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.07]">
              <span className="block whitespace-nowrap">Generate Official</span>
              <span className="block whitespace-nowrap">Meme Characters</span>
              <span className="block whitespace-nowrap">
                with <span className="text-brand">AI</span>
              </span>
            </h2>

            <p className="mt-5 text-[15px] leading-relaxed text-zinc-400 sm:text-base">
              <span className="block">
                Meme AI Studio allows you to create official
              </span>
              <span className="block">
                meme characters from your favorite projects.
              </span>
              <span className="block">
                Powered by <span className="text-brand">APEPE</span>.
              </span>
            </p>

            {/* Input bar */}
            <div className="mt-10 w-full max-w-[780px]">
              <Link href="/studio" className="group block">
                <div className="card-border flex items-center gap-3 rounded-2xl bg-[rgb(var(--bg-card))] p-3 transition group-hover:border-brand/30">
                  <button className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                    <div className="h-7 w-7 overflow-hidden rounded-full ring-1 ring-brand/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/apepe-icon.png"
                        alt="APEPE"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-base font-bold">APEPE</span>
                    <ChevronDown size={18} className="text-zinc-500" />
                  </button>
                  <span className="flex-1 px-2 text-base text-zinc-600">
                    Describe your meme...
                  </span>
                  <span className="btn-glow flex shrink-0 items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-base font-bold text-black transition group-hover:bg-brand-bright">
                    <Sparkles size={17} />
                    Generate
                  </span>
                </div>
              </Link>
              <p className="mt-2.5 pl-2 text-xs text-zinc-600">
                Example: APEPE as a cyberpunk warrior in Tokyo
              </p>
            </div>
          </div>

          {/* Mobile character image */}
          <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-20 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-characters.png"
              alt=""
              className="w-full max-w-md object-contain"
            />
          </div>
        </div>

        {/* Supported slots */}
        <div className="relative z-10 shrink-0 pb-5">
          <h3 className="font-display mb-4 text-center text-xl font-bold sm:text-2xl">
            Supported Meme Coins
          </h3>
          <div className="mx-auto grid max-w-6xl grid-cols-4 gap-3 sm:grid-cols-8 sm:gap-4">
            {COIN_SLOTS.map((slot) => (
              <div
                key={slot.id}
                className={`flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl border p-3.5 transition ${
                  slot.active
                    ? "border-brand/50 bg-brand/[0.06]"
                    : "border-white/[0.06] bg-white/[0.015]"
                }`}
              >
                {slot.isMore ? (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center">
                      <span className="text-3xl text-zinc-600">···</span>
                    </div>
                    <span className="text-[13px] font-semibold text-zinc-500">
                      More
                    </span>
                  </>
                ) : (
                  <>
                    <div
                      className={`h-14 w-14 overflow-hidden rounded-full ${
                        slot.active ? "ring-1 ring-brand/40" : "ring-1 ring-white/10"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slot.img}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span
                      className={`text-[13px] font-semibold ${
                        slot.active ? "text-brand" : "text-zinc-500"
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
      <footer className="relative z-10 shrink-0 border-t border-white/[0.04]">
        <div className="mx-auto max-w-[1400px] px-6 py-3 text-center text-[11px] text-zinc-600 sm:px-10">
          © 2026 APEPE Meme AI Studio. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
