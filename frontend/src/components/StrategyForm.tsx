"use client";

import { StrategyInfo } from "@/lib/api";

interface StrategyFormProps {
  strategies: StrategyInfo[];
}

export default function StrategyForm({ strategies }: StrategyFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {strategies.map((strategy) => (
        <div
          key={strategy.name}
          className="bg-surface-800 rounded-lg border border-surface-700 p-5 hover:border-surface-600 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-semibold text-surface-100">
              {strategy.display_name}
            </h3>
            <span className="bg-brand-500/10 text-brand-500 text-[10px] px-2 py-0.5 rounded font-medium">
              Built-in
            </span>
          </div>
          <p className="text-[11px] text-surface-400 mb-4 leading-relaxed">
            {strategy.description}
          </p>

          <div>
            <h4 className="text-[10px] text-surface-500 uppercase tracking-wider mb-2 font-medium">
              Parameters
            </h4>
            <div className="space-y-1.5">
              {Object.entries(strategy.parameters).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-surface-900 rounded px-3 py-2 border border-surface-700"
                >
                  <span className="text-[11px] text-surface-300">
                    {key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <span className="text-[11px] font-mono text-brand-500 font-medium">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
