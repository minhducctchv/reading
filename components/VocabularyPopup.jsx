"use client";

import { useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "../lib/clientAuth";

/**
 * @param {{
 *   vocab: object|null,
 *   selectedText: string,
 *   position: {x: number, y: number},
 *   onClose: () => void,
 *   onSaved: (vocab: object) => void,
 *   onDeleted: (id: string) => void,
 * }} props
 */
export function VocabularyPopup({
  vocab,
  selectedText,
  position,
  onClose,
  onSaved,
  onDeleted,
}) {
  const [originalWord, setOriginalWord] = useState(vocab?.originalWord ?? "");
  const [text, setText] = useState(vocab?.text ?? selectedText ?? "");
  const [pronunciation, setPronunciation] = useState(
    vocab?.pronunciation ?? "",
  );
  const [meaning, setMeaning] = useState(vocab?.meaning?.join("\n") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const popupRef = useRef(null);
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

  // Sync khi vocab thay đổi (e.g. click từ highlight khác nhau)
  useEffect(() => {
    setOriginalWord(vocab?.originalWord ?? "");
    setText(vocab?.text ?? selectedText ?? "");
    setPronunciation(vocab?.pronunciation ?? "");
    setMeaning(vocab?.meaning?.join("\n") ?? "");
    setError("");
  }, [vocab, selectedText]);

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") onClose();
    }
    function handleDeleteKey(e) {
      if (e.key === "Delete" && vocab?._id && !loading) {
        handleDelete();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleDeleteKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleDeleteKey);
    };
  }, [onClose, vocab, loading]);

  async function handleSave(e) {
    e.preventDefault();
    const meanings = meaning
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!text.trim()) return setError("Text is required");
    if (meanings.length === 0) return setError("Meaning is required");
    setLoading(true);
    setError("");
    try {
      const body = {
        originalWord: originalWord.trim() || undefined,
        text: text.trim(),
        pronunciation: pronunciation.trim() || undefined,
        meaning: meanings,
      };
      let res;
      if (vocab?._id) {
        res = await fetchWithAuth(`/api/vocabulary?id=${vocab._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetchWithAuth("/api/vocabulary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      onSaved(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!vocab?._id) return;
    if (!confirm(`Delete "${vocab.text}"?`)) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/vocabulary?id=${vocab._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      onDeleted(vocab._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="vocab-popup-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={popupRef} className="vocab-popup">
        <div className="vocab-popup-header">
          <span className="vocab-popup-title">
            {vocab?._id ? "✏️ Edit Vocabulary" : "📝 Add Vocabulary"}
          </span>
          <button
            className="vocab-popup-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="vocab-popup-form">
          <div className="vocab-field">
            <label>
              Text <span className="required">*</span>
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Selected text"
              required
              disabled
            />
          </div>

          <div className="vocab-field">
            <label>
              Meaning <span className="required">*</span>
            </label>
            <textarea
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSave(e);
                }
              }}
              placeholder="One meaning per line (Shift+Enter for new line)"
              rows={3}
              required
              autoFocus={!isMobile}
            />
          </div>

          <div className="vocab-field">
            <label>Pronunciation</label>
            <input
              type="text"
              value={pronunciation}
              onChange={(e) => setPronunciation(e.target.value)}
              placeholder="e.g. /rʌn/"
            />
          </div>

          <div className="vocab-field">
            <label>Original Word</label>
            <input
              type="text"
              value={originalWord}
              onChange={(e) => setOriginalWord(e.target.value)}
              placeholder="e.g. run"
            />
          </div>

          {error && <div className="vocab-error">{error}</div>}

          <div className="vocab-popup-actions">
            {vocab?._id && (
              <button
                type="button"
                className="vocab-btn vocab-btn-delete"
                onClick={handleDelete}
                disabled={loading}
              >
                🗑 Delete
              </button>
            )}
            <button
              type="submit"
              className="vocab-btn vocab-btn-save"
              disabled={loading}
            >
              {loading ? "..." : vocab?._id ? "✓ Update" : "＋ Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
