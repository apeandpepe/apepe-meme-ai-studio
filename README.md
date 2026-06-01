# APEPE Meme AI Studio

> AI-powered meme generation platform — powered by [APEPE](https://apepe.lol)

**Live**: [studio.apepe.lol](https://studio.apepe.lol) (coming soon)

---

## Overview

APEPE Meme AI Studio is a multimodal AI content generation platform built around APEPE memecoin IP. Users can generate unique APEPE meme characters in various scenes and styles using state-of-the-art AI models.

This platform serves as the foundation for an expandable Web3 Meme IP infrastructure layer — starting with APEPE and growing to support additional licensed memecoin partners over time.

## Why this matters

Existing AI image generators (ChatGPT, Midjourney, Grok, etc.) produce generic results when prompted with memecoin terms. They have no understanding of project-specific character IP, breaking brand identity in AI-generated content.

APEPE Meme AI Studio solves this by combining reference-based AI generation (Google's Gemini 2.5 Flash Image / Nano Banana) with curated official character references, ensuring brand consistency across every generation.

## Features

### V1 (Current Beta)
- 🎨 **APEPE Character Generation** — Character-consistent image generation
- 🎭 **Style Presets** — Cyberpunk, Samurai, Pixel Art, 3D, Anime
- 🌆 **Scene Composition** — Place APEPE in any background or context
- 📱 **Mobile-First Design** — Full responsive support
- ⚡ **Fast Generation** — Powered by Nano Banana (~3s per image)

### V2 (Roadmap)
- 🎬 **Short Video Generation** — Animated memes with Hailuo AI
- 🔗 **Wallet Integration** — APEPE token holders get premium access
- 💎 **Token Utility** — Pay with APEPE for premium features
- 🤝 **Partner Studios** — Licensed integration with partner memecoins

### V3+ (Future)
- 📦 **APEPE AI SDK** — Embed APEPE AI generation in other Web3 projects
- 🖼️ **PFP Generator** — Profile picture variants
- 📚 **Series Mode** — Multi-panel meme stories
- 💰 **User Marketplace** — Buy/sell user-generated content

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Image AI | Google Gemini 2.5 Flash Image (Nano Banana) |
| Database | Supabase (planned) |
| Hosting | Vercel |
| Auth | Wallet-based (planned, V2) |

## Project Structure

```
apepe-meme-ai-studio/
├── src/
│   ├── app/
│   │   ├── api/generate/route.ts   # Nano Banana API endpoint
│   │   ├── studio/page.tsx         # Main generation interface
│   │   ├── page.tsx                # Landing page
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles
│   ├── components/                 # Reusable UI components
│   └── lib/
│       ├── nano-banana.ts          # Gemini image generation client
│       └── references.ts           # APEPE reference image loader
├── public/
│   └── references/apepe/           # Official APEPE images (for AI reference)
├── package.json
└── README.md
```

## Getting Started (Development)

### Prerequisites
- Node.js 18+
- npm or pnpm
- Google AI Studio API key ([get one here](https://aistudio.google.com))

### Setup

```bash
# Clone
git clone https://github.com/apeandpepe/apepe-meme-ai-studio.git
cd apepe-meme-ai-studio

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Add reference images
# Drop 3-5 APEPE images into: public/references/apepe/
# Files should be named: apepe-01.png, apepe-02.png, etc.

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see it.

### Deployment

Deployed automatically to Vercel on `main` branch push.

Environment variables to configure in Vercel:
- `GOOGLE_AI_API_KEY` (required)
- `NEXT_PUBLIC_SUPABASE_URL` (planned)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (planned)

## Licensing & IP Policy

This platform exclusively works with IP that is:
1. **Owned by the project itself** (APEPE), or
2. **Officially licensed** through partnership agreements, or
3. **Released under CC0 / public domain** licenses

We do not generate content based on unlicensed third-party IP. New character integrations are added through official partnerships only.

## License

MIT — see [LICENSE](./LICENSE)

## Links

- 🌐 **Website**: [apepe.lol](https://apepe.lol)
- 🎨 **Studio**: [studio.apepe.lol](https://studio.apepe.lol)
- 𝕏 **Twitter**: [@apepe](https://x.com/apepe)

## Contributing

Contributions are welcome. This is an open-source project under the APEPE organization. Please open an issue first to discuss major changes.

---

**APEPE** — Where Memes Meet AI.
