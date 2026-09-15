import React, { useState } from "react";
import { X, PlusCircle } from "lucide-react";
import { addRoom } from "../../services/roomService";

export default function AddRoomModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    roomNo: "",
    rent: "",
    initialMeterReading: "",
    wasteBill: "60",
    isOccupied: false,
    tenantName: "",
    tenantPhone: "",
    hasWifi: false,
    joinedDate: new Date().toISOString().split("T")[0],
    initialDue: "0", // Outstanding dues if existing tenant
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roomNo || !formData.rent) {
      alert("দয়া করে রুম নম্বর ও মাসিক ভাড়া লিখুন!");
      return;
    }

    setLoading(true);
    const result = await addRoom(formData);
    setLoading(false);

    if (result.success) {
      onClose();
      setFormData({
        roomNo: "",
        rent: "",
        initialMeterReading: "",
        wasteBill: "60",
        isOccupied: false,
        tenantName: "",
        tenantPhone: "",
        hasWifi: false,
        joinedDate: new Date().toISOString().split("T")[0],
        initialDue: "0",
      });
    } else {
      alert("রুম যোগ করতে সমস্যা হয়েছে: " + result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-xl font-bold text-gray-800">
            নতুন রুম যুক্ত করুন
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                রুম নম্বর *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: ০১"
                value={formData.roomNo}
                onChange={(e) =>
                  setFormData({ ...formData, roomNo: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-base focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                মাসিক ভাড়া (টাকা) *
              </label>
              <input
                type="number"
                required
                placeholder="যেমন: ২২০০"
                value={formData.rent}
                onChange={(e) =>
                  setFormData({ ...formData, rent: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-base focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                শুরুর বিদ্যুৎ মিটার রিডিং
              </label>
              <input
                type="number"
                placeholder="যেমন: ১১০"
                value={formData.initialMeterReading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    initialMeterReading: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-base focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                ময়লার বিল (টাকা)
              </label>
              <input
                type="number"
                value={formData.wasteBill}
                onChange={(e) =>
                  setFormData({ ...formData, wasteBill: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-base focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Occupancy Toggle */}
          <div className="rounded-lg bg-gray-50 p-3 border">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isOccupied}
                onChange={(e) =>
                  setFormData({ ...formData, isOccupied: e.target.checked })
                }
                className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-base font-semibold text-gray-800">
                রুমে কি বর্তমানে ভাড়াটিয়া আছে?
              </span>
            </label>
          </div>

          {/* Tenant details if room is occupied */}
          {formData.isOccupied && (
            <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  ভাড়াটিয়ার নাম *
                </label>
                <input
                  type="text"
                  required={formData.isOccupied}
                  placeholder="যেমন: মোঃ রহিম"
                  value={formData.tenantName}
                  onChange={(e) =>
                    setFormData({ ...formData, tenantName: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-base focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    placeholder="০১৭১১..."
                    value={formData.tenantPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, tenantPhone: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-base focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    ওঠার তারিখ
                  </label>
                  <input
                    type="date"
                    value={formData.joinedDate}
                    onChange={(e) =>
                      setFormData({ ...formData, joinedDate: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-base focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  পূর্বের বকেয়া (টাকা)
                </label>
                <input
                  type="number"
                  placeholder="০"
                  value={formData.initialDue}
                  onChange={(e) =>
                    setFormData({ ...formData, initialDue: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-base focus:border-blue-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasWifi}
                  onChange={(e) =>
                    setFormData({ ...formData, hasWifi: e.target.checked })
                  }
                  className="h-4 w-4 rounded text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  ওয়াইফাই ব্যবহার করেন (১০০ টাকা)
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {loading ? "সংরক্ষণ হচ্ছে..." : "রুম যোগ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
