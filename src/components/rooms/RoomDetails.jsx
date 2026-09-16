import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Search,
  Trash2,
  Settings,
  UserX,
  UserPlus,
  Calendar,
  Zap,
  CheckCircle2,
} from "lucide-react";
import {
  releaseTenant,
  assignNewTenant,
  updateClaimPayment,
  deleteDepartureClaimDoc,
} from "../../services/roomService";
import { toBengaliNumber, formatCurrency } from "../../utils/formatters";
import { calculateProratedRent } from "../../utils/rentCalculators";
import EditMonthModal from "../forms/EditMonthModal";
import {
  getRoomBills,
  saveMonthlyBill,
  clearMonthlyBill,
} from "../../services/billService";
import Toast from "../common/Toast";
import ConfirmModal from "../common/ConfirmModal";
import ReleaseTenantModal from "../forms/ReleaseTenantModal";

export default function RoomDetails({ room, onBack }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMonth, setEditingMonth] = useState(null);
  const [searchTenant, setSearchTenant] = useState("");
  const [searchMonth, setSearchMonth] = useState("");
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    phone: "",
    hasWifi: false,
    joinedDate: "",
  });

  const getMinJoinDate = () => {
    if (room.lastBilledMonth) {
      const [y, m] = room.lastBilledMonth.split("-").map(Number);
      const nextDate = new Date(y, m, 1);
      return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-01`;
    }
    return undefined;
  };

  const getMaxJoinDate = () => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
  };

  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: true,
  });

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });

  const triggerToast = (message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  const previousMonthRef = useRef(null);

  const getPreviousMonthKey = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  const previousMonthKey = getPreviousMonthKey();

  useEffect(() => {
    if (!loading && previousMonthRef.current) {
      setTimeout(() => {
        previousMonthRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 200);
    }
  }, [loading]);

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const getMonthNameBengali = (yearMonthStr) => {
    if (!yearMonthStr) return "";
    const [year, month] = yearMonthStr.split("-");
    const months = [
      "জানুয়ারি",
      "ফেব্রুয়ারি",
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
    let carriedDue = 0;
    let previousMonthEndUnit = null;

    return rawList.map((bill, index) => {
      if (bill.isDepartureClaim) return bill;

      const isSameTenant =
        index === 0 || rawList[index - 1].tenantName === bill.tenantName;
      const previousDue = isSameTenant ? carriedDue : 0;

      let effectiveStartUnit = Number(bill.startUnit) || 0;
      if (index > 0 && previousMonthEndUnit !== null) {
        effectiveStartUnit = previousMonthEndUnit;
      }

      let effectiveEndUnit = Number(bill.endUnit) || 0;
      if (effectiveEndUnit < effectiveStartUnit) {
        effectiveEndUnit = effectiveStartUnit;
      }

      const unitDiff = Math.max(0, effectiveEndUnit - effectiveStartUnit);
      const electricityBill = unitDiff * (Number(bill.unitRate) || 10);

      const tenantJoinDate =
        bill.joinedDate ||
        (bill.isCurrentMonth
          ? room.currentTenant?.joinedDate || room.tenantJoinedDate
          : null);

      const proratedInfo = calculateProratedRent(
        bill.baseRent || room.rent,
        tenantJoinDate,
        bill.yearMonth,
      );

      const effectiveRent = proratedInfo.isProrated
        ? proratedInfo.rent
        : Number(bill.rent) || Number(room.rent) || 0;

      const subtotal =
        effectiveRent +
        (Number(bill.wasteBill) || 0) +
        (bill.hasWifi ? Number(bill.wifiBill) || 100 : 0) +
        electricityBill;

      const totalPayable = subtotal + previousDue;
      const currentDue = Math.max(
        0,
        totalPayable - (Number(bill.paidAmount) || 0),
      );

      carriedDue = bill.isVacant || bill.isCleared ? 0 : currentDue;
      previousMonthEndUnit = effectiveEndUnit;

      return {
        ...bill,
        rent: effectiveRent,
        baseRent: bill.baseRent || room.rent,
        proratedInfo,
        startUnit: effectiveStartUnit,
        endUnit: effectiveEndUnit,
        previousDue,
        unitDiff,
        electricityBill,
        subtotal,
        totalPayable,
        due: currentDue,
      };
    });
  };

  const buildMonthSequence = (fetchedBills) => {
    const rawJoinDate =
      room.currentTenant?.joinedDate ||
      room.tenantJoinedDate ||
      room.joinedDate;

    const departureClaims = fetchedBills.filter((b) => b.isDepartureClaim);
    const standardBills = fetchedBills.filter((b) => !b.isDepartureClaim);

    const candidateDates = [];

    if (standardBills.length > 0) {
      standardBills.forEach((b) => {
        if (b.yearMonth) candidateDates.push(b.yearMonth);
      });
    }

    if (rawJoinDate && typeof rawJoinDate === "string") {
      candidateDates.push(rawJoinDate.slice(0, 7));
    }

    if (room.createdAt) {
      if (typeof room.createdAt === "string") {
        candidateDates.push(room.createdAt.slice(0, 7));
      } else if (typeof room.createdAt.toDate === "function") {
        const d = room.createdAt.toDate();
        candidateDates.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        );
      }
    }

    candidateDates.push(currentYearMonth);
    candidateDates.sort();
    const earliestYM = candidateDates[0];

    const [startYear, startMonth] = earliestYM.split("-").map(Number);

    let curY = startYear;
    let curM = startMonth;
    const endY = now.getFullYear();
    const endM = now.getMonth() + 1;

    const list = [];
    let prevCarryReading =
      Number(room.initialMeterReading) || Number(room.currentMeterReading) || 0;

    while (curY < endY || (curY === endY && curM <= endM)) {
      const ym = `${curY}-${String(curM).padStart(2, "0")}`;
      const existing = standardBills.find((b) => b.yearMonth === ym);

      if (existing) {
        list.push({
          ...existing,
          id: existing.id || `${room.roomNo}_${ym}`,
          isCleared: Boolean(existing.isCleared),
          isBillFinalized: existing.isCleared
            ? false
            : (existing.isBillFinalized ?? true),
        });
        prevCarryReading =
          Number(existing.endUnit) ||
          Number(existing.startUnit) ||
          prevCarryReading;
      } else {
        const isCurrent = ym === currentYearMonth;
        const isBeforeNewTenant = rawJoinDate && ym < rawJoinDate.slice(0, 7);
        const isVacantMonth = !room.isOccupied || isBeforeNewTenant;

        list.push({
          id: `${room.roomNo}_${ym}`,
          roomNo: String(room.roomNo),
          yearMonth: ym,
          isVacant: isVacantMonth,
          isCleared: false,
          tenantName: isVacantMonth
            ? ""
            : room.currentTenant?.name || room.tenantName || "",
          tenantPhone: isVacantMonth
            ? ""
            : room.currentTenant?.phone || room.tenantPhone || "",
          joinedDate: isVacantMonth ? null : rawJoinDate,
          rent: Number(room.rent) || 0,
          wasteBill: Number(room.wasteBill) || 60,
          hasWifi:
            !isVacantMonth &&
            Boolean(room.currentTenant?.hasWifi ?? room.hasWifi),
          wifiBill:
            !isVacantMonth && (room.currentTenant?.hasWifi ?? room.hasWifi)
              ? Number(room.wifiBill) || 100
              : 0,
          startUnit: prevCarryReading,
          endUnit: prevCarryReading,
          unitRate: 10,
          paidAmount: 0,
          isCurrentMonth: isCurrent,
          isBillFinalized: !isVacantMonth,
        });
      }

      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }

    const regularChain = recalculateChain(list);
    return [...departureClaims, ...regularChain];
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
      isBillFinalized: true,
      isCleared: false,
    };

    const res = await saveMonthlyBill(monthBill.id, finalPayload, room.id);

    if (res.success) {
      await loadBills();
      triggerToast(
        `${getMonthNameBengali(monthBill.yearMonth)}-এর হিসাব সংরক্ষিত হয়েছে!`,
      );
    } else {
      triggerToast("সংরক্ষণ করা যায়নি: " + res.error, "error");
    }
  };

  const handleDeleteMonth = (monthBill) => {
    const monthName = getMonthNameBengali(monthBill.yearMonth);

    setConfirmDialog({
      isOpen: true,
      title: "হিসাব মুছে ফেলতে চান?",
      message: `${monthName}-এর হিসাব মুছে ফেললে এই মাসের যাবতীয় পাওনা ও রিডিং ০ হয়ে যাবে।`,
      confirmText: "হ্যাঁ, মুছে ফেলুন",
      isDanger: true,
      onConfirm: async () => {
        closeConfirmDialog();

        const res = await clearMonthlyBill(
          monthBill.id,
          monthBill.roomNo,
          monthBill.yearMonth,
          room.id,
        );

        if (res.success) {
          room.dueBalance = res.updatedDue;
          room.lastBilledMonth = res.updatedLastBilledMonth;
          room.isLastBillFinalized = res.updatedIsFinalized;

          await loadBills();
          triggerToast(`${monthName}-এর হিসাব মুছে ফেলা হয়েছে!`);
        } else {
          triggerToast("মুছে ফেলা যায়নি: " + res.error, "error");
        }
      },
    });
  };

  const handleConfirmRelease = async ({ isWaived, amount }) => {
    const res = await releaseTenant(room.id, room.roomNo, {
      isWaived,
      amount,
      tenantName: room.currentTenant?.name || room.tenantName,
      yearMonth: currentYearMonth,
    });

    if (res.success) {
      setShowReleaseModal(false);
      triggerToast("ভাড়াটিয়া রিলিজ হয়েছে এবং হিসাব স্থায়ীভাবে সংরক্ষিত হয়েছে!");
      room.isOccupied = false;
      room.currentTenant = null;
      await loadBills();
    } else {
      triggerToast("সমস্যা হয়েছে: " + res.error, "error");
    }
  };

  const handlePayClaim = async (claim) => {
    const amountStr = prompt(
      `${claim.tenantName}-এর থেকে জমা প্রাপ্ত টাকা লিখুন (মোট দাবি: ${claim.claimAmount} টাকা):`,
      claim.claimAmount,
    );
    if (amountStr === null) return;
    const paid = Number(amountStr) || 0;

    const res = await updateClaimPayment(claim.id, paid, claim.claimAmount);
    if (res.success) {
      triggerToast("পেমেন্ট আপডেট হয়েছে!");
      await loadBills();
    } else {
      triggerToast("পেমেন্ট আপডেট করা যায়নি!", "error");
    }
  };

  const handleDeleteClaim = async (claimId) => {
    if (
      !window.confirm(
        "আপনি কি নিশ্চিতভাবে এই জরিমানার রেকর্ডটি মুছে ফেলতে চান?",
      )
    )
      return;
    const res = await deleteDepartureClaimDoc(claimId);
    if (res.success) {
      triggerToast("জরিমানার রেকর্ড মুছে ফেলা হয়েছে!");
      await loadBills();
    } else {
      triggerToast("রেকর্ডটি মোছা যায়নি!", "error");
    }
  };

  const handleAssignTenant = async (e) => {
    e.preventDefault();

    const minDate = getMinJoinDate();
    const maxDate = getMaxJoinDate();

    if (minDate && newTenant.joinedDate < minDate) {
      triggerToast(
        "ভুল তারিখ! আগের ভাড়াটিয়া থাকা অবস্থায় নতুন ভাড়াটিয়া যোগ করা যাবে না।",
        "error",
      );
      return;
    }

    if (newTenant.joinedDate > maxDate) {
      triggerToast(
        "ভবিষ্যতের মাস নির্বাচন করা যাবে না! শুধুমাত্র চলতি মাস পর্যন্ত প্রযোজ্য।",
        "error",
      );
      return;
    }

    const res = await assignNewTenant(room.id, newTenant);
    if (res.success) {
      setShowAddTenantModal(false);
      triggerToast("নতুন ভাড়াটিয়া সফলভাবে যোগ করা হয়েছে!");
      room.isOccupied = true;
      room.currentTenant = { ...newTenant };
      setNewTenant({ name: "", phone: "", hasWifi: false, joinedDate: "" });
      await loadBills();
    } else {
      triggerToast("ভাড়াটিয়া যোগ করা যায়নি: " + res.error, "error");
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

      {/* Top Navigation Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            রুম #{toBengaliNumber(room.roomNo)}
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-0.5">
            {room.isOccupied
              ? `বর্তমান ভাড়াটিয়া: ${room.currentTenant?.name}`
              : "রুমটি বর্তমানে খালি আছে"}
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-98 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>ড্যাশবোর্ড</span>
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
          {filteredBills.map((monthBill) => {
            if (monthBill.isDepartureClaim) {
              return (
                <div
                  key={monthBill.id}
                  className="bg-white rounded-2xl border-2 border-rose-200 shadow-xs overflow-hidden"
                >
                  <div className="flex items-center justify-between bg-rose-50/80 px-5 py-3.5 border-b border-rose-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl font-black text-rose-950">
                        {monthBill.tenantName} — অপরিশোধিত দাবি
                      </span>
                      <span className="bg-rose-200 text-rose-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                        {getMonthNameBengali(monthBill.yearMonth)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteClaim(monthBill.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-all"
                      title="রেকর্ডটি মুছুন"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        ভাড়াটিয়া না জানিয়ে চলে যাওয়ায় ক্ষতিপূরণ/ভাড়া বাবদ ধার্য
                        করা হয়েছিল।
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-base font-bold text-slate-900">
                          দাবিকৃত টাকা:{" "}
                          <span className="text-rose-600 font-black text-lg">
                            {formatCurrency(monthBill.claimAmount)}
                          </span>
                        </span>
                        <span className="text-sm font-bold text-emerald-700">
                          জমা: {formatCurrency(monthBill.paidAmount || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {monthBill.isPaid || monthBill.due === 0 ? (
                        <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-black px-4 py-2 rounded-xl text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>পরিশোধিত</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-rose-700 bg-rose-100 px-3 py-1.5 rounded-xl">
                            বাকি: {formatCurrency(monthBill.due)}
                          </span>
                          <button
                            onClick={() => handlePayClaim(monthBill)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-98"
                          >
                            টাকা জমা নিন
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            const isCurrent = monthBill.yearMonth === currentYearMonth;
            const isPreviousMonth = monthBill.yearMonth === previousMonthKey;

            return (
              <div
                key={monthBill.id}
                ref={isPreviousMonth ? previousMonthRef : null}
                className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                  isCurrent
                    ? "border-blue-500 shadow-md ring-4 ring-blue-50"
                    : isPreviousMonth
                      ? "border-slate-300 ring-2 ring-slate-100 shadow-sm"
                      : "border-slate-200 shadow-xs"
                }`}
              >
                {/* Month Header Bar */}
                <div className="flex items-center justify-between bg-slate-50 px-5 py-3.5 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-slate-900">
                      {getMonthNameBengali(monthBill.yearMonth)}
                    </span>
                    {isCurrent ? (
                      <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                        চলতি মাস
                      </span>
                    ) : monthBill.isVacant && !monthBill.isCleared ? (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        খালি ছিল
                      </span>
                    ) : null}
                  </div>

                  {!isCurrent &&
                    !monthBill.isVacant &&
                    !monthBill.isCleared && (
                      <button
                        onClick={() => setEditingMonth(monthBill)}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-2xs transition-all"
                        title="হিসাব পরিবর্তন বা ডিলিট করুন"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                    )}
                </div>

                <div className="p-5 sm:p-6">
                  {isCurrent ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3">
                      <div>
                        {room.isOccupied ? (
                          <>
                            <div className="text-base font-semibold text-slate-600">
                              বর্তমান ভাড়াটিয়া:{" "}
                              <span className="text-blue-600 font-black text-xl underline ml-1">
                                {monthBill.tenantName}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              মাস শেষ হলে চলতি মাসের মিটার রিডিং ও চূড়ান্ত বিল
                              যোগ করা যাবে।
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-lg font-black text-slate-900">
                              রুমটি বর্তমানে খালি আছে
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                              নতুন ভাড়াটিয়া উঠলে নিচের বাটনে ক্লিক করে তথ্য যোগ
                              করুন।
                            </p>
                          </>
                        )}
                      </div>

                      <div className="shrink-0">
                        {room.isOccupied ? (
                          <button
                            type="button"
                            onClick={() => setShowReleaseModal(true)}
                            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2.5 rounded-xl text-sm transition-all active:scale-98 shadow-2xs"
                          >
                            <UserX className="h-4 w-4" />
                            <span>ভাড়াটিয়া রিলিজ করুন</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowAddTenantModal(true)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-3 rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-98"
                          >
                            <UserPlus className="h-5 w-5" />
                            <span>নতুন ভাড়াটিয়া ওঠান</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : monthBill.isVacant && !monthBill.isCleared ? (
                    <div className="py-6 text-center text-slate-400 font-medium">
                      এই মাসে কোনো ভাড়াটিয়া ছিল না
                    </div>
                  ) : monthBill.isCleared ? (
                    <div className="py-6 text-center text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      {monthBill.tenantName || "ভাড়াটিয়া"}-এর এই মাসের হিসাব
                      মুছে ফেলা হয়েছে
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-3">
                        <div>
                          <span className="text-xs text-slate-400 block font-bold">
                            ভাড়াটিয়ার নাম
                          </span>
                          <span className="text-blue-600 underline font-black text-xl tracking-tight">
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

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                          <div>
                            <span className="text-xs text-slate-500 font-bold block">
                              ঘর ভাড়া
                            </span>
                            <span className="text-base font-black text-slate-800 mt-0.5 block">
                              {formatCurrency(monthBill.rent)}
                            </span>
                          </div>

                          {monthBill.proratedInfo?.isProrated && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-200/60">
                              <span className="text-2xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md inline-block leading-tight">
                                {toBengaliNumber(
                                  monthBill.proratedInfo.joinDay,
                                )}{" "}
                                তারিখে ওঠায়{" "}
                                {toBengaliNumber(
                                  monthBill.proratedInfo.stayedDays,
                                )}{" "}
                                দিনের ভাড়া
                              </span>
                              <span className="text-2xs text-slate-400 block mt-0.5 font-medium">
                                (মূল:{" "}
                                {toBengaliNumber(
                                  monthBill.proratedInfo.originalRent,
                                )}
                                )
                              </span>
                            </div>
                          )}
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

                          <div className="flex justify-between items-center text-emerald-700">
                            <span>জমা দিয়েছেন</span>
                            <span className="font-bold text-emerald-700 text-base sm:text-lg tracking-wide">
                              {formatCurrency(monthBill.paidAmount)}
                            </span>
                          </div>
                        </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 border-b pb-3">
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
                  placeholder="নাম লিখুন"
                  value={newTenant.name}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, name: e.target.value })
                  }
                  className="mt-1 w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  placeholder="০১৭xxxxxxxx"
                  value={newTenant.phone}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, phone: e.target.value })
                  }
                  className="mt-1 w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600">
                  ওঠার তারিখ *
                </label>
                <input
                  type="date"
                  required
                  min={getMinJoinDate()}
                  max={getMaxJoinDate()}
                  value={newTenant.joinedDate}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, joinedDate: e.target.value })
                  }
                  className="mt-1 w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />
                <p className="text-2xs text-slate-400 mt-1">
                  * পূর্ববর্তী ভাড়াটিয়ার রিলিজের পর থেকে চলতি মাসের মধ্যবর্তী
                  যেকোনো তারিখ প্রযোজ্য।
                </p>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newTenant.hasWifi}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, hasWifi: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-700">
                  ওয়াইফাই ব্যবহার করবেন
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTenantModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md hover:bg-blue-700 active:scale-98 transition-all"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        isDanger={confirmDialog.isDanger}
      />

      {/* Edit Month Modal */}
      <EditMonthModal
        isOpen={Boolean(editingMonth)}
        monthBill={editingMonth}
        monthName={
          editingMonth ? getMonthNameBengali(editingMonth.yearMonth) : ""
        }
        onClose={() => setEditingMonth(null)}
        onSave={(updatedBill) => {
          handleSaveMonth(updatedBill);
          setEditingMonth(null);
        }}
        onDelete={(billToDelete) => {
          setEditingMonth(null);
          handleDeleteMonth(billToDelete);
        }}
      />

      {/* Release Tenant Modal */}
      <ReleaseTenantModal
        isOpen={showReleaseModal}
        onClose={() => setShowReleaseModal(false)}
        tenantName={room.currentTenant?.name || room.tenantName}
        roomRent={room.rent}
        currentMonthName={getMonthNameBengali(currentYearMonth)}
        onConfirmRelease={handleConfirmRelease}
      />
    </div>
  );
}
