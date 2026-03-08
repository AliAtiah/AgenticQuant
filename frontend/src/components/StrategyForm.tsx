"use client";

import { StrategyInfo } from "@/lib/api";

interface StrategyFormProps {
  strategies: StrategyInfo[];
}

export default function StrategyForm({ strategies }: StrategyFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {strategies.map((strategy) => (
        <div
          key={strategy.name}
          className="bg-surface-800 rounded-lg border border-surface-600 p-6 hover:border-brand-500/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold">{strategy.display_name}</h3>
            <span className="bg-brand-600/20 text-brand-400 text-xs px-2 py-1 rounded font-medium">
              Built-in
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-4">{strategy.description}</p>

          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Parameters
            </h4>
            <div className="space-y-2">
              {Object.entries(strategy.parameters).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-surface-700 rounded px-3 py-2"
                >
                  <span className="text-sm text-gray-300">
                    {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <span className="text-sm font-mono text-brand-400">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
