export const calculateProratedRent = (
  baseRent,
  joinedDateStr,
  yearMonthStr,
) => {
  const rent = Number(baseRent) || 0;
  if (!joinedDateStr || !yearMonthStr) return { rent, isProrated: false };

  const joinedMonth = joinedDateStr.slice(0, 7);
  if (joinedMonth !== yearMonthStr) {
    return { rent, isProrated: false };
  }

  const [y, m, d] = joinedDateStr.split("-").map(Number);
  const joinDay = d;

  if (joinDay <= 10) {
    return { rent, isProrated: false };
  }

  const daysInMonth = new Date(y, m, 0).getDate();
  const stayedDays = daysInMonth - joinDay + 1;
  const calculatedRent = Math.round((rent / daysInMonth) * stayedDays);

  return {
    rent: calculatedRent,
    isProrated: true,
    stayedDays,
    joinDay,
    originalRent: rent,
  };
};
