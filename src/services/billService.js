import { db } from "../firebase/config";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const BILLS_COLLECTION = "bills";
const ROOMS_COLLECTION = "rooms";

// Fetch all monthly logs for a specific room
export const getRoomBills = async (roomNo) => {
  try {
    const q = query(
      collection(db, BILLS_COLLECTION),
      where("roomNo", "==", String(roomNo)),
    );
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return results.sort((a, b) => (a.yearMonth > b.yearMonth ? 1 : -1));
  } catch (error) {
    console.error("Error fetching room bills:", error);
    return [];
  }
};

// Clean and persist single month record with explicit finalized flag
export const saveMonthlyBill = async (billId, data, roomId) => {
  try {
    const docId = `${data.roomNo}_${data.yearMonth}`;
    const docRef = doc(db, BILLS_COLLECTION, docId);

    const payload = {
      id: docId,
      roomNo: String(data.roomNo),
      yearMonth: String(data.yearMonth),
      tenantName: String(data.tenantName || ""),
      rent: Number(data.rent) || 0,
      wasteBill: Number(data.wasteBill) || 0,
      wifiBill: Number(data.wifiBill) || 0,
      hasWifi: Boolean(data.hasWifi),
      startUnit: Number(data.startUnit) || 0,
      endUnit: Number(data.endUnit) || 0,
      unitRate: Number(data.unitRate) || 10,
      electricityBill: Number(data.electricityBill) || 0,
      previousDue: Number(data.previousDue) || 0,
      subtotal: Number(data.subtotal) || 0,
      totalPayable: Number(data.totalPayable) || 0,
      paidAmount: Number(data.paidAmount) || 0,
      due: Number(data.due) || 0,
      isVacant: Boolean(data.isVacant),
      isBillFinalized: true, // Marked as explicitly confirmed by user
      updatedAt: serverTimestamp(),
    };

    // 1. Save in bills collection
    await setDoc(docRef, payload, { merge: true });

    // 2. Sync room status & state
    if (roomId) {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(roomRef, {
        lastBilledMonth: data.yearMonth,
        isLastBillFinalized: true,
        currentMeterReading: Number(data.endUnit) || 0,
        dueBalance: Number(data.due) || 0,
      });
    }

    return { success: true, savedData: payload };
  } catch (error) {
    console.error("Error saving bill:", error);
    return { success: false, error: error.message };
  }
};

// Delete a month entry
export const deleteMonthlyBill = async (billId) => {
  try {
    await deleteDoc(doc(db, BILLS_COLLECTION, billId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting bill:", error);
    return { success: false, error: error.message };
  }
};
