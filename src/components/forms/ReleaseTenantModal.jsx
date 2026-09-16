import React, { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle2, Ban } from "lucide-react";
import { toBengaliNumber } from "../../utils/formatters";

export default function ReleaseTenantModal({
  isOpen,
  onClose,
  tenantName,
  roomRent,
  currentMonthName,
  onConfirmRelease,
}) {
  const [isWaived, setIsWaived] = useState(true); // ডিফল্ট: মওকুফ (হ্যাঁ)
  const [claimAmount, setClaimAmount] = useState("");

  useEffect(() => {
    if (roomRent) {
      setClaimAmount(String(roomRent));
    }
  }, [roomRent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmRelease({
      isWaived,
      amount: isWaived ? 0 : Number(claimAmount) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-black text-slate-900">
              ভাড়াটিয়া রিলিজ কনফার্মেশন
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm font-semibold text-slate-700 leading-relaxed">
            আপনি কি নিশ্চিতভাবে{" "}
            <span className="text-blue-600 font-black">{tenantName}</span>-কে
            রিলিজ করতে চান?
          </p>

          {/* Question: চলতি মাসের ভাড়া কি মওকুফ? */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <label className="block text-xs font-black text-slate-700">
              {currentMonthName}-এর ভাড়া কি মওকুফ করা হয়েছে?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsWaived(true)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  isWaived
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>হ্যাঁ (মওকুফ)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWaived(false)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  !isWaived
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Ban className="h-4 w-4" />
                <span>না (ভাড়া দিতে হবে)</span>
              </button>
            </div>
          </div>

          {/* If Not Waived: Show Amount Input */}
          {!isWaived && (
            <div className="rounded-xl bg-rose-50/70 border border-rose-200 p-3.5 space-y-1.5 animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-rose-800">
                চলতি মাসের দাবিদার ভাড়ার পরিমাণ (টাকা)
              </label>
              <input
                type="number"
                required
                min="1"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                placeholder="যেমন: ২২০০"
                className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:border-rose-500"
              />
              <p className="text-2xs text-rose-600">
                * ভাড়াটিয়া না জানিয়ে চলে যাওয়ায় যে পরিমাণ অর্থ পরিশোধ সাপেক্ষে
                ছাড়পত্র দেওয়া হবে।
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-98"
            >
              রিলিজ সম্পন্ন করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
