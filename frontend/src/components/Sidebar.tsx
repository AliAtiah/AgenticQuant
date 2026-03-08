"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/chart", label: "Charts", icon: "candlestick" },
  { href: "/backtest", label: "Backtest", icon: "flask" },
  { href: "/strategies", label: "Strategies", icon: "cpu" },
  { href: "/agents", label: "AI Agent", icon: "bot" },
];

function NavIcon({ icon }: { icon: string }) {
  const iconMap: Record<string, JSX.Element> = {
    grid: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    candlestick: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <line x1="9" y1="2" x2="9" y2="6" /><rect x="7" y="6" width="4" height="8" rx="0.5" />
        <line x1="9" y1="14" x2="9" y2="18" />
        <line x1="17" y1="6" x2="17" y2="10" /><rect x="15" y="10" width="4" height="6" rx="0.5" />
        <line x1="17" y1="16" x2="17" y2="22" />
      </svg>
    ),
    flask: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path d="M9 3h6M10 3v7.4a2 2 0 0 1-.5 1.3L4 19a1 1 0 0 0 .8 1.6h14.4a1 1 0 0 0 .8-1.6l-5.5-7.3a2 2 0 0 1-.5-1.3V3" />
      </svg>
    ),
    cpu: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
    bot: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <line x1="12" y1="7" x2="12" y2="11" />
        <line x1="8" y1="16" x2="8" y2="16" strokeLinecap="round" strokeWidth={3} />
        <line x1="16" y1="16" x2="16" y2="16" strokeLinecap="round" strokeWidth={3} />
      </svg>
    ),
  };

  return iconMap[icon] || null;
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface-800 border-r border-surface-600 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-5 border-b border-surface-600">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-brand-400">Agentic</span>
          <span className="text-white">Quant</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">AI-Powered Trading Platform</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600/20 text-brand-400"
                  : "text-gray-400 hover:text-white hover:bg-surface-600"
              }`}
            >
              <NavIcon icon={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-600">
        <div className="text-xs text-gray-500">
          AgenticQuant v0.1.0
        </div>
      </div>
    </aside>
  );
}
