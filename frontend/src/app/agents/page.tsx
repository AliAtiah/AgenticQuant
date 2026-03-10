"use client";

import AgentChat from "@/components/AgentChat";

export default function AgentsPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-surface-100">
          AI Trading Agent
        </h1>
        <p className="text-xs text-surface-400 mt-1">
          Get AI-powered market analysis and recommendations
        </p>
      </div>
      <AgentChat />
    </div>
  );
}
