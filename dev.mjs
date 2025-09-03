import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

try {
  // Speedy dev: transpile only (skip typechecking)
  process.env.TS_NODE_TRANSPILE_ONLY = 'true';
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  // Register ts-node ESM loader for the current project
  register('ts-node/esm', pathToFileURL('./'));
} catch (err) {
  console.error('Failed to register ts-node ESM loader:', err);
  process.exit(1);
}

try {
  // Start the server
  await import('./src/server.ts');
} catch (err) {
  console.error('Startup error:', err);
  process.exit(1);
}


