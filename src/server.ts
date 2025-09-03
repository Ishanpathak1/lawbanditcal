import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';
import { uploadRoutes } from './routes/upload.js';
import { previewRoutes } from './routes/preview.js';
import { icsRoutes } from './routes/ics.js';
import { gcalRoutes } from './routes/gcal.js';

dotenv.config();

const app = Fastify({ logger: true });

// Static root index
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

app.get('/', async (_req, reply) => {
  const html = await readFile(path.join(publicDir, 'index.html'), 'utf8');
  reply.header('Content-Type', 'text/html');
  return reply.send(html);
});

// Routes
await uploadRoutes(app);
await previewRoutes(app);
await icsRoutes(app);
await gcalRoutes(app);

const port = Number(process.env.PORT || 3000);
app
  .listen({ port, host: '0.0.0.0' })
  .then((addr) => app.log.info(`listening at ${addr}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });


