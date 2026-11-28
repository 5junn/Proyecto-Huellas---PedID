const DAY_MS = 86400000;
const LIMA_OFFSET_SECONDS = 5 * 60 * 60;
const dateKey = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Lima' });
const displayDate = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric',
});

function clinicToday() {
  return dateKey.format(new Date());
}

function validDay(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    value >= '1000-01-01' && new Date(value).toJSON()?.slice(0, 10) === value;
}

function daysBetween(first, last) {
  return (Date.parse(last) - Date.parse(first)) / DAY_MS;
}

function vaccineStatus(days) {
  if (days < 0) return 'vencida';
  return days <= 15 ? 'por-vencer' : 'al-dia';
}

module.exports = { DAY_MS, LIMA_OFFSET_SECONDS, clinicToday, validDay, daysBetween, vaccineStatus, displayDate };
