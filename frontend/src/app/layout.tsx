import type { Metadata } from "next";
import "@/styles/globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AgenticQuant - AI-Powered Trading Platform",
  description:
    "Quantitative trading platform with backtesting, live charting, and autonomous AI trading agents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-56 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
