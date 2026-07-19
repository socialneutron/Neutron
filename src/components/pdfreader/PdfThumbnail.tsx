import React, { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import { usePdfReaderStore } from '../../stores/pdfReaderStore'

interface PdfThumbnailProps {
  pdfId: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

export default function PdfThumbnail({ pdfId, size, className, style }: PdfThumbnailProps) {
  const { pdfThumbnails, loadPdfThumbnail } = usePdfReaderStore()
  const [src, setSrc] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadPdfThumbnail(pdfId).then(url => {
      if (!cancelled) {
        setSrc(url)
        setLoaded(true)
      }
    })
    return () => { cancelled = true }
  }, [pdfId])

  if (src) {
    return (
      <img
        src={src}
        alt=""
        draggable={false}
        className={className}
        style={{
          width: size ? `${size}px` : '100%',
          height: size ? `${size}px` : '100%',
          objectFit: 'cover',
          display: 'block',
          ...style,
        }}
      />
    )
  }

  return (
    <div
      className={className}
      style={{
        width: size ? `${size}px` : '100%',
        height: size ? `${size}px` : '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        flexShrink: 0,
        ...style,
      }}
    >
      <FileText size={size ? Math.max(16, size * 0.4) : 28} color="#6b7280" />
    </div>
  )
}
