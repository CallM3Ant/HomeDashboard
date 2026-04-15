import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// ─── PATCH /api/categories/[id] ───────────────────────────────────────────────
// Body: { name?: string, parent_id?: string | null }
// name      → rename the category
// parent_id → move to new parent (drag & drop)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session)
      return NextResponse.json({ error: "Must be logged in" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    const category = db
      .prepare("SELECT id, name, path, parent_id FROM categories WHERE id = ?")
      .get(id) as { id: string; name: string; path: string; parent_id: string | null } | undefined;

    if (!category)
      return NextResponse.json({ error: "Category not found" }, { status: 404 });

    // ── Rename ────────────────────────────────────────────────────────────────
    if ("name" in body && body.name !== undefined) {
      const newName = (body.name as string).trim();
      if (!newName) return NextResponse.json({ error: "Name is required" }, { status: 400 });

      const segments = category.path.split("/");
      const newSlug = newName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      segments[segments.length - 1] = newSlug;
      const newPath = segments.join("/");

      // Check conflict
      const conflict = db
        .prepare("SELECT id FROM categories WHERE path = ? AND id != ?")
        .get(newPath, id);
      if (conflict)
        return NextResponse.json(
          { error: "A category with this name already exists here" },
          { status: 409 }
        );

      const oldPrefix = category.path;
      const newPrefix = newPath;

      db.transaction(() => {
        // Update this category
        db.prepare("UPDATE categories SET name = ?, path = ? WHERE id = ?").run(
          newName,
          newPrefix,
          id
        );
        // Update all descendants
        const descendants = db
          .prepare("SELECT id, path FROM categories WHERE path LIKE ?")
          .all(`${oldPrefix}/%`) as Array<{ id: string; path: string }>;
        for (const d of descendants) {
          db.prepare("UPDATE categories SET path = ? WHERE id = ?").run(
            newPrefix + d.path.slice(oldPrefix.length),
            d.id
          );
        }
      })();

      return NextResponse.json({ message: "Category renamed", data: { id, name: newName } });
    }

    // ── Move (change parent) ──────────────────────────────────────────────────
    if ("parent_id" in body) {
      const parent_id = body.parent_id as string | null;

      if (parent_id) {
        const potentialParent = db
          .prepare("SELECT path FROM categories WHERE id = ?")
          .get(parent_id) as { path: string } | undefined;

        if (!potentialParent)
          return NextResponse.json({ error: "Parent category not found" }, { status: 404 });
        if (potentialParent.path.startsWith(category.path + "/"))
          return NextResponse.json(
            { error: "Cannot move a category into its own descendant" },
            { status: 400 }
          );
        if (potentialParent.path === category.path)
          return NextResponse.json(
            { error: "Cannot move a category into itself" },
            { status: 400 }
          );
      }

      const categoryName = category.path.split("/").pop()!;
      let newPath: string;
      if (parent_id) {
        const parent = db
          .prepare("SELECT path FROM categories WHERE id = ?")
          .get(parent_id) as { path: string };
        newPath = `${parent.path}/${categoryName}`;
      } else {
        newPath = categoryName;
      }

      // Check conflict
      if (newPath !== category.path) {
        const conflict = db
          .prepare("SELECT id FROM categories WHERE path = ? AND id != ?")
          .get(newPath, id);
        if (conflict) newPath = `${newPath}_${Date.now().toString(36)}`;
      }

      const oldPrefix = category.path;
      const newPrefix = newPath;

      db.transaction(() => {
        db.prepare("UPDATE categories SET path = ?, parent_id = ? WHERE id = ?").run(
          newPrefix,
          parent_id || null,
          id
        );
        const descendants = db
          .prepare("SELECT id, path FROM categories WHERE path LIKE ?")
          .all(`${oldPrefix}/%`) as Array<{ id: string; path: string }>;
        for (const d of descendants) {
          db.prepare("UPDATE categories SET path = ? WHERE id = ?").run(
            newPrefix + d.path.slice(oldPrefix.length),
            d.id
          );
        }
      })();

      return NextResponse.json({
        message: "Category moved",
        data: { id, parent_id: parent_id || null },
      });
    }

    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  } catch (err) {
    console.error("[PATCH /categories/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/categories/[id] ─────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session)
      return NextResponse.json({ error: "Must be logged in" }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const category = db
      .prepare("SELECT id, path FROM categories WHERE id = ?")
      .get(id) as { id: string; path: string } | undefined;

    if (!category)
      return NextResponse.json({ error: "Category not found" }, { status: 404 });

    db.transaction(() => {
      // Delete all questions in this category tree first
      const catIds = (
        db
          .prepare("SELECT id FROM categories WHERE path = ? OR path LIKE ?")
          .all(category.path, `${category.path}/%`) as Array<{ id: string }>
      ).map((c) => c.id);

      for (const cid of catIds) {
        db.prepare("DELETE FROM user_stats WHERE question_id IN (SELECT id FROM questions WHERE category_id = ?)").run(cid);
        db.prepare("DELETE FROM questions WHERE category_id = ?").run(cid);
      }

      db.prepare("DELETE FROM categories WHERE path = ? OR path LIKE ?").run(
        category.path,
        `${category.path}/%`
      );
    })();

    return NextResponse.json({ message: "Category deleted" });
  } catch (err) {
    console.error("[DELETE /categories/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}