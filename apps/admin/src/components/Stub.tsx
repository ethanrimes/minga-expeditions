import { Wrench } from 'lucide-react';

interface Props {
  heading: string;
  title: string;
  subtitle: string;
  ready: string;
}

export function Stub({ heading, title, subtitle, ready }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{heading}</h1>
      </header>
      <div className="card flex flex-col gap-3 max-w-xl">
        <div className="flex items-center gap-2 text-primary">
          <Wrench size={18} strokeWidth={2.4} />
          <span className="font-semibold">{title}</span>
        </div>
        <p className="text-sm text-ink-500">{subtitle}</p>
        <span className="text-xs uppercase tracking-wider font-bold text-success">{ready}</span>
      </div>
    </div>
  );
}
