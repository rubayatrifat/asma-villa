import React from "react";
import {
  Phone,
  Wifi,
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Settings,
} from "lucide-react";
import { toBengaliNumber, formatCurrency } from "../../utils/formatters";

export default function RoomCard({ room, onSelectRoom, onEditRoom }) {
  const {
    roomNo,
    isOccupied,
    currentTenant,
    dueBalance,
    lastBilledMonth,
    isLastBillFinalized,
  } = room;

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const getPreviousMonthKey = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const targetPreviousMonth = getPreviousMonthKey();

  const joinedDateStr =
    currentTenant?.joinedDate || room.tenantJoinedDate || "";
  const tenantJoinedMonth = joinedDateStr ? joinedDateStr.slice(0, 7) : "";

  const isJoinedThisMonth = Boolean(
    isOccupied && tenantJoinedMonth === currentYM,
  );

  const isJoinedPastMonth = Boolean(
    isOccupied && tenantJoinedMonth && tenantJoinedMonth < currentYM,
  );

  const isPreviousMonthReadingPending =
    isOccupied &&
    isJoinedPastMonth &&
    (lastBilledMonth !== targetPreviousMonth || !isLastBillFinalized);

  return (
    <div
      onClick={() => onSelectRoom && onSelectRoom(room)}
      className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Top Bar: Room No & Occupancy Badge */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            রুম #{toBengaliNumber(roomNo)}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isOccupied
                ? "bg-blue-100 text-blue-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {isOccupied ? "ভাড়াটিয়া আছে" : "খালি"}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onEditRoom) onEditRoom(room);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-all"
            title="রুম এডিট করুন"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Middle Box: Tenant Details */}
      <div className="my-4">
        {isOccupied && currentTenant ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="text-xl font-black text-slate-900 leading-snug truncate">
              {currentTenant.name}
            </div>

            {currentTenant.phone ? (
              <div className="flex items-center text-base font-semibold text-slate-700">
                <Phone className="h-4 w-4 mr-2 text-slate-500 shrink-0" />
                <span>{toBengaliNumber(currentTenant.phone)}</span>
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                মোবাইল নম্বর দেওয়া নেই
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/80 flex items-center text-sm font-medium text-slate-600">
              <Wifi
                className={`h-4 w-4 mr-2 ${
                  currentTenant.hasWifi ? "text-blue-600" : "text-slate-400"
                }`}
              />
              <span>
                {currentTenant.hasWifi
                  ? "ওয়াইফাই ব্যবহার করেন"
                  : "ওয়াইফাই ব্যবহার করেন না"}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl py-6 px-4 text-center">
            <p className="text-slate-400 font-semibold text-sm mb-3">
              রুমটি বর্তমানে খালি আছে
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
              ক্লিক করে ভাড়াটিয়া যুক্ত করুন
            </span>
          </div>
        )}
      </div>

      {/* Bottom Bar: Smart Status Badges */}
      <div className="pt-2">
        {!isOccupied ? (
          <div className="text-sm font-bold text-slate-400">
            হিসাব প্রযোজ্য নয়
          </div>
        ) : isJoinedThisMonth ? (
          <div className="flex items-center gap-1.5 text-sky-700 bg-sky-50 border border-sky-200 px-3 py-2 rounded-xl font-bold text-sm">
            <Clock className="h-4 w-4 shrink-0" />
            <span>চলমান (নতুন ভাড়াটিয়া)</span>
          </div>
        ) : isPreviousMonthReadingPending ? (
          <div className="flex items-center justify-between text-amber-800 bg-amber-50 border border-amber-300 px-3 py-2 rounded-xl font-bold text-sm">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>অসম্পূর্ণ (মিটার রিডিং বাকি)</span>
            </div>
          </div>
        ) : dueBalance > 0 ? (
          <div className="flex items-center justify-between text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl font-bold text-sm">
            <span className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 shrink-0" />
              বকেয়া:
            </span>
            <span className="text-base font-black">
              {formatCurrency(dueBalance)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl font-bold text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>পরিশোধিত</span>
          </div>
        )}
      </div>
    </div>
  );
}
