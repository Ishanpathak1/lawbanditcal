import { JSONFilePreset } from 'lowdb/node';
import type { Course } from './types.js';

type DBSchema = { courses: Record<string, Course> };

const defaultData: DBSchema = { courses: {} };

export const db = await JSONFilePreset<DBSchema>('db.json', defaultData);

export async function upsertCourse(course: Course): Promise<void> {
  db.data.courses[course.id] = course;
  await db.write();
}

export function getCourse(id: string): Course | undefined {
  return db.data.courses[id];
}


