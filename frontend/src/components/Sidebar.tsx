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

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const color = active ? "currentColor" : "currentColor";
  const iconMap: Record<string, JSX.Element> = {
    grid: (
      <svg viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.5} className="w-[18px] h-[18px]">
        <rect x="3" y="3" width="6" height="6" rx="1.5" />
        <rect x="11" y="3" width="6" height="6" rx="1.5" />
        <rect x="3" y="11" width="6" height="6" rx="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" />
      </svg>
    ),
    candlestick: (
      <svg viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.5} className="w-[18px] h-[18px]">
        <line x1="7" y1="2" x2="7" y2="5" />
        <rect x="5" y="5" width="4" height="7" rx="0.5" />
        <line x1="7" y1="12" x2="7" y2="15" />
        <line x1="14" y1="5" x2="14" y2="8" />
        <rect x="12" y="8" width="4" height="5" rx="0.5" />
        <line x1="14" y1="13" x2="14" y2="18" />
      </svg>
    ),
    flask: (
      <svg viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.5} className="w-[18px] h-[18px]">
        <path d="M8 2h4M9 2v5.5L4 16a1 1 0 0 0 .8 1.5h10.4a1 1 0 0 0 .8-1.5L11 7.5V2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    cpu: (
      <svg viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.5} className="w-[18px] h-[18px]">
        <rect x="4" y="4" width="12" height="12" rx="2" />
        <rect x="7" y="7" width="6" height="6" rx="0.5" />
        <line x1="8" y1="1" x2="8" y2="4" /><line x1="12" y1="1" x2="12" y2="4" />
        <line x1="8" y1="16" x2="8" y2="19" /><line x1="12" y1="16" x2="12" y2="19" />
        <line x1="16" y1="8" x2="19" y2="8" /><line x1="16" y1="12" x2="19" y2="12" />
        <line x1="1" y1="8" x2="4" y2="8" /><line x1="1" y1="12" x2="4" y2="12" />
      </svg>
    ),
    bot: (
      <svg viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={1.5} className="w-[18px] h-[18px]">
        <rect x="3" y="8" width="14" height="9" rx="2" />
        <circle cx="10" cy="4" r="2" />
        <line x1="10" y1="6" x2="10" y2="8" />
        <circle cx="7" cy="13" r="1" fill={color} stroke="none" />
        <circle cx="13" cy="13" r="1" fill={color} stroke="none" />
      </svg>
    ),
  };

  return iconMap[icon] || null;
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-surface-800 border-r border-surface-700 flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="px-4 py-4 border-b border-surface-700">
        <h1 className="text-base font-bold tracking-tight">
          <span className="text-brand-500">Agentic</span>
          <span className="text-surface-100">Quant</span>
        </h1>
        <p className="text-[10px] text-surface-400 mt-0.5 tracking-wide">
          AI-Powered Trading Platform
        </p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-brand-500/10 text-brand-500"
                  : "text-surface-400 hover:text-surface-100 hover:bg-surface-700/50"
              }`}
            >
              <NavIcon icon={item.icon} active={isActive} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-surface-700">
        <div className="text-[10px] text-surface-500 font-mono">
          v0.1.0
        </div>
      </div>
    </aside>
  );
}
