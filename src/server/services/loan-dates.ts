const timeZone = "America/Sao_Paulo";
const nationalHolidayMonthDays = new Set([
  "01-01", // Confraternização Universal
  "04-21", // Tiradentes
  "05-01", // Dia do Trabalho
  "09-07", // Independência
  "10-12", // Nossa Senhora Aparecida
  "11-02", // Finados
  "11-15", // Proclamação da República
  "11-20", // Dia Nacional de Zumbi e da Consciência Negra
  "12-25", // Natal
]);

type LocalDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function localParts(date: Date): LocalDateTime {
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function dateKey({ year, month, day }: Pick<LocalDateTime, "year" | "month" | "day">) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateFromKey(key: string): Pick<LocalDateTime, "year" | "month" | "day"> {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

function addCalendarDays(key: string, days: number) {
  const { year, month, day } = dateFromKey(key);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return dateKey({
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  });
}

function isBusinessDate(key: string) {
  const { year, month, day } = dateFromKey(key);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const monthDay = key.slice(5);
  return weekday !== 0 && weekday !== 6 && !nationalHolidayMonthDays.has(monthDay);
}

function toZonedDateTime(parts: LocalDateTime, milliseconds: number) {
  const desiredUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    milliseconds,
  );
  let guess = desiredUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const observed = localParts(new Date(guess));
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
      milliseconds,
    );
    guess += desiredUtc - observedAsUtc;
  }
  return new Date(guess);
}

function preserveLocalTime(date: Date, targetDate: string) {
  const current = localParts(date);
  return toZonedDateTime({ ...current, ...dateFromKey(targetDate) }, date.getUTCMilliseconds());
}

export function addBrazilianBusinessDays(date: Date, businessDays: number) {
  if (!Number.isInteger(businessDays) || businessDays < 0) {
    throw new RangeError("businessDays precisa ser um inteiro não negativo.");
  }
  const current = localParts(date);
  let targetDate = dateKey(current);
  let counted = 0;
  while (counted < businessDays) {
    targetDate = addCalendarDays(targetDate, 1);
    if (isBusinessDate(targetDate)) counted += 1;
  }
  return preserveLocalTime(date, targetDate);
}

export function pendingPickupExpiresAt(createdAt: Date) {
  const current = localParts(createdAt);
  let start = createdAt;
  let startDate = dateKey(current);
  if (!isBusinessDate(startDate)) {
    while (!isBusinessDate(startDate)) startDate = addCalendarDays(startDate, 1);
    start = toZonedDateTime({ ...dateFromKey(startDate), hour: 0, minute: 0, second: 0 }, 0);
  }

  let expiresDate = addCalendarDays(dateKey(localParts(start)), 1);
  while (!isBusinessDate(expiresDate)) expiresDate = addCalendarDays(expiresDate, 1);
  return preserveLocalTime(start, expiresDate);
}
