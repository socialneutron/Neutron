import React, { useEffect, useRef, useState, useCallback } from 'react'
import { pdfjsLib } from '../../lib/pdfjs'
import { usePdfReaderStore } from '../../stores/pdfReaderStore'

const C = {
  bg: '#020617',
  text: '#f1f5f9',
  muted: '#6b7280',
  accent: '#00D2FF',
}

const TEXT_LAYER_CSS = `
.pdf-reader-page { position: relative; margin: 0 auto 16px; }
.pdf-reader-canvas { display: block; max-width: 100%; height: auto; }
.pdf-text-layer {
  position: absolute; inset: 0; overflow: clip;
  opacity: 0.25; line-height: 1.0;
}
.pdf-text-layer::selection { background: rgba(0, 150, 255, 0.35); }
.pdf-text-layer ::selection { background: rgba(0, 150, 255, 0.35); }
.pdf-text-layer span {
  color: transparent; position: absolute; white-space: pre;
  transform-origin: 0% 0%;
}
.pdf-page-current { outline: 2px solid rgba(0, 210, 255, 0.3); outline-offset: 4px; border-radius: 4px; }
`

interface PdfViewerProps {
  dataUrl: string
  onPageChange: (page: number) => void
  onSelectionChange: (text: string, rect: { x: number; y: number; width: number; height: number }) => void
}

export default function PdfViewer({ dataUrl, onPageChange, onSelectionChange }: PdfViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pagesRef = useRef<Map<number, HTMLDivElement>>(new Map())
  const renderTasksRef = useRef<Map<number, any>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)

  const { currentPage, zoom, setCurrentPage, setTotalPages, readingMode } = usePdfReaderStore()
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [numPages, setNumPages] = useState(0)
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const modeColors: Record<string, { bg: string; text: string }> = {
    light: { bg: '#ffffff', text: '#1a1a1a' },
    dark: { bg: '#1a1a2e', text: '#e0e0e0' },
    sepia: { bg: '#f4ecd8', text: '#5b4636' },
    'eye-protection': { bg: '#fef9e7', text: '#5d4e37' },
  }

  // Load PDF document
  useEffect(() => {
    let cancelled = false
    const loadPdf = async () => {
      try {
        let pdfData: ArrayBuffer
        if (dataUrl.startsWith('data:')) {
          const base64 = dataUrl.split(',')[1]
          const binaryString = atob(base64)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          pdfData = bytes.buffer
        } else {
          const response = await fetch(dataUrl)
          pdfData = await response.arrayBuffer()
        }
        const doc = await pdfjsLib.getDocument({ data: pdfData }).promise
        if (!cancelled) {
          setPdfDoc(doc)
          setNumPages(doc.numPages)
          setTotalPages(doc.numPages)
          setRenderedPages(new Set())
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load PDF')
      }
    }
    loadPdf()
    return () => { cancelled = true }
  }, [dataUrl])

  // Destroy PDF on unmount
  useEffect(() => {
    return () => {
      if (pdfDoc) {
        renderTasksRef.current.forEach(task => { try { task.cancel() } catch {} })
        renderTasksRef.current.clear()
        pdfDoc.destroy()
      }
    }
  }, [pdfDoc])

  // Render a single page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || renderedPages.has(pageNum)) return

    const page = await pdfDoc.getPage(pageNum)
    const container = pagesRef.current.get(pageNum)
    if (!container) return

    // Cancel any existing render task for this page
    const existingTask = renderTasksRef.current.get(pageNum)
    if (existingTask) { try { existingTask.cancel() } catch {} }

    // Calculate scale based on container width
    const containerWidth = Math.min(container.clientWidth, 700)
    const viewport = page.getViewport({ scale: 1 })
    const scale = (containerWidth / viewport.width) * zoom
    const scaledViewport = page.getViewport({ scale })

    // Render canvas
    let canvas = container.querySelector('canvas') as HTMLCanvasElement
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.className = 'pdf-reader-canvas'
      container.insertBefore(canvas, container.firstChild)
    }
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height

    const ctx = canvas.getContext('2d')!
    const mode = modeColors[readingMode] || modeColors.dark
    ctx.fillStyle = mode.bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const renderTask = page.render({ canvasContext: ctx, viewport: scaledViewport })
    renderTasksRef.current.set(pageNum, renderTask)

    try {
      await renderTask.promise
    } catch (err: any) {
      if (err?.name === 'RenderingCancelledException') return
    } finally {
      renderTasksRef.current.delete(pageNum)
    }

    // Render text layer
    let textLayerDiv = container.querySelector('.pdf-text-layer') as HTMLDivElement
    if (!textLayerDiv) {
      textLayerDiv = document.createElement('div')
      textLayerDiv.className = 'pdf-text-layer'
      container.appendChild(textLayerDiv)
    }

    try {
      const textContent = await page.getTextContent()
      // Clear old text layer content
      textLayerDiv.innerHTML = ''

      // Build text layer spans manually (more reliable than renderTextLayer across versions)
      for (const item of textContent.items) {
        if (!item.str) continue
        const span = document.createElement('span')
        span.textContent = item.str

        const tx = pdfjsLib.Util.transform(
          pdfjsLib.Util.transform(scaledViewport.transform, item.transform),
          [1, 0, 0, -1, 0, 0]
        )

        const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3])
        span.style.fontSize = `${fontHeight}px`
        span.style.fontFamily = item.fontName || 'sans-serif'
        span.style.left = `${tx[4]}px`
        span.style.top = `${tx[5] - fontHeight}px`
        span.style.width = `${item.width * scale}px`
        span.style.height = `${item.height * scale}px`

        textLayerDiv.appendChild(span)
      }
    } catch {}

    setRenderedPages(prev => new Set([...prev, pageNum]))
  }, [pdfDoc, zoom, readingMode, renderedPages])

  // Render visible pages + nearby pages (virtual rendering)
  const renderVisiblePages = useCallback(() => {
    if (!pdfDoc || !scrollRef.current) return
    const scrollTop = scrollRef.current.scrollTop
    const viewportHeight = scrollRef.current.clientHeight

    for (let i = 1; i <= numPages; i++) {
      const pageEl = pagesRef.current.get(i)
      if (!pageEl) continue
      const rect = pageEl.getBoundingClientRect()
      const containerRect = scrollRef.current.getBoundingClientRect()

      const pageTop = rect.top - containerRect.top + scrollTop
      const pageBottom = pageTop + rect.height

      // Render page if it's within viewport + 2 pages buffer
      if (pageBottom >= scrollTop - 800 && pageTop <= scrollTop + viewportHeight + 800) {
        renderPage(i)
      }
    }
  }, [pdfDoc, numPages, renderPage])

  // Set up IntersectionObserver for page tracking
  useEffect(() => {
    if (!scrollRef.current || numPages === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page') || '0')
            if (pageNum > 0) {
              setCurrentPage(pageNum - 1) // 0-indexed in store
              onPageChange(pageNum - 1)
            }
          }
        }
      },
      {
        root: scrollRef.current,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0,
      }
    )

    pagesRef.current.forEach((el) => {
      observerRef.current!.observe(el)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [numPages, setCurrentPage, onPageChange])

  // Render visible pages on scroll + zoom change
  useEffect(() => {
    renderVisiblePages()
  }, [renderVisiblePages, zoom])

  // Re-render all rendered pages when zoom changes
  useEffect(() => {
    setRenderedPages(new Set())
    renderTasksRef.current.forEach(task => { try { task.cancel() } catch {} })
    renderTasksRef.current.clear()
    // Clear canvases and text layers
    pagesRef.current.forEach((container) => {
      const canvas = container.querySelector('canvas')
      if (canvas) canvas.remove()
      const textLayer = container.querySelector('.pdf-text-layer')
      if (textLayer) textLayer.remove()
    })
  }, [zoom])

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim()
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      onSelectionChange(text, {
        x: rect.left + rect.width / 2,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      })
    }
  }, [onSelectionChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <style>{TEXT_LAYER_CSS}</style>
      <div
        ref={scrollRef}
        onScroll={renderVisiblePages}
        onMouseUp={handleMouseUp}
        style={{
          flex: 1, overflow: 'auto',
          background: modeColors[readingMode]?.bg || '#1a1a2e',
          color: modeColors[readingMode]?.text || '#e0e0e0',
          padding: '16px 0',
        }}
      >
        {error ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: C.muted }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>{error}</p>
          </div>
        ) : (
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
            {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
              <div
                key={pageNum}
                data-page={pageNum}
                ref={(el) => { if (el) pagesRef.current.set(pageNum, el) }}
                className={`pdf-reader-page ${currentPage === pageNum - 1 ? 'pdf-page-current' : ''}`}
              >
                {!renderedPages.has(pageNum) && (
                  <div style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    height: 400, background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                    marginBottom: 16,
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: `2px solid ${C.muted}40`, borderTopColor: C.accent,
                      animation: 'spin 1s linear infinite',
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
