import { promises as fs } from 'fs';
import path from 'path';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

export async function extractTextFromUpload(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const buf = await fs.readFile(filePath);

  if (ext === '.pdf') {
    const res = await pdf(buf);
    return res.text;
  }
  if (ext === '.docx') {
    const res = await mammoth.extractRawText({ buffer: buf });
    return res.value;
  }
  throw new Error('Unsupported file type. Only .pdf and .docx are supported.');
}


