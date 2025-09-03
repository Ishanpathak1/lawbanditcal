import ical, { ICalCalendar } from 'ical-generator';
import type { Course, ParsedEvent } from '../types.js';
import { isoDateTime } from '../util.js';

function prefixForType(type: ParsedEvent['type']): string {
  if (type === 'reading') return '📘 ';
  if (type === 'assignment' || type === 'quiz') return '📝 ';
  if (type === 'exam') return '🧪 ';
  return '';
}

export function generateICS(course: Course): ICalCalendar {
  const cal = ical({ name: `Course – ${course.name ?? 'Untitled'}`, timezone: course.timezone });

  for (const e of course.events) {
    const summaryBase = `${prefixForType(e.type)}${e.title}`.replace(/^:\s*/, '').trim();
    if (e.allDay) {
      // Inclusive end date; ical-generator expects exclusive end for all-day
      const start = new Date(`${e.date}T00:00:00`);
      const endDateStr = e.endDate ?? e.date;
      const endExclusive = new Date(new Date(`${endDateStr}T00:00:00`).getTime() + 24 * 60 * 60 * 1000);
      cal.createEvent({
        id: e.uid,
        summary: summaryBase,
        description: e.description ?? e.sourceText ?? undefined,
        location: e.location,
        allDay: true,
        start,
        end: endExclusive,
      });
    } else {
      // due-time UX: short duration to avoid spillover
      const startIso = isoDateTime(e.date, e.time ?? '23:59');
      const start = new Date(startIso);
      const end = new Date(start.getTime() + 10 * 60 * 1000);
      cal.createEvent({
        id: e.uid,
        start,
        end,
        summary: summaryBase,
        description: e.description ?? e.sourceText ?? undefined,
        location: e.location,
        timezone: course.timezone,
      });
    }
  }

  return cal;
}


