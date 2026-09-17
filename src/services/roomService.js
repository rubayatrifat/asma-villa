import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  getDoc,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  where,
  getDocs,
  writeBatch,
  deleteDoc,
  setDoc,
} from "firebase/firestore";

const ROOMS_COLLECTION = "rooms";
const BILLS_COLLECTION = "bills";

// Add a new room document
export const addRoom = async (roomData) => {
  try {
    const isOccupied = Boolean(roomData.isOccupied);

    const rawName = roomData.tenantName || roomData.currentTenant?.name || "";
    const rawPhone =
      roomData.tenantPhone || roomData.currentTenant?.phone || "";
    const rawJoinedDate =
      roomData.joinedDate ||
      roomData.tenantJoinedDate ||
      roomData.currentTenant?.joinedDate ||
      "";
    const hasWifi = Boolean(
      roomData.hasWifi ?? roomData.currentTenant?.hasWifi,
    );

    const formattedData = {
      roomNo: String(roomData.roomNo || "").trim(),
      rent: Number(roomData.rent) || 0,
      initialMeterReading: Number(roomData.initialMeterReading) || 0,
      currentMeterReading: Number(roomData.initialMeterReading) || 0,
      wasteBill: Number(roomData.wasteBill) || 60,
      wifiBill: Number(roomData.wifiBill) || 100,
      dueBalance: Number(roomData.initialDue || roomData.dueBalance) || 0,
      isOccupied: isOccupied,

      tenantName: isOccupied ? rawName.trim() : "",
      tenantPhone: isOccupied ? rawPhone.trim() : "",
      joinedDate: isOccupied ? rawJoinedDate : null,
      tenantJoinedDate: isOccupied ? rawJoinedDate : null,

      currentTenant: isOccupied
        ? {
            name: rawName.trim(),
            phone: rawPhone.trim(),
            joinedDate: rawJoinedDate,
            hasWifi: hasWifi,
          }
        : null,

      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(
      collection(db, ROOMS_COLLECTION),
      formattedData,
    );
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding room:", error);
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

// Release Tenant and optionally create a permanent Departure Due Claim record
export const releaseTenant = async (roomId, roomNo, penaltyData = null) => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    // রুম খালি করে দেওয়া
    const updatePayload = {
      isOccupied: false,
      currentTenant: null,
      tenantName: "",
      tenantPhone: "",
      tenantJoinedDate: null,
      joinedDate: null,
    };

    await updateDoc(roomRef, updatePayload);

    if (
      penaltyData &&
      !penaltyData.isWaived &&
      Number(penaltyData.amount) > 0
    ) {
      const claimId = `${roomNo}_${penaltyData.yearMonth}_claim_${Date.now()}`;
      const claimRef = doc(db, BILLS_COLLECTION, claimId);

      await setDoc(claimRef, {
        id: claimId,
        roomNo: String(roomNo),
        yearMonth: penaltyData.yearMonth,
        isDepartureClaim: true,
        tenantName: penaltyData.tenantName || "পূর্ববর্তী ভাড়াটিয়া",
        claimAmount: Number(penaltyData.amount),
        paidAmount: 0,
        due: Number(penaltyData.amount),
        isPaid: false,
        createdAt: new Date().toISOString(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error releasing tenant:", error);
    return { success: false, error: error.message };
  }
};

export const updateClaimPayment = async (claimId, paidAmount, claimTotal) => {
  try {
    const claimRef = doc(db, BILLS_COLLECTION, claimId);
    const paid = Number(paidAmount);
    const total = Number(claimTotal);
    const due = Math.max(0, total - paid);

    await updateDoc(claimRef, {
      paidAmount: paid,
      due: due,
      isPaid: due === 0,
      paidAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating claim payment:", error);
    return { success: false, error: error.message };
  }
};

// Permanently delete a claim record from history
export const deleteDepartureClaimDoc = async (claimId) => {
  try {
    const claimRef = doc(db, BILLS_COLLECTION, claimId);
    await deleteDoc(claimRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting claim document:", error);
    return { success: false, error: error.message };
  }
};

// Assign a new tenant to an existing room (আগের জরিমানা ও হিস্ট্রি অক্ষত থাকবে)
export const assignNewTenant = async (roomId, tenantData) => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    await updateDoc(roomRef, {
      isOccupied: true,
      tenantName: tenantData.name.trim(),
      tenantPhone: tenantData.phone ? tenantData.phone.trim() : "",
      tenantJoinedDate: tenantData.joinedDate,
      joinedDate: tenantData.joinedDate,
      hasWifi: Boolean(tenantData.hasWifi),

      currentTenant: {
        name: tenantData.name.trim(),
        phone: tenantData.phone ? tenantData.phone.trim() : "",
        joinedDate: tenantData.joinedDate,
        hasWifi: Boolean(tenantData.hasWifi),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error assigning tenant:", error);
    return { success: false, error: error.message };
  }
};

// Update room default pricing and details
export const updateRoomDetails = async (roomId, updatedData) => {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, {
      roomNo: String(updatedData.roomNo).trim(),
      rent: Number(updatedData.rent),
      wasteBill: Number(updatedData.wasteBill),
      wifiBill: Number(updatedData.wifiBill || 100),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating room:", error);
    return { success: false, error: error.message };
  }
};

// Permanently delete a room along with all its linked bills (Cascade Delete)
export const deleteRoom = async (roomId, roomNo) => {
  try {
    const batch = writeBatch(db);

    // 1. Delete the main room document
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    batch.delete(roomRef);

    // 2. Query and delete all bills related to this roomNo
    if (roomNo) {
      const billsQuery = query(
        collection(db, BILLS_COLLECTION),
        where("roomNo", "==", String(roomNo)),
      );
      const billsSnapshot = await getDocs(billsQuery);
      billsSnapshot.forEach((billDoc) => {
        batch.delete(billDoc.ref);
      });
    }

    // 3. Commit atomic batch operation
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error deleting room and bills:", error);
    return { success: false, error: error.message };
  }
};

export const updateDepartureClaimAmount = async (claimId, newAmount) => {
  try {
    const claimRef = doc(db, "bills", claimId);
    const snap = await getDoc(claimRef);
    if (!snap.exists()) return { success: false, error: "রেকর্ড পাওয়া যায়নি!" };

    const currentData = snap.data();
    const paid = Number(currentData.paidAmount) || 0;
    const total = Number(newAmount) || 0;
    const due = Math.max(0, total - paid);

    await updateDoc(claimRef, {
      claimAmount: total,
      due: due,
      isPaid: due === 0,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating claim amount:", error);
    return { success: false, error: error.message };
  }
};