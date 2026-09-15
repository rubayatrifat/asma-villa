import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

const ROOMS_COLLECTION = "rooms";

// Add a new room document
export const addRoom = async (roomData) => {
  try {
    const docRef = await addDoc(collection(db, ROOMS_COLLECTION), {
      roomNo: roomData.roomNo.trim(),
      rent: Number(roomData.rent),
      wasteBill: Number(roomData.wasteBill || 60),
      currentMeterReading: Number(roomData.initialMeterReading || 0),
      isOccupied: Boolean(roomData.isOccupied),
      currentTenant: roomData.isOccupied
        ? {
            name: roomData.tenantName.trim(),
            phone: roomData.tenantPhone ? roomData.tenantPhone.trim() : "",
            hasWifi: Boolean(roomData.hasWifi),
            joinedDate:
              roomData.joinedDate || new Date().toISOString().split("T")[0],
          }
        : null,
      dueBalance: Number(roomData.initialDue || 0),
      // Track the last month for which bill was calculated (null means pending)
      lastBilledMonth: null,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding room: ", error);
    return { success: false, error: error.message };
  }
};

// Realtime subscription to rooms collection
export const subscribeRooms = (callback) => {
  const q = query(collection(db, ROOMS_COLLECTION), orderBy("roomNo", "asc"));
  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(rooms);
  });
};

// Release current tenant and make room vacant
export const releaseTenant = async (roomId) => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, {
      isOccupied: false,
      currentTenant: null,
      dueBalance: 0,
    });
    return { success: true };
  } catch (error) {
    console.error("Error releasing tenant:", error);
    return { success: false, error: error.message };
  }
};

// Assign a new tenant to an existing room
export const assignNewTenant = async (roomId, tenantData) => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, {
      isOccupied: true,
      currentTenant: {
        name: tenantData.name.trim(),
        phone: tenantData.phone ? tenantData.phone.trim() : "",
        hasWifi: Boolean(tenantData.hasWifi),
        joinedDate: tenantData.joinedDate || new Date().toISOString().split("T")[0],
      },
      dueBalance: 0,
    });
    return { success: true };
  } catch (error) {
    console.error("Error assigning tenant:", error);
    return { success: false, error: error.message };
  }
};