import {
  addVocabulary,
  deleteVocabulary,
  findVocabulariesByText,
  updateVocabulary,
} from "@/lib/vocabularyService";
import { NextResponse } from "next/server";

// GET /api/vocabulary?text=hello  -> findVocabulariesByText (limit 10)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text");

    if (text !== null) {
      const items = await findVocabulariesByText(text);
      return NextResponse.json({ data: items });
    }

    return NextResponse.json(
      { error: "Provide query param: text" },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/vocabulary   body: { originalWord?, text, pronunciation?, meaning[] }
export async function POST(request) {
  try {
    const body = await request.json();
    const item = await addVocabulary(body);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/vocabulary?id=xxx   body: { ...fields }
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const body = await request.json();
    const item = await updateVocabulary(id, body);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: item });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/vocabulary?id=xxx
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const item = await deleteVocabulary(id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: item });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
