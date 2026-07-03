import React, { useState, useRef, useEffect } from 'react';
import { useAnimations } from '../context/AnimationContext';
import { Graph, DataPoint, ChartSeries, ChartType, Folder } from '../types';
import { 
  Plus, Trash2, Key, FolderOpen, RefreshCw, Sparkles, AlertCircle, 
  Upload, Download, FileText, CheckCircle, Sliders, Palette, Grid, HelpCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, Area, Scatter, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import NeutronLogo from './NeutronLogo';

interface GraphCreatorProps {
  folders: Folder[];
  onSaveGraph: (graph: Omit<Graph, 'id' | 'creatorId' | 'creatorName' | 'creatorAvatar' | 'creatorHandle' | 'uploadDate' | 'views' | 'likes' | 'commentsCount' | 'comments'> & { id?: string }) => void;
  editingGraph?: Graph | null;
  onCancel: () => void;
}

// Compact robust CSV parser (extract headers & row dictionaries)
function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return { headers: [], data: [] };

  const delimiter = text.includes('\t') ? '\t' : (text.includes(';') ? ';' : ',');
  
  // Clean quotes off headers
  const headers = lines[0].split(delimiter).map(h => h.replace(/^["']|["']$/g, '').trim());
  const data: DataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.replace(/^["']|["']$/g, '').trim());
    if (values.length < headers.length) continue;
    
    const rowObj: DataPoint = {};
    headers.forEach((h, index) => {
      const val = values[index];
      // Convert to number if numeric, else keep string
      rowObj[h] = isNaN(Number(val)) || val === '' ? val : Number(val);
    });
    data.push(rowObj);
  }

  return { headers, data };
}

export default function GraphCreator({ folders, onSaveGraph, editingGraph, onCancel }: GraphCreatorProps) {
  const { animationsEnabled } = useAnimations();

  // Primary Metadata
  const [title, setTitle] = useState(editingGraph?.title || '');
  const [description, setDescription] = useState(editingGraph?.description || '');
  const [category, setCategory] = useState(editingGraph?.category || 'Finance');
  const [tagsInput, setTagsInput] = useState(editingGraph?.tags.join(', ') || '');
  const [isPrivate, setIsPrivate] = useState(editingGraph?.isPrivate || false);
  const [password, setPassword] = useState(editingGraph?.password || '');
  const [folderId, setFolderId] = useState(editingGraph?.folderId || '');

  // Core Chart Configuration
  const [chartType, setChartType] = useState<ChartType>(editingGraph?.type || 'line');
  const [themeColor, setThemeColor] = useState(editingGraph?.themeColor || '#00BFFF');
  const [gridVisible, setGridVisible] = useState(editingGraph?.gridVisible !== false);
  const [dotVisible, setDotVisible] = useState(editingGraph?.dotVisible !== false);
  const [showValues, setShowValues] = useState(editingGraph?.showValues || false);
  const [isAreaGradient, setIsAreaGradient] = useState(editingGraph?.isAreaGradient !== false);

  // Raw Interactive Grid States
  const [headers, setHeaders] = useState<string[]>([]);
  const [gridData, setGridData] = useState<DataPoint[]>([]);
  const [independentKey, setIndependentKey] = useState('');
  const [activeSeries, setActiveSeries] = useState<ChartSeries[]>([]);

  // CSV paste input toggle
  const [pastedText, setPastedText] = useState('');
  const [csvUploadError, setCsvUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gemini AI Analysis Drawer States
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(editingGraph?.aiAnalysis || null);
  const [aiError, setAiError] = useState('');

  // Initial Data Prep (Load editor if specified or populate nice default coordinates)
  useEffect(() => {
    if (editingGraph) {
      const originalHeaders = Object.keys(editingGraph.data[0] || {});
      setHeaders(originalHeaders);
      setGridData(editingGraph.data);
      setIndependentKey(editingGraph.independentKey || originalHeaders[0] || 'label');
      setActiveSeries(editingGraph.seriesList);
    } else {
      // Default template data for rapid editing onboarding
      const defaultHeaders = ['month', 'revenue', 'expenses'];
      setHeaders(defaultHeaders);
      setIndependentKey('month');
      setGridData([
        { month: 'Jul', revenue: 110, expenses: 84 },
        { month: 'Aug', revenue: 142, expenses: 95 },
        { month: 'Sep', revenue: 135, expenses: 102 },
        { month: 'Oct', revenue: 168, expenses: 115 },
        { month: 'Nov', revenue: 185, expenses: 120 }
      ]);
      setActiveSeries([
        { key: 'revenue', name: 'Revenue ($K)', color: '#00BFFF' },
        { key: 'expenses', name: 'Expenses ($K)', color: '#FF00FF' }
      ]);
    }
  }, [editingGraph]);

  // Adjust Series on Header/Data Change
  const updateSeriesHeaders = (newHeaders: string[], dataSlice: DataPoint[]) => {
    // Treat the first column as Independent Key and subsequent numeric headers as interactive series
    const indy = newHeaders[0] || '';
    setIndependentKey(indy);

    const presetColors = ['#00BFFF', '#10B981', '#39FF14', '#FFD700', '#FF8C00', '#FF4500', '#EF4444', '#FF1493', '#FF00FF', '#9370DB', '#6366F1', '#A5F3FC'];
    const numericKeys = newHeaders.filter(h => h !== indy && dataSlice.some(row => typeof row[h] === 'number'));

    const series: ChartSeries[] = numericKeys.map((key, index) => ({
      key,
      name: key.toUpperCase(),
      color: presetColors[index % presetColors.length]
    }));

    setActiveSeries(series);
    if (series.length === 0 && newHeaders.length > 1) {
      // Fallback: use first secondary header even if text
      setActiveSeries([{
        key: newHeaders[1],
        name: newHeaders[1].toUpperCase(),
        color: '#00BFFF'
      }]);
    }
  };

  // CSV File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      try {
        const parsed = parseCSV(content);
        if (parsed.headers.length === 0) throw new Error("CSV file lacks parsable content headers.");
        setHeaders(parsed.headers);
        setGridData(parsed.data);
        updateSeriesHeaders(parsed.headers, parsed.data);
        setCsvUploadError('');
      } catch (err: any) {
        setCsvUploadError(err.message || "Failed decoding CSV source. Verify encoding formatting.");
      }
    };
    reader.readAsText(file);
  };

  // Manual Pasting text parser
  const handlePasteProcess = () => {
    if (!pastedText.trim()) return;
    try {
      const parsed = parseCSV(pastedText);
      if (parsed.headers.length === 0) throw new Error("No headers detected.");
      setHeaders(parsed.headers);
      setGridData(parsed.data);
      updateSeriesHeaders(parsed.headers, parsed.data);
      setPastedText('');
      setCsvUploadError('');
    } catch (err: any) {
      setCsvUploadError(err.message || "Decoding error. Ensure comma or tab separation matrix.");
    }
  };

  // Interactive Grid Mutators
  const updateCellValue = (rowIndex: number, headerKey: string, val: string) => {
    setGridData(prev => prev.map((row, index) => {
      if (index === rowIndex) {
        const typedVal = isNaN(Number(val)) || val === '' ? val : Number(val);
        return { ...row, [headerKey]: typedVal };
      }
      return row;
    }));
  };

  const addGridRow = () => {
    const newRow: DataPoint = {};
    headers.forEach(h => {
      newRow[h] = h === independentKey ? `Node-${gridData.length + 1}` : 0;
    });
    setGridData(prev => [...prev, newRow]);
  };

  const deleteGridRow = (index: number) => {
    if (gridData.length <= 1) return;
    setGridData(prev => prev.filter((_, i) => i !== index));
  };

  const addColumnHeader = () => {
    const suffix = headers.length;
    const newHeaderName = `metric_${suffix}`;
    setHeaders(prev => [...prev, newHeaderName]);
    setGridData(prev => prev.map(row => ({ ...row, [newHeaderName]: 0 })));
    setActiveSeries(prev => [...prev, {
      key: newHeaderName,
      name: newHeaderName.toUpperCase(),
      color: themeColor
    }]);
  };

  // Trigger Backend AI Analytics using express `/api/gemini/analyze`
  const triggerAIAnalysis = async () => {
    setAiAnalyzing(true);
    setAiError('');
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || "Telemetry Simulation",
          data: gridData,
          type: chartType,
          description: description,
          promptType: "all"
        })
      });

      if (!res.ok) throw new Error(`Operational code error: ${res.status}`);
      const parsedInsights = await res.json();
      setAiResult({
        ...parsedInsights,
        analyzedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed connecting to server intelligence node. Check network status.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Save Config to pipeline parent
  const handleSave = () => {
    if (!title.trim()) {
      alert("A telemetry visual title is required.");
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    onSaveGraph({
      title: title.trim(),
      description: description.trim(),
      category,
      tags,
      isPrivate,
      password: isPrivate && password ? password : undefined,
      passwordProtected: isPrivate && !!password,
      folderId: folderId || null,
      type: chartType,
      data: gridData,
      seriesList: activeSeries,
      independentKey: independentKey || headers[0] || 'label',
      themeColor,
      gridVisible,
      dotVisible,
      showValues,
      isAreaGradient,
      aiAnalysis: aiResult || undefined
    });
  };

  // Local exporter helper functions
  const handleExportCSV = () => {
    if (gridData.length === 0) return;
    const csvRows: string[] = [];
    csvRows.push(headers.join(','));

    gridData.forEach(row => {
      const values = headers.map(h => {
        const val = row[h];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_telemetry.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Live Preview Chart using Recharts
  const renderLiveChart = () => {
    if (gridData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center border border-dashed border-neutral-800 rounded-xl text-neutral-500 font-mono text-xs">
          STATION SEED MISSING // FILL GRID CELLS TO BOOT PREVIEW
        </div>
      );
    }

    if (chartType === 'pie') {
      const valueKey = activeSeries[0]?.key || headers[1] || Object.keys(gridData[0] || {}).find(k => k !== independentKey) || '';
      const pieData = gridData.map((d, index) => ({
        name: String(d[independentKey] || index),
        value: Number(d[valueKey] || 0)
      }));

      const colors = [themeColor, '#10B981', '#39FF14', '#FFD700', '#FF8C00', '#FF4500', '#EF4444', '#FF1493', '#FF00FF', '#9370DB', '#6366F1', '#A5F3FC', '#FF69B4'];

      return (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              isAnimationActive={animationsEnabled}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#222', borderRadius: '12px' }}
              itemStyle={{ color: '#DDD' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // Prepare candlestick shapes
    if (chartType === 'candlestick') {
      // Recharts Candlestick visualization composed of multiple custom series coordinates
      // We will render high, low, open, close
      return (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={gridData} margin={{ top: 15, right: 15, left: 0, bottom: 15 }}>
            <XAxis dataKey={independentKey} stroke="#555" tick={{ fill: '#888', fontSize: 10 }} />
            <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 10 }} />
            {gridVisible && <CartesianGrid strokeDasharray="3 3" stroke="#222" />}
            <Tooltip
              contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '12px', color: '#fff' }}
              formatter={(value, name) => [value, String(name).toUpperCase()]}
            />
            <Legend />
            {/* Shadows/Wicks rendered using a custom transparent bar with error dimensions or a Bar trick */}
            <Bar 
              dataKey="high" 
              fill="#FF3E3E" 
              name="Highwick Bounds" 
              barSize={2}
              isAnimationActive={animationsEnabled}
            />
            <Bar 
              dataKey="close" 
              fill={themeColor} 
              name="Index Close" 
              barSize={12}
              radius={[2, 2, 0, 0]}
              isAnimationActive={animationsEnabled}
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    // Default ComposedChart for Line, Bar, Area, Mixed, Scatter, Multi-series
    return (
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={gridData} margin={{ top: 15, right: 15, left: 0, bottom: 15 }}>
          <XAxis dataKey={independentKey} stroke="#555" tick={{ fill: '#888', fontSize: 10 }} />
          <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 10 }} />
          {gridVisible && <CartesianGrid strokeDasharray="3 3" stroke="#222" />}
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#222', borderRadius: '12px', color: '#FFF' }}
            formatter={(value, name) => [value, String(name).toUpperCase()]}
          />
          <Legend />

          {activeSeries.map((series, idx) => {
            const hexColor = series.color || themeColor;

            // Determine specific sub-series graphics
            const visualRep = chartType === 'mixed' 
              ? (idx % 2 === 0 ? 'bar' : 'line') 
              : chartType;

            if (visualRep === 'bar') {
              return (
                <Bar 
                  key={series.key} 
                  dataKey={series.key} 
                  name={series.name} 
                  fill={hexColor} 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={animationsEnabled}
                />
              );
            }

            if (visualRep === 'area') {
              return (
                <React.Fragment key={series.key}>
                  <defs>
                    <linearGradient id={`grad-${series.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={hexColor} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={hexColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey={series.key}
                    name={series.name}
                    stroke={hexColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={isAreaGradient ? `url(#grad-${series.key})` : hexColor}
                    dot={dotVisible ? { r: 3, fill: hexColor } : false}
                    isAnimationActive={animationsEnabled}
                  />
                </React.Fragment>
              );
            }

            if (visualRep === 'scatter') {
              return (
                <Scatter 
                  key={series.key} 
                  dataKey={series.key} 
                  name={series.name} 
                  fill={hexColor}
                  line={false}
                  isAnimationActive={animationsEnabled}
                />
              );
            }

            // Otherwise standard line
            return (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.name}
                stroke={hexColor}
                strokeWidth={2}
                dot={dotVisible ? { r: 4, strokeWidth: 0, fill: hexColor } : false}
                isAnimationActive={animationsEnabled}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      {/* LEFT COLUMN: Controls & Creator Settings, 4 cols */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Core Settings Studio Card */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 space-y-5 relative shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00BFFF]/5 blur-2xl rounded-full"></div>
          <div className="flex items-center space-x-2 text-[#00BFFF] font-mono text-xs uppercase font-extrabold tracking-wider text-glow relative z-10">
            <Sliders className="w-4 h-4 text-glow" />
            <span>Graph Config Node</span>
          </div>

          <div className="space-y-4 relative z-10">
            <div>
              <label htmlFor="graph-title-input" className="block text-[10px] font-mono text-neutral-500 uppercase mb-1.5 font-bold">Graph Visual Title</label>
              <input
                type="text"
                id="graph-title-input"
                placeholder="e.g., SOL Network Telemetry"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF] transition-all"
              />
            </div>

            <div>
              <label htmlFor="graph-desc-input" className="block text-[10px] font-mono text-neutral-500 uppercase mb-1.5 font-bold">Telemetry Description</label>
              <textarea
                id="graph-desc-input"
                placeholder="Provide analytical context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF] resize-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="graph-category-select" className="block text-[10px] font-mono text-neutral-500 uppercase mb-1.5 font-bold">Category</label>
                <select
                  id="graph-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF] transition-colors"
                >
                  <option value="Finance">Finance</option>
                  <option value="Science">Science</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Genetics">Genetics</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label htmlFor="graph-tags-input" className="block text-[10px] font-mono text-neutral-500 uppercase mb-1.5 font-bold font-sans">Tags (comma split)</label>
                <input
                  type="text"
                  id="graph-tags-input"
                  placeholder="crypto, defi, solana"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visual Customization Card */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 space-y-5 relative shadow-lg">
          <div className="flex items-center space-x-2 text-[#00BFFF] font-mono text-xs uppercase font-extrabold tracking-wider text-glow">
            <Palette className="w-4 h-4 text-glow" />
            <span>Aesthetics Engine</span>
          </div>

          <div className="space-y-4">
            {/* Chart type grid selection */}
            <div>
              <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-2 font-bold">Graphics Topology</span>
              <div className="grid grid-cols-4 gap-1.5" aria-label="Chart Type Selection">
                {([
                  { id: 'line', l: 'Line' },
                  { id: 'bar', l: 'Bar' },
                  { id: 'area', l: 'Area' },
                  { id: 'pie', l: 'Pie' },
                  { id: 'scatter', l: 'Scatter' },
                  { id: 'candlestick', l: 'Candle' },
                  { id: 'multi', l: 'Multi' },
                  { id: 'mixed', l: 'Mixed' }
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    id={`type-btn-${t.id}`}
                    type="button"
                    onClick={() => {
                      setChartType(t.id);
                      if (t.id === 'candlestick' && !headers.includes('high')) {
                        // Inject high/low headers as convenience for candle metrics
                        setHeaders(['month', 'open', 'high', 'low', 'close']);
                        setGridData([
                          { month: '09:00', open: 10, high: 28, low: 5, close: 22 },
                          { month: '12:00', open: 22, high: 45, low: 18, close: 34 },
                          { month: '15:00', open: 34, high: 38, low: 22, close: 30 }
                        ]);
                        setIndependentKey('month');
                        setActiveSeries([{ key: 'close', name: 'Spot Price', color: themeColor }]);
                      }
                    }}
                    className={`py-2 rounded-lg border text-[9.5px] font-mono uppercase tracking-wide transition-all cursor-pointer ${
                      chartType === t.id
                        ? 'bg-[#00BFFF]/10 border-[#00BFFF] text-white shadow-[0_0_12px_rgba(0,191,255,0.25)]'
                        : 'bg-white/[0.01] border-white/5 text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {t.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Theme Color Picker */}
            <div>
              <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-2 font-bold">Accent Hue Channel</span>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="grid grid-cols-6 gap-2" aria-label="Color Picker Preset Palette">
                  {['#00BFFF', '#10B981', '#39FF14', '#FFD700', '#FF8C00', '#FF4500', '#EF4444', '#FF1493', '#FF00FF', '#9370DB', '#6366F1', '#A5F3FC'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setThemeColor(color);
                        setActiveSeries(prev => prev.map((s, idx) => idx === 0 ? { ...s, color } : s));
                      }}
                      className={`w-6 h-6 rounded-full border transition-all hover:scale-110 cursor-pointer ${
                        themeColor.toLowerCase() === color.toLowerCase() ? 'scale-115 border-white shadow-[0_0_10px_rgba(255,255,255,0.4)] ring-2 ring-white/20' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                {/* Custom HEX code input */}
                <input
                  type="text"
                  id="custom-hex-picker"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-20 bg-neutral-900 border border-white/10 rounded-lg p-1.5 text-[10px] font-mono uppercase text-center focus:outline-none focus:border-[#00BFFF]"
                />
              </div>
            </div>

            {/* Micro-Toggles grid */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <label className="flex items-center space-x-2.5 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gridVisible}
                  onChange={(e) => setGridVisible(e.target.checked)}
                  className="accent-[#00BFFF] rounded"
                />
                <span className="font-sans">Cartesian Grid</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dotVisible}
                  onChange={(e) => setDotVisible(e.target.checked)}
                  className="accent-[#00BFFF] rounded"
                />
                <span className="font-sans">Vertex Nodes</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-neutral-300 cursor-pointer col-span-2">
                <input
                  type="checkbox"
                  checked={isAreaGradient}
                  onChange={(e) => setIsAreaGradient(e.target.checked)}
                  className="accent-[#00BFFF] rounded"
                />
                <span className="font-sans">Area Wave Gradient Glow</span>
              </label>
            </div>
          </div>
        </div>

        {/* Security & Organization Folder assignment Card */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 space-y-5 relative shadow-lg">
          <div className="flex items-center space-x-2 text-[#00BFFF] font-mono text-xs uppercase font-extrabold tracking-wider text-glow">
            <Key className="w-4 h-4 text-glow" />
            <span>Folder Sync & Cryptography</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-300 font-sans">Private Lockout Mode</span>
              <button
                id="private-mode-switcher"
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-all outline-none ${
                  isPrivate ? 'bg-[#00BFFF]' : 'bg-neutral-800'
                } flex items-center cursor-pointer`}
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-neutral-950 transition-transform ${isPrivate ? 'translate-x-4.5' : 'translate-x-0'}`} />
              </button>
            </div>

            {isPrivate && (
              <div>
                <label htmlFor="graph-password-input" className="block text-[10px] font-mono text-neutral-500 uppercase mb-1.5 font-bold">Passphrase Keys Protection</label>
                <input
                  type="password"
                  id="graph-password-input"
                  placeholder="Enter private unlock key..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
                />
              </div>
            )}

            <div>
              <label htmlFor="assign-folder-select" className="block text-[10px] font-mono text-neutral-500 uppercase mb-1.5 font-bold">Assign Folder Bin</label>
              <select
                id="assign-folder-select"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF] transition-colors"
              >
                <option value="">Personal Cloud Workspace (Default)</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Grid Table, Upload, Live Preview, Gemini Insights Drawer, 8 cols */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Live Preview Console */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 md:p-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00BFFF]"></div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <NeutronLogo className="w-5 h-5" glow={true} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00BFFF] font-bold text-glow">
                Realtime High-Performance Analytics Core
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                id="export-csv-btn"
                type="button"
                onClick={handleExportCSV}
                className="p-1 px-2.5 border border-white/5 rounded-lg hover:border-white/10 bg-white/[0.02] text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all text-[9.5px] font-mono uppercase flex items-center space-x-1"
                title="Save telemetry grid raw data"
              >
                <Download className="w-3.5 h-3.5" /> <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div id="live-recharts-surface" className="p-3 bg-neutral-950/40 rounded-xl border border-white/5 flex items-center justify-center">
            {renderLiveChart()}
          </div>
        </div>

        {/* Manual Grid cell editor & Dataset Loader tab panel */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 space-y-5 relative shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center space-x-2 text-[#00BFFF] font-mono text-xs uppercase font-extrabold tracking-wider text-glow">
              <Grid className="w-4 h-4 text-glow" />
              <span>Fluid Matrix Cells Editor</span>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto" aria-label="Input Dataset Tools">
              <button
                id="manual-add-row"
                type="button"
                onClick={addGridRow}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] rounded-xl text-[10px] font-mono text-neutral-300 hover:text-white transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#00BFFF]" /> <span>Add Node Row</span>
              </button>
              <button
                id="manual-add-col"
                type="button"
                onClick={addColumnHeader}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] rounded-xl text-[10px] font-mono text-neutral-300 hover:text-white transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#00BFFF]" /> <span>Add Column Metric</span>
              </button>
              <button
                id="trigger-csv-file"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-[#00BFFF]/10 border border-[#00BFFF]/20 rounded-xl text-[10px] font-mono text-[#00BFFF] hover:bg-[#00BFFF]/15 transition-all cursor-pointer font-bold"
              >
                <Upload className="w-3.5 h-3.5" /> <span>Import CSV</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
              />
            </div>
          </div>

          {/* Pasting Console collapse */}
          <div className="bg-neutral-900/10 rounded-xl p-4 border border-white/5 space-y-2.5">
            <label htmlFor="csv-pasteboard-area" className="block text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider">Paste Spreadsheets or Raw CSV Data Area</label>
            <div className="flex gap-2.5">
              <textarea
                id="csv-pasteboard-area"
                placeholder="month,metric_1,metric_2&#10;Jan,120,45&#10;Feb,145,52"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={2}
                className="flex-1 bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-neutral-350 placeholder-neutral-600 focus:outline-none focus:border-[#00BFFF] transition-colors"
              />
              <button
                id="process-paste-btn"
                type="button"
                onClick={handlePasteProcess}
                className="bg-neutral-950 border border-white/10 hover:border-white/20 hover:bg-neutral-900 rounded-xl px-4 text-xs font-mono text-neutral-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                Load
              </button>
            </div>
            {csvUploadError && (
              <div className="text-[10px] font-mono text-pink-500 flex items-center space-x-1.5 pt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Error: {csvUploadError}</span>
              </div>
            )}
          </div>

          {/* Matrix Cell Grid Table Wrapper */}
          <div className="overflow-x-auto max-h-56 border border-white/5 rounded-xl">
            <table className="w-full text-xs text-left text-neutral-400 antialiased font-mono table-fixed min-w-[500px]">
              <thead className="text-[9px] text-neutral-500 bg-neutral-950 uppercase border-b border-white/5 font-bold tracking-wider">
                <tr>
                  <th className="p-2.5 py-3 w-14 text-center">Node</th>
                  {headers.map(h => (
                    <th key={h} className="p-2.5 py-3">{h === independentKey ? `${h} (ID)` : h}</th>
                  ))}
                  <th className="p-2.5 py-3 w-14 text-center">Op</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03] bg-neutral-950/20">
                {gridData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-1 px-2 text-center text-neutral-500 font-bold">{rowIndex + 1}</td>
                    {headers.map(h => (
                      <td key={h} className="p-1">
                        <input
                          type="text"
                          id={`input-cell-${rowIndex}-${h}`}
                          value={row[h] !== undefined ? String(row[h]) : ''}
                          onChange={(e) => updateCellValue(rowIndex, h, e.target.value)}
                          className="w-full bg-transparent border-0 text-xs px-2.5 py-1.5 focus:outline-none text-neutral-200 focus:bg-white/[0.04] rounded"
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center">
                      <button
                        id={`delete-row-${rowIndex}`}
                        type="button"
                        onClick={() => deleteGridRow(rowIndex)}
                        disabled={gridData.length <= 1}
                        className="p-1.5 text-neutral-600 hover:text-pink-500 disabled:opacity-30 transition-colors cursor-pointer"
                        title="Delete this data row node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI GEN DATA ANALYTICS BOARD */}
        <div className="bg-gradient-to-br from-neutral-900/40 to-neutral-950/80 border border-white/5 rounded-2xl p-6 space-y-5 relative overflow-hidden shadow-lg text-left">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#00BFFF]/5 blur-3xl rounded-full"></div>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center space-x-2 text-[#00BFFF] font-mono text-xs uppercase font-extrabold tracking-wider text-glow">
              <Sparkles className="w-4 h-4 text-glow animate-pulse" />
              <span>Neutron AI Synthesis Deck</span>
            </div>

          </div>

          {aiError && (
            <div className="p-3.5 rounded-xl border border-pink-900/40 bg-pink-950/15 text-xs text-pink-400 font-mono flex items-center space-x-2 relative z-10">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Telemetry Node: {aiError}</span>
            </div>
          )}

          {/* Insights content display */}
          {aiResult ? (
            <div id="ai-insights-report" className="space-y-4 text-xs font-sans text-left relative z-10">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase">Executive Summary Overlay</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[#00BFFF] font-bold">Confidence: {aiResult.confidence || "Unknown"}</span>
                </div>
                <p className="text-neutral-300 leading-relaxed font-sans">{aiResult.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-1">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase font-semibold">Trend Deviation Metrics</span>
                  <p className="text-neutral-300 leading-relaxed font-sans">{aiResult.trend}</p>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-1">
                  <span className="text-[9px] font-mono text-[#00BFFF] uppercase font-extrabold tracking-widest text-glow">Predictive Forecast Target</span>
                  <p className="text-neutral-300 leading-relaxed font-sans">{aiResult.predictions}</p>
                </div>
              </div>

              {aiResult.insights && aiResult.insights.length > 0 && (
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase font-semibold font-mono">Localized Anomaly Observations</span>
                  <ul className="space-y-1.5 list-disc pl-4 text-neutral-400 font-sans">
                    {aiResult.insights.map((ins: string, i: number) => (
                      <li key={i} className="leading-relaxed hover:text-[#00BFFF] transition-colors">{ins}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center border border-dashed border-white/5 rounded-xl bg-white/[0.01] text-neutral-500 font-sans text-xs flex flex-col items-center justify-center space-y-2 relative z-10">
              <FileText className="w-8 h-8 text-neutral-700 animate-pulse" />
              <p>No model forecasts generated for this dataset yet.</p>
              <p className="text-[10px] text-neutral-600 font-mono">Press &quot;Generate AI Insights&quot; above to connect with Gemini.</p>
            </div>
          )}
        </div>

        {/* Global Action submission Row */}
        <div className="flex space-x-3 justify-end pt-4">
          <button
            id="cancel-create-btn"
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-white/5 text-xs font-mono uppercase bg-white/[0.02] hover:bg-white/[0.04] text-neutral-450 hover:text-white transition-all cursor-pointer"
          >
            Cancel Node
          </button>
          <button
            id="save-graph-btn"
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#00BFFF] text-neutral-950 text-xs font-bold uppercase transition-all text-glow shadow-[0_0_20px_rgba(0,191,255,0.3)] cursor-pointer"
          >
            {editingGraph ? 'Publish Updates' : 'Publish Graph Output'}
          </button>
        </div>

      </div>
    </div>
  );
}
