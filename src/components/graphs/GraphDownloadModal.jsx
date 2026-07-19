import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Image, Table, Check } from 'lucide-react';

const C = {
  bg: '#05050A', surface: '#090914', card: '#0d0d1a', border: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', purple: '#7928CA', green: '#34D399',
  text: '#f1f5f9', muted: '#6b7280',
};

const formats = [
  { id: 'pdf', label: 'PDF Report', icon: FileText, desc: 'Full report with description, dataset summary, and creator details' },
  { id: 'png', label: 'PNG Image', icon: Image, desc: 'Graph image only' },
  { id: 'csv', label: 'CSV Data', icon: Table, desc: 'Raw data table' },
];

const checkboxes = [
  { id: 'image', label: 'Graph Image' },
  { id: 'description', label: 'Description' },
  { id: 'creator', label: 'Creator Info' },
  { id: 'summary', label: 'Dataset Summary' },
];

export default function GraphDownloadModal({ isOpen, onClose, graph }) {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [includes, setIncludes] = useState({ image: true, description: true, creator: true, summary: true });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const toggleInclude = (key) => setIncludes((p) => ({ ...p, [key]: !p[key] }));

  const handleDownload = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToast('Download started');
      setTimeout(() => {
        setToast(null);
        onClose();
      }, 1500);
    }, 1200);
  };

  const previewItems = [];
  if (selectedFormat === 'csv') {
    previewItems.push({ label: 'Raw dataset table', rows: graph?.dataRows?.length || 12 });
  } else {
    if (includes.image) previewItems.push({ label: 'Graph image' });
    if (selectedFormat === 'pdf') {
      if (includes.description) previewItems.push({ label: 'Description section' });
      if (includes.creator) previewItems.push({ label: 'Creator details' });
      if (includes.summary) previewItems.push({ label: 'Dataset summary' });
      previewItems.push({ label: 'Export metadata' });
    }
  }

  return (
    <AnimatePresence>
      {!isOpen ? null : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
            }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.text }}>Export Report</h2>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: C.muted,
                  display: 'flex', padding: 4, borderRadius: 6,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {/* Graph preview card */}
              <div style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: 16, marginBottom: 24,
              }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                    background: `linear-gradient(135deg, ${C.cyan}22, ${C.purple}22)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Image size={22} color={C.cyan} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                      {graph?.title || 'Untitled Graph'}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      {graph?.creator || 'Unknown Creator'} &middot; {graph?.date || new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Format selection */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Export Format
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {formats.map((f) => {
                    const Icon = f.icon;
                    const active = selectedFormat === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFormat(f.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                          background: active ? `${C.cyan}12` : C.card,
                          border: `1px solid ${active ? C.cyan : C.border}`,
                          borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                          transition: 'border-color 0.2s, background 0.2s',
                        }}
                      >
                        <Icon size={18} color={active ? C.cyan : C.muted} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: active ? C.text : C.muted }}>{f.label}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>{f.desc}</div>
                        </div>
                        {active && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{
                              width: 20, height: 20, borderRadius: '50%',
                              background: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <Check size={12} color={C.bg} strokeWidth={3} />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Include checkboxes (hidden for CSV) */}
              {selectedFormat !== 'csv' && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Include
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {checkboxes.map((cb) => {
                      const checked = includes[cb.id];
                      return (
                        <button
                          key={cb.id}
                          onClick={() => toggleInclude(cb.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                            background: C.card, border: `1px solid ${C.border}`,
                            borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.2s',
                          }}
                        >
                          <div style={{
                            width: 18, height: 18, borderRadius: 5,
                            border: `1.5px solid ${checked ? C.cyan : C.muted}`,
                            background: checked ? C.cyan : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s, border-color 0.2s',
                          }}>
                            {checked && <Check size={11} color={C.bg} strokeWidth={3} />}
                          </div>
                          <span style={{ fontSize: 13, color: checked ? C.text : C.muted }}>{cb.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preview section */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Preview
                </div>
                <div style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: 14,
                }}>
                  <div style={{ fontSize: 13, color: C.text, marginBottom: 6 }}>
                    Your {selectedFormat.toUpperCase()} will contain:
                  </div>
                  {previewItems.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {previewItems.map((item, i) => (
                        <li key={i} style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>
                          {item.label}{item.rows ? ` (${item.rows} rows)` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ fontSize: 12, color: C.muted }}>Select options to preview</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: `1px solid ${C.border}`,
              display: 'flex', justifyContent: 'flex-end',
            }}>
              <button
                onClick={handleDownload}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer',
                  background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
                  color: C.bg, fontSize: 14, fontWeight: 600,
                  opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
                }}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${C.bg}33`, borderTopColor: C.bg }}
                  />
                ) : (
                  <Download size={16} />
                )}
                {loading ? 'Preparing...' : 'Download'}
              </button>
            </div>
          </motion.div>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                style={{
                  position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
                  background: C.card, border: `1px solid ${C.green}`,
                  borderRadius: 10, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, color: C.green, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <Check size={16} />
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
