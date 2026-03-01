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

/**
 * Tìm tất cả items mà field `text` xuất hiện bên trong đoạn markdown dài.
 * Loại bỏ các ký tự đặc biệt của markdown, sau đó để MongoDB tự filter
 * bằng $expr + $indexOfCP (không fetch toàn bộ collection về app).
 * @param {string} markdownText
 */
export async function findVocabulariesByIncludedText(markdownText) {
  await connectDB();

  // Loại bỏ ký tự đặc biệt markdown để tránh lỗi khi so sánh trong DB
  const cleaned = markdownText
    .toLowerCase()
    .replace(/[#*_`~\[\]()\-=>|\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return [];

  // MongoDB kiểm tra từng item: item.text có nằm trong cleaned markdown không
  const items = await Vocabulary.find({
    $expr: {
      $gte: [{ $indexOfCP: [cleaned, { $toLower: "$text" }] }, 0],
    },
  });
  return items.map((i) => i.toObject());
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
