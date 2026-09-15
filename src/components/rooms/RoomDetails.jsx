import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Trash2,
  Edit3,
  Check,
  X,
  UserX,
  UserPlus,
  Calendar,
  Zap,
  ArrowRight,
} from "lucide-react";
import {
  getRoomBills,
  saveMonthlyBill,
  deleteMonthlyBill,
} from "../../services/billService";
import { releaseTenant, assignNewTenant } from "../../services/roomService";
import { toBengaliNumber, formatCurrency } from "../../utils/formatters";
import Toast from "../common/Toast";

export default function RoomDetails({ room, onBack }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMonthId, setEditingMonthId] = useState(null);
  const [searchTenant, setSearchTenant] = useState("");
  const [searchMonth, setSearchMonth] = useState("");
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    phone: "",
    hasWifi: false,
    joinedDate: "",
  });

  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });

  const triggerToast = (message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const getMonthNameBengali = (yearMonthStr) => {
    const [year, month] = yearMonthStr.split("-");
    const months = [
      "জানুয়ারি",
      "ফেব্রুয়ারি",
      "মার্চ",
      "এপ্রিল",
      "মে",
      "জুন",
      "জুলাই",
      "আগস্ট",
      "সেপ্টেম্বর",
      "অক্টোবর",
      "নভেম্বর",
      "ডিসেম্বর",
    ];
    return `${months[parseInt(month, 10) - 1]} ${toBengaliNumber(year)}`;
  };

  const recalculateChain = (rawList) => {
    let accumulatedDue = Number(room.dueBalance) || 0;

    return rawList.map((bill, index) => {
      const isSameTenant =
        index === 0 || rawList[index - 1].tenantName === bill.tenantName;
      const carriedDue = isSameTenant ? accumulatedDue : 0;

      const unitDiff = Math.max(
        0,
        (Number(bill.endUnit) || 0) - (Number(bill.startUnit) || 0),
      );
      const electricityBill = unitDiff * (Number(bill.unitRate) || 10);
      const subtotal =
        (Number(bill.rent) || 0) +
        (Number(bill.wasteBill) || 0) +
        (bill.hasWifi ? Number(bill.wifiBill) || 100 : 0) +
        electricityBill;

      const totalPayable = subtotal + carriedDue;
      const currentDue = Math.max(
        0,
        totalPayable - (Number(bill.paidAmount) || 0),
      );

      accumulatedDue = currentDue;

      return {
        ...bill,
        previousDue: carriedDue,
        unitDiff,
        electricityBill,
        subtotal,
        totalPayable,
        due: currentDue,
      };
    });
  };

const buildMonthSequence = (fetchedBills) => {
  const joinDateStr =
    room.currentTenant?.joinedDate || `${currentYearMonth}-01`;
  const [startYear, startMonth] = joinDateStr.split("-").map(Number);

  let curY = startYear;
  let curM = startMonth;
  const endY = now.getFullYear();
  const endM = now.getMonth() + 1;

  const list = [];
  let prevCarryReading = room.currentMeterReading || 0;

  while (curY < endY || (curY === endY && curM <= endM)) {
    const ym = `${curY}-${String(curM).padStart(2, "0")}`;
    const existing = fetchedBills.find((b) => b.yearMonth === ym);

    if (existing) {
      list.push({
        ...existing,
        id: existing.id || `${room.roomNo}_${ym}`,
        isBillFinalized: existing.isBillFinalized ?? true,
      });
      prevCarryReading =
        existing.endUnit || existing.startUnit || prevCarryReading;
    } else {
      const isCurrent = ym === currentYearMonth;
      list.push({
        id: `${room.roomNo}_${ym}`,
        roomNo: String(room.roomNo),
        yearMonth: ym,
        isVacant: !room.isOccupied,
        tenantName: room.currentTenant?.name || "",
        tenantPhone: room.currentTenant?.phone || "",
        rent: Number(room.rent) || 0,
        wasteBill: Number(room.wasteBill) || 60,
        hasWifi: Boolean(room.currentTenant?.hasWifi),
        wifiBill: room.currentTenant?.hasWifi ? 100 : 0,
        startUnit: prevCarryReading,
        endUnit: prevCarryReading,
        unitRate: 10,
        paidAmount: 0,
        isCurrentMonth: isCurrent,
        isBillFinalized: false, // Default false until user explicitly saves
      });
    }

    curM++;
    if (curM > 12) {
      curM = 1;
      curY++;
    }
  }

  return recalculateChain(list);
};

  const loadBills = async () => {
    setLoading(true);
    const data = await getRoomBills(room.roomNo);
    const populated = buildMonthSequence(data);
    setBills(populated);
    setLoading(false);
  };

  useEffect(() => {
    loadBills();
  }, [room]);

  const handleFieldChange = (index, field, value) => {
    const updated = [...bills];
    const target = { ...updated[index], [field]: value };

    if (field === "endUnit") {
      const parsedEnd = Number(value) || 0;
      target.endUnit = parsedEnd;
      if (index + 1 < updated.length) {
        updated[index + 1] = {
          ...updated[index + 1],
          startUnit: parsedEnd,
        };
      }
    }

    if (field === "startUnit") {
      target.startUnit = Number(value) || 0;
    }

    updated[index] = target;
    setBills(recalculateChain(updated));
  };

const handleSaveMonth = async (monthBill) => {
  const unitDiff = Math.max(
    0,
    (Number(monthBill.endUnit) || 0) - (Number(monthBill.startUnit) || 0),
  );
  const electricityBill = unitDiff * (Number(monthBill.unitRate) || 10);
  const subtotal =
    (Number(monthBill.rent) || 0) +
    (Number(monthBill.wasteBill) || 0) +
    (monthBill.hasWifi ? Number(monthBill.wifiBill) || 100 : 0) +
    electricityBill;

  const totalPayable = subtotal + (Number(monthBill.previousDue) || 0);
  const due = Math.max(0, totalPayable - (Number(monthBill.paidAmount) || 0));

  const finalPayload = {
    ...monthBill,
    unitDiff,
    electricityBill,
    subtotal,
    totalPayable,
    due,
    isBillFinalized: true, // Marked finalized
  };

  const res = await saveMonthlyBill(monthBill.id, finalPayload, room.id);

  if (res.success) {
    const updatedList = bills.map((b) =>
      b.yearMonth === monthBill.yearMonth ? { ...b, ...finalPayload } : b,
    );
    setBills(recalculateChain(updatedList));
    setEditingMonthId(null);
    triggerToast(
      `${getMonthNameBengali(monthBill.yearMonth)}-এর হিসাব সংরক্ষিত হয়েছে!`,
    );
  } else {
    triggerToast("সংরক্ষণ করা যায়নি: " + res.error, "error");
  }
};

const handleReleaseTenant = async () => {
  if (window.confirm("ভাড়াটিয়া কি সত্যি রুম ছেড়ে দিচ্ছেন?")) {
    const res = await releaseTenant(room.id);
    if (res.success) {
      triggerToast("ভাড়াটিয়া রিলিজ সম্পন্ন হয়েছে!");
      onBack();
    } else {
      triggerToast("রিলিজ করা যায়নি: " + res.error, "error");
    }
  }
};

const handleAssignTenant = async (e) => {
  e.preventDefault();
  const res = await assignNewTenant(room.id, newTenant);
  if (res.success) {
    setShowAddTenantModal(false);
    setNewTenant({ name: "", phone: "", hasWifi: false, joinedDate: "" }); // Reset form state
    triggerToast("নতুন ভাড়াটিয়া যোগ করা হয়েছে!");
    onBack();
  } else {
    triggerToast("ভাড়াটিয়া যোগ করা যায়নি: " + res.error, "error");
  }
};

const filteredBills = bills.filter((b) => {
  const matchName = (b.tenantName || "")
    .toLowerCase()
    .includes(searchTenant.toLowerCase());
  const matchMonth = (b.yearMonth || "").includes(searchMonth);
  return matchName && matchMonth;
});

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            রুম #{toBengaliNumber(room.roomNo)}
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-0.5">
            {room.isOccupied
              ? `বর্তমান ভাড়াটিয়া: ${room.currentTenant?.name}`
              : "রুমটি বর্তমানে খালি"}
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-98 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>পিছনে ফিরে যান</span>
        </button>
      </div>

      {/* Search Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ভাড়াটিয়ার নাম দিয়ে ফিল্টার..."
            value={searchTenant}
            onChange={(e) => setSearchTenant(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="মাস ও বছর (যেমন: 2026-08)..."
            value={searchMonth}
            onChange={(e) => setSearchMonth(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Month Cards Timeline */}
      {loading ? (
        <div className="text-center py-20 font-bold text-slate-400">
          হিসাব লোড হচ্ছে...
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBills.map((monthBill, idx) => {
            const isCurrent = monthBill.yearMonth === currentYearMonth;
            const isEditing = editingMonthId === monthBill.id;

            return (
              <div
                key={monthBill.id}
                className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                  isCurrent
                    ? "border-blue-500 shadow-md ring-4 ring-blue-50"
                    : isEditing
                      ? "border-amber-400 shadow-lg"
                      : "border-slate-200 shadow-xs"
                }`}
              >
                {/* Month Header Bar */}
                <div className="flex items-center justify-between bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-slate-900">
                      {getMonthNameBengali(monthBill.yearMonth)}
                    </span>
                    {isCurrent && (
                      <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                        চলতি মাস
                      </span>
                    )}
                    {monthBill.isVacant && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        খালি ছিল
                      </span>
                    )}
                  </div>

                  {!isCurrent && !monthBill.isVacant && (
                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <button
                          onClick={() => setEditingMonthId(null)}
                          className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>বাতিল</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingMonthId(monthBill.id)}
                          className="flex items-center gap-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                          <span>হিসাব পরিবর্তন</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteMonth(monthBill.id)}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-all ml-1"
                        title="ডিলিট করুন"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-5 sm:p-6">
                  {monthBill.isVacant ? (
                    <div className="py-6 text-center text-slate-400 font-medium">
                      এই মাসে কোনো ভাড়াটিয়া ছিল না
                    </div>
                  ) : isCurrent ? (
                    /* Current Month Active Banner */
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
                      <div>
                        <div className="text-base font-semibold text-slate-600">
                          বর্তমান ভাড়াটিয়া:{" "}
                          <span className="text-blue-600 font-black text-xl underline ml-1">
                            {monthBill.tenantName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          মাস শেষ হলে চলতি মাসের মিটার রিডিং ও চূড়ান্ত বিল যোগ
                          করা যাবে।
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {room.isOccupied ? (
                          <button
                            onClick={handleReleaseTenant}
                            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
                          >
                            <UserX className="h-4 w-4" />
                            <span>ভাড়াটিয়া রিলিজ করুন</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowAddTenantModal(true)}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
                          >
                            <UserPlus className="h-4 w-4" />
                            <span>নতুন ভাড়াটিয়া ওঠান</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : isEditing ? (
                    /* ============ EDIT FORM VIEW ============ */
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            ঘর ভাড়া (৳)
                          </label>
                          <input
                            type="number"
                            value={monthBill.rent}
                            onChange={(e) =>
                              handleFieldChange(idx, "rent", e.target.value)
                            }
                            className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            ময়লার বিল (৳)
                          </label>
                          <input
                            type="number"
                            value={monthBill.wasteBill}
                            onChange={(e) =>
                              handleFieldChange(
                                idx,
                                "wasteBill",
                                e.target.value,
                              )
                            }
                            className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            ওয়াইফাই বিল (৳)
                          </label>
                          <input
                            type="number"
                            disabled={!monthBill.hasWifi}
                            value={
                              monthBill.hasWifi ? monthBill.wifiBill || 100 : 0
                            }
                            onChange={(e) =>
                              handleFieldChange(idx, "wifiBill", e.target.value)
                            }
                            className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Meter Units Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            শুরুর মিটার রিডিং
                          </label>
                          <input
                            type="number"
                            value={monthBill.startUnit}
                            onChange={(e) =>
                              handleFieldChange(
                                idx,
                                "startUnit",
                                e.target.value,
                              )
                            }
                            className="w-full p-2 border border-slate-300 rounded-lg text-base font-bold bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            শেষের মিটার রিডিং
                          </label>
                          <input
                            type="number"
                            value={monthBill.endUnit}
                            onChange={(e) =>
                              handleFieldChange(idx, "endUnit", e.target.value)
                            }
                            className="w-full p-2 border border-slate-300 rounded-lg text-base font-bold bg-white focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-xs font-bold text-slate-500">
                            ব্যবহৃত বিদ্যুৎ বিল
                          </span>
                          <span className="text-sm font-black text-amber-700 mt-1">
                            {toBengaliNumber(monthBill.unitDiff)} ইউনিট × ১০ ={" "}
                            {formatCurrency(monthBill.electricityBill)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-emerald-700 mb-1">
                          জমা দিয়েছেন (৳)
                        </label>
                        <input
                          type="number"
                          placeholder="০"
                          value={monthBill.paidAmount || ""}
                          onChange={(e) =>
                            handleFieldChange(idx, "paidAmount", e.target.value)
                          }
                          className="w-full sm:w-1/2 p-2.5 border-2 border-emerald-400 bg-emerald-50/50 rounded-xl text-base font-bold text-emerald-800 focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleSaveMonth(monthBill)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-98"
                        >
                          <Check className="h-4 w-4" />
                          <span>সংরক্ষণ করুন</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ============ NEW CLEAN CALCULATION VIEW ============ */
                    <div className="space-y-5">
                      {/* Top Row: Larger Tenant Name & Meter Details */}
                      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-3">
                        <div>
                          <span className="text-xs text-slate-400 block font-bold">
                            ভাড়াটিয়ার নাম
                          </span>
                          <span className="text-blue-600 underline font-black text-xl tracking-tight cursor-pointer">
                            {monthBill.tenantName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-amber-50/80 border border-amber-200/80 px-3.5 py-1.5 rounded-xl">
                          <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>
                            মিটার: {toBengaliNumber(monthBill.startUnit)} হতে{" "}
                            {toBengaliNumber(monthBill.endUnit)} (
                            {toBengaliNumber(monthBill.unitDiff)} ইউনিট ={" "}
                            {formatCurrency(monthBill.electricityBill)})
                          </span>
                        </div>
                      </div>

                      {/* 4 Separate Component Chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-xs text-slate-500 font-bold block">
                            ঘর ভাড়া
                          </span>
                          <span className="text-base font-black text-slate-800 mt-0.5 block">
                            {formatCurrency(monthBill.rent)}
                          </span>
                        </div>
                        <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-xs text-slate-500 font-bold block">
                            ময়লার বিল
                          </span>
                          <span className="text-base font-black text-slate-800 mt-0.5 block">
                            {formatCurrency(monthBill.wasteBill)}
                          </span>
                        </div>
                        <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-xs text-slate-500 font-bold block">
                            ওয়াইফাই বিল
                          </span>
                          <span className="text-base font-black text-slate-800 mt-0.5 block">
                            {monthBill.hasWifi
                              ? formatCurrency(monthBill.wifiBill || 100)
                              : "০"}
                          </span>
                        </div>
                        <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-xs text-slate-500 font-bold block">
                            বিদ্যুৎ বিল
                          </span>
                          <span className="text-base font-black text-slate-800 mt-0.5 block">
                            {formatCurrency(monthBill.electricityBill)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3 font-medium text-sm sm:text-base">
                        <div className="flex justify-between items-center text-slate-600">
                          <span>চলতি মাসের মোট বিল</span>
                          <span className="font-bold text-slate-900 text-base sm:text-lg tracking-wide">
                            {formatCurrency(monthBill.subtotal)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-rose-600">
                          <span>পূর্বের মাসের বকেয়া</span>
                          <span className="font-bold text-rose-600 text-base sm:text-lg tracking-wide">
                            {formatCurrency(monthBill.previousDue)}
                          </span>
                        </div>

                        <div className="border-t border-slate-200 my-2 pt-2 space-y-3">
                          <div className="flex justify-between items-center text-slate-800">
                            <span className="font-bold">মোট পাওনা</span>
                            <span className="font-black text-slate-950 text-lg sm:text-xl tracking-wide">
                              {formatCurrency(monthBill.totalPayable)}
                            </span>
                          </div>

                          {/* 4. Joma Diyechen */}
                          <div className="flex justify-between items-center text-emerald-700">
                            <span>জমা দিয়েছেন</span>
                            <span className="font-bold text-emerald-700 text-base sm:text-lg tracking-wide">
                              {formatCurrency(monthBill.paidAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Final Divider */}
                        <div className="border-t border-slate-200 my-2 pt-3 flex justify-between items-center">
                          <span className="font-black text-base sm:text-lg text-slate-900">
                            বাকি আছে
                          </span>
                          {monthBill.due > 0 ? (
                            <span className="font-black text-lg sm:text-2xl text-rose-600 tracking-wider">
                              {formatCurrency(monthBill.due)}
                            </span>
                          ) : (
                            <span className="font-black text-base sm:text-lg text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl">
                              নেই (পরিশোধিত)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Tenant Modal */}
      {showAddTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
              নতুন ভাড়াটিয়া যোগ করুন
            </h3>
            <form onSubmit={handleAssignTenant} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600">
                  ভাড়াটিয়ার নাম *
                </label>
                <input
                  type="text"
                  required
                  value={newTenant.name}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, name: e.target.value })
                  }
                  className="mt-1 w-full border rounded-xl p-2.5 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  value={newTenant.phone}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, phone: e.target.value })
                  }
                  className="mt-1 w-full border rounded-xl p-2.5 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600">
                  ওঠার তারিখ
                </label>
                <input
                  type="date"
                  value={newTenant.joinedDate}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, joinedDate: e.target.value })
                  }
                  className="mt-1 w-full border rounded-xl p-2.5 text-sm focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newTenant.hasWifi}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, hasWifi: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm font-semibold text-slate-700">
                  ওয়াইফাই ব্যবহার করবেন
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddTenantModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-bold text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
