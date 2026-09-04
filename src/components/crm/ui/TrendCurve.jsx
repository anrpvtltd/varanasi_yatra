import React, { useState } from 'react';

/**
 * TrendCurve Component
 * Clean SVG cubic-bezier trend/curve line visualization
 * Displays real data trajectories, growth/decline indicators, and tooltips.
 */
export default function TrendCurve({
  title,
  subtitle,
  data = [],
  series = null, // Optional multiple series: [{ name, color, data: [...] }]
  formatter = (v) => v,
  height = 130,
  badge = null,
  period = 'Past 7 Days'
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Normalize single series to unified format
  const normalizedSeries = series || [
    {
      name: title || 'Metric',
      color: '#10B981', // emerald
      fillGradient: ['rgba(16, 185, 129, 0.28)', 'rgba(16, 185, 129, 0.0)'],
      data: data
    }
  ];

  // Extract all points to compute bounds
  const allValues = normalizedSeries.flatMap(s => (s.data || []).map(d => (typeof d === 'object' ? d.value : d)));
  
  const hasValidData = allValues.length >= 2 && allValues.some(v => v > 0);

  if (!hasValidData) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between" style={{ minHeight: height + 60 }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          {badge && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {badge}
            </span>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-xs text-slate-400 font-medium">Accumulating Real Timeline Data</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Trend curve requires at least 2 active intervals</p>
        </div>
      </div>
    );
  }

  const minVal = Math.min(0, ...allValues);
  const maxVal = Math.max(...allValues) * 1.15 || 1;
  const paddingX = 24;
  const paddingY = 20;
  const viewWidth = 400;
  const viewHeight = height;

  // Compute direction
  const firstVal = allValues[0] || 0;
  const lastVal = allValues[allValues.length - 1] || 0;
  const pctChange = firstVal === 0 ? (lastVal > 0 ? 100 : 0) : Math.round(((lastVal - firstVal) / firstVal) * 100);
  const isUp = pctChange >= 0;

  // Build smooth bezier curves
  const generatePath = (points) => {
    if (!points || points.length === 0) return { linePath: '', areaPath: '', coords: [] };
    
    const count = points.length;
    const stepX = (viewWidth - paddingX * 2) / (count - 1);
    const coords = points.map((p, i) => {
      const val = typeof p === 'object' ? p.value : p;
      const label = typeof p === 'object' ? p.label : `T${i + 1}`;
      const x = paddingX + i * stepX;
      const normY = (val - minVal) / (maxVal - minVal || 1);
      const y = viewHeight - paddingY - normY * (viewHeight - paddingY * 2);
      return { x, y, val, label };
    });

    if (coords.length === 1) {
      return { linePath: `M ${coords[0].x} ${coords[0].y}`, areaPath: '', coords };
    }

    let linePath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cx = (p0.x + p1.x) / 2;
      linePath += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const lastCoord = coords[coords.length - 1];
    const firstCoord = coords[0];
    const bottomY = viewHeight - paddingY + 6;
    const areaPath = `${linePath} L ${lastCoord.x} ${bottomY} L ${firstCoord.x} ${bottomY} Z`;

    return { linePath, areaPath, coords };
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
            <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isUp ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}>
              {isUp ? '↑' : '↓'} {isUp ? `+${pctChange}%` : `${pctChange}%`}
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        
        <div className="text-right">
          {badge ? (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
              {badge}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">{period}</span>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="w-full h-auto overflow-visible select-none"
          style={{ maxHeight: height }}
        >
          <defs>
            {normalizedSeries.map((s, idx) => (
              <linearGradient key={`grad-${idx}`} id={`trend-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Guide grid line */}
          <line
            x1={paddingX}
            y1={viewHeight - paddingY + 4}
            x2={viewWidth - paddingX}
            y2={viewHeight - paddingY + 4}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Series lines & areas */}
          {normalizedSeries.map((s, idx) => {
            const { linePath, areaPath, coords } = generatePath(s.data);
            return (
              <g key={`series-${idx}`}>
                {/* Area under curve */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill={`url(#trend-grad-${idx})`}
                    className="transition-all duration-300"
                  />
                )}
                {/* The main bezier curve line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300 filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                />

                {/* Interactive Points */}
                {coords.map((pt, pIdx) => (
                  <g
                    key={`pt-${idx}-${pIdx}`}
                    onMouseEnter={() => setHoveredPoint({ ...pt, seriesName: s.name, color: s.color })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#0f172a"
                      stroke={s.color}
                      strokeWidth="2"
                      className="hover:r-6 transition-all duration-150"
                    />
                  </g>
                ))}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute -top-7 pointer-events-none transform -translate-x-1/2 bg-slate-800/95 text-slate-100 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-700 shadow-xl flex items-center gap-1.5 z-30"
            style={{
              left: `${(hoveredPoint.x / viewWidth) * 100}%`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hoveredPoint.color }} />
            <span className="text-slate-400">{hoveredPoint.label}:</span>
            <span className="font-semibold text-white">{formatter(hoveredPoint.val)}</span>
          </div>
        )}
      </div>

      {/* Footer / Legend */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          {normalizedSeries.map((s, i) => (
            <div key={`legend-${i}`} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-slate-300 font-medium">{s.name}</span>
            </div>
          ))}
        </div>
        <div className="text-slate-400">
          Latest: <span className="font-semibold text-slate-200">{formatter(lastVal)}</span>
        </div>
      </div>
    </div>
  );
}
