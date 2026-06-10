export const getTodayAtMidnight = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const isPastDate = (value: Date | null | undefined) => {
  if (!value) return false;

  const selectedDate = new Date(value);
  selectedDate.setHours(0, 0, 0, 0);

  return selectedDate < getTodayAtMidnight();
};
