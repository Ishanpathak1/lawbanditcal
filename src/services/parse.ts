import * as chrono from 'chrono-node';
import { nanoid } from 'nanoid';
import type { ParsedEvent, EventType } from '../types.js';
import { normalizeISODate } from '../util.js';

const TYPE_RULES: Array<{ type: EventType; regex: RegExp }> = [
  { type: 'exam', regex: /(midterm|final|exam|test)/i },
  { type: 'quiz', regex: /\bquiz\b/i },
  { type: 'reading', regex: /(\bread\b|chapter|chap\.|pp\.)/i },
  { type: 'assignment', regex: /(\bdue\b|submit|assignment|homework|project|hw\d*)/i },
];

function inferType(line: string): EventType {
  for (const rule of TYPE_RULES) {
    if (rule.regex.test(line)) return rule.type;
  }
  return 'other';
}

function extractTime(result: chrono.ParsedResult): string | null {
  const start = result.start;
  if (start.isCertain('hour')) {
    const date = start.date();
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  return null;
}

function detectYearHint(text: string, fallbackYear: number): number {
  const m = /(spring|summer|fall|autumn|winter)\s+(20\d{2})/i.exec(text);
  if (m) return parseInt(m[2], 10);
  const y = /(20\d{2})/.exec(text);
  if (y) return parseInt(y[1], 10);
  return fallbackYear;
}

function cleanTitle(title: string): string {
  // Remove empty parentheses and leading separators
  let t = title.replace(/\(\s*\)/g, '').replace(/\s*[:\-–—]\s*$/, '').trim();
  if (t.startsWith(':')) t = t.replace(/^:\s*/, '');
  return t.trim();
}

function splitByDelimiters(text: string): string[] {
  // Split combined items separated by ';' or ' / '
  return text
    .split(/;|\s\/\s/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function expandDateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const d = new Date(start);
  while (d <= end) {
    dates.push(normalizeISODate(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function replaceYear(isoDate: string, year: number): string {
  return `${year}-${isoDate.slice(5)}`;
}

export function parseSyllabusText(text: string, yearHint: number): ParsedEvent[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const detectedYear = detectYearHint(text, yearHint);
  // Debug aid
  if (process.env.NODE_ENV !== 'production') {
    console.log('[parse] yearHint:', yearHint, 'detectedYear:', detectedYear);
  }
  const refDate = new Date(detectedYear, 0, 1);
  const events: ParsedEvent[] = [];

  for (const line of lines) {
    // Prefer future dates relative to detected year start
    const results = chrono.parse(line, refDate, { forwardDate: true } as any);
    if (results.length === 0) continue;

    const primary = results[0];
    const startDate = primary.start.date();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[parse] line:', line, '=>', startDate.toISOString());
    }
    const endDateObj = primary.end?.date();
    const isRange = !!endDateObj && normalizeISODate(startDate) !== normalizeISODate(endDateObj);

    const dateText = primary.text ?? '';
    const remainder = line.replace(dateText, '').trim();
    const parts = splitByDelimiters(remainder);
    const items = parts.length > 0 ? parts : [remainder];

    let startIso = normalizeISODate(startDate);
    if (!primary.start.isCertain('year')) {
      startIso = replaceYear(startIso, detectedYear);
    }
    let endIso = endDateObj ? normalizeISODate(endDateObj) : undefined;
    if (endIso && !primary.end!.isCertain('year')) {
      endIso = replaceYear(endIso, detectedYear);
    }
    const dates = isRange ? expandDateRange(new Date(startIso), new Date(endIso!)) : [startIso];

    for (const item of items) {
      const title = cleanTitle(item || 'Course item');
      const type = inferType(item || line);
      if (isRange) {
        // create one all-day multi-day event: start to end inclusive
        events.push({
          uid: nanoid(12),
          date: startIso,
          endDate: endIso!,
          allDay: true,
          time: null,
          title,
          type,
          sourceText: line,
        });
      } else {
        const time = extractTime(primary);
        events.push({
          uid: nanoid(12),
          date: dates[0],
          time,
          title,
          type,
          sourceText: line,
        });
      }
    }
  }

  return events;
}


