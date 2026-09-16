import React, { useState, useEffect } from "react";
import { X, Save, Trash2, AlertTriangle } from "lucide-react";
import { updateRoomDetails, deleteRoom } from "../../services/roomService";
import ConfirmModal from "../common/ConfirmModal";
import { toBengaliNumber } from "../../utils/formatters";

export default function EditRoomModal({
  isOpen,
  onClose,
  room,
  onDeleted,
  triggerToast,
}) {
  const [formData, setFormData] = useState({
    roomNo: "",
    rent: "",
    wasteBill: "",
    wifiBill: "100",
  });
  const [loading, setLoading] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (room) {
      setFormData({
        roomNo: room.roomNo || "",
        rent: room.rent || "",
        wasteBill: room.wasteBill || "60",
        wifiBill: room.wifiBill || "100",
      });
    }
  }, [room]);

  if (!isOpen || !room) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateRoomDetails(room.id, formData);
    setLoading(false);

    if (res.success) {
      triggerToast("রুমের তথ্য সফলভাবে আপডেট হয়েছে!");
      onClose();
    } else {
      triggerToast("আপডেট করা যায়নি: " + res.error, "error");
    }
  };

    const handleConfirmDelete = async () => {
        setIsConfirmDeleteOpen(false);
        setLoading(true);

        // Pass both room.id and room.roomNo to delete room + all associated bills
        const res = await deleteRoom(room.id, room.roomNo);
        setLoading(false);

        if (res.success) {
            triggerToast(
            `রুম #${toBengaliNumber(room.roomNo)} ও এর যাবতীয় বিল মুছে ফেলা হয়েছে!`,
            );
            onClose();
            if (onDeleted) onDeleted();
        } else {
            triggerToast("রুম মোছা সম্ভব হয়নি: " + res.error, "error");
        }
    };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xl font-black text-slate-800">
              রুম #{toBengaliNumber(room.roomNo)} এর তথ্য পরিবর্তন
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600">
                  রুম নম্বর *
                </label>
                <input
                  type="text"
                  required
                  value={formData.roomNo}
                  onChange={(e) =>
                    setFormData({ ...formData, roomNo: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-base font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600">
                  ডিফল্ট ঘর ভাড়া (টাকা) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.rent}
                  onChange={(e) =>
                    setFormData({ ...formData, rent: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-base font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600">
                  ময়লার বিল (টাকা)
                </label>
                <input
                  type="number"
                  value={formData.wasteBill}
                  onChange={(e) =>
                    setFormData({ ...formData, wasteBill: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-base font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600">
                  ওয়াইফাই বিল (টাকা)
                </label>
                <input
                  type="number"
                  value={formData.wifiBill}
                  onChange={(e) =>
                    setFormData({ ...formData, wifiBill: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-base font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <p className="text-xs text-slate-400">
              * এখান থেকে ভাড়া বা বিল পরিবর্তন করলে তা আগামী মাস থেকে নতুন বিল
              হিসেবে কার্যকর হবে।
            </p>

            {/* Save Buttons */}
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
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-98"
              >
                <Save className="h-4 w-4" />
                <span>
                  {loading ? "সংরক্ষণ হচ্ছে..." : "তথ্য সংরক্ষণ করুন"}
                </span>
              </button>
            </div>

            {/* Hidden Danger Zone for Deleting Room */}
            <div className="mt-8 pt-5 border-t-2 border-dashed border-rose-100">
              <div className="rounded-xl bg-rose-50/60 border border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-rose-800 tracking-wider">
                    বিপজ্জনক এলাকা
                  </h4>
                  <p className="text-xs text-rose-600 mt-0.5">
                    রুমটি মুছে ফেললে এর সমস্ত ডেটা সম্পূর্ণভাবে মুছে যাবে।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-xs shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>রুম ডিলিট করুন</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal for Room Deletion */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="রুমটি চিরতরে মুছে ফেলতে চান?"
        message={`আপনি কি নিশ্চিত রুম #${toBengaliNumber(room.roomNo)} মুছে ফেলতে চান? এটি মুছে ফেললে ফিরিয়ে আনা সম্ভব হবে না।`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </>
  );
}
