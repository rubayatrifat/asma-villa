import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function Toast({ message, type = "success", isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold ${
          type === "success"
            ? "bg-white text-emerald-600 border-slate-200"
            : "bg-white text-rose-600 border-slate-200"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
        )}

        <span>{message}</span>
      </div>
    </div>
  );
}
