export const formatPrice = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const isSameDay = (dateStr, targetDate) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.getDate() === targetDate.getDate() &&
           d.getMonth() === targetDate.getMonth() &&
           d.getFullYear() === targetDate.getFullYear();
  }
  const numbers = dateStr.match(/\d+/g);
  if (numbers && numbers.length >= 3) {
    const day = parseInt(numbers[0]);
    const month = parseInt(numbers[1]);
    const year = parseInt(numbers[2]);
    const tDay = targetDate.getDate();
    const tMonth = targetDate.getMonth() + 1;
    const tYear = targetDate.getFullYear();
    return day === tDay && month === tMonth && (year === tYear || year === tYear % 100);
  }
  return false;
};
