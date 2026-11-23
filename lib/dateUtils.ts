export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getLocalMonthString(date = new Date()) {
  return getLocalDateString(date).slice(0, 7);
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
