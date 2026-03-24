import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function Section({ id, number, title, subtitle, children }: SectionProps) {
  return (
    <section id={id} className="pt-10 md:pt-16 pb-20 md:pb-28 px-6">
      <div className="max-w-[760px] mx-auto">
        <p className="text-sm font-medium text-sienna/70 tracking-wide uppercase mb-2">
          Section {number}
        </p>
        <h2 className="font-heading text-3xl md:text-4xl font-semibold text-text leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-lg text-text-muted leading-relaxed">{subtitle}</p>
        )}

        {/* Ornamental divider: thin line with centered diamond */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-border" />
          <div className="w-2 h-2 rotate-45 border border-border bg-bg" />
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-6 text-text leading-relaxed">{children}</div>
      </div>
    </section>
  );
}
