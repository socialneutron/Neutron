import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipForward, RotateCcw, CheckCircle2, Circle, Clock, AlertCircle, ArrowRight } from 'lucide-react'

const C = {
  bg: '#05050A',
  card: '#090914',
  cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF',
  green: '#34D399',
  yellow: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  text: '#f1f5f9',
  muted: '#6b7280',
}

function getShapeLabel(shape) {
  const map = {
    rectangle: 'Process', parallelogram: 'I/O', diamond: 'Decision', circle: 'End', image: 'Info',
    stadium: 'Start/End', triangle: 'Triangle', pentagon: 'Pentagon', hexagon: 'Hexagon',
    octagon: 'Octagon', star: 'Star', cylinder: 'Database', cloud: 'External',
    document: 'Document', pill: 'Delay',
  }
  return map[shape] || 'Process'
}

function parseHours(str) {
  if (!str) return 0
  const s = String(str).toLowerCase().trim()
  const num = parseFloat(s)
  if (isNaN(num)) return 0
  if (s.includes('w')) return num * 40
  if (s.includes('d')) return num * 8
  if (s.includes('m') && !s.includes('mo')) return num / 60
  if (s.includes('mo')) return num * 160
  return num
}

function formatHours(h) {
  if (h < 1) return `${Math.round(h * 60)}m`
  if (h < 8) return `${Math.round(h)}h`
  const d = Math.floor(h / 8)
  const r = h % 8
  return r ? `${d}d ${r}h` : `${d}d`
}

function findStartNodes(tags, connections) {
  const targets = new Set(connections.map(c => c.to))
  return tags.filter(t => !targets.has(t.id))
}

function findNextNodes(currentId, connections) {
  return connections
    .filter(c => c.from === currentId)
    .map(c => ({ tagId: c.to, label: c.label || '', port: c.fromPort }))
}

export default function WorkflowEngine({ tags, connections, onClose }) {
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [nodeStates, setNodeStates] = useState({})
  const [currentQueue, setCurrentQueue] = useState([])
  const [log, setLog] = useState([])
  const [stepMode, setStepMode] = useState(false)
  const [decisionAnswers, setDecisionAnswers] = useState({})
  const [pendingDecision, setPendingDecision] = useState(null)
  const [stats, setStats] = useState({ totalCost: 0, totalDuration: 0, nodesCompleted: 0, nodesTotal: 0 })
  const timerRef = useRef(null)
  const logEndRef = useRef(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  const addLog = useCallback((type, message, nodeId) => {
    setLog(prev => [...prev, { type, message, nodeId, timestamp: Date.now() }])
  }, [])

  const startExecution = useCallback(() => {
    const startNodes = findStartNodes(tags, connections)
    if (startNodes.length === 0) {
      addLog('error', 'No start node found. Ensure your workflow has a node with no incoming connections.')
      return
    }

    setRunning(true)
    setPaused(false)
    setLog([])
    setNodeStates({})
    setDecisionAnswers({})
    setCurrentQueue(startNodes.map(n => n.id))
    setStats({ totalCost: 0, totalDuration: 0, nodesCompleted: 0, nodesTotal: tags.length })

    addLog('info', `Execution started. ${tags.length} nodes, ${connections.length} connections.`)
    startNodes.forEach(n => addLog('info', `Starting at: ${n.text}`, n.id))
  }, [tags, connections, addLog])

  const processNode = useCallback((nodeId) => {
    const tag = tags.find(t => t.id === nodeId)
    if (!tag) return

    setNodeStates(prev => ({ ...prev, [nodeId]: 'running' }))
    addLog('step', `Processing: ${tag.text} (${getShapeLabel(tag.shape)})`, nodeId)

    if (tag.shape === 'diamond') {
      setPendingDecision(nodeId)
      addLog('decision', `Decision needed: ${tag.text}`, nodeId)
      return
    }

    const delay = tag.shape === 'circle' ? 100 : Math.min(1500, Math.max(300, parseHours(tag.duration) * 100))

    timerRef.current = setTimeout(() => {
      setNodeStates(prev => ({ ...prev, [nodeId]: 'done' }))
      setStats(prev => ({
        ...prev,
        totalCost: prev.totalCost + (parseFloat(tag.cost) || 0),
        totalDuration: prev.totalDuration + parseHours(tag.duration),
        nodesCompleted: prev.nodesCompleted + 1,
      }))
      addLog('done', `Completed: ${tag.text} [${tag.duration || '0'}] [$${tag.cost || '0'}]`, nodeId)

      const nexts = findNextNodes(nodeId, connections)
      if (nexts.length === 0) {
        addLog('info', `Workflow ended at: ${tag.text}`)
        setRunning(false)
      } else if (!stepMode) {
        setCurrentQueue(prev => [...prev, ...nexts.map(n => n.tagId)])
      }
    }, stepMode ? 100 : delay)
  }, [tags, connections, addLog, stepMode])

  const answerDecision = useCallback((nodeId, answer) => {
    setPendingDecision(null)
    setDecisionAnswers(prev => ({ ...prev, [nodeId]: answer }))
    setNodeStates(prev => ({ ...prev, [nodeId]: 'done' }))

    const tag = tags.find(t => t.id === nodeId)
    addLog('done', `Decision "${tag?.text}": ${answer}`, nodeId)

    const nexts = findNextNodes(nodeId, connections)
    const matching = nexts.filter(n => {
      const label = n.label.toLowerCase()
      return label === answer.toLowerCase() || (answer === 'Yes' && (label === 'yes' || label === 'true' || label === 'pass')) || (answer === 'No' && (label === 'no' || label === 'false' || label === 'fail'))
    })

    const fallback = matching.length > 0 ? matching : nexts
    if (!stepMode) {
      setCurrentQueue(prev => [...prev, ...fallback.map(n => n.tagId)])
    }
  }, [tags, connections, addLog, stepMode])

  useEffect(() => {
    if (!running || paused || currentQueue.length === 0 || pendingDecision) return

    const nextId = currentQueue[0]
    setCurrentQueue(prev => prev.slice(1))

    if (nodeStates[nextId] === 'done' || nodeStates[nextId] === 'running') return

    processNode(nextId)
  }, [running, paused, currentQueue, pendingDecision, nodeStates, processNode])

  const stepForward = useCallback(() => {
    if (currentQueue.length === 0 || pendingDecision) return
    const nextId = currentQueue[0]
    setCurrentQueue(prev => prev.slice(1))
    if (nodeStates[nextId] !== 'done' && nodeStates[nextId] !== 'running') {
      processNode(nextId)
    }
  }, [currentQueue, pendingDecision, nodeStates, processNode])

  const stopExecution = useCallback(() => {
    setRunning(false)
    setPaused(false)
    clearTimeout(timerRef.current)
    addLog('info', 'Execution stopped.')
  }, [addLog])

  const resetExecution = useCallback(() => {
    setRunning(false)
    setPaused(false)
    setNodeStates({})
    setCurrentQueue([])
    setLog([])
    setDecisionAnswers({})
    setPendingDecision(null)
    setStats({ totalCost: 0, totalDuration: 0, nodesCompleted: 0, nodesTotal: 0 })
    clearTimeout(timerRef.current)
  }, [])

  const togglePause = useCallback(() => {
    setPaused(prev => !prev)
    if (paused) addLog('info', 'Resumed.')
    else addLog('info', 'Paused.')
  }, [paused, addLog])

  const getStatusIcon = (nodeId) => {
    const state = nodeStates[nodeId]
    if (state === 'done') return <CheckCircle2 size={11} color={C.green} />
    if (state === 'running') return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Clock size={11} color={C.yellow} /></motion.div>
    return <Circle size={11} color={C.muted} />
  }

  const getLogColor = (type) => {
    const map = { info: C.muted, step: C.cyan, done: C.green, decision: C.yellow, error: C.red }
    return map[type] || C.muted
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          Execution Engine
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setStepMode(!stepMode)}
            style={{
              padding: '3px 7px', borderRadius: 5, border: `1px solid ${stepMode ? C.purple + '50' : C.cardBdr}`,
              background: stepMode ? C.purple + '15' : 'transparent',
              color: stepMode ? C.purple : C.muted, fontSize: 9, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {stepMode ? 'Step' : 'Auto'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 4 }}>
        {!running ? (
          <motion.button whileTap={{ scale: 0.95 }} onClick={startExecution}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '6px 0', borderRadius: 7, border: 'none',
              background: C.green, color: '#000', fontSize: 10, fontWeight: 700, cursor: 'pointer',
            }}>
            <Play size={11} /> Run
          </motion.button>
        ) : (
          <>
            <motion.button whileTap={{ scale: 0.95 }} onClick={togglePause}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '6px 0', borderRadius: 7, border: `1px solid ${C.yellow}30`,
                background: C.yellow + '10', color: C.yellow, fontSize: 10, fontWeight: 600, cursor: 'pointer',
              }}>
              <Pause size={11} /> {paused ? 'Resume' : 'Pause'}
            </motion.button>
            {stepMode && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={stepForward} disabled={!!pendingDecision}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '6px 0', borderRadius: 7, border: `1px solid ${C.cyan}30`,
                  background: C.cyan + '10', color: C.cyan, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  opacity: pendingDecision ? 0.5 : 1,
                }}>
                <SkipForward size={11} /> Step
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.95 }} onClick={stopExecution}
              style={{
                padding: '6px 8px', borderRadius: 7, border: `1px solid ${C.red}30`,
                background: C.red + '10', color: C.red, fontSize: 10, fontWeight: 600, cursor: 'pointer',
              }}>
              Stop
            </motion.button>
          </>
        )}
        <motion.button whileTap={{ scale: 0.95 }} onClick={resetExecution}
          style={{
            padding: '6px 8px', borderRadius: 7, border: `1px solid ${C.cardBdr}`,
            background: 'rgba(255,255,255,0.03)', color: C.muted, cursor: 'pointer',
          }}>
          <RotateCcw size={11} />
        </motion.button>
      </div>

      {/* Decision prompt */}
      <AnimatePresence>
        {pendingDecision && (() => {
          const tag = tags.find(t => t.id === pendingDecision)
          const nexts = findNextNodes(pendingDecision, connections)
          const labels = [...new Set(nexts.map(n => n.label).filter(Boolean))]
          return (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}>
              <div style={{ background: C.yellow + '08', border: `1px solid ${C.yellow}25`, borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <AlertCircle size={12} color={C.yellow} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.yellow }}>{tag?.text}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {labels.length > 0 ? labels.map(l => (
                    <motion.button key={l} whileTap={{ scale: 0.95 }} onClick={() => answerDecision(pendingDecision, l)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.cyan}30`,
                        background: C.cyan + '10', color: C.cyan, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                      }}>
                      {l}
                    </motion.button>
                  )) : (
                    <>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => answerDecision(pendingDecision, 'Yes')}
                        style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.green}30`, background: C.green + '10', color: C.green, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                        Yes
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => answerDecision(pendingDecision, 'No')}
                        style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.red}30`, background: C.red + '10', color: C.red, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                        No
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Stats bar */}
      {running && (
        <div style={{ display: 'flex', gap: 8, fontSize: 9, color: C.muted, fontFamily: 'monospace' }}>
          <span>Cost: <b style={{ color: C.cyan }}>${stats.totalCost.toLocaleString()}</b></span>
          <span>Time: <b style={{ color: C.cyan }}>{formatHours(stats.totalDuration)}</b></span>
          <span>Nodes: <b style={{ color: C.green }}>{stats.nodesCompleted}/{stats.nodesTotal}</b></span>
        </div>
      )}

      {/* Node status list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 120, overflowY: 'auto' }}>
        {tags.map(tag => (
          <div key={tag.id} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px',
            borderRadius: 5, fontSize: 9, color: nodeStates[tag.id] === 'done' ? C.green : nodeStates[tag.id] === 'running' ? C.yellow : C.muted,
            background: nodeStates[tag.id] === 'running' ? C.yellow + '08' : 'transparent',
          }}>
            {getStatusIcon(tag.id)}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag.text}</span>
            {tag.duration && <span style={{ fontFamily: 'monospace', opacity: 0.6 }}>{tag.duration}</span>}
          </div>
        ))}
      </div>

      {/* Execution log */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, borderTop: `1px solid ${C.cardBdr}`, paddingTop: 4, overflow: 'hidden' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 4 }}>
          Execution Log
        </span>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {log.length === 0 && (
            <div style={{ textAlign: 'center', padding: '12px 0', color: C.muted, fontSize: 9 }}>
              Click "Run" to start execution
            </div>
          )}
          {log.map((entry, i) => (
            <div key={i} style={{ fontSize: 9, color: getLogColor(entry.type), lineHeight: 1.4, display: 'flex', gap: 4 }}>
              <span style={{ fontFamily: 'monospace', opacity: 0.4, flexShrink: 0 }}>
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span>{entry.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  )
}
