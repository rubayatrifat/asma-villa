// Converting Numbers to Bangla
export const toBengaliNumber = (num) => {
  if (num === null || num === undefined) return "০";
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num
    .toString()
    .replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
};

export const formatCurrency = (amount) => {
  return `৳ ${toBengaliNumber(amount || 0)}`;
};
