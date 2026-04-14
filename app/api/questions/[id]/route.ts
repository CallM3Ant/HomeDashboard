import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

// ─── PATCH /api/categories/[id] ───────────────────────────────────────────────
// Move a category to a new parent (or to root if parent_id is null)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const { id } = await params;
    const { parent_id } = await req.json();

    const db = getDb();

    const category = db.prepare('SELECT id, path FROM categories WHERE id = ?').get(id) as
      | { id: string; path: string }
      | undefined;

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Prevent circular references: parent cannot be a descendant of this category
    if (parent_id) {
      const potentialParent = db.prepare('SELECT path FROM categories WHERE id = ?').get(parent_id) as
        | { path: string }
        | undefined;

      if (!potentialParent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 404 });
      }

      if (potentialParent.path.startsWith(category.path + '/')) {
        return NextResponse.json({ error: 'Cannot move a category into its own descendant' }, { status: 400 });
      }

      if (potentialParent.path === category.path) {
        return NextResponse.json({ error: 'Cannot move a category into itself' }, { status: 400 });
      }
    }

    // Build new path
    const categoryName = category.path.split('/').pop()!;
    let newPath: string;

    if (parent_id) {
      const parent = db.prepare('SELECT path FROM categories WHERE id = ?').get(parent_id) as { path: string };
      newPath = `${parent.path}/${categoryName}`;
    } else {
      newPath = categoryName;
    }

    // Check for path conflict
    if (newPath !== category.path) {
      const conflict = db.prepare('SELECT id FROM categories WHERE path = ? AND id != ?').get(newPath, id);
      if (conflict) {
        // Append timestamp to avoid conflict
        newPath = `${newPath}_${Date.now().toString(36)}`;
      }
    }

    const oldPathPrefix = category.path;
    const newPathPrefix = newPath;

    // Update this category and all its descendants' paths
    const descendants = db.prepare(`
      SELECT id, path FROM categories
      WHERE path = ? OR path LIKE ?
    `).all(oldPathPrefix, `${oldPathPrefix}/%`) as Array<{ id: string; path: string }>;

    const updatePath = db.prepare('UPDATE categories SET path = ?, parent_id = ? WHERE id = ?');

    db.transaction(() => {
      for (const desc of descendants) {
        if (desc.id === id) {
          updatePath.run(newPathPrefix, parent_id || null, desc.id);
        } else {
          const updatedPath = newPathPrefix + desc.path.slice(oldPathPrefix.length);
          // Keep the same parent_id for descendants (only top-level changes parent)
          const descParentId = desc.path.split('/').length > oldPathPrefix.split('/').length + 1
            ? null // will be recalculated
            : id;
          db.prepare('UPDATE categories SET path = ? WHERE id = ?').run(updatedPath, desc.id);
        }
      }
    })();

    return NextResponse.json({ message: 'Category moved', data: { id, parent_id: parent_id || null } });
  } catch (err) {
    console.error('[PATCH /categories/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE /api/categories/[id] ─────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const category = db.prepare('SELECT id, path FROM categories WHERE id = ?').get(id) as
      | { id: string; path: string }
      | undefined;

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Delete the category and all descendants
    db.prepare(`DELETE FROM categories WHERE path = ? OR path LIKE ?`).run(
      category.path,
      `${category.path}/%`
    );

    return NextResponse.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('[DELETE /categories/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}