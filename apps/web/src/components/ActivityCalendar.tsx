import React from 'react';
import { useTheme, activityColors } from '@minga/theme';
import { useT } from '@minga/i18n';
import type { ActivityCalendar as ActivityCalendarData } from '@minga/logic';

interface Props {
  data: ActivityCalendarData;
}

/**
 * GitHub-style contribution grid. Each column is a week (7 day-cells). Days are
 * colored by their dominant class — Minga orange vs. independent blue — so the
 * two activity sources read at a glance. Empty days use a muted surface.
 */
export function ActivityCalendar({ data }: Props) {
  const { theme } = useTheme();
  const { t } = useT();

  const weeks: typeof data.days[] = [];
  for (let i = 0; i < data.days.length; i += 7) {
    weeks.push(data.days.slice(i, i + 7));
  }

  const colorFor = (dominant: 'minga' | 'independent' | null, count: number): string => {
    if (!dominant || count === 0) return theme.surfaceAlt;
    return activityColors[dominant];
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ color: theme.text, margin: 0, fontSize: 18 }}>{t('profile.calendarHeading')}</h2>
        <span style={{ color: theme.textMuted, fontSize: 13 }}>
          {t('profile.calendarActiveDays', { count: String(data.activeDays) })}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date} · ${day.count} ${day.count === 1 ? '' : ''}`.trim()}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 3,
                  background: colorFor(day.dominant, day.count),
                  opacity: day.count === 0 ? 1 : Math.min(1, 0.55 + day.count * 0.2),
                  border: `1px solid ${theme.border}`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 12, flexWrap: 'wrap' }}>
        <LegendDot color={activityColors.minga} label={t('profile.legendMinga')} theme={theme} />
        <LegendDot color={activityColors.independent} label={t('profile.legendIndependent')} theme={theme} />
      </div>
    </div>
  );
}

function LegendDot({ color, label, theme }: { color: string; label: string; theme: any }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: 'inline-block' }} />
      <span style={{ color: theme.textMuted, fontSize: 13 }}>{label}</span>
    </span>
  );
}
