import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

// ─── GET /api/categories ───────────────────────────────────────────────────────
export async function GET() {
  try {
    const db = getDb();

    const cats = db
      .prepare(
        `SELECT id, name, parent_id, path, sort_order, created_at
         FROM categories
         ORDER BY sort_order ASC, name ASC`
      )
      .all() as Array<{
      id: string;
      name: string;
      parent_id: string | null;
      path: string;
      sort_order: number;
      created_at: string;
    }>;

    // Count questions per category (direct only — we compute totals in tree)
    const counts = db
      .prepare("SELECT category_id, COUNT(*) as count FROM questions GROUP BY category_id")
      .all() as Array<{ category_id: string; count: number }>;

    const countMap = Object.fromEntries(counts.map((c) => [c.category_id, c.count]));

    const tree = buildTree(cats, countMap);

    return NextResponse.json({ data: tree });
  } catch (err) {
    console.error("[GET /categories]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/categories ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session)
      return NextResponse.json(
        { error: "Must be logged in to create categories" },
        { status: 401 }
      );

    const { name, parent_id } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length < 1)
      return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const db = getDb();

    let path: string;
    if (parent_id) {
      const parent = db
        .prepare("SELECT path FROM categories WHERE id = ?")
        .get(parent_id) as { path: string } | undefined;
      if (!parent)
        return NextResponse.json({ error: "Parent category not found" }, { status: 404 });
      path = `${parent.path}/${slugify(name.trim())}`;
    } else {
      path = slugify(name.trim());
    }

    const existing = db.prepare("SELECT id FROM categories WHERE path = ?").get(path);
    if (existing)
      return NextResponse.json(
        { error: "A category with this name already exists here" },
        { status: 409 }
      );

    const id = crypto.randomUUID();
    db.prepare(
      "INSERT INTO categories (id, name, parent_id, path, sort_order) VALUES (?, ?, ?, ?, 0)"
    ).run(id, name.trim(), parent_id || null, path);

    return NextResponse.json(
      {
        data: { id, name: name.trim(), parent_id: parent_id || null, path },
        message: "Category created",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /categories]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

interface CatNode {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  sort_order: number;
  created_at: string;
  subcategories: CatNode[];
  totalQuestions: number;
  directQuestions: number;
}

function buildTree(
  cats: Array<{
    id: string;
    name: string;
    parent_id: string | null;
    path: string;
    sort_order: number;
    created_at: string;
  }>,
  countMap: Record<string, number>
) {
  const map: Record<string, CatNode> = {};
  const roots: CatNode[] = [];

  for (const cat of cats) {
    map[cat.id] = {
      ...cat,
      subcategories: [],
      totalQuestions: countMap[cat.id] ?? 0,
      directQuestions: countMap[cat.id] ?? 0,
    };
  }

  for (const cat of cats) {
    if (cat.parent_id && map[cat.parent_id]) {
      map[cat.parent_id].subcategories.push(map[cat.id]);
    } else if (!cat.parent_id) {
      roots.push(map[cat.id]);
    }
  }

  // Compute recursive totals bottom-up
  function computeTotal(node: CatNode): number {
    let total = node.directQuestions;
    for (const child of node.subcategories) {
      total += computeTotal(child);
    }
    node.totalQuestions = total;
    return total;
  }

  for (const root of roots) {
    computeTotal(root);
  }

  return roots;
}