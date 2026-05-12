'use client';

interface Bucket {
  day: string;
  count: number;
}

interface Props {
  signupSeries: Bucket[];
  bookingSeries: Bucket[];
  tierCounts: { bronze: number; silver: number; gold: number; diamond: number };
  orderStatusCounts: Record<string, number>;
}

export function InsightsCharts({ signupSeries, bookingSeries, tierCounts, orderStatusCounts }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BarChart title="Signups (30d)" series={signupSeries} color="#ED8B00" />
      <BarChart title="Orders (30d)" series={bookingSeries} color="#1F8A4C" />
      <DonutChart
        title="Tier distribution"
        slices={[
          { label: 'Bronze', value: tierCounts.bronze, color: '#CD7F32' },
          { label: 'Silver', value: tierCounts.silver, color: '#9AA1AE' },
          { label: 'Gold', value: tierCounts.gold, color: '#D4AF37' },
          { label: 'Diamond', value: tierCounts.diamond, color: '#5BC0EB' },
        ]}
      />
      <DonutChart
        title="Order status (30d)"
        slices={Object.entries(orderStatusCounts).map(([label, value]) => ({
          label,
          value,
          color: ORDER_STATUS_COLORS[label] ?? '#9AA1AE',
        }))}
      />
    </div>
  );
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  approved: '#1F8A4C',
  pending: '#ED8B00',
  declined: '#D14343',
  voided: '#9AA1AE',
  error: '#D14343',
  refunded: '#5BC0EB',
};

function BarChart({ title, series, color }: { title: string; series: Bucket[]; color: string }) {
  const max = Math.max(1, ...series.map((b) => b.count));
  const W = 540;
  const H = 160;
  const bw = W / Math.max(series.length, 1);

  return (
    <div className="card">
      <div className="text-sm font-bold mb-3">{title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40">
        {series.map((b, i) => {
          const h = (b.count / max) * (H - 24);
          return (
            <g key={b.day}>
              <rect
                x={i * bw + 2}
                y={H - h - 12}
                width={bw - 4}
                height={h}
                fill={color}
                opacity={b.count === 0 ? 0.2 : 1}
              />
              {b.count > 0 && i % 5 === 0 ? (
                <text
                  x={i * bw + bw / 2}
                  y={H - 2}
                  fontSize={9}
                  textAnchor="middle"
                  fill="#6B7280"
                >
                  {b.day.slice(5)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({
  title,
  slices,
}: {
  title: string;
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((a, b) => a + b.value, 0);
  const radius = 60;
  const cx = 70;
  const cy = 70;
  let cursor = 0;

  return (
    <div className="card">
      <div className="text-sm font-bold mb-3">{title}</div>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0">
          {total === 0 ? (
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={20} />
          ) : (
            slices.map((slice) => {
              if (slice.value === 0) return null;
              const portion = slice.value / total;
              const start = cursor;
              const end = cursor + portion;
              cursor = end;
              const angle = (a: number) => a * 2 * Math.PI - Math.PI / 2;
              const x1 = cx + radius * Math.cos(angle(start));
              const y1 = cy + radius * Math.sin(angle(start));
              const x2 = cx + radius * Math.cos(angle(end));
              const y2 = cy + radius * Math.sin(angle(end));
              const large = portion > 0.5 ? 1 : 0;
              return (
                <path
                  key={slice.label}
                  d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`}
                  fill={slice.color}
                />
              );
            })
          )}
          <circle cx={cx} cy={cy} r={32} fill="white" />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={14} fontWeight={700}>
            {total}
          </text>
        </svg>
        <ul className="text-xs space-y-1">
          {slices.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              <span className="capitalize">{s.label}</span>
              <span className="text-ink-500">· {s.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
