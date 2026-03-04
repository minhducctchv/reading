'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { VocabularyPopup } from './VocabularyPopup'

const HIGHLIGHT_CLASS = 'vocab-highlight'
const HIGHLIGHT_ATTR = 'data-vocab-id'

// Đồng bộ với normalizeText() trong vocabularyService.js:
// chỉ strip ký tự markdown syntax, giữ lại '-', '.', "'" ... có trong vocabulary
const MARKDOWN_STRIP_RE = /[#*_`~\[\]()=>|\\]/g

function normalizeText(str) {
    return str
        .toLowerCase()
        .replace(MARKDOWN_STRIP_RE, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

export function VocabularyHighlighter() {
    const pathname = usePathname()
    const [vocabs, setVocabs] = useState([]) // list of {_id, text, ...}
    const [popup, setPopup] = useState(null) // { vocab|null, selectedText, position }
    const contentRootRef = useRef(null)
    const highlightedRef = useRef([]) // track injected spans for cleanup

    // ─── 1. Load vocabularies từ API mỗi khi route thay đổi ─────────────────
    useEffect(() => {
        async function loadVocabs() {
            try {
                const pageText = document.body.innerText
                const res = await fetch('/api/vocabulary/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-password': process.env.NEXT_PUBLIC_PASSWORD },
                    body: JSON.stringify({ text: pageText }),
                })
                if (!res.ok) return
                const json = await res.json()
                setVocabs(json.data ?? [])
            } catch (e) {
                console.error('[VocabularyHighlighter] load error:', e)
            }
        }
        // Đợi DOM của trang mới render xong rồi mới đọc innerText
        const id = setTimeout(() => loadVocabs(), 300)
        return () => clearTimeout(id)
    }, [pathname])

    // ─── 2. Highlight text nodes khi vocabs thay đổi ─────────────────────────
    const highlight = useCallback((vocabList) => {
        // Dọn highlight cũ
        highlightedRef.current.forEach(span => {
            const parent = span.parentNode
            if (!parent) return
            parent.replaceChild(document.createTextNode(span.textContent), span)
            parent.normalize()
        })
        highlightedRef.current = []

        if (!vocabList.length) return

        // Tìm content root (nextra renders article tag)
        const root = document.querySelector('article') ||
            document.querySelector('main') ||
            document.querySelector('.nextra-content') ||
            document.body

        contentRootRef.current = root

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                // Skip script/style/already-highlighted nodes
                const parent = node.parentElement
                if (!parent) return NodeFilter.FILTER_REJECT
                const tag = parent.tagName?.toLowerCase()
                if (['script', 'style', 'noscript', 'textarea', 'input'].includes(tag)) {
                    return NodeFilter.FILTER_REJECT
                }
                if (parent.classList?.contains(HIGHLIGHT_CLASS)) {
                    return NodeFilter.FILTER_REJECT
                }
                return NodeFilter.FILTER_ACCEPT
            }
        })

        const textNodes = []
        let node
        while ((node = walker.nextNode())) {
            textNodes.push(node)
        }

        // Build map: normalizedText → { vocab, originalLength }
        // Dùng regex để match case-insensitive + ignore special chars
        const vocabEntries = vocabList.map(v => {
            const normalized = normalizeText(v.text)
            // Escape regex special chars trong normalized text, rồi cho phép \W* giữa các từ
            const escapedParts = normalized.split(/\s+/).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            // Pattern: các phần từ ngăn cách bởi ký tự đặc biệt / khoảng trắng tùy ý
            const pattern = escapedParts.join('[^\\p{L}\\p{N}]*')
            // Word boundary: không match khi vocab chỉ là 1 phần của word
            // (?<!\p{L}|\p{N}) = trước match không phải letter/number
            // (?!\p{L}|\p{N})  = sau match không phải letter/number
            const regex = new RegExp(`(?<!\\p{L}|\\p{N})${pattern}(?!\\p{L}|\\p{N})`, 'iu')
            return { vocab: v, normalized, regex }
        }).filter(e => e.normalized.length > 0)

        // Sort by normalized length desc để match longer phrases first
        vocabEntries.sort((a, b) => b.normalized.length - a.normalized.length)

        textNodes.forEach(textNode => {
            const original = textNode.textContent
            if (!original.trim()) return

            let remaining = original
            const fragment = document.createDocumentFragment()
            let didMatch = false

            while (remaining.length > 0) {
                // Tìm match sớm nhất (earliest index) trong tất cả vocabs.
                // Nếu cùng index, ưu tiên match dài hơn.
                let bestMatch = null // { idx, matchLen, vocab }

                for (const { vocab, regex } of vocabEntries) {
                    const m = regex.exec(remaining)
                    if (!m) continue

                    const idx = m.index
                    const matchLen = m[0].length

                    if (
                        bestMatch === null ||
                        idx < bestMatch.idx ||
                        (idx === bestMatch.idx && matchLen > bestMatch.matchLen)
                    ) {
                        bestMatch = { idx, matchLen, vocab }
                    }
                }

                if (!bestMatch) {
                    fragment.appendChild(document.createTextNode(remaining))
                    break
                }

                const { idx, matchLen, vocab } = bestMatch

                // Text trước match
                if (idx > 0) {
                    fragment.appendChild(document.createTextNode(remaining.slice(0, idx)))
                }

                // Span highlight – giữ nguyên text gốc
                const span = document.createElement('span')
                span.className = HIGHLIGHT_CLASS
                span.setAttribute(HIGHLIGHT_ATTR, vocab._id)
                span.textContent = remaining.slice(idx, idx + matchLen)
                span.title = vocab.meaning?.join(' / ') ?? ''
                fragment.appendChild(span)
                highlightedRef.current.push(span)

                remaining = remaining.slice(idx + matchLen)
                didMatch = true
            }

            if (didMatch && textNode.parentNode) {
                textNode.parentNode.replaceChild(fragment, textNode)
            }
        })
    }, [])

    useEffect(() => {
        highlight(vocabs)
    }, [vocabs, highlight])

    // ─── 3. Click handler cho highlight spans (event delegation) ──────────────
    useEffect(() => {
        function handleClick(e) {
            const span = e.target.closest?.(`.${HIGHLIGHT_CLASS}`)
            if (!span) return
            const id = span.getAttribute(HIGHLIGHT_ATTR)
            const vocab = vocabs.find(v => String(v._id) === id)
            if (!vocab) return
            e.preventDefault()
            e.stopPropagation()
            const rect = span.getBoundingClientRect()
            setPopup({
                vocab,
                selectedText: vocab.text,
                position: {
                    x: rect.left + window.scrollX,
                    y: rect.bottom + window.scrollY,
                }
            })
        }
        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [vocabs])

    // ─── 4. Keyboard shortcut: (Cmd | Ctrl | Alt) + K ────────────────────────
    useEffect(() => {
        function handleKeydown(e) {
            if (e.key !== 'k' && e.key !== 'K') return
            if (!e.metaKey && !e.ctrlKey && !e.altKey) return

            const selection = window.getSelection()
            const selectedText = selection?.toString().trim()
            if (!selectedText) return

            e.preventDefault()

            const range = selection.getRangeAt(0)
            const rect = range.getBoundingClientRect()

            // Kiểm tra xem text này đã có trong vocab chưa
            const existing = vocabs.find(
                v => v.text.toLowerCase() === selectedText.toLowerCase()
            )

            setPopup({
                vocab: existing ?? null,
                selectedText,
                position: {
                    x: rect.left + window.scrollX,
                    y: rect.bottom + window.scrollY,
                }
            })
        }
        document.addEventListener('keydown', handleKeydown)
        return () => document.removeEventListener('keydown', handleKeydown)
    }, [vocabs])

    // ─── 5. Popup callbacks ───────────────────────────────────────────────────
    const handleClose = useCallback(() => setPopup(null), [])

    const handleSaved = useCallback((savedVocab) => {
        setVocabs(prev => {
            const idx = prev.findIndex(v => v._id === savedVocab._id)
            if (idx >= 0) {
                const next = [...prev]
                next[idx] = savedVocab
                return next
            }
            return [...prev, savedVocab]
        })
        setPopup(null)
    }, [])

    const handleDeleted = useCallback((id) => {
        setVocabs(prev => prev.filter(v => String(v._id) !== String(id)))
        setPopup(null)
    }, [])

    if (!popup) return null

    return (
        <VocabularyPopup
            vocab={popup.vocab}
            selectedText={popup.selectedText}
            position={popup.position}
            onClose={handleClose}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
        />
    )
}
