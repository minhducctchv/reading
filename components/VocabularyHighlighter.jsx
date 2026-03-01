'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { VocabularyPopup } from './VocabularyPopup'

const HIGHLIGHT_CLASS = 'vocab-highlight'
const HIGHLIGHT_ATTR = 'data-vocab-id'

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
                    headers: { 'Content-Type': 'application/json' },
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

        // Build map: lowercase text → vocab
        const vocabMap = {}
        vocabList.forEach(v => {
            vocabMap[v.text.toLowerCase()] = v
        })

        // Sort by length desc để match longer phrases first
        const sortedTexts = Object.keys(vocabMap).sort((a, b) => b.length - a.length)

        textNodes.forEach(textNode => {
            const original = textNode.textContent
            if (!original.trim()) return

            let remaining = original
            let remainingIndex = 0
            const fragment = document.createDocumentFragment()
            let didMatch = false

            while (remaining.length > 0) {
                let matched = false
                const lowerRemaining = remaining.toLowerCase()

                for (const searchText of sortedTexts) {
                    const idx = lowerRemaining.indexOf(searchText)
                    if (idx === -1) continue

                    const vocab = vocabMap[searchText]

                    // Text trước match
                    if (idx > 0) {
                        fragment.appendChild(document.createTextNode(remaining.slice(0, idx)))
                    }

                    // Span highlight
                    const span = document.createElement('span')
                    span.className = HIGHLIGHT_CLASS
                    span.setAttribute(HIGHLIGHT_ATTR, vocab._id)
                    span.textContent = remaining.slice(idx, idx + searchText.length)
                    span.title = vocab.meaning?.join(' / ') ?? ''
                    fragment.appendChild(span)
                    highlightedRef.current.push(span)

                    remaining = remaining.slice(idx + searchText.length)
                    matched = true
                    didMatch = true
                    break
                }

                if (!matched) {
                    fragment.appendChild(document.createTextNode(remaining))
                    break
                }
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
