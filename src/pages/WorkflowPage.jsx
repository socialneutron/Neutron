import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import {
  Plus, Minus, Trash2, GripVertical, ArrowLeft, PanelLeftClose, PanelLeft,
  Grid3X3, Square, Shapes, MousePointer2,
  Circle, Save, Upload, Clock, DollarSign, Building2, Pencil, Zap,
  RotateCcw,
} from 'lucide-react'

const C = {
  bg: '#05050A',
  card: '#090914',
  cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF',
  purple: '#7928CA',
  green: '#34D399',
  text: '#f1f5f9',
  muted: '#6b7280',
  tagBg: 'rgba(255,255,255,0.03)',
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
  return {
    ...cfg,
    width: tag.width || cfg.width,
    height: tag.height || cfg.height,
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
  const [tags, setTags] = useState([
    { id: '1', text: 'Define Objective', x: 260, y: 40, shape: 'rectangle', duration: '', cost: '', department: '', app: 'google' },
    { id: '2', text: 'Gather Requirements', x: 260, y: 120, shape: 'rectangle', duration: '3d', cost: '5000', department: 'engineering', app: 'google' },
    { id: '3', text: 'Feasible?', x: 260, y: 200, shape: 'diamond', duration: '1d', cost: '2000', department: 'finance', app: '' },
    { id: '4', text: 'Design Solution', x: 80, y: 310, shape: 'rectangle', duration: '5d', cost: '8000', department: 'engineering', app: 'slack' },
    { id: '5', text: 'Export Spec', x: 440, y: 310, shape: 'parallelogram', duration: '2d', cost: '3000', department: 'operations', app: 'stripe' },
    { id: '6', text: 'Implement', x: 80, y: 400, shape: 'rectangle', duration: '10d', cost: '15000', department: 'engineering', app: 'hubspot' },
    { id: '7', text: 'Test & Validate', x: 80, y: 480, shape: 'rectangle', duration: '4d', cost: '6000', department: 'marketing', app: '' },
    { id: '8', text: 'Deploy', x: 80, y: 560, shape: 'rectangle', duration: '2d', cost: '4000', department: 'operations', app: '' },
  ])
  const [connections, setConnections] = useState([
    { from: '1', to: '2', fromPort: 'bottom', toPort: 'top', label: '' },
    { from: '2', to: '3', fromPort: 'bottom', toPort: 'top', label: '' },
    { from: '3', to: '4', fromPort: 'bottom', toPort: 'top', label: 'Yes' },
    { from: '3', to: '5', fromPort: 'right', toPort: 'left', label: 'No' },
    { from: '4', to: '6', fromPort: 'bottom', toPort: 'top', label: '' },
    { from: '6', to: '7', fromPort: 'bottom', toPort: 'top', label: '' },
    { from: '7', to: '8', fromPort: 'bottom', toPort: 'top', label: '' },
  ])
  const [nextId, setNextId] = useState(9)
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
  const [isDrawingNode, setIsDrawingNode] = useState(false)
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 })
  const [drawCurrent, setDrawCurrent] = useState({ x: 0, y: 0 })
  const [drawShapeMenu, setDrawShapeMenu] = useState(null)
  const drawRef = useRef({ isDrawingNode: false, start: { x: 0, y: 0 }, current: { x: 0, y: 0 } })

  const canvasRef = useRef(null)
  const tagRefs = useRef({})
  const pathsRef = useRef([])
  const tagsRef = useRef(tags)

  useEffect(() => { tagsRef.current = tags }, [tags])

  const snap = useCallback((val) => gridSnap ? Math.round(val / 32) * 32 : val, [gridSnap])

  const addTag = useCallback((shape = 'rectangle') => {
    const cfg = SHAPES[shape] || SHAPES.rectangle
    const vw = canvasRef.current?.clientWidth || 600
    const vh = canvasRef.current?.clientHeight || 400
    const cx = vw / 2 - panOffset.x - cfg.width / 2
    const cy = vh / 2 - panOffset.y - cfg.height / 2
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
    setTags(prev => [...prev, newTag])
    setNextId(prev => prev + 1)
    setSelectedTag(newTag.id)
    setEditing(newTag.id)
    setEditText(newTag.text)
  }, [nextId, snap, panOffset])

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
    const minX = Math.min(...tags.map(t => t.x)) - pad
    const minY = Math.min(...tags.map(t => t.y)) - pad
    const maxX = Math.max(...tags.map(t => t.x + getShapeConfig(t).width)) + pad
    const maxY = Math.max(...tags.map(t => t.y + getShapeConfig(t).height)) + pad
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
        if (data.tags) setTags(data.tags.map(t => ({ duration: '', cost: '', department: '', app: '', ...t })))
        if (data.connections) setConnections(data.connections.map(c => ({ fromPort: 'bottom', toPort: 'top', label: '', ...c })))
        if (data.nextId) setNextId(data.nextId)
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
      let x = e.clientX - dragOffset.x
      let y = e.clientY - dragOffset.y
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
    setDragOffset({ x: e.clientX - tag.x, y: e.clientY - tag.y })
    setSelectedTag(tagId)
  }, [tags])

  const handleTagClick = useCallback((e, tagId) => {
    e.stopPropagation()
    setSelectedTag(tagId)
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
        setConnections(prev => [...prev, { from: connectingFrom, to: tagId, fromPort: connectingPort, toPort: port, label: '' }])
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

  const totalCost = tags.reduce((sum, t) => sum + (parseFloat(t.cost) || 0), 0)
  const totalHours = tags.reduce((sum, t) => sum + parseHours(t.duration), 0)

  return (
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
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, flex: 1 }}>
          Workflow
        </h1>
        <span style={{ fontSize: 11, color: C.muted }}>
          {tags.length} nodes · {connections.length} connections
        </span>
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
      </div>

      {/* Body: sidebar + canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* ─── SIDEBAR ─── */}
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
            <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 252, minHeight: 0 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                  Canvas Tools
                </span>
                <button onClick={() => setSidebarOpen(false)}
                  style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 2, display: 'flex' }}
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>

              {/* Add New Node */}
              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                Add New Node
              </span>

              {/* Quick shape inserts */}
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.entries(SHAPES).map(([key, cfg]) => (
                  <motion.button key={key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                    onClick={() => addTag(key)}
                    title={`Add ${cfg.label}`}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '8px 6px', borderRadius: 8, border: `1px solid ${C.cardBdr}`,
                      background: 'rgba(255,255,255,0.03)', color: C.muted, cursor: 'pointer',
                      fontSize: 9, fontWeight: 600, transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.cyan}30`; e.currentTarget.style.color = C.cyan }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBdr; e.currentTarget.style.color = C.muted }}
                  >
                    <cfg.icon size={16} />
                    {cfg.label}
                  </motion.button>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: C.cardBdr }} />

              {/* Grid Snapping Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Grid3X3 size={14} color={C.muted} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Grid Snapping</span>
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

              {/* Selected node properties */}
              {selectedTagData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Selected Node
                  </span>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                    padding: 10, border: `1px solid ${C.cardBdr}`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                      {selectedTagData.text}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>
                      ID: {selectedTagData.id} · {SHAPES[selectedTagData.shape]?.label || 'Process'}
                    </div>

                    {/* Shape selector */}
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

                    {/* Actions */}
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
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Connection
                  </span>
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
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '20px 10px', color: C.muted, fontSize: 11, textAlign: 'center',
                }}>
                  <MousePointer2 size={20} style={{ opacity: 0.3 }} />
                  <span>Click a node or connection to edit</span>
                </div>
              )}

            </div>
          )}
        </motion.aside>

        {/* Sidebar toggle button (when collapsed) */}
        {!sidebarOpen && (
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

        {/* ─── CANVAS ─── */}
        <div
          ref={canvasRef}
          className="grid-canvas"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
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
                <g key={`conn-${i}`}>
                  <path
                    ref={el => { if (el) pathsRef.current[i] = el }}
                    d={path.d}
                    fill="none"
                    stroke={isSelected ? C.cyan : 'rgba(255,255,255,0.18)'}
                    strokeWidth={isSelected ? 2.5 : 2}
                    markerEnd="url(#arrowhead)"
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
                      <rect
                        x={midX - 14} y={midY - 10}
                        width={28} height={20} rx={4}
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
                    }}>
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') { setEditing(null); setEditText('') } }}
                          onClick={e => e.stopPropagation()}
                          onMouseDown={e => e.stopPropagation()}
                          style={{
                            width: '100%', background: 'rgba(0,0,0,0.4)',
                            border: `1px solid ${C.cyan}50`, borderRadius: 4,
                            padding: '4px 8px', textAlign: 'center',
                            color: '#fff', fontSize: 11, fontWeight: 600,
                            outline: 'none', fontFamily: 'inherit',
                          }}
                        />
                      ) : (
                        <span style={{
                          display: 'block', fontSize: 11, fontWeight: 600, color: C.text,
                          padding: 0, lineHeight: 1.35, textAlign: 'center',
                          wordBreak: 'break-word', overflowWrap: 'break-word',
                        }}>
                          {tag.text}
                        </span>
                      )}

                      {/* Grip indicator (center, visible on hover) */}
                      {isHovered && !isEditing && (
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
                    setTags(prev => [...prev, newTag])
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

          {/* Floating ROI dashboard — live-updating */}
          {(totalCost > 0 || totalHours > 0) && (
            <div style={{
              position: 'absolute', top: 12, right: 12, zIndex: 10,
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 14px', borderRadius: 10,
              background: `${C.card}dd`, backdropFilter: 'blur(12px)',
              border: `1px solid ${C.cardBdr}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              pointerEvents: 'auto',
            }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ROI
              </span>
              <div style={{ width: 1, height: 18, background: C.cardBdr }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <DollarSign size={12} color={C.green} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                  ${totalCost.toLocaleString()}
                </span>
              </div>
              <div style={{ width: 1, height: 16, background: C.cardBdr }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} color={C.cyan} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                  {formatHours(totalHours)}
                </span>
              </div>
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

        </div>

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
    </div>
  )
}
