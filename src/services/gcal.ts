import { google } from 'googleapis';
import type { ParsedEvent } from '../types.js';
import { isoDateTime } from '../util.js';

type OAuthTokens = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
};

export async function upsertToGoogleCalendar(
  oauth: OAuthTokens,
  courseName: string,
  timezone: string,
  events: ParsedEvent[]
): Promise<{ calendarId: string; created: number; updated: number; skipped: number }> {
  const oAuth2Client = new google.auth.OAuth2(
    oauth.clientId,
    oauth.clientSecret,
    oauth.redirectUri
  );
  oAuth2Client.setCredentials({ refresh_token: oauth.refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  // Find or create calendar
  const calName = `Course – ${courseName ?? 'Untitled'}`;
  const list = await calendar.calendarList.list();
  let cal = list.data.items?.find((c) => c.summary === calName);
  if (!cal) {
    const created = await calendar.calendars.insert({ requestBody: { summary: calName, timeZone: timezone } });
    cal = created.data;
  }
  const calendarId = cal!.id!;

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const e of events) {
    const startIso = isoDateTime(e.date, e.time ?? '23:59');
    const endIso = isoDateTime(e.date, e.time ?? '23:59');
    const start = { dateTime: new Date(startIso).toISOString(), timeZone: timezone };
    const end = { dateTime: new Date(new Date(startIso).getTime() + 45 * 60 * 1000).toISOString(), timeZone: timezone };

    // Upsert by private extended property s2c_uid
    const q = await calendar.events.list({
      calendarId,
      privateExtendedProperty: [`s2c_uid=${e.uid}`],
      maxResults: 1,
      singleEvents: true,
    });

    const body = {
      summary: e.title,
      description: e.sourceText ?? undefined,
      start,
      end,
      extendedProperties: { private: { s2c_uid: e.uid } },
    } as const;

    const existing = q.data.items?.[0];
    if (existing) {
      await calendar.events.update({ calendarId, eventId: existing.id!, requestBody: body });
      updatedCount++;
    } else {
      await calendar.events.insert({ calendarId, requestBody: body });
      createdCount++;
    }
  }

  return { calendarId, created: createdCount, updated: updatedCount, skipped: skippedCount };
}


