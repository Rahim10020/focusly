
/**
 * Calcule la durée entre deux heures au format HH:mm.
 * @param start Heure de début
 * @param end Heure de fin
 * @returns Durée en minutes sous forme de chaîne, ou null si invalide.
 */
export const calculateTimeDuration = (start: string, end: string): string | null => {
  if (!start || !end) return null;

  try {
    const startValue = start.includes(":") ? start : `${start}:00`;
    const endValue = end.includes(":") ? end : `${end}:00`;
    const [startHours, startMinutes = 0] = startValue.split(":").map(Number);
    const [endHours, endMinutes = 0] = endValue.split(":").map(Number);

    if (
      isNaN(startHours) ||
      isNaN(startMinutes) ||
      isNaN(endHours) ||
      isNaN(endMinutes)
    )
      return null;

    const startDateObj = new Date();
    startDateObj.setHours(startHours, startMinutes, 0, 0);
    const endDateObj = new Date();
    endDateObj.setHours(endHours, endMinutes, 0, 0);

    if (endDateObj <= startDateObj) {
      endDateObj.setDate(endDateObj.getDate() + 1);
    }

    const diffInMs = endDateObj.getTime() - startDateObj.getTime();
    const diffInMinutes = Math.round(diffInMs / (1000 * 60));

    if (diffInMinutes > 0) return diffInMinutes.toString();
    if (diffInMinutes < 0) return "";
    return null;
  } catch (error) {
    console.error("Error calculating duration:", error);
    return null;
  }
};
