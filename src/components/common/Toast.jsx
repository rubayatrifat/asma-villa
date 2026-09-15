import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function Toast({ message, type = "success", isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold ${
          type === "success"
            ? "bg-slate-900 text-emerald-400 border-slate-700"
            : "bg-rose-900 text-rose-200 border-rose-700"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}
