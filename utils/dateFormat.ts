/**
 * Formats a date string to a readable format with date and time
 * Example: "21 Nov, 9:43 PM" (for report cards)
 */
export const formatReportDate = (dateString: string): string => {
  const date = new Date(dateString);

  // Format: "21 Nov, 9:43 PM"
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${day} ${month}, ${displayHours}:${displayMinutes} ${ampm}`;
};

/**
 * Formats a date string for tables: DD/MM/YY with time in AM/PM
 * Example: "21/11/23, 9:43 PM"
 */
export const formatTableDate = (dateString: string): string => {
  const date = new Date(dateString);

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${day}/${month}/${year}, ${displayHours}:${displayMinutes} ${ampm}`;
};



/**
 * Formats a Date object to YYYY-MM-DD string using local time
 * This prevents timezone issues where toISOString() uses UTC and might return previous day
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
