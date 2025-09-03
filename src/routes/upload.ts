import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { promises as fs } from 'fs';
import path from 'path';
import { extractTextFromUpload } from '../services/extract.js';
import { parseSyllabusText } from '../services/parse.js';
import { applyDefaults } from '../services/normalize.js';
import { upsertCourse } from '../db.js';
import { nanoid } from 'nanoid';
import type { Course } from '../types.js';

export async function uploadRoutes(app: FastifyInstance) {
  await app.register(multipart);

  app.post('/upload', async (req, reply) => {
    const mp = await req.file();
    if (!mp) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const uploadsDir = path.resolve('uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const ts = Date.now();
    const safeName = mp.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const destPath = path.join(uploadsDir, `${ts}-${safeName}`);
    await fs.writeFile(destPath, await mp.toBuffer());

    try {
      const text = await extractTextFromUpload(destPath);
      const now = new Date();
      const filenameYear = (() => {
        const m = mp.filename.match(/(20\d{2})/);
        return m ? parseInt(m[1], 10) : undefined;
      })();
      const yearHint = filenameYear ?? now.getFullYear();
      const parsed = parseSyllabusText(text, yearHint);
      const events = applyDefaults(parsed, { defaultTime: '23:59', dedupe: true });

      const id = nanoid(12);
      const tz = process.env.TZ_DEFAULT || 'America/New_York';
      const iso = now.toISOString();
      const course: Course = { id, timezone: tz, events, createdAt: iso, updatedAt: iso };
      await upsertCourse(course);

      return reply.send({ courseId: id, count: events.length });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Failed to process file' });
    }
  });
}


