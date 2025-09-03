import { FastifyInstance } from 'fastify';
import { getCourse } from '../db.js';
import { generateICS } from '../services/ics.js';

export async function icsRoutes(app: FastifyInstance) {
  app.get('/ics/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const course = getCourse(id);
    if (!course) return reply.status(404).send({ error: 'Course not found' });

    const cal = generateICS(course);
    const ics = cal.toString();
    reply.header('Content-Type', 'text/calendar; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${id}.ics"`);
    return reply.send(ics);
  });
}


