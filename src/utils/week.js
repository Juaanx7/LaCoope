export function getISOWeekStr(dateInput = new Date()) {
  const d = new Date(dateInput);
  const day = (d.getDay() + 6) % 7; // lunes=0..domingo=6
  d.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstThursdayDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDay + 3);
  const weekNo = 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
  const year = d.getFullYear();
  return `${year}-W${String(weekNo).padStart(2, "0")}`;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}