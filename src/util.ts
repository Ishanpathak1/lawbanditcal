export const normalizeISODate = (d: Date) => d.toISOString().slice(0, 10);
export const isoDateTime = (date: string, time = "23:59") => `${date}T${time}:00`;


