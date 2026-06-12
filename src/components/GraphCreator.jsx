import { useState, useMemo } from 'react'
import { Plus, Trash2, RotateCcw, BarChart3, TrendingUp, AreaChart, PieChart } from 'lucide-react'
import './GraphCreator.css'

const DEFAULT_POINTS = [
  { x: 'Jan', y: 45 },
  { x: 'Feb', y: 80 },
  { x: 'Mar', y: 55 },
  { x: 'Apr', y: 120 },
  { x: 'May', y: 95 },
  { x: 'Jun', y: 150 }
]

export default function GraphCreator() {
  const [xAxisLabel, setXAxisLabel] = useState('Month')
  const [yAxisLabel, setYAxisLabel] = useState('Value')
  const [dataPoints, setDataPoints] = useState(DEFAULT_POINTS)
  const [chartType, setChartType] = useState('bar') // 'bar', 'line', 'area', 'pie'

  // Temporary inputs for adding a point
  const [newX, setNewX] = useState('')
  const [newY, setNewY] = useState('')

  // Handle data updates
  const handleUpdatePoint = (index, field, value) => {
    const updated = [...dataPoints]
    if (field === 'y') {
      updated[index][field] = value === '' ? '' : Number(value)
    } else {
      updated[index][field] = value
    }
    setDataPoints(updated)
  }

  const handleAddPoint = () => {
    if (!newX.trim()) return
    const yVal = parseFloat(newY)
    setDataPoints([...dataPoints, { x: newX, y: isNaN(yVal) ? 0 : yVal }])
    setNewX('')
    setNewY('')
  }

  const handleRemovePoint = (index) => {
    setDataPoints(dataPoints.filter((_, i) => i !== index))
  }

  const handleReset = () => {
    setDataPoints(DEFAULT_POINTS)
    setXAxisLabel('Month')
    setYAxisLabel('Value')
  }

  const handleClear = () => {
    setDataPoints([])
  }

  // SVG Chart Calculations
  const svgWidth = 500
  const svgHeight = 280
  const paddingLeft = 55
  const paddingRight = 20
  const paddingTop = 25
  const paddingBottom = 40

  const usableWidth = svgWidth - paddingLeft - paddingRight
  const usableHeight = svgHeight - paddingTop - paddingBottom

  // Find max Y for scaling (default to 100 if empty or 0 to avoid division by zero)
  const maxY = useMemo(() => {
    if (dataPoints.length === 0) return 100
    const maxVal = Math.max(...dataPoints.map(p => Number(p.y) || 0))
    return maxVal <= 0 ? 100 : maxVal * 1.15 // add 15% head room
  }, [dataPoints])

  // Map data to coordinates
  const coords = useMemo(() => {
    if (dataPoints.length === 0) return []
    const N = dataPoints.length

    return dataPoints.map((p, i) => {
      // Calculate X coordinate
      let x = paddingLeft
      if (N > 1) {
        x += (i / (N - 1)) * usableWidth
      } else {
        x += usableWidth / 2 // Center single item
      }

      // Calculate Y coordinate
      const pY = Number(p.y) || 0
      const yRatio = pY / maxY
      const y = svgHeight - paddingBottom - (yRatio * usableHeight)

      return { x, y, rawX: p.x, rawY: p.y }
    })
  }, [dataPoints, maxY, usableWidth, usableHeight, svgHeight, paddingBottom])

  // SVG Path generation for line & area charts
  const pathData = useMemo(() => {
    if (coords.length === 0) return ''
    return coords.reduce((acc, coord, i) => {
      return i === 0 ? `M ${coord.x} ${coord.y}` : `${acc} L ${coord.x} ${coord.y}`
    }, '')
  }, [coords])

  const areaPathData = useMemo(() => {
    if (coords.length === 0) return ''
    const firstX = coords[0].x
    const lastX = coords[coords.length - 1].x
    const yBaseline = svgHeight - paddingBottom
    return `${pathData} L ${lastX} ${yBaseline} L ${firstX} ${yBaseline} Z`
  }, [coords, pathData, svgHeight, paddingBottom])

  // Y-axis tick values
  const yTicks = useMemo(() => {
    const ticks = []
    const step = maxY / 4
    for (let i = 0; i <= 4; i++) {
      ticks.push(Math.round(step * i))
    }
    return ticks
  }, [maxY])

  return (
    <div className="graph-creator glass-panel">
      <div className="graph-header-row">
        <h3 className="neon-text">📊 Neutron Chart Engine</h3>
        <div className="chart-type-selector">
          <button
            className={`type-btn-sm ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
            title="Bar Chart"
          >
            <BarChart3 size={15} />
          </button>
          <button
            className={`type-btn-sm ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
            title="Line Chart"
          >
            <TrendingUp size={15} />
          </button>
          <button
            className={`type-btn-sm ${chartType === 'area' ? 'active' : ''}`}
            onClick={() => setChartType('area')}
            title="Area Chart"
          >
            <AreaChart size={15} />
          </button>
          <button
            className={`type-btn-sm ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
            title="Pie Chart"
          >
            <PieChart size={15} />
          </button>
        </div>
      </div>

      {/* Inputs for axes */}
      <div className="axis-labels-inputs">
        <div className="input-group-sm">
          <label>X-Axis Name</label>
          <input
            type="text"
            className="glass-input-sm"
            value={xAxisLabel}
            onChange={(e) => setXAxisLabel(e.target.value)}
            placeholder="e.g. Month"
          />
        </div>
        <div className="input-group-sm">
          <label>Y-Axis Name</label>
          <input
            type="text"
            className="glass-input-sm"
            value={yAxisLabel}
            onChange={(e) => setYAxisLabel(e.target.value)}
            placeholder="e.g. Sales"
          />
        </div>
      </div>

      {/* SVG Rendering area */}
      <div className="chart-viewport">
        {dataPoints.length === 0 ? (
          <div className="chart-empty-state">
            <BarChart3 size={36} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
            <p>No data points entered.</p>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Add some rows below to visualize!</span>
          </div>
        ) : (
          <svg className="chart-svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-blue)" />
                <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity={0.15} />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity={0.0} />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid Lines */}
            {chartType !== 'pie' && yTicks.map((tick, i) => {
              const yPos = svgHeight - paddingBottom - (tick / maxY) * usableHeight
              return (
                <g key={i} className="grid-group">
                  <line
                    x1={paddingLeft}
                    y1={yPos}
                    x2={svgWidth - paddingRight}
                    y2={yPos}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    className="chart-axis-text"
                  >
                    {tick}
                  </text>
                </g>
              )
            })}

            {/* Base Axes */}
            {chartType !== 'pie' && (
              <>
                <line
                  x1={paddingLeft}
                  y1={svgHeight - paddingBottom}
                  x2={svgWidth - paddingRight}
                  y2={svgHeight - paddingBottom}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1.5"
                />
                <line
                  x1={paddingLeft}
                  y1={paddingTop}
                  x2={paddingLeft}
                  y2={svgHeight - paddingBottom}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1.5"
                />
              </>
            )}

            {/* Axis Titles */}
            {chartType !== 'pie' && (
              <>
                <text
                  x={paddingLeft + usableWidth / 2}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className="chart-title-text"
                >
                  {xAxisLabel}
                </text>
                <text
                  transform={`rotate(-90 ${paddingLeft / 3} ${paddingTop + usableHeight / 2})`}
                  x={paddingLeft / 3}
                  y={paddingTop + usableHeight / 2}
                  textAnchor="middle"
                  className="chart-title-text"
                >
                  {yAxisLabel}
                </text>
              </>
            )}

            {/* Render Bars */}
            {chartType === 'bar' && dataPoints.map((p, i) => {
              const N = dataPoints.length
              const barWidth = Math.max(10, Math.min(40, (usableWidth / N) * 0.6))
              
              // Center coordinates
              let xCenter = paddingLeft + (i + 0.5) * (usableWidth / N)
              
              const pY = Number(p.y) || 0
              const barX = xCenter - barWidth / 2
              const barY = svgHeight - paddingBottom - (pY / maxY) * usableHeight
              const barHeight = (pY / maxY) * usableHeight

              return (
                <g key={i} className="chart-bar-group">
                  <rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={Math.max(2, barHeight)}
                    rx="4"
                    fill="url(#barGradient)"
                    className="chart-rect"
                  />
                  {/* Tooltip Label on Hover */}
                  <text
                    x={xCenter}
                    y={barY - 8}
                    textAnchor="middle"
                    className="chart-tooltip-text"
                  >
                    {p.y}
                  </text>
                  {/* X axis tick labels */}
                  <text
                    x={xCenter}
                    y={svgHeight - paddingBottom + 18}
                    textAnchor="middle"
                    className="chart-axis-text"
                  >
                    {p.x}
                  </text>
                </g>
              )
            })}

            {/* Render Area */}
            {chartType === 'area' && coords.length > 0 && (
              <path
                d={areaPathData}
                fill="url(#areaGradient)"
                className="chart-area-path"
              />
            )}

            {/* Render Line */}
            {(chartType === 'line' || chartType === 'area') && coords.length > 0 && (
              <path
                d={pathData}
                fill="none"
                stroke="var(--accent-blue)"
                strokeWidth="3"
                filter="url(#glow)"
                className="chart-line-path"
              />
            )}

            {/* Render Line/Area Dots & Labels */}
            {(chartType === 'line' || chartType === 'area') && coords.map((coord, i) => (
              <g key={i} className="chart-dot-group">
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="5"
                  fill="var(--accent-blue)"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="chart-dot"
                />
                <text
                  x={coord.x}
                  y={coord.y - 10}
                  textAnchor="middle"
                  className="chart-tooltip-text"
                >
                  {coord.rawY}
                </text>
                <text
                  x={coord.x}
                  y={svgHeight - paddingBottom + 18}
                  textAnchor="middle"
                  className="chart-axis-text"
                >
                  {coord.rawX}
                </text>
              </g>
            ))}

            {/* Render Pie Chart */}
            {chartType === 'pie' && (() => {
              const total = dataPoints.reduce((sum, p) => sum + Math.max(0, Number(p.y) || 0), 0);
              if (total === 0) return null;
              let currentAngle = -Math.PI / 2; // start from top
              const cx = paddingLeft + usableWidth / 2;
              const cy = paddingTop + usableHeight / 2;
              const radius = Math.min(usableWidth, usableHeight) / 2;

              return dataPoints.map((p, i) => {
                const value = Math.max(0, Number(p.y) || 0);
                if (value === 0) return null;
                const sliceAngle = (value / total) * 2 * Math.PI;
                
                const color = `hsl(${(i * 360) / dataPoints.length}, 70%, 55%)`;

                // If it's a full circle (100% value)
                if (sliceAngle === 2 * Math.PI) {
                   return <circle key={i} cx={cx} cy={cy} r={radius} fill={color} />;
                }

                const startX = cx + radius * Math.cos(currentAngle);
                const startY = cy + radius * Math.sin(currentAngle);
                
                currentAngle += sliceAngle;
                
                const endX = cx + radius * Math.cos(currentAngle);
                const endY = cy + radius * Math.sin(currentAngle);
                
                const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
                
                const pathData = [
                  `M ${cx} ${cy}`,
                  `L ${startX} ${startY}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                  'Z'
                ].join(' ');

                const midAngle = currentAngle - sliceAngle / 2;
                const labelX = cx + (radius * 0.65) * Math.cos(midAngle);
                const labelY = cy + (radius * 0.65) * Math.sin(midAngle);

                return (
                  <g key={i} className="chart-pie-group">
                    <path d={pathData} fill={color} stroke="var(--bg-panel)" strokeWidth="2" />
                    {sliceAngle > 0.15 && (
                      <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" className="chart-tooltip-text" style={{ fill: '#fff', fontWeight: 'bold' }}>
                        {p.x} ({Math.round((value / total) * 100)}%)
                      </text>
                    )}
                  </g>
                );
              });
            })()}
          </svg>
        )}
      </div>

      {/* Data Entries Editor Workspace */}
      <div className="data-workspace">
        <p className="workspace-title">🔧 Data Points Manager</p>
        
        <div className="points-list-scroll">
          {dataPoints.map((point, index) => (
            <div key={index} className="data-row-item">
              <input
                type="text"
                className="row-input"
                placeholder="X Label"
                value={point.x}
                onChange={(e) => handleUpdatePoint(index, 'x', e.target.value)}
              />
              <input
                type="number"
                className="row-input qty"
                placeholder="Y Value"
                value={point.y}
                onChange={(e) => handleUpdatePoint(index, 'y', e.target.value)}
              />
              <button
                type="button"
                className="row-delete-btn"
                onClick={() => handleRemovePoint(index)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Form to add a new point */}
        <div className="add-point-row">
          <input
            type="text"
            className="row-input add"
            placeholder="New X Label (e.g. Jul)"
            value={newX}
            onChange={(e) => setNewX(e.target.value)}
          />
          <input
            type="number"
            className="row-input qty add"
            placeholder="Y Value"
            value={newY}
            onChange={(e) => setNewY(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPoint()}
          />
          <button
            type="button"
            className="row-add-btn"
            onClick={handleAddPoint}
            disabled={!newX.trim()}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Footer actions */}
        <div className="workspace-actions">
          <button type="button" className="btn-action-outline" onClick={handleReset}>
            <RotateCcw size={13} /> Reset Samples
          </button>
          <button type="button" className="btn-action-outline danger" onClick={handleClear}>
            <Trash2 size={13} /> Clear All
          </button>
        </div>
      </div>
    </div>
  )
}
