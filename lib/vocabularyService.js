import connectDB from "@/lib/db";
import Vocabulary from "@/models/Vocabulary";

/**
 * Thêm mới 1 item
 * @param {{ originalWord?: string, text: string, pronunciation?: string, meaning: string[] }} data
 */
export async function addVocabulary(data) {
  await connectDB();
  const item = await Vocabulary.create(data);
  return item.toObject();
}

/**
 * Update 1 item theo id
 * @param {string} id
 * @param {{ originalWord?: string, text?: string, pronunciation?: string, meaning?: string[] }} data
 */
export async function updateVocabulary(id, data) {
  await connectDB();
  const item = await Vocabulary.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  return item?.toObject() ?? null;
}

/**
 * Delete 1 item theo id
 * @param {string} id
 */
export async function deleteVocabulary(id) {
  await connectDB();
  const item = await Vocabulary.findByIdAndDelete(id);
  return item?.toObject() ?? null;
}

// Các ký tự markdown bị strip — dùng chung cho normalizeText()
const MARKDOWN_STRIP_RE = /[#*_`~\[\]()=>|\\]/g;

/**
 * Chuẩn hoá text: xoá ký tự markdown, collapse whitespace, lowercase.
 * Dùng cho phía JS (markdown input).
 * @param {string} text
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(MARKDOWN_STRIP_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tìm tất cả items mà field `text` xuất hiện bên trong đoạn markdown dài.
 * Cả hai phía đều được normalize bằng cùng hàm normalizeText() trong JS,
 * tránh mọi vấn đề về ký tự đặc biệt và không phụ thuộc vào version MongoDB.
 * @param {string} markdownText
 */
export async function findVocabulariesByIncludedText(markdownText) {
  await connectDB();

  const cleaned = normalizeText(markdownText);
  if (!cleaned) return [];

  const all = await Vocabulary.find({}).lean();
  return all.filter((item) => {
    const normalizedItemText = normalizeText(item.text ?? "");
    return normalizedItemText && cleaned.includes(normalizedItemText);
  });
}

/**
 * Tìm tất cả items theo text (exact or partial), giới hạn 10 kết quả
 * @param {string} text
 */
export async function findVocabulariesByText(text) {
  await connectDB();
  const items = await Vocabulary.find({
    text: { $regex: `^${text}`, $options: "i" },
  }).limit(10);
  return items.map((i) => i.toObject());
}
