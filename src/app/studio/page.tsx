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
  Lock,
  Wand2,
  Trash2,
  Video,
  UserCircle,
  Crown,
  Zap,
  Check,
} from "lucide-react";
import { UNLOCK_ALL, FREE_LIMIT_ON } from "@/lib/config";

const PROJECTS = [
  { id: "apepe", name: "APEPE", active: true, img: "/apepe-icon.png" },
  { id: "coin-1", name: "Soon", active: false, locked: true, img: "/coins/coin-1.png" },
  { id: "coin-2", name: "Soon", active: false, locked: true, img: "/coins/coin-2.png" },
  { id: "coin-3", name: "Soon", active: false, locked: true, img: "/coins/coin-3.png" },
  { id: "coin-4", name: "Soon", active: false, locked: true, img: "/coins/coin-4.png" },
  { id: "coin-5", name: "Soon", active: false, locked: true, img: "/coins/coin-5.png" },
  { id: "coin-6", name: "Soon", active: false, locked: true, img: "/coins/coin-6.png" },
  { id: "coin-7", name: "Soon", active: false, locked: true, img: "/coins/coin-7.png" },
  { id: "coin-8", name: "Soon", active: false, locked: true, img: "/coins/coin-8.png" },
  { id: "coin-9", name: "Soon", active: false, locked: true, img: "/coins/coin-9.png" },
  { id: "coin-10", name: "Soon", active: false, locked: true },
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

// Free daily generation limit (per browser). Active only when FREE_LIMIT_ON.
const FREE_LIMIT = 5;
const USAGE_KEY = "apepe_usage";
const MAX_CONCURRENT = 3; // max simultaneous in-flight generations

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function readUsage(): number {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw) as { date: string; count: number };
    if (data.date !== todayStr()) return 0; // new day → reset
    return data.count ?? 0;
  } catch {
    return 0;
  }
}

function writeUsage(count: number) {
  try {
    localStorage.setItem(
      USAGE_KEY,
      JSON.stringify({ date: todayStr(), count }),
    );
  } catch {
    // ignore
  }
}

// ---- Per-coin chat rooms (localStorage) ----
// Each coin id has its own saved conversation. Images are stored too;
// if storage fills up, the oldest results are dropped to make room.
const ROOM_KEY_PREFIX = "apepe_room_";
const MAX_RESULTS_PER_ROOM = 30; // hard cap per room

function roomKey(projectId: string): string {
  return `${ROOM_KEY_PREFIX}${projectId}`;
}

function loadRoom(projectId: string): GenerationResult[] {
  try {
    const raw = localStorage.getItem(roomKey(projectId));
    if (!raw) return [];
    const data = JSON.parse(raw) as GenerationResult[];
    // Never restore a stuck "loading" state.
    return data.map((r) => ({ ...r, loading: false }));
  } catch {
    return [];
  }
}

function saveRoom(projectId: string, results: GenerationResult[]) {
  // Only keep finished results (no loading/in-flight) and cap the count.
  let toSave = results
    .filter((r) => !r.loading)
    .slice(-MAX_RESULTS_PER_ROOM);

  // Try to save; if quota is exceeded, drop oldest results until it fits.
  while (toSave.length > 0) {
    try {
      localStorage.setItem(roomKey(projectId), JSON.stringify(toSave));
      return;
    } catch {
      // QuotaExceeded — drop the oldest result and retry.
      toSave = toSave.slice(1);
    }
  }
  // Nothing fit (e.g. one huge result) — clear the key.
  try {
    localStorage.removeItem(roomKey(projectId));
  } catch {
    // ignore
  }
}

function clearRoom(projectId: string) {
  try {
    localStorage.removeItem(roomKey(projectId));
  } catch {
    // ignore
  }
}

type GenerationResult = {
  id: string;
  prompt: string;
  style?: string;
  count: number;
  images: string[];
  loading?: boolean;
  error?: string;
  timestamp: number;
  projectIcon?: string;
  projectName?: string;
};

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("default");
  const [styleOpen, setStyleOpen] = useState(false);
  const [imageCount, setImageCount] = useState(4);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("apepe");
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [modalImage, setModalImage] = useState<{
    src: string;
    prompt: string;
  } | null>(null);
  // The image currently selected to edit (its data URL), or null for fresh generation.
  const [editBase, setEditBase] = useState<string | null>(null);
  // Top-header mode tabs. Only "image" is active; pfp/video are coming soon.
  const [activeMode, setActiveMode] = useState("image");
  // Free daily usage count (localStorage-backed). Shown as "Today X/FREE_LIMIT".
  const [usedToday, setUsedToday] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
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

  // Load today's free-usage count on mount.
  useEffect(() => {
    setUsedToday(readUsage());
  }, []);

  // When the selected coin (room) changes, load that room's saved conversation.
  const currentRoomRef = useRef("apepe");
  useEffect(() => {
    currentRoomRef.current = selectedProject;
    setResults(loadRoom(selectedProject));
  }, [selectedProject]);

  // Read ?project= and ?prompt= from the URL on mount (set from the landing page).
  // If a prompt is present, auto-run the generation once (came from "search & go").
  const autoRanRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("project");
    if (p) {
      const match = PROJECTS.find((proj) => proj.id === p);
      if (match && (match.active || UNLOCK_ALL)) {
        setSelectedProject(p);
      }
    }
    const pr = params.get("prompt");
    const validProject =
      p && PROJECTS.find((proj) => proj.id === p && (proj.active || UNLOCK_ALL))
        ? p
        : "apepe";
    if (pr) {
      setPrompt(pr);
      // Auto-generate once, using the prompt + project directly (state isn't ready yet).
      if (!autoRanRef.current) {
        autoRanRef.current = true;
        setTimeout(() => handleGenerate(pr, validProject), 100);
      }
    }

    // Clean the URL so the prompt isn't shown in the address bar and a
    // refresh doesn't auto-generate again.
    if (p || pr) {
      window.history.replaceState(null, "", "/studio");
    }
  }, []);

  async function handleGenerate(promptOverride?: string, projectOverride?: string) {
    const effectivePrompt = (promptOverride ?? prompt).trim();
    const effectiveProject = projectOverride ?? selectedProject;
    if (!effectivePrompt) return;

    // Limit simultaneous generations.
    if (activeCount >= MAX_CONCURRENT) return;

    // Free daily limit (only when FREE_LIMIT_ON).
    if (FREE_LIMIT_ON && usedToday >= FREE_LIMIT) {
      setShowLimitModal(true);
      return;
    }

    const baseImage = editBase; // capture current edit target
    const projMeta =
      PROJECTS.find((p) => p.id === effectiveProject) ?? PROJECTS[0];
    const id = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newResult: GenerationResult = {
      id,
      prompt: effectivePrompt,
      style: selectedStyle !== "default" ? selectedStyle : undefined,
      count: imageCount,
      images: [],
      loading: true,
      projectIcon: projMeta.img,
      projectName: projMeta.active ? projMeta.name : projMeta.id,
      timestamp: Date.now(),
    };

    // Show the loading card only if the user is currently viewing that room.
    setResults((prev) =>
      effectiveProject === selectedProject ? [...prev, newResult] : prev,
    );
    setPrompt("");
    setEditBase(null);
    setActiveCount((n) => n + 1);

    // Helper: write a finished/failed result into the correct room's storage,
    // and update the on-screen list only if that room is currently visible.
    const finalize = (patch: Partial<GenerationResult>) => {
      // Persist to the room: load fresh, replace/append this result, save.
      const room = loadRoom(effectiveProject).filter((r) => r.id !== id);
      const finished = { ...newResult, ...patch, loading: false };
      saveRoom(effectiveProject, [...room, finished]);

      // Update screen if viewing this room.
      setResults((prev) => {
        const isViewing = currentRoomRef.current === effectiveProject;
        if (!isViewing) return prev;
        const exists = prev.some((r) => r.id === id);
        if (exists) {
          return prev.map((r) => (r.id === id ? finished : r));
        }
        return [...prev, finished];
      });
    };

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newResult.prompt,
          style: newResult.style,
          count: imageCount,
          project: effectiveProject,
          baseImage: baseImage || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");

      finalize({ images: data.images });

      if (FREE_LIMIT_ON) {
        const next = readUsage() + 1;
        writeUsage(next);
        setUsedToday(next);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      finalize({ error: message });
    } finally {
      setActiveCount((n) => Math.max(0, n - 1));
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
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[rgb(var(--bg-primary))]">
      {/* Top full-width header */}
      <header className="z-30 flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-brand/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/apepe-icon.png"
                alt="APEPE"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <p className="font-display text-base font-bold leading-tight">
                Meme <span className="text-brand">AI</span> Studio
              </p>
              <p className="text-[10px] text-zinc-500">
                Powered by <span className="text-brand">APEPE</span>
              </p>
            </div>
          </Link>

          {/* Mode tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveMode("image")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                activeMode === "image"
                  ? "bg-brand text-black"
                  : "text-zinc-300 hover:bg-white/5"
              }`}
            >
              <ImageIcon size={15} />
              <span className="font-medium">Image</span>
            </button>
            <button
              disabled
              className="flex cursor-not-allowed items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-600"
            >
              <UserCircle size={15} />
              <span className="font-medium">PFP</span>
              <Lock size={12} />
            </button>
            <button
              disabled
              className="flex cursor-not-allowed items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-600"
            >
              <Video size={15} />
              <span className="font-medium">Video</span>
              <Lock size={12} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
      </header>

      {/* Sidebar + main row */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
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
              {/* APEPE — labeled row */}
              {PROJECTS.filter((p) => p.active).map((proj) => {
                const isSelected = selectedProject === proj.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedProject(proj.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[15px] transition ${
                      isSelected
                        ? "border border-brand/30 bg-brand/10 text-white"
                        : "text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-brand/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={proj.img}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="font-semibold">{proj.name}</span>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-brand" />
                  </button>
                );
              })}

              {/* Coins — icon-only vertical list, ~7 visible then scroll; More at end */}
              <div className="mt-1 max-h-[300px] space-y-1 overflow-y-auto pr-1">
                {PROJECTS.filter((p) => !p.active).map((proj) => {
                  const isSelected = selectedProject === proj.id;
                  const clickable = !proj.isMore && (UNLOCK_ALL || proj.active);
                  const showLocked = proj.locked && !UNLOCK_ALL;

                  let icon;
                  if (proj.isMore) {
                    icon = (
                      <span className="-mt-1 text-lg leading-none text-zinc-600">
                        ···
                      </span>
                    );
                  } else if (showLocked) {
                    icon = <Lock size={15} className="text-zinc-600" />;
                  } else if (!proj.img) {
                    icon = (
                      <span className="text-base font-semibold text-zinc-600">
                        ?
                      </span>
                    );
                  } else {
                    icon = (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={proj.img}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    );
                  }

                  return (
                    <button
                      key={proj.id}
                      disabled={!clickable}
                      onClick={() => clickable && setSelectedProject(proj.id)}
                      title={proj.isMore ? "More coming soon" : undefined}
                      className={`flex w-full items-center rounded-xl px-3 py-2 transition ${
                        isSelected
                          ? "border border-brand/30 bg-brand/10"
                          : clickable
                            ? "hover:bg-white/5"
                            : "cursor-not-allowed"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ${
                          isSelected ? "ring-brand/50" : "ring-white/10"
                        } ${proj.isMore || showLocked || !proj.img ? "bg-white/[0.03]" : ""}`}
                      >
                        {icon}
                      </div>
                      {proj.isMore && (
                        <span className="ml-3 text-[15px] text-zinc-500">
                          More
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
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
          {results.length > 0 ? (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Clear all images in this room? This cannot be undone.",
                  )
                ) {
                  clearRoom(selectedProject);
                  setResults([]);
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:border-red-500/40 hover:text-red-400"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          ) : (
            <div className="w-8 md:w-0" />
          )}
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
                    onEdit={(src) => {
                      setEditBase(src);
                      // bring focus to input area by scrolling down
                      if (scrollRef.current) {
                        scrollRef.current.scrollTop =
                          scrollRef.current.scrollHeight;
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/5 bg-[rgb(var(--bg-card))]/80 px-4 py-4 backdrop-blur sm:px-8 sm:py-5">
          <div className="mx-auto max-w-5xl">
            {editBase && (
              <div className="animate-fade-in mb-3 flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/10 p-2.5">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-brand/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editBase}
                    alt="Editing"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 items-center gap-2 text-sm">
                  <Wand2 size={15} className="text-brand" />
                  <span className="text-zinc-200">
                    Editing this image — describe the change
                  </span>
                </div>
                <button
                  onClick={() => setEditBase(null)}
                  className="rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
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
                className="flex-1 bg-transparent px-2 text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50 sm:px-3"
              />
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-500">
                <ImageIcon size={20} />
              </div>
              <button
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || activeCount >= MAX_CONCURRENT}
                title={
                  activeCount >= MAX_CONCURRENT
                    ? "Up to 3 generations at once"
                    : undefined
                }
                className="btn-glow flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-base font-semibold text-black transition hover:bg-brand-bright disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500 sm:px-6"
              >
                {activeCount > 0 ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Sparkles size={17} />
                )}
                <span className="hidden sm:inline">Generate</span>
              </button>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-3 px-2">
              <p className="text-xs text-zinc-600">
                Tip: Be specific for better results.
              </p>
              {FREE_LIMIT_ON && (
                <div className="shrink-0 rounded-lg border border-brand/40 bg-brand/5 px-2.5 py-1">
                  <span className="text-[11px] text-zinc-400">
                    Today{" "}
                    <span className="font-medium text-brand">
                      {usedToday}/{FREE_LIMIT}
                    </span>{" "}
                    free
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      </div>

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

      {/* Free limit reached modal */}
      {showLimitModal && (
        <div
          className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowLimitModal(false)}
        >
          <div
            className="w-[360px] rounded-[18px] border border-white/12 bg-[rgb(var(--bg-card))] p-7 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
              <Zap size={26} className="text-brand" />
            </div>
            <p className="text-lg font-semibold">
              You&apos;re out of free generations
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              You&apos;ve used all {FREE_LIMIT} free generations today.
              <br />
              Premium is coming soon.
            </p>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left">
              <div className="mb-2.5 flex items-center gap-2">
                <Crown size={18} className="text-brand" />
                <span className="text-sm font-medium">APEPE Premium</span>
                <span className="ml-auto rounded-full bg-brand/15 px-2.5 py-1 text-[11px] text-brand">
                  Coming soon
                </span>
              </div>
              <div className="space-y-1.5 text-[13px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-brand" />
                  Unlimited image generation
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-brand" />
                  PFP &amp; video generation
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-brand" />
                  No watermark
                </div>
              </div>
            </div>

            <div className="mt-4 cursor-not-allowed rounded-xl bg-brand py-2.5 text-sm font-semibold text-black opacity-60">
              Notify me (coming soon)
            </div>
            <button
              onClick={() => setShowLimitModal(false)}
              className="mt-3.5 text-xs text-zinc-500 transition hover:text-zinc-300"
            >
              Your {FREE_LIMIT} free generations reset tomorrow
            </button>
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
  onEdit,
}: {
  result: GenerationResult;
  onImageClick: (src: string) => void;
  onDownload: (src: string) => void;
  onEdit: (src: string) => void;
}) {
  // Always lay out on a 4-column grid so each image is the same size
  // whether the user generated 1, 2, or 4 images.
  const gridCols = "grid-cols-2 sm:grid-cols-4";

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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-brand/40">
          {result.projectIcon ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={result.projectIcon}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold text-zinc-500">?</span>
          )}
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
                          onEdit(img);
                        }}
                        className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white backdrop-blur transition hover:bg-black/90"
                        aria-label="Edit this image"
                        title="Edit this image"
                      >
                        <Wand2 size={12} />
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
