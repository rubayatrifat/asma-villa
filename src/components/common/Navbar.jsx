import React, { useState, useEffect } from "react";
import { Home, Wifi, WifiOff } from "lucide-react";

export default function Navbar() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Listen to network status changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
            <Home className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
              আসমা ভিলা
            </h1>
            <p className="text-xs text-gray-500">বাসা ভাড়ার হিসাব খাতা</p>
          </div>
        </div>

        {/* Network status badge */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5" />
              <span>অনলাইন</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              <span>অফলাইন (ক্যাশ মোড)</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
