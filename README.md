# syllabus2cal

Minimal TypeScript + Fastify service to parse syllabus files (PDF/DOCX), extract dated items, review/edit, export ICS, and optionally sync to Google Calendar.

Tech: Node 20, TypeScript, Fastify, @fastify/multipart, pdf-parse, mammoth, chrono-node, zod, ical-generator, googleapis, lowdb, nanoid, dotenv.

## Install

```bash
npm i
```

## Dev

```bash
npm run dev
```

Server runs on PORT (default 3000) and serves `public/index.html` at `/`.

## Env

Copy `.env.example` to `.env` and fill values as needed.

## API usage

Example curls:

```bash
# upload
curl -F "file=@tests/sample.docx" http://localhost:3000/upload

# preview
curl http://localhost:3000/course/<ID>

# save
curl -X POST http://localhost:3000/course/<ID> \
  -H "Content-Type: application/json" \
  -d '{"name":"CS 501","timezone":"America/New_York","events":[] }'

# ics
curl -D- http://localhost:3000/ics/<ID>

# gcal (requires env)
curl -X POST http://localhost:3000/gcal/<ID>/sync
```

## Notes

- Uploads stored to `uploads/` (gitignored).
- LowDB persists to `db.json`.
- Default event time is 23:59; ICS uses course timezone; 45-minute default duration.
- Emoji prefixes: 📘 reading, 📝 assignment/quiz, 🧪 exam.

## Sample syllabus lines

Use this text in a `.txt` or DOCX to verify parsing:

```
Course Schedule – Fall 2025
Week 1 (Aug 28): Read Ch. 1–2; Quiz 1
Sep 05: HW1 due – Submit on LMS by 11:59pm
Fri, Sep 19: Midterm Exam (in class)
10/03: Project Proposal due
Oct 24 – Oct 28: No class (Fall Break)
Nov 14: HW3 due; Read pp. 210–235
Dec 12: Final Exam – LC 3
```

Expected: lines with dates become events; types inferred; default time 23:59 if none.


