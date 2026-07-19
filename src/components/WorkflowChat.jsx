import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Send, Key, Loader2, Wand2 } from 'lucide-react'

const API_URL = 'https://api.deepseek.com/v1/chat/completions'
const STORAGE_KEY = 'deepseek_api_key'
const CHAT_KEY = 'workflow_chat_history'

const C = {
  bg: '#05050A',
  card: '#090914',
  cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF',
  purple: '#7928CA',
  text: '#f1f5f9',
  muted: '#6b7280',
}

const SYSTEM_PROMPT = `You are a workflow design assistant that can BOTH advise AND directly modify the user's workflow.

You can suggest improvements and ALSO perform actions. When performing actions, respond with BOTH a human-readable message AND a JSON action block.

ACTION FORMAT (put inside <ACTION> tags):
<ACTION>{"type":"add_node","text":"Step Name","shape":"rectangle","duration":"5d","cost":"1000","department":"engineering"}</ACTION>
<ACTION>{"type":"edit_node","id":"3","text":"New Text","duration":"2d"}</ACTION>
<ACTION>{"type":"delete_node","id":"5"}</ACTION>
<ACTION>{"type":"add_connection","from":"1","to":"2","fromPort":"bottom","toPort":"top","label":""}</ACTION>
<ACTION>{"type":"delete_connection","from":"1","to":"2"}</ACTION>
<ACTION>{"type":"set_duration","id":"3","duration":"5d"}</ACTION>
<ACTION>{"type":"set_cost","id":"3","cost":"5000"}</ACTION>
<ACTION>{"type":"set_department","id":"3","department":"engineering"}</ACTION>

Available shapes: rectangle (Process), parallelogram (I/O), diamond (Decision), circle (End).
Available departments: engineering, marketing, sales, hr, finance, operations.
Available integrations: google, gmail, slack, stripe, hubspot, zapier.

Multiple actions can be chained. Keep messages concise. Always include the ACTION tags when modifying the workflow.`

function parseActions(text) {
  const actions = []
  const actionRegex = /<ACTION>([\s\S]*?)<\/ACTION>/g
  let match
  while ((match = actionRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim())
      actions.push(parsed)
    } catch { /* ignore malformed */ }
  }
  return actions
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(msgs) {
  try { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-50))) } catch { /* ignore */ }
}

export default function WorkflowChat({ tags, connections, onApplyActions }) {
  const [messages, setMessages] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || ''
    return stored.startsWith('sk-') ? stored : ''
  })
  const [showKeyInput, setShowKeyInput] = useState(!apiKey)
  const [lastActions, setLastActions] = useState([])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])
  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { if (apiKey) localStorage.setItem(STORAGE_KEY, apiKey); else localStorage.removeItem(STORAGE_KEY) }, [apiKey])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const key = apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY || ''
    if (!key) { setShowKeyInput(true); return }

    if (!key.startsWith('sk-')) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Invalid API key format. DeepSeek keys start with "sk-". Please enter a valid key in the input above.' }])
      setShowKeyInput(true)
      return
    }

    setInput('')
    const userMsg = { role: 'user', content: text }

    const workflowContext = tags?.length ? `\n\nCurrent workflow state:\n- ${tags.length} nodes, ${connections?.length || 0} connections\n- Nodes: ${tags.map(t => `[${t.id}] "${t.text}" (${t.shape}, dept:${t.department || 'none'}, cost:$${t.cost || 0}, dur:${t.duration || 'none'})`).join('\n- ')}\n- Connections: ${connections?.map(c => `[${c.from}]-->[${c.to}] "${c.label || ''}"`).join(', ') || 'none'}` : ''

    const history = [...messages, userMsg]
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const body = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + workflowContext },
        ...history.slice(-20),
      ],
      max_tokens: 1500,
      temperature: 0.7,
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errBody = await res.text()
        const isAuth = errBody.toLowerCase().includes('authentication') || errBody.toLowerCase().includes('unauthorized') || errBody.toLowerCase().includes('invalid api')
        if (isAuth) throw new Error('__AUTH__')
        throw new Error(`API error (${res.status})`)
      }

      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content || 'No response'

      const actions = parseActions(reply)
      const cleanReply = reply.replace(/<ACTION>[\s\S]*?<\/ACTION>/g, '').trim()

      const assistantMsg = { role: 'assistant', content: cleanReply || reply }
      setMessages(prev => [...prev, assistantMsg])
      saveHistory([...history, assistantMsg])

      if (actions.length > 0 && onApplyActions) {
        setLastActions(actions)
        onApplyActions(actions)
      }
    } catch (err) {
      const msg = err.message
      let displayMsg
      if (msg === '__AUTH__') {
        displayMsg = 'Authentication failed. Your DeepSeek API key is invalid or expired.'
      } else {
        displayMsg = 'Unable to connect to assistant. Check your network connection.'
      }
      setMessages(prev => [...prev, { role: 'assistant', content: displayMsg }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, apiKey, messages, tags, connections, onApplyActions])

  const clearChat = useCallback(() => {
    setMessages([])
    localStorage.removeItem(CHAT_KEY)
  }, [])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: 6, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 7, background: `${C.purple}20`,
          border: `1px solid ${C.purple}30`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={12} color={C.purple} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          AI Assistant
        </span>
        {onApplyActions && (
          <span style={{ fontSize: 8, color: C.green, background: C.green + '15', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
            CAN EDIT
          </span>
        )}
      </div>

      {/* API Key input */}
      {showKeyInput && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Key size={10} color={C.muted} />
            <span style={{ fontSize: 9, fontWeight: 600, color: C.muted }}>DeepSeek API Key</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              style={{
                flex: 1, padding: '5px 8px', borderRadius: 6, border: `1px solid ${C.cardBdr}`,
                background: 'rgba(255,255,255,0.03)', color: C.text, fontSize: 10,
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button onClick={() => {
              if (apiKey.startsWith('sk-')) {
                setShowKeyInput(false);
                localStorage.setItem(STORAGE_KEY, apiKey)
              } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Invalid format. DeepSeek API keys must start with "sk-".' }])
              }
            }}
              style={{
                padding: '5px 10px', borderRadius: 6, border: 'none',
                background: apiKey.startsWith('sk-') ? C.cyan : 'rgba(255,255,255,0.05)',
                color: apiKey.startsWith('sk-') ? '#000' : C.muted, fontSize: 10, fontWeight: 700, cursor: 'pointer',
              }}
            >Save</button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', minHeight: 0,
        display: 'flex', flexDirection: 'column', gap: 6,
        borderTop: `1px solid ${C.cardBdr}`, borderBottom: `1px solid ${C.cardBdr}`,
        padding: '6px 0',
      }}>
        {messages.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center', color: C.muted, fontSize: 10, lineHeight: 1.6 }}>
            <Wand2 size={22} style={{ opacity: 0.15, marginBottom: 4 }} />
            <div style={{ marginBottom: 4 }}>Ask me to design or modify your workflow</div>
            <div style={{ fontSize: 8, opacity: 0.5 }}>
              e.g. "Add a testing step after Build"<br/>
              "Set all engineering costs to 5000"<br/>
              "Create a complete CI/CD pipeline"
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: 5,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}>
              <div style={{
                maxWidth: '88%',
                padding: '5px 9px', borderRadius: 7,
                background: msg.role === 'user' ? `${C.cyan}12` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${msg.role === 'user' ? `${C.cyan}15` : C.cardBdr}`,
              }}>
                <p style={{ margin: 0, fontSize: 10, color: C.text, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.content}
                </p>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '3px 0' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}>
              <Loader2 size={11} color={C.purple} />
            </motion.div>
            <span style={{ fontSize: 9, color: C.muted }}>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Ask or instruct..."
          style={{
            flex: 1, padding: '6px 9px', borderRadius: 7, border: `1px solid ${C.cardBdr}`,
            background: 'rgba(255,255,255,0.03)', color: C.text, fontSize: 10,
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          style={{
            padding: '6px 8px', borderRadius: 7, border: 'none',
            background: input.trim() ? C.cyan : 'rgba(255,255,255,0.05)',
            color: input.trim() ? '#000' : C.muted, cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Send size={11} />
        </button>
      </div>

      {messages.length > 0 && (
        <button onClick={clearChat}
          style={{ padding: '2px 0', borderRadius: 4, border: 'none', background: 'none', color: C.muted, fontSize: 8, cursor: 'pointer', textAlign: 'left' }}>
          Clear chat
        </button>
      )}
    </div>
  )
}
