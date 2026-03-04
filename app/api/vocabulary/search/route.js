import { findVocabulariesByIncludedText } from "@/lib/vocabularyService";
import { checkApiPassword } from "@/lib/apiAuth";
import { NextResponse } from "next/server";

// POST /api/vocabulary/search
// body: { text: string }  <- đoạn markdown dài cần tìm vocabulary
export async function POST(request) {
  const authError = checkApiPassword(request);
  if (authError) return authError;

  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    const items = await findVocabulariesByIncludedText(text);
    return NextResponse.json({ data: items });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
