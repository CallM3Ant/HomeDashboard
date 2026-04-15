import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "Must be logged in" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const supabase = getSupabaseAdmin();

    const { data: category } = await supabase
      .from('categories').select('id, name, path, parent_id').eq('id', id).single();
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    // ── Rename ──────────────────────────────────────────────────────────────
    if ("name" in body && body.name !== undefined) {
      const newName = (body.name as string).trim();
      if (!newName) return NextResponse.json({ error: "Name is required" }, { status: 400 });

      const segments = category.path.split("/");
      segments[segments.length - 1] = newName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const newPath = segments.join("/");

      const { data: conflict } = await supabase
        .from('categories').select('id').eq('path', newPath).neq('id', id).single();
      if (conflict)
        return NextResponse.json({ error: "A category with this name already exists here" }, { status: 409 });

      const oldPrefix = category.path;
      await supabase.from('categories').update({ name: newName, path: newPath }).eq('id', id);

      const { data: descendants } = await supabase
        .from('categories').select('id, path').like('path', `${oldPrefix}/%`);
      for (const d of descendants || []) {
        await supabase.from('categories')
          .update({ path: newPath + d.path.slice(oldPrefix.length) }).eq('id', d.id);
      }

      return NextResponse.json({ message: "Category renamed", data: { id, name: newName } });
    }

    // ── Move ─────────────────────────────────────────────────────────────────
    if ("parent_id" in body) {
      const parent_id = body.parent_id as string | null;

      if (parent_id) {
        const { data: potentialParent } = await supabase
          .from('categories').select('path').eq('id', parent_id).single();
        if (!potentialParent) return NextResponse.json({ error: "Parent category not found" }, { status: 404 });
        if (potentialParent.path.startsWith(category.path + "/"))
          return NextResponse.json({ error: "Cannot move a category into its own descendant" }, { status: 400 });
      }

      const categoryName = category.path.split("/").pop()!;
      let newPath: string;

      if (parent_id) {
        const { data: parent } = await supabase.from('categories').select('path').eq('id', parent_id).single();
        newPath = `${parent!.path}/${categoryName}`;
      } else {
        newPath = categoryName;
      }

      if (newPath !== category.path) {
        const { data: conflict } = await supabase
          .from('categories').select('id').eq('path', newPath).neq('id', id).single();
        if (conflict) newPath = `${newPath}_${Date.now().toString(36)}`;
      }

      const oldPrefix = category.path;
      await supabase.from('categories')
        .update({ path: newPath, parent_id: parent_id || null }).eq('id', id);

      const { data: descendants } = await supabase
        .from('categories').select('id, path').like('path', `${oldPrefix}/%`);
      for (const d of descendants || []) {
        await supabase.from('categories')
          .update({ path: newPath + d.path.slice(oldPrefix.length) }).eq('id', d.id);
      }

      return NextResponse.json({ message: "Category moved", data: { id, parent_id: parent_id || null } });
    }

    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  } catch (err) {
    console.error("[PATCH /categories/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "Must be logged in" }, { status: 401 });

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data: category } = await supabase
      .from('categories').select('id, path').eq('id', id).single();
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const { data: allCats } = await supabase
      .from('categories').select('id')
      .or(`path.eq.${category.path},path.like.${category.path}/%`);

    const catIds = (allCats || []).map(c => c.id);
    if (catIds.length > 0) {
      const { data: qs } = await supabase.from('questions').select('id').in('category_id', catIds);
      const qIds = (qs || []).map(q => q.id);
      if (qIds.length > 0) {
        await supabase.from('user_stats').delete().in('question_id', qIds);
        await supabase.from('questions').delete().in('category_id', catIds);
      }
      await supabase.from('categories').delete().in('id', catIds);
    }

    return NextResponse.json({ message: "Category deleted" });
  } catch (err) {
    console.error("[DELETE /categories/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}