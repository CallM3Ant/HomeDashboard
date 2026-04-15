import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [{ data: cats, error }, { data: questions }] = await Promise.all([
      supabase.from('categories').select('id, name, parent_id, path, sort_order, created_at')
        .order('sort_order', { ascending: true }).order('name', { ascending: true }),
      supabase.from('questions').select('category_id'),
    ]);

    if (error) throw error;

    const countMap: Record<string, number> = {};
    (questions || []).forEach(q => {
      countMap[q.category_id] = (countMap[q.category_id] || 0) + 1;
    });

    return NextResponse.json({ data: buildTree(cats || [], countMap) });
  } catch (err) {
    console.error("[GET /categories]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session)
      return NextResponse.json({ error: "Must be logged in to create categories" }, { status: 401 });

    const { name, parent_id } = await req.json();
    if (!name || typeof name !== "string" || !name.trim())
      return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    let path: string;

    if (parent_id) {
      const { data: parent } = await supabase.from('categories').select('path').eq('id', parent_id).single();
      if (!parent) return NextResponse.json({ error: "Parent category not found" }, { status: 404 });
      path = `${parent.path}/${slugify(name.trim())}`;
    } else {
      path = slugify(name.trim());
    }

    const { data: existing } = await supabase.from('categories').select('id').eq('path', path).single();
    if (existing)
      return NextResponse.json({ error: "A category with this name already exists here" }, { status: 409 });

    const { data: newCat, error } = await supabase
      .from('categories')
      .insert({ name: name.trim(), parent_id: parent_id || null, path, sort_order: 0 })
      .select('id, name, parent_id, path')
      .single();

    if (error) throw error;

    return NextResponse.json({ data: newCat, message: "Category created" }, { status: 201 });
  } catch (err) {
    console.error("[POST /categories]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

interface CatNode {
  id: string; name: string; parent_id: string | null; path: string;
  sort_order: number; created_at: string; subcategories: CatNode[];
  totalQuestions: number; directQuestions: number;
}

function buildTree(cats: any[], countMap: Record<string, number>) {
  const map: Record<string, CatNode> = {};
  const roots: CatNode[] = [];

  for (const cat of cats) {
    map[cat.id] = { ...cat, subcategories: [], totalQuestions: countMap[cat.id] ?? 0, directQuestions: countMap[cat.id] ?? 0 };
  }
  for (const cat of cats) {
    if (cat.parent_id && map[cat.parent_id]) map[cat.parent_id].subcategories.push(map[cat.id]);
    else if (!cat.parent_id) roots.push(map[cat.id]);
  }

  function computeTotal(node: CatNode): number {
    let total = node.directQuestions;
    for (const child of node.subcategories) total += computeTotal(child);
    node.totalQuestions = total;
    return total;
  }
  roots.forEach(computeTotal);
  return roots;
}