"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronDown, Lock } from "lucide-react";
import { UNLOCK_ALL } from "@/lib/config";

// Project slots. APEPE is active; coin-1..coin-7 are locked ("Soon").
// The generation engine is generic — each locked slot maps to its own
// reference folder (public/references/coin-N/) and unlocks later.
const COIN_SLOTS = [
  { id: "apepe", active: true, img: "/apepe-icon.png" },
  { id: "coin-1", active: false, locked: true, img: "/coins/coin-1.png" },
  { id: "coin-2", active: false, locked: true, img: "/coins/coin-2.png" },
  { id: "coin-3", active: false, locked: true, img: "/coins/coin-3.png" },
  { id: "coin-4", active: false, locked: true, img: "/coins/coin-4.png" },
  { id: "coin-5", active: false, locked: true, img: "/coins/coin-5.png" },
  { id: "coin-6", active: false, locked: true, img: "/coins/coin-6.png" },
  { id: "coin-7", active: false, locked: true, img: "/coins/coin-7.png" },
  { id: "coin-8", active: false, locked: true, img: "/coins/coin-8.png" },
  { id: "coin-9", active: false, locked: true, img: "/coins/coin-9.png" },
  { id: "coin-10", active: false, locked: true },
  { id: "more", active: false, isMore: true },
];

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState("apepe");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const selectableSlots = COIN_SLOTS.filter((s) => s.active || UNLOCK_ALL);
  const selectedSlot =
    COIN_SLOTS.find((s) => s.id === selected) ?? COIN_SLOTS[0];
  const selectedLabel = selectedSlot.active ? "APEPE" : selectedSlot.id;

  function go() {
    const params = new URLSearchParams();
    params.set("project", selected);
    if (prompt.trim()) params.set("prompt", prompt.trim());
    router.push(`/memeaistudio/studio?${params.toString()}`);
  }

  return (
    <main className="relative flex h-dvh min-h-[680px] flex-col overflow-hidden bg-[rgb(var(--bg-primary))]">
      {/* Background glow on the right (behind characters) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-glow opacity-60" />
      <div className="bg-grain" />

      {/* Header */}
      <header className="relative z-10 shrink-0">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 sm:px-10">
          <Link href="/memeaistudio" className="flex items-center gap-3">
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
              <div className="card-border flex items-center gap-3 rounded-2xl bg-[rgb(var(--bg-card))] p-3 transition focus-within:border-brand/30">
                {/* Character dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 transition hover:bg-white/[0.06]"
                  >
                    <div className="h-7 w-7 overflow-hidden rounded-full ring-1 ring-brand/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedSlot.img}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-base font-bold">{selectedLabel}</span>
                    <ChevronDown size={18} className="text-zinc-500" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute bottom-full left-0 z-50 mb-2 max-h-72 w-52 overflow-y-auto rounded-xl border border-white/10 bg-[rgb(var(--bg-card))] p-1.5 shadow-xl">
                      {selectableSlots.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelected(s.id);
                            setDropdownOpen(false);
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                            selected === s.id
                              ? "bg-brand/10 text-white"
                              : "text-zinc-300 hover:bg-white/5"
                          }`}
                        >
                          <div className="h-6 w-6 overflow-hidden rounded-full ring-1 ring-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={s.img}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-semibold">
                            {s.active ? "APEPE" : s.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") go();
                  }}
                  placeholder="Describe your meme..."
                  className="flex-1 bg-transparent px-2 text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={go}
                  className="btn-glow flex shrink-0 items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-base font-bold text-black transition hover:bg-brand-bright"
                >
                  <Sparkles size={17} />
                  Generate
                </button>
              </div>
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
          <div className="mx-auto grid max-w-5xl grid-cols-4 gap-3 sm:grid-cols-6 sm:gap-3.5">
            {COIN_SLOTS.map((slot) => {
              const selectable = !slot.isMore && (slot.active || UNLOCK_ALL);

              let inner;
              if (slot.isMore) {
                inner = (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-white/10">
                      <span className="-mt-1 text-2xl leading-none text-zinc-600">
                        ···
                      </span>
                    </div>
                    <span className="text-[13px] font-semibold text-zinc-500">
                      More
                    </span>
                  </>
                );
              } else if (slot.locked && !UNLOCK_ALL) {
                inner = (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-white/10">
                    <Lock size={20} className="text-zinc-600" />
                  </div>
                );
              } else {
                inner = (
                  <>
                    <div
                      className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full ${
                        slot.active ? "ring-1 ring-brand/40" : "ring-1 ring-white/10"
                      }`}
                    >
                      {slot.img ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={slot.img}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-semibold text-zinc-600">
                          ?
                        </span>
                      )}
                    </div>
                    {slot.active && (
                      <span className="text-[13px] font-semibold text-brand">
                        APEPE
                      </span>
                    )}
                  </>
                );
              }

              const className = `flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border p-3.5 transition ${
                slot.active
                  ? "border-brand/50 bg-brand/[0.06]"
                  : "border-white/[0.06] bg-white/[0.015]"
              } ${selectable ? "hover:border-brand/40 hover:bg-white/[0.04]" : ""}`;

              return selectable ? (
                <Link key={slot.id} href={`/memeaistudio/studio?project=${slot.id}`} className={className}>
                  {inner}
                </Link>
              ) : (
                <div key={slot.id} className={className}>
                  {inner}
                </div>
              );
            })}
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
