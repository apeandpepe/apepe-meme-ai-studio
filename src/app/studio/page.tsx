"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Settings2,
  Menu,
  X,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Loader2,
  Download,
  Maximize2,
  Images,
  Image as ImageIcon,
} from "lucide-react";

const PROJECTS = [
  { id: "apepe", name: "APEPE", active: true, img: "/apepe-icon.png" },
  { id: "slot-1", name: "Soon", active: false, comingSoon: true, img: "/coins/coin-1.png" },
  { id: "slot-2", name: "Soon", active: false, comingSoon: true, img: "/coins/coin-2.png" },
  { id: "slot-3", name: "Soon", active: false, comingSoon: true, img: "/coins/coin-3.png" },
  { id: "slot-4", name: "Soon", active: false, comingSoon: true, img: "/coins/coin-4.png" },
  { id: "slot-5", name: "Soon", active: false, comingSoon: true, img: "/coins/coin-5.png" },
  { id: "slot-6", name: "Soon", active: false, comingSoon: true, img: "/coins/coin-6.png" },
  { id: "more", name: "More", active: false, isMore: true },
];

const STYLE_PRESETS = [
  { id: "default", name: "Default", emoji: "🎨" },
  { id: "cyberpunk", name: "Cyberpunk", emoji: "🌃" },
  { id: "samurai", name: "Samurai", emoji: "⚔️" },
  { id: "pixel", name: "Pixel Art", emoji: "👾" },
  { id: "3d", name: "3D Render", emoji: "🎮" },
  { id: "anime", name: "Anime", emoji: "✨" },
];

const COUNT_OPTIONS = [1, 2, 4];

const ESTIMATED_SECONDS: Record<number, number> = {
  1: 12,
  2: 16,
  4: 22,
};

type GenerationResult = {
  id: string;
  prompt: string;
  style?: string;
  count: number;
  images: string[];
  loading?: boolean;
  error?: string;
  timestamp: number;
};

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("default");
  const [styleOpen, setStyleOpen] = useState(false);
  const [imageCount, setImageCount] = useState(4);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalImage, setModalImage] = useState<{
    src: string;
    prompt: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [results]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setModalImage(null);
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;

    const id = `gen_${Date.now()}`;
    const newResult: GenerationResult = {
      id,
      prompt: prompt.trim(),
      style: selectedStyle !== "default" ? selectedStyle : undefined,
      count: imageCount,
      images: [],
      loading: true,
      timestamp: Date.now(),
    };

    setResults((prev) => [...prev, newResult]);
    setPrompt("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newResult.prompt,
          style: newResult.style,
          count: imageCount,
          project: "apepe",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");

      setResults((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, images: data.images, loading: false } : r,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setResults((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, loading: false, error: message } : r,
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function downloadImage(src: string, promptText: string) {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = promptText
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "-")
        .slice(0, 50);
      link.download = `apepe-${safeName}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  }

  const activeStyle = STYLE_PRESETS.find((s) => s.id === selectedStyle);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[rgb(var(--bg-primary))]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/5 bg-[rgb(var(--bg-card))] transition-transform md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft size={16} className="text-zinc-400" />
              <span className="text-sm font-medium">
                <span className="text-brand">APEPE</span> Studio
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1 text-zinc-400 hover:bg-white/5 md:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <p className="px-3 pb-3 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Projects
            </p>
            <div className="space-y-1.5">
              {PROJECTS.map((proj) => (
                <button
                  key={proj.id}
                  disabled={!proj.active}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[15px] transition ${
                    proj.active
                      ? "border border-brand/30 bg-brand/10 text-white"
                      : "cursor-not-allowed text-zinc-500"
                  }`}
                >
                  {proj.isMore ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                        <span className="text-lg leading-none text-zinc-500">
                          ···
                        </span>
                      </div>
                      <span className="text-zinc-500">More</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 overflow-hidden rounded-full ${
                            proj.active
                              ? "ring-1 ring-brand/40"
                              : "ring-1 ring-white/10"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={proj.img}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className={proj.active ? "font-semibold" : ""}>
                          {proj.active ? proj.name : "Soon"}
                        </span>
                      </div>
                      {proj.active && (
                        <span className="h-2 w-2 rounded-full bg-brand" />
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* APEPE card — right below the project list */}
            <div className="mt-5 rounded-2xl border border-brand/20 bg-brand/5 p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-brand/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/apepe-icon.png"
                    alt="APEPE"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-lg font-bold">APEPE</p>
              </div>
              <p className="mt-3 text-[13px] leading-snug text-zinc-400">
                The official AI studio for APEPE.
              </p>
              <p className="mt-3 text-[13px] font-medium text-brand">
                Create. Share. Meme.
              </p>
            </div>
          </div>

          {/* Social icons at the very bottom — X and Telegram only */}
          <div className="border-t border-white/5 p-4">
            <div className="flex items-center gap-2">
              <a
                href="https://x.com/APEPE_MEME"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-300 transition hover:border-white/30 hover:text-white"
                aria-label="X / Twitter"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://t.me/apepe_official"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-300 transition hover:border-white/30 hover:text-white"
                aria-label="Telegram"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/5 px-4 py-4 md:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-white/5 md:hidden"
          >
            <Menu size={18} />
          </button>
          <div className="flex flex-col">
            <h1 className="font-display text-xl font-bold sm:text-2xl">
              APEPE <span className="text-brand">Generator</span>
            </h1>
            <p className="text-[13px] text-zinc-500">
              Create unique APEPE images with AI
            </p>
          </div>
          <div className="w-8 md:w-0" />
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-5xl">
            {results.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-6">
                {results.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    onImageClick={(src) =>
                      setModalImage({ src, prompt: result.prompt })
                    }
                    onDownload={(src) => downloadImage(src, result.prompt)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/5 bg-[rgb(var(--bg-card))]/80 px-4 py-4 backdrop-blur sm:px-8 sm:py-5">
          <div className="mx-auto max-w-5xl">
            {styleOpen && (
              <div className="animate-fade-in mb-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Style
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {STYLE_PRESETS.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition ${
                        selectedStyle === style.id
                          ? "bg-brand text-black"
                          : "bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                      }`}
                    >
                      <span>{style.emoji}</span>
                      <span className="font-medium">{style.name}</span>
                    </button>
                  ))}
                </div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Images
                </p>
                <div className="flex gap-2">
                  {COUNT_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setImageCount(c)}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs transition ${
                        imageCount === c
                          ? "bg-brand text-black"
                          : "bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                      }`}
                    >
                      <Images size={12} />
                      <span className="font-medium">{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.02] p-2.5 sm:p-3">
              <button
                onClick={() => setStyleOpen(!styleOpen)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm transition sm:px-4 ${
                  selectedStyle !== "default" || imageCount !== 4
                    ? "bg-brand/10 text-brand"
                    : "bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                }`}
              >
                <Settings2 size={17} />
                <span className="hidden font-medium sm:inline">
                  {activeStyle?.name} · {imageCount}
                </span>
              </button>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="Describe your meme..."
                disabled={isGenerating}
                className="flex-1 bg-transparent px-2 text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50 sm:px-3"
              />
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-500">
                <ImageIcon size={20} />
              </div>
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="btn-glow flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-base font-semibold text-black transition hover:bg-brand-bright disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500 sm:px-6"
              >
                {isGenerating ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Sparkles size={17} />
                )}
                <span className="hidden sm:inline">Generate</span>
              </button>
            </div>
            <p className="mt-2.5 px-2 text-xs text-zinc-600">
              Tip: Be specific for better results. Example: &quot;APEPE as a king
              in a medieval castle&quot;
            </p>
          </div>
        </div>
      </main>

      {modalImage && (
        <div
          className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setModalImage(null)}
        >
          <div
            className="relative max-h-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalImage(null)}
              className="absolute -top-12 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <img
              src={modalImage.src}
              alt={modalImage.prompt}
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-black/60 p-3 backdrop-blur">
              <p className="flex-1 truncate text-sm text-zinc-300">
                {modalImage.prompt}
              </p>
              <button
                onClick={() => downloadImage(modalImage.src, modalImage.prompt)}
                className="btn-glow flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-brand-bright"
              >
                <Download size={14} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 ring-1 ring-brand/30">
        <Sparkles size={24} className="text-brand" />
      </div>
      <h2 className="text-lg font-bold sm:text-xl">Generate your first APEPE</h2>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        Type a prompt below to create a unique APEPE meme. Try styles like
        cyberpunk, samurai, or pixel art.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {[
          "APEPE as a cyberpunk warrior",
          "APEPE in samurai armor",
          "APEPE pixel art",
        ].map((sample) => (
          <span
            key={sample}
            className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] text-zinc-500"
          >
            &quot;{sample}&quot;
          </span>
        ))}
      </div>
    </div>
  );
}

function CountdownTimer({ count }: { count: number }) {
  const start = ESTIMATED_SECONDS[count] ?? 20;
  const [remaining, setRemaining] = useState(start);

  useEffect(() => {
    setRemaining(start);
    const interval = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 1 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [start]);

  return (
    <span className="font-mono inline-flex items-center gap-1.5 text-[11px] text-brand">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-glow-pulse rounded-full bg-brand" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
      </span>
      Generating... {remaining}s
    </span>
  );
}

function ResultCard({
  result,
  onImageClick,
  onDownload,
}: {
  result: GenerationResult;
  onImageClick: (src: string) => void;
  onDownload: (src: string) => void;
}) {
  const gridCols =
    result.count === 1
      ? "grid-cols-1"
      : result.count === 2
        ? "grid-cols-2"
        : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className="animate-fade-in-up space-y-3">
      <div className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">
          <svg
            className="h-4 w-4 text-zinc-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-semibold text-zinc-300">You</p>
          <p className="mt-1 text-[15px] text-zinc-200">{result.prompt}</p>
          {result.style && (
            <p className="mt-1 text-xs text-zinc-500">
              Style: <span className="text-brand">{result.style}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-brand/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/apepe-icon.png"
            alt="APEPE"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              <span className="text-brand">Meme AI Studio</span>
            </p>
            {result.loading ? (
              <CountdownTimer count={result.count} />
            ) : (
              <p className="text-[11px] text-zinc-600">Just now</p>
            )}
          </div>

          {result.loading && (
            <div className={`mt-4 grid gap-3 ${gridCols}`}>
              {Array.from({ length: result.count }).map((_, i) => (
                <div key={i} className="shimmer aspect-square rounded-xl" />
              ))}
            </div>
          )}

          {result.error && (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-xs text-red-400">{result.error}</p>
            </div>
          )}

          {!result.loading && result.images.length > 0 && (
            <>
              <div className={`mt-4 grid gap-3 ${gridCols}`}>
                {result.images.map((img, i) => (
                  <div
                    key={i}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-white/5"
                  >
                    <img
                      src={img}
                      alt={`${result.prompt} ${i + 1}`}
                      className="h-full w-full cursor-pointer object-cover transition group-hover:scale-105"
                      onClick={() => onImageClick(img)}
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-end justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageClick(img);
                        }}
                        className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white backdrop-blur transition hover:bg-black/90"
                        aria-label="View larger"
                      >
                        <Maximize2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(img);
                        }}
                        className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-black backdrop-blur transition hover:bg-brand-bright"
                        aria-label="Download"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1">
                <button className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white">
                  <Copy size={14} />
                </button>
                <button className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-brand">
                  <ThumbsUp size={14} />
                </button>
                <button className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-red-400">
                  <ThumbsDown size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
