'use client';

import { useMemo, useState } from 'react';
import { buildHeatmapYear, type HeatDay } from '@/lib/utils';

// Weekday labels
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  dayCounts: Record<string, number>; // YYYY-MM-DD → count
  year?: number;
}

interface TooltipState {
  x: number;
  y: number;
  day: HeatDay;
}

export default function Heatmap({ dayCounts, year }: Props) {
  const displayYear = year ?? new Date().getFullYear();
  const days = useMemo(() => buildHeatmapYear(dayCounts, displayYear), [dayCounts, displayYear]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Build week columns: pad with empty cells at start
  const firstDay = new Date(`${displayYear}-01-01`);
  const startPad = (firstDay.getDay() + 6) % 7; // Mon=0

  const cells: Array<HeatDay | null> = [
    ...Array(startPad).fill(null),
    ...days,
  ];

  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = Math.ceil(cells.length / 7);

  // Group cells by column (week) for grid display
  const cols: Array<Array<HeatDay | null>> = [];
  for (let w = 0; w < weeks; w++) {
    cols.push(cells.slice(w * 7, w * 7 + 7));
  }

  // Month label positions
  const monthLabels: Array<{ col: number; label: string }> = [];
  let lastMonth = -1;
  cols.forEach((col, colIdx) => {
    const firstReal = col.find(c => c !== null);
    if (firstReal) {
      const m = new Date(firstReal.date).getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ col: colIdx, label: MONTHS[m] });
        lastMonth = m;
      }
    }
  });

  function showTooltip(e: React.MouseEvent, day: HeatDay) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip({ x: rect.left, y: rect.top - 40, day });
  }

  const totalActive = Object.values(dayCounts).filter(v => v > 0).length;

  return (
    <div>
      {/* Month labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `28px repeat(${weeks}, 11px)`,
        gap: '2px',
        marginBottom: '4px',
      }}>
        <div /> {/* day label column */}
        {cols.map((_, colIdx) => {
          const label = monthLabels.find(m => m.col === colIdx);
          return (
            <div key={colIdx} style={{
              fontSize: '0.6rem',
              color: 'var(--text-faint)',
              fontFamily: 'var(--font-mono)',
            }}>
              {label?.label ?? ''}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '4px' }}>
        {/* Day labels */}
        <div style={{
          display: 'grid',
          gridTemplateRows: 'repeat(7, 11px)',
          gap: '2px',
          width: '24px',
        }}>
          {DAYS.map((d, i) => (
            <div key={d} style={{
              fontSize: '0.58rem',
              color: 'var(--text-faint)',
              fontFamily: 'var(--font-mono)',
              lineHeight: '11px',
              textAlign: 'right',
              paddingRight: '4px',
              opacity: i % 2 === 0 ? 1 : 0, // show alternate for spacing
            }}>
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>

        {/* Heat cells */}
        <div
          className="heatmap-grid"
          style={{
            gridTemplateColumns: `repeat(${weeks}, 11px)`,
            gridTemplateRows: 'repeat(7, 11px)',
          }}
          role="img"
          aria-label={`Activity heatmap for ${displayYear}`}
        >
          {cols.map((col, colIdx) =>
            col.map((day, rowIdx) => {
              if (!day) return (
                <div key={`${colIdx}-${rowIdx}`} style={{ width: 11, height: 11 }} />
              );
              return (
                <div
                  key={day.date}
                  className="heat-cell"
                  data-level={day.level}
                  title={`${day.date}: ${day.count} topic${day.count !== 1 ? 's' : ''}`}
                  onMouseEnter={e => showTooltip(e, day)}
                  onMouseLeave={() => setTooltip(null)}
                  aria-label={`${day.date}: ${day.count} topics`}
                  style={{ gridColumn: colIdx + 1, gridRow: rowIdx + 1 }}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2" style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>
        <span>Less</span>
        {[0,1,2,3,4].map(l => (
          <div key={l} className="heat-cell" data-level={l} style={{ width: 10, height: 10, flexShrink: 0 }} />
        ))}
        <span>More</span>
        <span style={{ marginLeft: '0.5rem' }}>{totalActive} active days in {displayYear}</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
          background: 'var(--bg-card)',
          border: '2px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
          padding: '0.3rem 0.6rem',
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          pointerEvents: 'none',
          zIndex: 999,
          whiteSpace: 'nowrap',
        }}>
          {tooltip.day.date} — {tooltip.day.count} topic{tooltip.day.count !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
