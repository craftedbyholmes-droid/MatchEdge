import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MatchEdge",
  description: "Matched betting platform for odds comparison, qualifying bets, profit planning, alerts, and admin tooling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}