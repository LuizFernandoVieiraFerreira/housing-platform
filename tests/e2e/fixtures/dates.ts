function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Returns check-in/check-out dates that avoid overlapping holds from prior E2E runs.
 * Uses a random check-in offset so repeated runs on the same listing don't collide.
 */
export function bookingWindow(minStayNights: number) {
  const daysUntilCheckIn = 90 + Math.floor(Math.random() * 270);
  const checkIn = addDays(new Date(), daysUntilCheckIn);
  const checkOut = addDays(checkIn, minStayNights);

  return {
    checkIn: formatLocalDate(checkIn),
    checkOut: formatLocalDate(checkOut),
  };
}
