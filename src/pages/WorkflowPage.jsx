import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import {
  Plus, Minus, Trash2, GripVertical, ArrowLeft, PanelLeftClose, PanelLeft,
  Grid3X3, Square, Shapes, MousePointer2, Image as ImageIcon,
  Circle, Save, Upload, Pencil,
  RotateCcw, Camera, Undo2, Redo2, Bot, LayoutTemplate,
  Triangle, Pentagon, Hexagon, Octagon, Star, RectangleHorizontal,
  Cylinder, Cloud, FileText, ChevronDown, ChevronRight, BarChart3,
} from 'lucide-react'

import WorkflowChat from '../components/WorkflowChat'
import WorkflowTemplates from '../components/WorkflowTemplates'
import BusinessTracker from '../components/business/BusinessTracker'
import PdfLibraryView from '../components/pdfreader/PdfLibraryView'
import PdfReaderScreen from '../components/pdfreader/PdfReaderScreen'
import { useWorkflowHistory } from '../hooks/useWorkflowHistory'

const C = {
  bg: '#05050A',
  card: '#090914',
  cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF',
  purple: '#7928CA',
  green: '#34D399',
  text: '#f1f5f9',
  muted: '#6b7280',
  tagBdr: 'rgba(255,255,255,0.08)',
}

const SHAPES = {
  rectangle: {
    label: 'Process',
    icon: Square,
    width: 220, height: 62,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: null,
    borderRadius: 10,
    portAdjust: {},
    contentPad: '6px 14px',
  },
  parallelogram: {
    label: 'Input/Output',
    icon: Shapes,
    width: 220, height: 73,
    outPort: { x: 0.88, y: 1 },
    inPort: { x: 0.12, y: 0 },
    clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)',
    borderRadius: 0,
    portAdjust: { left: { x: 0.05, y: 0.5 }, right: { x: 0.95, y: 0.5 } },
    contentPad: '8px 22px',
  },
  diamond: {
    label: 'Decision',
    icon: Shapes,
    width: 195, height: 75,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    borderRadius: 0,
    portAdjust: {
      top: { x: 0.5, y: 0 },
      bottom: { x: 0.5, y: 1 },
      left: { x: 0, y: 0.5 },
      right: { x: 1, y: 0.5 },
    },
    contentPad: '18px 20px',
  },
  circle: {
    label: 'Circle',
    icon: Circle,
    width: 117, height: 117,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: 'circle(50%)',
    borderRadius: 0,
    portAdjust: {},
    contentPad: '28px 18px',
  },
  image: {
    label: 'Photo',
    icon: ImageIcon,
    width: 200, height: 160,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: null,
    borderRadius: 10,
    portAdjust: {},
    contentPad: '0',
  },
  stadium: {
    label: 'Start/End',
    icon: RectangleHorizontal,
    width: 200, height: 62,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: null,
    borderRadius: 31,
    portAdjust: {},
    contentPad: '6px 20px',
  },
  triangle: {
    label: 'Triangle',
    icon: Triangle,
    width: 200, height: 170,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    borderRadius: 0,
    portAdjust: {
      top: { x: 0.5, y: 0 },
      bottom: { x: 0.5, y: 1 },
      left: { x: 0.125, y: 0.75 },
      right: { x: 0.875, y: 0.75 },
    },
    contentPad: '60px 20px 16px',
  },
  pentagon: {
    label: 'Pentagon',
    icon: Pentagon,
    width: 200, height: 185,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
    borderRadius: 0,
    portAdjust: {
      top: { x: 0.5, y: 0 },
      bottom: { x: 0.5, y: 1 },
      left: { x: 0, y: 0.38 },
      right: { x: 1, y: 0.38 },
    },
    contentPad: '40px 20px 30px',
  },
  hexagon: {
    label: 'Hexagon',
    icon: Hexagon,
    width: 210, height: 185,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    borderRadius: 0,
    portAdjust: {
      top: { x: 0.5, y: 0 },
      bottom: { x: 0.5, y: 1 },
      left: { x: 0, y: 0.5 },
      right: { x: 1, y: 0.5 },
    },
    contentPad: '36px 30px',
  },
  octagon: {
    label: 'Octagon',
    icon: Octagon,
    width: 200, height: 185,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    borderRadius: 0,
    portAdjust: {
      top: { x: 0.5, y: 0 },
      bottom: { x: 0.5, y: 1 },
      left: { x: 0, y: 0.5 },
      right: { x: 1, y: 0.5 },
    },
    contentPad: '36px 24px',
  },
  star: {
    label: 'Star',
    icon: Star,
    width: 200, height: 190,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    borderRadius: 0,
    portAdjust: {
      top: { x: 0.5, y: 0 },
      bottom: { x: 0.5, y: 0.91 },
      left: { x: 0.02, y: 0.35 },
      right: { x: 0.98, y: 0.35 },
    },
    contentPad: '50px 30px 40px',
  },
  cylinder: {
    label: 'Database',
    icon: Cylinder,
    width: 200, height: 130,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: 'polygon(0% 15%, 5% 8%, 50% 0%, 95% 8%, 100% 15%, 100% 85%, 95% 92%, 50% 100%, 5% 92%, 0% 85%)',
    borderRadius: 0,
    portAdjust: {},
    contentPad: '28px 16px',
  },
  cloud: {
    label: 'External',
    icon: Cloud,
    width: 220, height: 130,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: 'polygon(25% 70%, 12% 55%, 15% 38%, 28% 25%, 42% 18%, 58% 18%, 72% 25%, 85% 38%, 88% 55%, 75% 70%)',
    borderRadius: 0,
    portAdjust: {
      top: { x: 0.5, y: 0.18 },
      bottom: { x: 0.5, y: 0.7 },
      left: { x: 0.12, y: 0.55 },
      right: { x: 0.88, y: 0.55 },
    },
    contentPad: '36px 30px 20px',
  },
  document: {
    label: 'Document',
    icon: FileText,
    width: 200, height: 140,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: 'polygon(0% 0%, 85% 0%, 100% 15%, 100% 100%, 0% 100%)',
    borderRadius: 0,
    portAdjust: {},
    contentPad: '16px 16px',
  },
  pill: {
    label: 'Delay',
    icon: Circle,
    width: 200, height: 100,
    outPort: { x: 0.5, y: 1 },
    inPort: { x: 0.5, y: 0 },
    clipPath: null,
    borderRadius: 50,
    portAdjust: {
      top: { x: 0.5, y: 0 },
      bottom: { x: 0.5, y: 1 },
      left: { x: 0, y: 0.5 },
      right: { x: 1, y: 0.5 },
    },
    contentPad: '6px 16px',
  },
}

const DEPARTMENTS = {
  '': { label: 'None', color: '', border: '' },
  engineering: { label: 'Engineering', color: '#00D2FF', border: 'rgba(0,210,255,0.5)' },
  marketing: { label: 'Marketing', color: '#f59e0b', border: 'rgba(245,158,11,0.5)' },
  sales: { label: 'Sales', color: '#34D399', border: 'rgba(52,211,153,0.5)' },
  hr: { label: 'HR', color: '#ec4899', border: 'rgba(236,72,153,0.5)' },
  finance: { label: 'Finance', color: '#8b5cf6', border: 'rgba(139,92,246,0.5)' },
  operations: { label: 'Operations', color: '#f97316', border: 'rgba(249,115,22,0.5)' },
}

const INTEGRATIONS = {
  '': { label: 'None', color: '', bg: '' },
  google: { label: 'Google WS', color: '#4285F4', bg: 'rgba(66,133,244,0.15)' },
  gmail: { label: 'Gmail', color: '#EA4335', bg: 'rgba(234,67,53,0.15)' },
  slack: { label: 'Slack', color: '#4A154B', bg: 'rgba(74,21,75,0.15)' },
  stripe: { label: 'Stripe', color: '#635BFF', bg: 'rgba(99,91,255,0.15)' },
  hubspot: { label: 'HubSpot', color: '#FF7A59', bg: 'rgba(255,122,89,0.15)' },
  zapier: { label: 'Zapier', color: '#FF4A00', bg: 'rgba(255,74,0,0.15)' },
}

const PORT_POSITIONS = {
  top: { x: 0.5, y: 0, dx: 0, dy: -1 },
  right: { x: 1, y: 0.5, dx: 1, dy: 0 },
  bottom: { x: 0.5, y: 1, dx: 0, dy: 1 },
  left: { x: 0, y: 0.5, dx: -1, dy: 0 },
}

function parseHours(str) {
  if (!str) return 0
  const s = String(str).toLowerCase().trim()
  const num = parseFloat(s)
  if (isNaN(num)) return 0
  if (s.includes('w')) return num * 40
  if (s.includes('d')) return num * 8
  if (s.includes('h')) return num
  return num
}

function formatHours(h) {
  if (h < 8) return `${h}h`
  const d = Math.floor(h / 8)
  const r = h % 8
  return r ? `${d}d ${r}h` : `${d}d`
}

function getShapeConfig(tag) {
  const cfg = SHAPES[tag.shape] || SHAPES.rectangle
  const textLen = (tag.text || '').length
  const charWidth = tag.shape === 'diamond' ? 9 : 7.5
  const dynamicWidth = Math.max(cfg.width, Math.min(360, Math.ceil(textLen * charWidth) + 50))
  const lines = (tag.text || '').split('\n').length
  const dynamicHeight = Math.max(cfg.height, 44 + lines * 16)
  return {
    ...cfg,
    width: dynamicWidth,
    height: dynamicHeight,
  }
}

function getPortPoint(tag, port = 'bottom') {
  const cfg = getShapeConfig(tag)
  const base = PORT_POSITIONS[port] || PORT_POSITIONS.bottom
  const adj = cfg.portAdjust?.[port] || { x: base.x, y: base.y }
  return { x: tag.x + cfg.width * adj.x, y: tag.y + cfg.height * adj.y, dx: base.dx, dy: base.dy }
}

function getConnectionPath(fromTag, toTag, fromPort = 'bottom', toPort = 'top') {
  const p1 = getPortPoint(fromTag, fromPort)
  const p2 = getPortPoint(toTag, toPort)

  const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
  const ext = Math.max(30, Math.min(100, dist * 0.35))

  const cp1 = { x: p1.x + p1.dx * ext, y: p1.y + p1.dy * ext }
  const cp2 = { x: p2.x + p2.dx * ext, y: p2.y + p2.dy * ext }

  return {
    x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
    d: `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`,
  }
}


export default function WorkflowPage({ navigate }) {
  const {
    tags, setTags,
    connections, setConnections,
    nextId, setNextId,
    undo, redo, canUndo, canRedo,
  } = useWorkflowHistory([
    { id: '1', text: 'Define Objective', x: 260, y: 40, shape: 'rectangle', duration: '', cost: '', department: '', app: 'google' },
    { id: '2', text: 'Gather Requirements', x: 260, y: 120, shape: 'rectangle', duration: '3d', cost: '5000', department: 'engineering', app: 'google' },
    { id: '3', text: 'Feasible?', x: 260, y: 200, shape: 'diamond', duration: '1d', cost: '2000', department: 'finance', app: '' },
    { id: '4', text: 'Design Solution', x: 80, y: 310, shape: 'rectangle', duration: '5d', cost: '8000', department: 'engineering', app: 'slack' },
    { id: '5', text: 'Export Spec', x: 440, y: 310, shape: 'parallelogram', duration: '2d', cost: '3000', department: 'operations', app: 'stripe' },
    { id: '6', text: 'Implement', x: 80, y: 400, shape: 'rectangle', duration: '10d', cost: '15000', department: 'engineering', app: 'hubspot' },
    { id: '7', text: 'Test & Validate', x: 80, y: 480, shape: 'rectangle', duration: '4d', cost: '6000', department: 'marketing', app: '' },
    { id: '8', text: 'Deploy', x: 80, y: 560, shape: 'rectangle', duration: '2d', cost: '4000', department: 'operations', app: '' },
  ], [
    { from: '1', to: '2', fromPort: 'bottom', toPort: 'top', label: '' },
    { from: '2', to: '3', fromPort: 'bottom', toPort: 'top', label: '' },
    { from: '3', to: '4', fromPort: 'bottom', toPort: 'top', label: 'Yes' },
    { from: '3', to: '5', fromPort: 'right', toPort: 'left', label: 'No' },
    { from: '4', to: '6', fromPort: 'bottom', toPort: 'top', label: '' },
    { from: '6', to: '7', fromPort: 'bottom', toPort: 'top', label: '' },
    { from: '7', to: '8', fromPort: 'bottom', toPort: 'top', label: '' },
  ], 9)
  const [selectedTag, setSelectedTag] = useState(null)
  const [hoveredTag, setHoveredTag] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')
  const [connectingFrom, setConnectingFrom] = useState(null)
  const [connectingPort, setConnectingPort] = useState('bottom')
  const [connectingMouse, setConnectingMouse] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [showConfirmDelete, setShowConfirmDelete] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [gridSnap, setGridSnap] = useState(true)
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [editingConnectionLabel, setEditingConnectionLabel] = useState('')
  const [sidebarTab, setSidebarTab] = useState('tools')
  const [activeView, setActiveView] = useState(null)
  const [isDrawingNode, setIsDrawingNode] = useState(false)
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 })
  const [drawCurrent, setDrawCurrent] = useState({ x: 0, y: 0 })
  const [drawShapeMenu, setDrawShapeMenu] = useState(null)
  const drawRef = useRef({ isDrawingNode: false, start: { x: 0, y: 0 }, current: { x: 0, y: 0 } })
  const [photoAssets, setPhotoAssets] = useState([])
  const [draggingAsset, setDraggingAsset] = useState(null)
  const [dragOverCanvas, setDragOverCanvas] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState(null)

  const canvasRef = useRef(null)
  const tagRefs = useRef({})
  const pathsRef = useRef([])
  const tagsRef = useRef(tags)

  useEffect(() => { tagsRef.current = tags }, [tags])

  useEffect(() => {
    if (!Array.isArray(tags)) setTags([])
    if (!Array.isArray(connections)) setConnections([])
  }, [tags, connections, setTags, setConnections])

  const snap = useCallback((val) => gridSnap ? Math.round(val / 32) * 32 : val, [gridSnap])

  const addTag = useCallback((shape = 'rectangle') => {
    const cfg = SHAPES[shape] || SHAPES.rectangle
    const vw = canvasRef.current?.clientWidth || 600
    const vh = canvasRef.current?.clientHeight || 400
    const cx = (vw / 2 - panOffset.x) / scale - cfg.width / 2
    const cy = (vh / 2 - panOffset.y) / scale - cfg.height / 2
    const newTag = {
      id: String(nextId),
      text: shape === 'diamond' ? 'New Decision' : shape === 'parallelogram' ? 'New I/O' : 'New Step',
      x: snap(cx),
      y: snap(cy),
      shape,
      duration: '',
      cost: '',
      department: '',
      app: '',
    }
    setTags(prev => [...(Array.isArray(prev) ? prev : []), newTag])
    setNextId(prev => prev + 1)
    setSelectedTag(newTag.id)
    setEditing(newTag.id)
    setEditText(newTag.text)
  }, [nextId, snap, panOffset, scale])

  const updateTagPosition = useCallback((id, x, y) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, x, y } : t))
  }, [])

  const deleteTag = useCallback((id) => {
    setTags(prev => prev.filter(t => t.id !== id))
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id))
    if (selectedTag === id) setSelectedTag(null)
    setShowConfirmDelete(null)
  }, [selectedTag])

  const changeShape = useCallback((tagId, newShape) => {
    setTags(prev => prev.map(t => t.id === tagId ? { ...t, shape: newShape } : t))
  }, [])

  const saveEdit = useCallback(() => {
    if (editing && editText.trim()) {
      setTags(prev => prev.map(t => t.id === editing ? { ...t, text: editText.trim() } : t))
    }
    setEditing(null)
    setEditText('')
  }, [editing, editText])

  const saveProject = useCallback(async () => {
    const JSZip = (await import('jszip')).default
    const html2canvas = (await import('html2canvas')).default
    const el = canvasRef.current
    if (!el || !tags.length) return

    const origOverflow = el.style.overflow
    const origW = el.style.width
    const origH = el.style.height

    const pad = 60
    const bounds = tags.map(t => {
      const cfg = getShapeConfig(t)
      return { minX: t.x - pad, minY: t.y - pad, maxX: t.x + cfg.width + pad, maxY: t.y + cfg.height + pad }
    })
    const minX = Math.min(...bounds.map(b => b.minX))
    const minY = Math.min(...bounds.map(b => b.minY))
    const maxX = Math.max(...bounds.map(b => b.maxX))
    const maxY = Math.max(...bounds.map(b => b.maxY))
    el.style.overflow = 'visible'
    el.style.width = `${maxX - minX}px`
    el.style.height = `${maxY - minY}px`

    const zip = new JSZip()

    const canvas = await html2canvas(el, { scale: 2, backgroundColor: C.bg, useCORS: true })
    el.style.overflow = origOverflow
    el.style.width = origW
    el.style.height = origH
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'))
    if (blob) zip.file('workflow.png', blob)

    const lines = ['Workflow Summary', '================', '']
    tags.forEach((t, i) => {
      const details = []
      if (t.department) details.push(`Dept: ${DEPARTMENTS[t.department]?.label || t.department}`)
      if (t.app) details.push(`App: ${INTEGRATIONS[t.app]?.label || t.app}`)
      if (t.duration) details.push(`Duration: ${t.duration}`)
      if (t.cost) details.push(`Cost: $${parseFloat(t.cost).toLocaleString()}`)
      const suffix = details.length ? ` [${details.join(', ')}]` : ''
      lines.push(`${i + 1}. ${t.text} (${getShapeConfig(t).label})${suffix}`)
    })
    const tc = tags.reduce((sum, t) => sum + (parseFloat(t.cost) || 0), 0)
    const th = tags.reduce((sum, t) => sum + parseHours(t.duration), 0)
    lines.push('', `Total Cost: $${tc.toLocaleString()}  |  Total Duration: ${formatHours(th)}`, '')
    lines.push('Connections:', '------------')
    connections.forEach((c, i) => {
      const f = tags.find(t => t.id === c.from)
      const t = tags.find(t => t.id === c.to)
      if (f && t) lines.push(`${i + 1}. ${f.text} \u2192 ${t.text}`)
    })
    zip.file('workflow.txt', lines.join('\r\n'))

    zip.file('workflow.json', JSON.stringify({ version: 1, nextId, tags, connections }, null, 2))

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [tags, connections, nextId])

  const importProject = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zip'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        const JSZip = (await import('jszip')).default
        const zip = await JSZip.loadAsync(file)
        const entry = zip.file('workflow.json')
        if (!entry) return
        const data = JSON.parse(await entry.async('string'))
        if (data.tags) {
          setTags(data.tags.map(t => ({ duration: '', cost: '', department: '', app: '', ...t })))
          setConnections(data.connections ? data.connections.map(c => ({ fromPort: 'bottom', toPort: 'top', label: '', ...c })) : [])
          setNextId(data.nextId || data.tags.length + 1)
          setSelectedTag(null)
          setSelectedConnection(null)
          setEditing(null)
          setEditText('')
        }
      } catch (err) { console.error('Import failed', err) }
    }
    input.click()
  }, [])

  const handleCanvasMouseDown = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.classList?.contains('grid-canvas') || e.target.classList?.contains('canvas-pan-layer') || e.target.tagName === 'svg' || e.target.tagName === 'path') {
      if (e.shiftKey) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = (e.clientX - rect.left - panOffset.x) / scale
        const y = (e.clientY - rect.top - panOffset.y) / scale
        drawRef.current = { isDrawingNode: true, start: { x, y }, current: { x, y } }
        setDrawStart({ x, y })
        setDrawCurrent({ x, y })
        setIsDrawingNode(true)
        setDrawShapeMenu(null)
        setSelectedTag(null)
        setSelectedConnection(null)
        return
      }
      setSelectedTag(null)
      setSelectedConnection(null)
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [panOffset, scale])

  const handleCanvasMouseMove = useCallback((e) => {
    if (isDrawingNode) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = (e.clientX - rect.left - panOffset.x) / scale
      const y = (e.clientY - rect.top - panOffset.y) / scale
      drawRef.current.current = { x, y }
      setDrawCurrent({ x, y })
      return
    }
    if (isPanning) {
      const dx = e.clientX - panStart.x
      const dy = e.clientY - panStart.y
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      setPanStart({ x: e.clientX, y: e.clientY })
      return
    }
    if (dragging) {
      let x = (e.clientX - dragOffset.x - panOffset.x) / scale
      let y = (e.clientY - dragOffset.y - panOffset.y) / scale
      if (gridSnap) {
        const tag = tagsRef.current.find(t => t.id === dragging)
        if (tag) {
          x = snap(x)
          y = snap(y)
        }
      }

      const nodeEl = tagRefs.current[dragging]
      if (nodeEl) {
        nodeEl.style.left = `${x}px`
        nodeEl.style.top = `${y}px`
      }

      const updatedTags = tagsRef.current.map(t =>
        t.id === dragging ? { ...t, x, y } : t
      )
      tagsRef.current = updatedTags

      for (let i = 0; i < connections.length; i++) {
        const conn = connections[i]
        const fromTag = updatedTags.find(t => t.id === conn.from)
        const toTag = updatedTags.find(t => t.id === conn.to)
        if (fromTag && toTag) {
          const path = getConnectionPath(fromTag, toTag, conn.fromPort, conn.toPort)
          const pathEl = pathsRef.current[i]
          if (pathEl) pathEl.setAttribute('d', path.d)
        }
      }
      return
    }
    if (connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setConnectingMouse({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }
  }, [isPanning, panStart, dragging, dragOffset, gridSnap, connectingFrom, snap, connections, isDrawingNode, panOffset, scale])

  const endDrag = useCallback(() => {
    if (dragging) {
      const el = tagRefs.current[dragging]
      if (el) {
        const l = parseFloat(el.style.left)
        const t = parseFloat(el.style.top)
        if (!isNaN(l) && !isNaN(t)) {
          updateTagPosition(dragging, l, t)
        }
      }
    }
    if (drawRef.current.isDrawingNode) {
      const { start, current } = drawRef.current
      const minX = Math.min(start.x, current.x)
      const minY = Math.min(start.y, current.y)
      const maxX = Math.max(start.x, current.x)
      const maxY = Math.max(start.y, current.y)
      const w = maxX - minX
      const h = maxY - minY
      if (w > 10 && h > 10) {
        setDrawShapeMenu({ boxX: minX, boxY: minY, boxW: w, boxH: h })
      }
      drawRef.current.isDrawingNode = false
      setIsDrawingNode(false)
      return
    }
    setDragging(null)
    setIsPanning(false)
    if (connectingFrom) {
      setConnectingFrom(null)
    }
  }, [dragging, connectingFrom, updateTagPosition])

  const handleTagMouseDown = useCallback((e, tagId) => {
    e.stopPropagation()
    const tag = tags.find(t => t.id === tagId)
    if (!tag) return
    setDragging(tagId)
    setDragOffset({ x: e.clientX - tag.x * scale - panOffset.x, y: e.clientY - tag.y * scale - panOffset.y })
    setSelectedTag(tagId)
    setEditing(null)
    setEditText('')
  }, [tags, scale, panOffset])

  const handleTagClick = useCallback((e, tagId) => {
    e.stopPropagation()
    setSelectedTag(tagId)
    setSelectedConnection(null)
  }, [])

  const handleTagDoubleClick = useCallback((e, tagId) => {
    e.stopPropagation()
    const tag = tags.find(t => t.id === tagId)
    if (!tag) return
    setEditing(tagId)
    setEditText(tag.text)
  }, [tags])

  const handlePortMouseDown = useCallback((e, tagId, port) => {
    e.stopPropagation()
    const tag = tags.find(t => t.id === tagId)
    if (!tag) return
    setConnectingFrom(tagId)
    setConnectingPort(port)
    const pt = getPortPoint(tag, port)
    setConnectingMouse(pt)
  }, [tags])

  const handlePortMouseUp = useCallback((e, tagId, port) => {
    e.stopPropagation()
    if (connectingFrom) {
      const dup = connections.some(c => c.from === connectingFrom && c.to === tagId && c.fromPort === connectingPort && c.toPort === port)
      if (!dup) {
        setConnections(prev => [...(Array.isArray(prev) ? prev : []), { from: connectingFrom, to: tagId, fromPort: connectingPort, toPort: port, label: '' }])
      }
    }
    setConnectingFrom(null)
  }, [connectingFrom, connectingPort, connections])

  const deleteConnection = useCallback((fromId, toId) => {
    setConnections(prev => prev.filter(c => !(c.from === fromId && c.to === toId)))
    setSelectedConnection(null)
  }, [])

  const handleConnectionClick = useCallback((fromId, toId) => {
    const conn = connections.find(c => c.from === fromId && c.to === toId)
    if (conn) {
      setSelectedConnection({ from: fromId, to: toId })
      setEditingConnectionLabel(conn.label || '')
    }
  }, [connections])

  const saveConnectionLabel = useCallback(() => {
    if (selectedConnection) {
      setConnections(prev => prev.map(c =>
        c.from === selectedConnection.from && c.to === selectedConnection.to
          ? { ...c, label: editingConnectionLabel }
          : c
      ))
    }
  }, [selectedConnection, editingConnectionLabel])

  // ── AI Actions Handler ──
  const applyAIActions = useCallback((actions) => {
    const safeActions = Array.isArray(actions) ? actions : [];
    for (const action of safeActions) {
      switch (action.type) {
        case 'add_node': {
          const shape = action.shape || 'rectangle'
          const cfg = SHAPES[shape] || SHAPES.rectangle
          const vw = canvasRef.current?.clientWidth || 600
          const vh = canvasRef.current?.clientHeight || 400
          const newTag = {
            id: String(nextId),
            text: action.text || 'New Step',
            x: snap((vw / 2 - panOffset.x) / scale - cfg.width / 2),
            y: snap((vh / 2 - panOffset.y) / scale - cfg.height / 2),
            shape,
            duration: action.duration || '',
            cost: action.cost || '',
            department: action.department || '',
            app: action.app || '',
          }
          setTags(prev => [...(Array.isArray(prev) ? prev : []), newTag])
          setNextId(prev => prev + 1)
          break
        }
        case 'edit_node': {
          setTags(prev => prev.map(t => {
            if (t.id !== action.id) return t
            const updates = {}
            if (action.text !== undefined) updates.text = action.text
            if (action.duration !== undefined) updates.duration = action.duration
            if (action.cost !== undefined) updates.cost = action.cost
            if (action.department !== undefined) updates.department = action.department
            if (action.app !== undefined) updates.app = action.app
            return { ...t, ...updates }
          }))
          break
        }
        case 'delete_node': {
          setTags(prev => prev.filter(t => t.id !== action.id))
          setConnections(prev => prev.filter(c => c.from !== action.id && c.to !== action.id))
          break
        }
        case 'add_connection': {
          setConnections(prev => [...(Array.isArray(prev) ? prev : []), {
            from: action.from,
            to: action.to,
            fromPort: action.fromPort || 'bottom',
            toPort: action.toPort || 'top',
            label: action.label || '',
          }])
          break
        }
        case 'delete_connection': {
          setConnections(prev => prev.filter(c => !(c.from === action.from && c.to === action.to)))
          break
        }
        case 'set_duration': {
          setTags(prev => prev.map(t => t.id === action.id ? { ...t, duration: action.duration } : t))
          break
        }
        case 'set_cost': {
          setTags(prev => prev.map(t => t.id === action.id ? { ...t, cost: action.cost } : t))
          break
        }
        case 'set_department': {
          setTags(prev => prev.map(t => t.id === action.id ? { ...t, department: action.department } : t))
          break
        }
      }
    }
  }, [nextId, snap, panOffset, scale, setTags, setConnections, setNextId])

  // ── Template Handler ──
  const handleTemplateSelect = useCallback((templateTags, templateConnections, templateNextId) => {
    setTags(templateTags)
    setConnections(templateConnections)
    setNextId(templateNextId)
    setSelectedTag(null)
    setSelectedConnection(null)
    setEditing(null)
    setEditText('')
  }, [setTags, setConnections, setNextId])

  const handlePhotoDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer?.files || [])
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target.result
        const img = new window.Image()
        img.onload = () => {
          setPhotoAssets(prev => [...(Array.isArray(prev) ? prev : []), {
            id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            src: dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
          }])
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handlePhotoDragStart = useCallback((e, asset) => {
    e.dataTransfer.setData('application/neutron-photo', JSON.stringify(asset))
    e.dataTransfer.effectAllowed = 'copy'
    setDraggingAsset(asset)
  }, [])

  const handleCanvasDrop = useCallback((e) => {
    e.preventDefault()
    setDragOverCanvas(false)
    const data = e.dataTransfer.getData('application/neutron-photo')
    if (!data) return
    try {
      const asset = JSON.parse(data)
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = snap((e.clientX - rect.left - panOffset.x) / scale)
      const y = snap((e.clientY - rect.top - panOffset.y) / scale)
      const newTag = {
        id: String(nextId),
        text: asset.name || 'Photo',
        x, y,
        shape: 'image',
        duration: '',
        cost: '',
        department: '',
        app: '',
        imageSrc: asset.src,
        imageWidth: asset.width,
        imageHeight: asset.height,
      }
      setTags(prev => [...(Array.isArray(prev) ? prev : []), newTag])
      setNextId(prev => prev + 1)
      setSelectedTag(newTag.id)
    } catch (err) { console.error('Drop failed', err) }
    setDraggingAsset(null)
  }, [nextId, snap, panOffset, scale])

  const zoomIn = useCallback(() => {
    const el = canvasRef.current
    if (!el) return
    const { width: vw, height: vh } = el.getBoundingClientRect()
    const newScale = Math.min(1.5, +(scale + 0.1).toFixed(1))
    setPanOffset(prev => ({
      x: vw / 2 - (vw / 2 - prev.x) * newScale / scale,
      y: vh / 2 - (vh / 2 - prev.y) * newScale / scale,
    }))
    setScale(newScale)
  }, [scale])

  const zoomOut = useCallback(() => {
    const el = canvasRef.current
    if (!el) return
    const { width: vw, height: vh } = el.getBoundingClientRect()
    const newScale = Math.max(0.5, +(scale - 0.1).toFixed(1))
    setPanOffset(prev => ({
      x: vw / 2 - (vw / 2 - prev.x) * newScale / scale,
      y: vh / 2 - (vh / 2 - prev.y) * newScale / scale,
    }))
    setScale(newScale)
  }, [scale])

  const resetZoom = useCallback(() => {
    const el = canvasRef.current
    if (!el) return
    const { width: vw, height: vh } = el.getBoundingClientRect()
    setPanOffset(prev => ({
      x: vw / 2 - (vw / 2 - prev.x) / scale,
      y: vh / 2 - (vh / 2 - prev.y) / scale,
    }))
    setScale(1)
  }, [scale])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedConnection) saveConnectionLabel()
        setEditing(null)
        setConnectingFrom(null)
        setShowConfirmDelete(null)
        setSelectedConnection(null)
        setDrawShapeMenu(null)
        drawRef.current.isDrawingNode = false
        setIsDrawingNode(false)
      }
      if (e.key === 'Enter' && editing) {
        saveEdit()
      }
      if (e.key === 'Delete' && hoveredTag && !editing) {
        setShowConfirmDelete(hoveredTag)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mouseup', endDrag)
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('mouseup', endDrag) }
  }, [editing, saveEdit, hoveredTag, endDrag, saveConnectionLabel, selectedConnection])

  const sidebarWidth = sidebarOpen ? 280 : 0

  const selectedTagData = tags.find(t => t.id === selectedTag)

  return (
    <>
    <style>{`
      .workflow-sidebar::-webkit-scrollbar { width: 5px; }
      .workflow-sidebar::-webkit-scrollbar-track { background: transparent; }
      .workflow-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
      .workflow-sidebar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
    `}</style>
    <div style={{
      flex: 1, width: '100%', overflow: 'hidden', position: 'relative',
      background: C.bg, display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', flexShrink: 0,
        borderBottom: `1px solid ${C.cardBdr}`,
        background: `${C.bg}ee`, backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('home')} style={{
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`,
          borderRadius: 8, width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: C.muted, flexShrink: 0,
        }}>
          <ArrowLeft size={16} />
        </motion.button>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, flexShrink: 0 }}>
          Workflow
        </h1>

        {/* Back to selection */}
        {activeView && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveView(null)} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.cardBdr}`,
            background: 'rgba(255,255,255,0.04)', color: C.muted,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            <ArrowLeft size={12} /> Back
          </motion.button>
        )}

        <div style={{ flex: 1 }} />

        {activeView === 'canvas' && (<>
          <span style={{ fontSize: 11, color: C.muted }}>
            {tags.length} nodes · {connections.length} connections
          </span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={undo} disabled={!canUndo}
            style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`,
              borderRadius: 8, width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canUndo ? 'pointer' : 'default', color: canUndo ? C.text : C.muted, opacity: canUndo ? 1 : 0.3,
            }}>
            <Undo2 size={13} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={redo} disabled={!canRedo}
            style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`,
              borderRadius: 8, width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canRedo ? 'pointer' : 'default', color: canRedo ? C.text : C.muted, opacity: canRedo ? 1 : 0.3,
            }}>
            <Redo2 size={13} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
            onClick={saveProject}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.cyan}30`,
              background: `${C.cyan}10`, color: C.cyan, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Save size={13} /> Save
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
            onClick={importProject}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.cardBdr}`,
              background: 'rgba(255,255,255,0.04)', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Upload size={13} /> Import
          </motion.button>
        </>)}
      </div>

      {/* Body: sidebar + canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* ─── LANDING SCREEN ─── */}
        {!activeView && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 24, padding: 40,
          }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>
                What would you like to do?
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: C.muted }}>
                Choose a tool to get started
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveView('canvas')}
                style={{
                  width: 240, padding: '28px 24px', borderRadius: 14,
                  border: `1px solid ${C.cardBdr}`, background: C.card,
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.cyan}40` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBdr }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${C.cyan}12`, border: `1px solid ${C.cyan}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Grid3X3 size={24} color={C.cyan} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Canvas</div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
                    Flowcharts, diagrams, and visual workflows with drag-and-drop
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveView('tracker')}
                style={{
                  width: 240, padding: '28px 24px', borderRadius: 14,
                  border: `1px solid ${C.cardBdr}`, background: C.card,
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.green}40` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBdr }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${C.green}12`, border: `1px solid ${C.green}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BarChart3 size={24} color={C.green} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Habit Tracker</div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
                    Track daily business metrics, sales targets, and KPIs
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveView('pdfreader')}
                style={{
                  width: 240, padding: '28px 24px', borderRadius: 14,
                  border: `1px solid ${C.cardBdr}`, background: C.card,
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.purple}40` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBdr }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${C.purple}12`, border: `1px solid ${C.purple}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={24} color={C.purple} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>PDF Reader</div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
                    Upload a PDF and read it with highlights, notes, and word lookup
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        )}

        {/* ─── SIDEBAR (only in canvas view) ─── */}
        {activeView === 'canvas' && (
        <motion.aside
          animate={{ width: sidebarWidth }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{
            background: `${C.card}dd`, backdropFilter: 'blur(16px)',
            borderRight: `1px solid ${C.cardBdr}`,
            overflow: 'hidden', flexShrink: 0, zIndex: 5,
            display: 'flex', flexDirection: 'column',
          }}
        >
          {sidebarOpen && (
            <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 252, minHeight: 0, overflow: 'hidden' }}>
              {/* Tab bar */}
              <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 2 }}>
                {[
                  { id: 'tools', icon: Grid3X3, label: 'Tools' },
                  { id: 'ai', icon: Bot, label: 'AI' },
                  { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
                  { id: 'selected', icon: MousePointer2, label: 'Selected' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setSidebarTab(tab.id)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      padding: '5px 4px', borderRadius: 6, border: 'none',
                      background: sidebarTab === tab.id ? `${C.cyan}15` : 'transparent',
                      color: sidebarTab === tab.id ? C.cyan : C.muted,
                      fontSize: 9, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                    <tab.icon size={11} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Close button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setSidebarOpen(false)}
                  style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 2, display: 'flex' }}>
                  <PanelLeftClose size={14} />
                </button>
              </div>

              {/* Tab content - scrollable */}
              <div className="workflow-sidebar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>

              {sidebarTab === 'tools' && (<>

              {/* ── SHAPES ── */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                letterSpacing: '0.5px', width: 'fit-content',
              }}>
                <Square size={10} />
                Shapes
              </div>

              {/* Shape grid — 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {Object.entries(SHAPES).map(([key, cfg]) => (
                  <motion.button key={key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                    onClick={() => addTag(key)}
                    title={`Add ${cfg.label}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '7px 10px', borderRadius: 8,
                      border: `1px solid ${C.cardBdr}`,
                      background: 'rgba(255,255,255,0.03)',
                      color: C.muted, cursor: 'pointer', textAlign: 'left',
                      fontSize: 10, fontWeight: 600,
                      transition: 'border-color 0.15s, color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.cyan}30`; e.currentTarget.style.color = C.cyan; e.currentTarget.style.background = `${C.cyan}08` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBdr; e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  >
                    <cfg.icon size={13} />
                    {cfg.label}
                  </motion.button>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: C.cardBdr }} />

              {/* ── CANVAS ── */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                letterSpacing: '0.5px', width: 'fit-content',
              }}>
                <Grid3X3 size={10} />
                Canvas
              </div>

              {/* Grid Snapping card */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                padding: '8px 10px', border: `1px solid ${C.cardBdr}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Grid3X3 size={13} color={C.muted} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>Grid Snapping</span>
                </div>
                <button
                  onClick={() => setGridSnap(!gridSnap)}
                  style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: gridSnap ? C.cyan : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: gridSnap ? 18 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: C.cardBdr }} />

              {/* ── PHOTOS ── */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                letterSpacing: '0.5px', width: 'fit-content',
              }}>
                <Camera size={10} />
                Photos
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                onDrop={handlePhotoDrop}
                style={{
                  border: `2px dashed ${C.cardBdr}`,
                  borderRadius: 10,
                  padding: '14px 12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                  background: 'rgba(255,255,255,0.02)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.cyan}40`; e.currentTarget.style.background = `${C.cyan}06` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBdr; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/png,image/jpeg,image/jpg'
                  input.multiple = true
                  input.onchange = (ev) => {
                    const files = Array.from(ev.target.files || [])
                    files.forEach(file => {
                      const reader = new FileReader()
                      reader.onload = (rev) => {
                        const dataUrl = rev.target.result
                        const img = new window.Image()
                        img.onload = () => {
                          setPhotoAssets(prev => [...(Array.isArray(prev) ? prev : []), {
                            id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                            name: file.name,
                            src: dataUrl,
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                          }])
                        }
                        img.src = dataUrl
                      }
                      reader.readAsDataURL(file)
                    })
                  }
                  input.click()
                }}
              >
                <Camera size={18} color={C.muted} style={{ opacity: 0.4 }} />
                <span style={{ fontSize: 10, color: C.muted, textAlign: 'center', lineHeight: 1.3 }}>
                  Drop images or click to browse
                </span>
              </div>

              {photoAssets.length > 0 && (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4,
                  maxHeight: 160, overflowY: 'auto',
                  padding: '2px 0',
                }}>
                  {photoAssets.map(asset => (
                    <div
                      key={asset.id}
                      draggable
                      onDragStart={(e) => handlePhotoDragStart(e, asset)}
                      style={{
                        position: 'relative', aspectRatio: '1', borderRadius: 6,
                        overflow: 'hidden', cursor: 'grab', border: `1px solid ${C.cardBdr}`,
                        transition: 'border-color 0.15s, transform 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.cyan}50`; e.currentTarget.style.transform = 'scale(1.05)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBdr; e.currentTarget.style.transform = 'scale(1)' }}
                    >
                      <img src={asset.src} alt={asset.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                        draggable={false}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPhotoAssets(prev => prev.filter(a => a.id !== asset.id))
                        }}
                        style={{
                          position: 'absolute', top: 2, right: 2,
                          width: 16, height: 16, borderRadius: '50%',
                          background: 'rgba(0,0,0,0.7)', border: 'none',
                          color: '#fff', fontSize: 9, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.7' }}
                      >x</button>
                    </div>
                  ))}
                </div>
              )}

              </>)}

              {sidebarTab === 'ai' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <WorkflowChat
                    tags={tags}
                    connections={connections}
                    onApplyActions={applyAIActions}
                  />
                </div>
              )}

              {sidebarTab === 'templates' && (
                <WorkflowTemplates onSelect={handleTemplateSelect} />
              )}

              {sidebarTab === 'selected' && (<>
                {selectedTagData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 8px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                      fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                      letterSpacing: '0.5px', width: 'fit-content',
                    }}>
                      <MousePointer2 size={10} />
                      Node Editor
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                      padding: 10, border: `1px solid ${C.cardBdr}`,
                    }}>
                      <textarea
                        autoFocus
                        ref={el => {
                          if (el && editing !== selectedTagData.id) {
                            el.value = selectedTagData.text || ''
                            el.style.height = 'auto'
                            el.style.height = el.scrollHeight + 'px'
                          }
                        }}
                        value={editing === selectedTagData.id ? editText : selectedTagData.text}
                        onChange={e => {
                          setEditText(e.target.value)
                          setEditing(selectedTagData.id)
                          e.target.style.height = 'auto'
                          e.target.style.height = e.target.scrollHeight + 'px'
                          setTags(prev => prev.map(t => t.id === selectedTagData.id ? { ...t, text: e.target.value } : t))
                        }}
                        onBlur={saveEdit}
                        onKeyDown={e => { if (e.key === 'Escape') { setEditing(null); setEditText('') } }}
                        placeholder="Type node text..."
                        style={{
                          width: '100%', minHeight: 60, maxHeight: 200, overflowY: 'auto',
                          background: 'rgba(0,0,0,0.4)',
                          border: `1px solid ${C.cyan}40`, borderRadius: 6,
                          padding: '8px 10px', textAlign: 'left',
                          color: '#fff', fontSize: 11, fontWeight: 600,
                          outline: 'none', fontFamily: 'inherit',
                          lineHeight: 1.4, resize: 'none',
                        }}
                      />

                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 8, marginTop: 6 }}>
                        ID: {selectedTagData.id} · {SHAPES[selectedTagData.shape]?.label || 'Process'}
                      </div>

                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {Object.entries(SHAPES).map(([key, cfg]) => {
                          const isActive = selectedTagData.shape === key
                          return (
                            <motion.button key={key} whileTap={{ scale: 0.9 }}
                              onClick={() => changeShape(selectedTagData.id, key)}
                              style={{
                                flex: 1, padding: '5px 4px', borderRadius: 6, border: isActive ? `1px solid ${C.cyan}50` : `1px solid ${C.cardBdr}`,
                                background: isActive ? `${C.cyan}10` : 'rgba(255,255,255,0.03)',
                                color: isActive ? C.cyan : C.muted, fontSize: 9, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                transition: 'all 0.15s',
                              }}
                            >
                              <cfg.icon size={12} />
                              {cfg.label}
                            </motion.button>
                          )
                        })}
                      </div>

                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(selectedTagData.id) }}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)',
                            background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ) : selectedConnection ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 8px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                      fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
                      letterSpacing: '0.5px', width: 'fit-content',
                    }}>
                      <MousePointer2 size={10} />
                      Connection
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 10, border: `1px solid ${C.cardBdr}` }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>
                        {tags.find(t => t.id === selectedConnection.from)?.text} → {tags.find(t => t.id === selectedConnection.to)?.text}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '4px 6px', border: `1px solid ${C.cardBdr}` }}>
                        <Pencil size={11} color={C.muted} />
                        <input value={editingConnectionLabel} onChange={e => setEditingConnectionLabel(e.target.value)}
                          onBlur={saveConnectionLabel}
                          onKeyDown={e => { if (e.key === 'Enter') saveConnectionLabel() }}
                          placeholder="Label (e.g. Yes / No)"
                          style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 10, fontWeight: 600 }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { deleteConnection(selectedConnection.from, selectedConnection.to); setSelectedConnection(null) }}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                        >
                          <Trash2 size={10} /> Remove
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    padding: '40px 20px', color: C.muted, textAlign: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBdr}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MousePointer2 size={20} style={{ opacity: 0.3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Nothing selected</span>
                    <span style={{ fontSize: 11, lineHeight: 1.4 }}>
                      Click a node or connection on the canvas to view and edit its properties
                    </span>
                  </div>
                )}
              </>)}

            </div>
            </div>
          )}
        </motion.aside>
        )}

        {/* Sidebar toggle button (when collapsed) */}
        {activeView === 'canvas' && !sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)}
            style={{
              position: 'absolute', left: 0, top: 8, zIndex: 6,
              background: `${C.card}dd`, backdropFilter: 'blur(8px)',
              border: `1px solid ${C.cardBdr}`, borderRadius: '0 8px 8px 0',
              padding: '6px 5px 6px 3px', cursor: 'pointer', color: C.muted,
              display: 'flex', alignItems: 'center',
            }}
          >
            <PanelLeft size={14} />
          </button>
        )}

        {/* ─── CANVAS, TRACKER, or BOOKS ─── */}
        {activeView === 'tracker' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <BusinessTracker />
          </div>
        )}
        {activeView === 'pdfreader' && !selectedPdf && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <PdfLibraryView onOpenReader={(pdf) => setSelectedPdf(pdf)} />
          </div>
        )}
        {activeView === 'pdfreader' && selectedPdf && (
          <PdfReaderScreen pdf={selectedPdf} onClose={() => setSelectedPdf(null)} />
        )}
        {activeView === 'canvas' && (
        <div
          ref={canvasRef}
          className="grid-canvas"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOverCanvas(true) }}
          onDragLeave={() => setDragOverCanvas(false)}
          onDrop={handleCanvasDrop}
          onDoubleClick={(e) => {
            if (e.target.classList.contains('grid-canvas') || e.target === canvasRef.current) {
              addTag('rectangle')
            }
          }}
          style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            cursor: isDrawingNode || connectingFrom ? 'crosshair' : 'default',
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
            `,
            backgroundSize: `${32 * scale}px ${32 * scale}px`,
            backgroundPosition: `${((panOffset.x % 32 + 32) % 32) * scale}px ${((panOffset.y % 32 + 32) % 32) * scale}px`,
          }}
        >
          {/* Panning content container */}
          <div className="canvas-pan-layer" style={{
            position: 'absolute', inset: 0,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}>
          {/* SVG connections layer */}
          <svg
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              pointerEvents: 'none', zIndex: 1,
            }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.25)" />
              </marker>
              <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={C.cyan} />
              </marker>
              <marker id="arrowhead-connecting" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={C.cyan} />
              </marker>
            </defs>

            {connections.map((conn, i) => {
              const fromTag = tags.find(t => t.id === conn.from)
              const toTag = tags.find(t => t.id === conn.to)
              if (!fromTag || !toTag) return null
              const path = getConnectionPath(fromTag, toTag, conn.fromPort, conn.toPort)
              const isSelected = selectedConnection?.from === conn.from && selectedConnection?.to === conn.to
              const midX = (path.x1 + path.x2) / 2
              const midY = (path.y1 + path.y2) / 2
              return (
                <g key={`conn-${conn.from}-${conn.to}`}>
                  <path
                    ref={el => { if (el) pathsRef.current[i] = el }}
                    d={path.d}
                    fill="none"
                    stroke={isSelected ? C.cyan : 'rgba(255,255,255,0.18)'}
                    strokeWidth={isSelected ? 2.5 : 2}
                    markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
                    style={{ pointerEvents: 'stroke' }}
                  />
                  <path
                    d={path.d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={20}
                    style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                    onClick={(e) => { e.stopPropagation(); handleConnectionClick(conn.from, conn.to) }}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); deleteConnection(conn.from, conn.to) }}
                  />
                  {conn.label && (
                    <g>
                      {(() => { const labelW = Math.max(28, (conn.label || '').length * 8 + 16); return (
                        <>
                          <rect
                            x={midX - labelW / 2} y={midY - 10}
                            width={labelW} height={20} rx={4}
                            fill="#0d1117"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth={1}
                          />
                          <text
                            x={midX} y={midY + 4}
                            textAnchor="middle"
                            fill={isSelected ? C.cyan : 'rgba(255,255,255,0.5)'}
                            fontSize={10}
                            fontWeight={600}
                          >{conn.label}</text>
                        </>
                      ) })()}
                    </g>
                  )}
                </g>
              )
            })}

            {connectingFrom && (() => {
              const fromTag = tags.find(t => t.id === connectingFrom)
              if (!fromTag) return null
              const pt = getPortPoint(fromTag, connectingPort)
              const { x: ex, y: ey } = connectingMouse
              const dist = Math.sqrt((ex - pt.x) ** 2 + (ey - pt.y) ** 2)
              const ext = Math.max(30, Math.min(100, dist * 0.35))
              const cp = { x: pt.x + pt.dx * ext, y: pt.y + pt.dy * ext }
              return (
                <path
                  d={`M ${pt.x} ${pt.y} C ${cp.x} ${cp.y}, ${ex} ${ey}, ${ex} ${ey}`}
                  fill="none"
                  stroke={C.cyan}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  markerEnd="url(#arrowhead-connecting)"
                />
              )
            })()}

            {isDrawingNode && (() => {
              const x = Math.min(drawStart.x, drawCurrent.x)
              const y = Math.min(drawStart.y, drawCurrent.y)
              const w = Math.abs(drawCurrent.x - drawStart.x)
              const h = Math.abs(drawCurrent.y - drawStart.y)
              return (
                <rect
                  x={x} y={y} width={w} height={h}
                  fill="rgba(0,210,255,0.06)"
                  stroke={C.cyan}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  rx={4}
                />
              )
            })()}
          </svg>

          {/* Tags */}
          <AnimatePresence>
            {tags.map(tag => {
              const cfg = getShapeConfig(tag)
              const isEditing = editing === tag.id
              const isDragging = dragging === tag.id
              const isHovered = hoveredTag === tag.id
              const isSelected = selectedTag === tag.id
              const isConnectingFrom = connectingFrom === tag.id
              const w = cfg.width
              const h = cfg.height

              return (
                <motion.div
                  key={tag.id}
                  ref={el => { if (el) tagRefs.current[tag.id] = el }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                  style={{
                    position: 'absolute',
                    left: tag.x, top: tag.y,
                    width: w, height: h,
                    zIndex: isDragging ? 20 : (isSelected ? 8 : (isHovered ? 6 : 2)),
                    cursor: isEditing ? 'text' : 'move',
                    userSelect: 'none',
                  }}
                  onMouseDown={(e) => handleTagMouseDown(e, tag.id)}
                  onClick={(e) => handleTagClick(e, tag.id)}
                  onDoubleClick={(e) => handleTagDoubleClick(e, tag.id)}
                  onMouseEnter={() => setHoveredTag(tag.id)}
                  onMouseLeave={() => { if (hoveredTag === tag.id) setHoveredTag(null) }}
                >
                  {/* Shape inner — background + content layers */}
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {/* Visual background layer (clipped to shape) */}
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: cfg.borderRadius || 0,
                      clipPath: cfg.clipPath || undefined,
                      background: isConnectingFrom ? `${C.cyan}10` : 'rgba(255,255,255,0.03)',
                      border: isConnectingFrom
                        ? `1.5px solid ${C.cyan}`
                        : isSelected
                          ? `1px solid ${C.cyan}40`
                          : isHovered
                            ? `1px solid rgba(255,255,255,0.15)`
                            : `1px solid ${C.tagBdr}`,
                      transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                      boxShadow: isDragging
                        ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,210,255,0.1)'
                        : isSelected
                          ? '0 0 0 1px rgba(0,210,255,0.08), 0 4px 12px rgba(0,0,0,0.3)'
                          : '0 1px 4px rgba(0,0,0,0.2)',
                    }} />

                    {/* Content layer (no clip-path, padded to stay within shape) */}
                    <div style={{
                      position: 'relative', width: '100%', minHeight: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: cfg.contentPad || '0 8px',
                      overflow: 'hidden',
                      borderRadius: cfg.borderRadius || 0,
                    }}>
                      {tag.shape === 'image' && tag.imageSrc ? (
                        <img src={tag.imageSrc} alt={tag.text}
                          draggable={false}
                          style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            borderRadius: cfg.borderRadius || 0,
                            display: 'block',
                          }}
                        />
                      ) : (
                        <span style={{
                          display: 'block', fontSize: 11, fontWeight: 600, color: C.text,
                          padding: 0, lineHeight: 1.35, textAlign: 'center',
                          wordBreak: 'break-word', overflowWrap: 'break-word',
                          opacity: editing === tag.id ? 0.4 : 1,
                        }}>
                          {tag.text}
                        </span>
                      )}

                      {/* Grip indicator (center, visible on hover) */}
                      {isHovered && !editing && tag.shape !== 'image' && (
                        <div style={{
                          position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                          color: 'rgba(255,255,255,0.15)', display: 'flex', pointerEvents: 'none',
                        }}>
                          <GripVertical size={11} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selection ring */}
                  {isSelected && !isDragging && (
                    <div style={{
                      position: 'absolute', inset: -3, borderRadius: (cfg.borderRadius || 0) + 3,
                      border: `1px solid ${C.cyan}25`, pointerEvents: 'none',
                      clipPath: cfg.clipPath ? undefined : undefined,
                    }} />
                  )}

                  {/* 4-way ports — always visible */}
                  {Object.entries(PORT_POSITIONS).map(([side, base]) => {
                    const adj = cfg.portAdjust?.[side] || { x: base.x, y: base.y }
                    const isSource = connectingFrom === tag.id && connectingPort === side
                    const isTarget = connectingFrom && connectingFrom !== tag.id
                    return (
                      <div key={side}
                        onMouseDown={(e) => handlePortMouseDown(e, tag.id, side)}
                        onMouseUp={(e) => isTarget && handlePortMouseUp(e, tag.id, side)}
                        style={{
                          position: 'absolute',
                          left: `${adj.x * 100}%`,
                          top: `${adj.y * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          width: isSource ? 16 : (isTarget ? 16 : 10),
                          height: isSource ? 16 : (isTarget ? 16 : 10),
                          borderRadius: '50%',
                          background: isSource ? C.cyan : (isTarget ? 'rgba(0,210,255,0.25)' : 'rgba(255,255,255,0.12)'),
                          border: `2px solid ${isSource ? C.cyan : (isTarget ? C.cyan : 'rgba(255,255,255,0.1)')}`,
                          cursor: 'crosshair',
                          zIndex: 5,
                          transition: 'background 0.12s, transform 0.12s, box-shadow 0.12s',
                          boxShadow: isSource ? `0 0 10px ${C.cyan}60` : (isTarget ? `0 0 6px ${C.cyan}40` : 'none'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={e => { if (!isSource) { e.currentTarget.style.background = C.cyan; e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.4)' } }}
                        onMouseLeave={e => { if (!isSource) { e.currentTarget.style.background = isTarget ? 'rgba(0,210,255,0.25)' : 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translate(-50%, -50%)' } }}
                      >
                        <div style={{
                          width: 4, height: 4, borderRadius: '50%',
                          background: isSource || isTarget ? '#fff' : 'rgba(255,255,255,0.3)',
                        }} />
                      </div>
                    )
                  })}
                </motion.div>
              )
            })}
          </AnimatePresence>
          </div>{/* end panning container */}

          {/* Draw-to-create shape menu */}
          {drawShapeMenu && (
            <div style={{
              position: 'absolute',
              left: drawShapeMenu.boxX * scale + panOffset.x + drawShapeMenu.boxW / 2 * scale,
              top: drawShapeMenu.boxY * scale + panOffset.y + drawShapeMenu.boxH / 2 * scale,
              transform: 'translate(-50%, -50%)',
              zIndex: 100,
              display: 'flex', gap: 4,
              padding: 6,
              borderRadius: 10,
              background: '#141420',
              border: `1px solid ${C.cardBdr}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {Object.entries(SHAPES).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button key={key} onClick={() => {
                    const newTag = {
                      id: String(nextId),
                      text: key === 'diamond' ? 'New Decision' : key === 'parallelogram' ? 'New I/O' : 'New Step',
                      x: drawShapeMenu.boxX,
                      y: drawShapeMenu.boxY,
                      width: drawShapeMenu.boxW,
                      height: drawShapeMenu.boxH,
                      shape: key,
                      duration: '',
                      cost: '',
                      department: '',
                      app: '',
                    }
                    setTags(prev => [...(Array.isArray(prev) ? prev : []), newTag])
                    setNextId(prev => prev + 1)
                    setSelectedTag(newTag.id)
                    setEditing(newTag.id)
                    setEditText(newTag.text)
                    setDrawShapeMenu(null)
                  }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      padding: '6px 8px', borderRadius: 7, border: `1px solid ${C.cardBdr}`,
                      background: 'rgba(255,255,255,0.03)', color: C.text, cursor: 'pointer',
                      fontSize: 9, fontWeight: 600, transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    <Icon size={14} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {tags.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 12, color: C.muted, pointerEvents: 'none',
            }}>
              <Shapes size={40} style={{ opacity: 0.12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                Double-click canvas or use the sidebar to start
              </p>
            </div>
          )}

          {/* Drag-over indicator */}
          {dragOverCanvas && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 15,
              border: `2px dashed ${C.cyan}`,
              borderRadius: 8,
              background: `${C.cyan}08`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                padding: '12px 24px', borderRadius: 10,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                border: `1px solid ${C.cyan}40`,
                display: 'flex', alignItems: 'center', gap: 8,
                color: C.cyan, fontSize: 13, fontWeight: 600,
              }}>
                <Camera size={16} />
                Drop photo here
              </div>
            </div>
          )}

          {/* Zoom control island */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 2,
            padding: '4px', borderRadius: 10,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            border: `1px solid ${C.cardBdr}`,
          }}>
            <button onClick={zoomOut} title="Zoom out"
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none',
                background: 'transparent', color: C.text, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Minus size={14} />
            </button>
            <span style={{
              minWidth: 32, textAlign: 'center', fontSize: 10, fontWeight: 600, color: C.muted,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {Math.round(scale * 100)}%
            </span>
            <button onClick={zoomIn} title="Zoom in"
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none',
                background: 'transparent', color: C.text, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Plus size={14} />
            </button>
            <div style={{ width: 1, height: 16, background: C.cardBdr, margin: '0 2px' }} />
            <button onClick={resetZoom} title="Reset zoom"
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none',
                background: 'transparent', color: C.text, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <RotateCcw size={13} />
            </button>
          </div>
          </div>

        )}

        {/* Delete confirmation modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setShowConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#141420', border: `1px solid ${C.cardBdr}`,
                borderRadius: 14, padding: 20, maxWidth: 300, width: '90%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Trash2 size={15} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>Delete Node?</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>
                    This will also remove all connections.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowConfirmDelete(null)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.cardBdr}`,
                    background: 'transparent', color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >Cancel</button>
                <button onClick={() => deleteTag(showConfirmDelete)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, border: 'none',
                    background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom status bar */}
      {activeView === 'canvas' && (
      <div style={{
        position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        border: `1px solid ${C.cardBdr}`, borderRadius: 8,
        padding: '5px 12px', fontSize: 10, color: C.muted,
        display: 'flex', alignItems: 'center', gap: 12, zIndex: 5, whiteSpace: 'nowrap',
      }}>
        <span>Drag to move · 4-port connect · Double-click to edit</span>
        {gridSnap && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: C.cyan }}>
            <Grid3X3 size={10} /> Snap
          </span>
        )}
      </div>
      )}
      </div>
    </div>
    </>
  )
}
