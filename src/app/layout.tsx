import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "APEPE Meme AI Studio — Generate Official Meme Characters with AI",
  description:
    "Create unique APEPE meme characters with AI. The official AI-powered meme generation studio. Powered by APEPE.",
  keywords: ["APEPE", "Meme", "AI", "Generator", "Crypto", "Web3", "Memecoin"],
  openGraph: {
    title: "APEPE Meme AI Studio",
    description: "Create unique APEPE meme characters with AI.",
    type: "website",
    url: "https://studio.apepe.lol",
  },
  twitter: {
    card: "summary_large_image",
    title: "APEPE Meme AI Studio",
    description: "Create unique APEPE meme characters with AI.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
