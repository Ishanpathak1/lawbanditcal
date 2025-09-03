import { FastifyInstance } from 'fastify';
import { getCourse } from '../db.js';
import { upsertToGoogleCalendar } from '../services/gcal.js';

export async function gcalRoutes(app: FastifyInstance) {
  app.post('/gcal/:id/sync', async (req, reply) => {
    const { id } = req.params as { id: string };
    const course = getCourse(id);
    if (!course) return reply.status(404).send({ error: 'Course not found' });

    const { GCLIENT_ID, GCLIENT_SECRET, GREDIRECT_URI, GREFRESH_TOKEN } = process.env;
    if (!GCLIENT_ID || !GCLIENT_SECRET || !GREDIRECT_URI || !GREFRESH_TOKEN) {
      return reply.status(400).send({ error: 'Missing Google OAuth env vars' });
    }

    const res = await upsertToGoogleCalendar(
      {
        clientId: GCLIENT_ID,
        clientSecret: GCLIENT_SECRET,
        redirectUri: GREDIRECT_URI,
        refreshToken: GREFRESH_TOKEN,
      },
      course.name ?? 'Untitled',
      course.timezone,
      course.events
    );

    return reply.send(res);
  });
}


