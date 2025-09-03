import type { ParsedEvent } from '../types.js';

export function applyDefaults(
  events: ParsedEvent[],
  opts: { defaultTime?: string; dedupe?: boolean } = {}
): ParsedEvent[] {
  const defaultTime = opts.defaultTime ?? '23:59';
  const dedupe = opts.dedupe ?? true;

  const withTime = events.map((e) => ({
    ...e,
    time: e.allDay ? null : (e.time ?? defaultTime),
  }));

  let result = withTime;
  if (dedupe) {
    const seen = new Set<string>();
    result = [];
    for (const e of withTime) {
      const key = `${e.date}|${e.title.trim().toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(e);
    }
  }

  result.sort((a, b) => {
    const at = `${a.date} ${a.time ?? (a.allDay ? '00:00' : '00:00')}`;
    const bt = `${b.date} ${b.time ?? (b.allDay ? '00:00' : '00:00')}`;
    return at.localeCompare(bt);
  });

  return result;
}


