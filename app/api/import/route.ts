import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import crypto from "crypto";
import { content, ContentTree, QuestionDef } from "@/data/content";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function isQuestionArray(value: ContentTree | QuestionDef[]): value is QuestionDef[] {
  return Array.isArray(value);
}

interface SyncResult {
  categoriesCreated: number;
  categoriesUpdated: number;
  questionsCreated: number;
  questionsSkipped: number;
}

function syncTree(
  db: ReturnType<typeof getDb>,
  tree: ContentTree,
  parentId: string | null,
  parentPath: string,
  result: SyncResult
) {
  for (const [name, value] of Object.entries(tree)) {
    const slug = slugify(name);
    const path = parentPath ? `${parentPath}/${slug}` : slug;

    // Upsert category
    let cat = db
      .prepare("SELECT id FROM categories WHERE path = ?")
      .get(path) as { id: string } | undefined;

    if (!cat) {
      const newId = crypto.randomUUID();
      db.prepare(
        "INSERT INTO categories (id, name, parent_id, path, sort_order) VALUES (?, ?, ?, ?, 0)"
      ).run(newId, name, parentId, path);
      cat = { id: newId };
      result.categoriesCreated++;
    } else {
      // Update name in case it changed
      db.prepare("UPDATE categories SET name = ?, parent_id = ? WHERE id = ?").run(
        name,
        parentId,
        cat.id
      );
      result.categoriesUpdated++;
    }

    if (isQuestionArray(value)) {
      // These are questions for this category
      for (const q of value) {
        const text = q.q.trim();
        const existing = db
          .prepare("SELECT id FROM questions WHERE category_id = ? AND text = ?")
          .get(cat.id, text);

        if (existing) {
          result.questionsSkipped++;
          continue;
        }

        const correctAnswers = Array.isArray(q.a) ? q.a : [q.a];
        const type: "single" | "multiple" =
          q.type ?? (correctAnswers.length > 1 ? "multiple" : "single");

        db.prepare(
          `INSERT INTO questions (id, category_id, text, type, correct, incorrect, difficulty, tags)
           VALUES (?, ?, ?, ?, ?, ?, 1, '[]')`
        ).run(
          crypto.randomUUID(),
          cat.id,
          text,
          type,
          JSON.stringify(correctAnswers),
          JSON.stringify(q.wrong ?? [])
        );
        result.questionsCreated++;
      }
    } else {
      // Recurse into subcategories
      syncTree(db, value, cat.id, path, result);
    }
  }
}

// POST /api/import  — syncs data/content.ts into the DB
export async function POST() {
  try {
    const db = getDb();
    const result: SyncResult = {
      categoriesCreated: 0,
      categoriesUpdated: 0,
      questionsCreated: 0,
      questionsSkipped: 0,
    };

    db.transaction(() => {
      syncTree(db, content, null, "", result);
    })();

    return NextResponse.json({ data: result, message: "Sync complete" });
  } catch (err) {
    console.error("[POST /import]", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

// GET /api/import — preview what's in content.ts without writing
export async function GET() {
  function countTree(tree: ContentTree | QuestionDef[]): { cats: number; qs: number } {
    if (Array.isArray(tree)) return { cats: 0, qs: tree.length };
    let cats = 0,
      qs = 0;
    for (const v of Object.values(tree)) {
      cats++;
      const sub = countTree(v as ContentTree | QuestionDef[]);
      cats += sub.cats;
      qs += sub.qs;
    }
    return { cats, qs };
  }

  const { cats, qs } = countTree(content);
  return NextResponse.json({
    data: { categories: cats, questions: qs },
    message: "Call POST /api/import to sync these into the database",
  });
}