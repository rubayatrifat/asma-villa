import React, { useState, useEffect } from "react";
import { X, Check, Trash2, Zap, AlertTriangle } from "lucide-react";
import { toBengaliNumber, formatCurrency } from "../../utils/formatters";

export default function EditMonthModal({
  isOpen,
  onClose,
  monthBill,
  monthName,
  onSave,
  onDelete,
}) {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (monthBill) {
      setFormData({ ...monthBill });
    }
  }, [monthBill]);

  if (!isOpen || !formData) return null;

  const handleChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  // লাইভ বিদ্যুৎ ক্যালকুলেশন
  const startUnit = Number(formData.startUnit) || 0;
  const endUnit = Number(formData.endUnit) || 0;
  const unitDiff = Math.max(0, endUnit - startUnit);
  const electricityBill = unitDiff * (Number(formData.unitRate) || 10);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      startUnit,
      endUnit,
      unitDiff,
      electricityBill,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {monthName}-এর হিসাব পরিবর্তন
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              ভাড়াটিয়া: {formData.tenantName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
          {/* Rent, Waste, Wifi Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                ঘর ভাড়া (৳)
              </label>
              <input
                type="number"
                value={formData.rent}
                onChange={(e) => handleChange("rent", e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                ময়লার বিল (৳)
              </label>
              <input
                type="number"
                value={formData.wasteBill}
                onChange={(e) => handleChange("wasteBill", e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                ওয়াইফাই বিল (৳)
              </label>
              <input
                type="number"
                disabled={!formData.hasWifi}
                value={formData.hasWifi ? formData.wifiBill || 100 : 0}
                onChange={(e) => handleChange("wifiBill", e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Meter Readings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                শুরুর মিটার রিডিং
              </label>
              <input
                type="number"
                value={formData.startUnit}
                onChange={(e) => handleChange("startUnit", e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-base font-bold bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                শেষের মিটার রিডিং
              </label>
              <input
                type="number"
                value={formData.endUnit}
                onChange={(e) => handleChange("endUnit", e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-base font-bold bg-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-500">
                ব্যবহৃত বিদ্যুৎ বিল
              </span>
              <span className="text-sm font-black text-amber-700 mt-1">
                {toBengaliNumber(unitDiff)} ইউনিট ={" "}
                {formatCurrency(electricityBill)}
              </span>
            </div>
          </div>

          {/* Paid Amount */}
          <div>
            <label className="block text-xs font-bold text-emerald-700 mb-1">
              জমা দিয়েছেন (টাকা)
            </label>
            <input
              type="number"
              placeholder="০"
              value={formData.paidAmount || ""}
              onChange={(e) => handleChange("paidAmount", e.target.value)}
              className="w-full p-2.5 border-2 border-emerald-400 bg-emerald-50/50 rounded-xl text-base font-bold text-emerald-800 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-98"
            >
              <Check className="h-4 w-4" />
              <span>হিসাব সংরক্ষণ করুন</span>
            </button>
          </div>

          {/* Danger Zone: Delete Month Option */}
          <div className="mt-8 pt-5 border-t-2 border-dashed border-rose-100">
            <div className="rounded-xl bg-rose-50/70 border border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black uppercase text-rose-800 tracking-wider">
                  বিপজ্জনক এলাকা
                </h4>
                <p className="text-xs text-rose-600 mt-0.5">
                  এই মাসের যাবতীয় তথ্য ও রিডিং রিসেট করে খালি করতে চান?
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(formData);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-xs shrink-0"
              >
                <Trash2 className="h-4 w-4" />
                <span>হিসাব মুছুন</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
