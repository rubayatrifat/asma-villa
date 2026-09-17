import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Edit2, DollarSign } from "lucide-react";
import { formatCurrency, toBengaliNumber } from "../../utils/formatters";

export default function ClaimActionModal({
  isOpen,
  onClose,
  claim,
  type, // 'pay' অথবা 'edit'
  onConfirm,
}) {
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (claim) {
      if (type === "pay") {
        setAmount(String(claim.due ?? claim.claimAmount));
      } else {
        setAmount(String(claim.claimAmount));
      }
    }
  }, [claim, type, isOpen]);

  if (!isOpen || !claim) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (num < 0) return;
    onConfirm(claim.id, num);
  };

  const isPayment = type === "pay";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800">
            {isPayment ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <Edit2 className="h-5 w-5 text-blue-600" />
            )}
            <h3 className="text-lg font-black">
              {isPayment
                ? "জরিমানার টাকা জমা নিন"
                : "দাবির পরিমাণ পরিবর্তন করুন"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <p className="text-xs font-bold text-slate-500">ভাড়াটিয়া</p>
            <p className="text-base font-black text-slate-900">
              {claim.tenantName}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              মোট দাবি:{" "}
              <span className="font-bold text-rose-600">
                {formatCurrency(claim.claimAmount)}
              </span>
              {isPayment && (
                <>
                  {" "}
                  | বকেয়া:{" "}
                  <span className="font-bold text-rose-600">
                    {formatCurrency(claim.due)}
                  </span>
                </>
              )}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isPayment ? "জমা প্রাপ্ত টাকার পরিমাণ" : "নতুন দাবির পরিমাণ"}{" "}
              (টাকা) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="টাকা লিখুন"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-base font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

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
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-98 ${
                isPayment
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPayment ? "জমা নিশ্চিত করুন" : "আপডেট করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
