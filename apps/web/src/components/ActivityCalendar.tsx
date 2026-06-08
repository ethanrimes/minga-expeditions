import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme, activityColors } from '@minga/theme';
import { useT } from '@minga/i18n';
import { buildMonthCalendar, earliestActivityMonth } from '@minga/logic';
import type { DbActivity } from '@minga/types';

type CalActivity = Pick<DbActivity, 'started_at' | 'expedition_id' | 'is_independent'>;

interface Props {
  activities: CalActivity[];
}

const monthIndex = (y: number, m: number) => y * 12 + m;

/**
 * A real, navigable month calendar. Days with activity are filled by their
 * dominant class — Minga days get a solid, ringed, emphasized tile while
 * independent days get a lighter outlined tile — so paid trips read first.
 */
export function ActivityCalendar({ activities }: Props) {
  const { theme } = useTheme();
  const { t, language } = useT();
  const locale = language === 'es' ? 'es-CO' : 'en-US';

  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const cal = useMemo(
    () => buildMonthCalendar(activities, view.year, view.month, now),
    [activities, view.year, view.month],
  );

  const earliest = useMemo(() => earliestActivityMonth(activities), [activities]);
  const cur = monthIndex(view.year, view.month);
  const canPrev = earliest ? cur > monthIndex(earliest.year, earliest.month) : false;
  const canNext = cur < monthIndex(now.getFullYear(), now.getMonth());

  const step = (delta: number) => {
    const next = new Date(view.year, view.month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  };

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  // Monday-first weekday initials derived from the locale.
  const weekdays = useMemo(() => {
    const base = new Date(2024, 0, 1); // a Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: 'narrow' });
    });
  }, [locale]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h2 style={{ color: theme.text, margin: 0, fontSize: 18 }}>{t('profile.calendarHeading')}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavButton theme={theme} disabled={!canPrev} onClick={() => step(-1)} aria-label={t('profile.prevMonth')}>
            <ChevronLeft size={18} strokeWidth={2.4} />
          </NavButton>
          <span
            style={{
              color: theme.text,
              fontWeight: 800,
              fontSize: 14,
              minWidth: 150,
              textAlign: 'center',
              textTransform: 'capitalize',
            }}
          >
            {monthLabel}
          </span>
          <NavButton theme={theme} disabled={!canNext} onClick={() => step(1)} aria-label={t('profile.nextMonth')}>
            <ChevronRight size={18} strokeWidth={2.4} />
          </NavButton>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {weekdays.map((w, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              color: theme.textMuted,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              paddingBottom: 4,
            }}
          >
            {w}
          </div>
        ))}
        {cal.weeks.flat().map((day, i) => {
          if (!day.inMonth) return <div key={`pad-${i}`} />;
          const minga = day.dominant === 'minga';
          const independent = day.dominant === 'independent';
          const accent = minga ? activityColors.minga : activityColors.independent;
          const active = day.count > 0;
          return (
            <div
              key={day.date ?? `cell-${i}`}
              title={
                active
                  ? `${day.date} · ${t('profile.calendarMonthSummary', {
                      minga: String(day.mingaCount),
                      independent: String(day.independentCount),
                    })}`
                  : day.date ?? ''
              }
              style={{
                position: 'relative',
                aspectRatio: '1 / 1',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: active ? 800 : 600,
                color: minga ? '#fff' : independent ? accent : theme.textMuted,
                background: minga ? accent : independent ? `${accent}1f` : theme.surfaceAlt,
                border: minga
                  ? `2px solid ${accent}`
                  : independent
                    ? `1.5px dashed ${accent}`
                    : `1px solid ${theme.border}`,
                boxShadow: minga ? `0 4px 10px ${accent}59` : 'none',
                outline: day.isToday ? `2px solid ${theme.primary}` : 'none',
                outlineOffset: 2,
              }}
            >
              {day.day}
              {active ? (
                <span style={{ position: 'absolute', bottom: 5, display: 'flex', gap: 3 }}>
                  {Array.from({ length: Math.min(day.count, 3) }).map((_, di) => (
                    <span
                      key={di}
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 999,
                        background: minga ? '#fff' : accent,
                      }}
                    />
                  ))}
                </span>
              ) : null}
              {minga ? (
                <span style={{ position: 'absolute', top: 3, right: 4, fontSize: 9 }}>★</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 18, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <LegendItem theme={theme} solid color={activityColors.minga} label={t('profile.legendMinga')} />
        <LegendItem theme={theme} color={activityColors.independent} label={t('profile.legendIndependent')} />
        <span style={{ color: theme.textMuted, fontSize: 13, marginLeft: 'auto' }}>
          {t('profile.calendarActiveDays', { count: String(cal.totals.activeDays) })}
        </span>
      </div>
    </div>
  );
}

function NavButton({
  theme,
  disabled,
  onClick,
  children,
  ...rest
}: {
  theme: any;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        border: `1px solid ${theme.border}`,
        background: theme.surfaceAlt,
        color: disabled ? theme.textMuted : theme.text,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

function LegendItem({
  theme,
  color,
  label,
  solid,
}: {
  theme: any;
  color: string;
  label: string;
  solid?: boolean;
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: solid ? color : `${color}1f`,
          border: solid ? `2px solid ${color}` : `1.5px dashed ${color}`,
          display: 'inline-block',
        }}
      />
      <span style={{ color: theme.textMuted, fontSize: 13 }}>{label}</span>
    </span>
  );
}
