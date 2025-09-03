import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getCourse, upsertCourse } from '../db.js';
import type { Course, ParsedEvent, EventType } from '../types.js';

const eventSchema = z.object({
  uid: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  allDay: z.boolean().optional(),
  title: z.string().min(1),
  type: z.custom<EventType>((v) => typeof v === 'string' && ['assignment','reading','exam','quiz','other'].includes(v as string)),
  description: z.string().optional(),
  location: z.string().optional(),
  sourceText: z.string().optional(),
});

const courseUpdateSchema = z.object({
  name: z.string().optional(),
  timezone: z.string(),
  events: z.array(eventSchema),
});

export async function previewRoutes(app: FastifyInstance) {
  app.get('/course/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const course = getCourse(id);
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    return reply.send(course);
  });

  app.post('/course/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const course = getCourse(id);
    if (!course) return reply.status(404).send({ error: 'Course not found' });

    const parsed = courseUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const data = parsed.data;
    const updated: Course = {
      ...course,
      name: data.name ?? course.name,
      timezone: data.timezone,
      events: data.events as ParsedEvent[],
      updatedAt: new Date().toISOString(),
    };

    await upsertCourse(updated);
    return reply.send(updated);
  });
}


