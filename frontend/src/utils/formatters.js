/**
 * SmartStay Architectural Display & Localization Formatters
 */

/**
 * Format monetary amount with currency symbol
 * Defaults to Indian Rupee (₹) matching sovereign YouPI-PG settlement
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const num = Number(amount);

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  }
};

/**
 * Format ISO or Date string into clean editorial date
 * e.g., "12 Nov 2026"
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Invalid date';

  const defaultOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  };

  return d.toLocaleDateString('en-IN', defaultOptions);
};

/**
 * Calculate the number of nights between two date strings
 */
export const calculateNights = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return 0;
  const inD = new Date(checkInDate);
  const outD = new Date(checkOutDate);
  const diffTime = outD.getTime() - inD.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};
