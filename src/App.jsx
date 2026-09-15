import React, { useState, useEffect } from "react";
import { Plus, Layers } from "lucide-react";
import Navbar from "./components/common/Navbar";
import RoomCard from "./components/rooms/RoomCard";
import RoomDetails from "./components/rooms/RoomDetails";
import AddRoomModal from "./components/forms/AddRoomModal";
import { subscribeRooms } from "./services/roomService";
import { toBengaliNumber } from "./utils/formatters";

export default function App() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeRooms((data) => {
      setRooms(data);
      // Keep selectedRoom updated in realtime if it changes
      if (selectedRoom) {
        const current = data.find((r) => r.id === selectedRoom.id);
        if (current) setSelectedRoom(current);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedRoom?.id]);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {selectedRoom ? (
          /* View Room Details View */
          <RoomDetails
            room={selectedRoom}
            onBack={() => setSelectedRoom(null)}
          />
        ) : (
          /* View Dashboard Grid */
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-800">
                  রুম তালিকা
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  মোট রুম: {toBengaliNumber(rooms.length)} টি
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-98 transition-all"
              >
                <Plus className="h-5 w-5" />
                <span>নতুন রুম যোগ করুন</span>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
                <Layers className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-3 text-lg font-bold text-gray-800">
                  কোনো রুম যুক্ত করা হয়নি
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  উপরের বাটনে ক্লিক করে নতুন রুম তৈরি করুন।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onSelectRoom={(r) => setSelectedRoom(r)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <AddRoomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
