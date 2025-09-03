export type EventType = "assignment" | "reading" | "exam" | "quiz" | "other";

export interface ParsedEvent {
  uid: string;
  date: string;          // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD (inclusive) for all-day/multi-day
  time?: string | null;  // "HH:mm" or null
  allDay?: boolean;      // true for all-day events
  title: string;
  type: EventType;
  description?: string;
  location?: string;
  sourceText?: string;
}

export interface Course {
  id: string;
  name?: string;
  timezone: string;
  events: ParsedEvent[];
  createdAt: string;
  updatedAt: string;
}


