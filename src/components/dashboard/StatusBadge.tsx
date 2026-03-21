import { cn } from '@/lib/utils';

type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'success' | 'info' | 'warning';

const variantStyles: Record<BadgeVariant, string> = {
  critical: 'bg-critical/20 text-critical border-critical/30',
  high: 'bg-primary/20 text-primary border-primary/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  low: 'bg-info/20 text-info border-info/30',
  success: 'bg-success/20 text-success border-success/30',
  info: 'bg-info/20 text-info border-info/30',
  warning: 'bg-warning/20 text-warning border-warning/30',
};

export function StatusBadge({ variant, children, pulse, className }: {
  variant: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border font-mono uppercase tracking-wider',
      variantStyles[variant],
      className
    )}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            variant === 'critical' ? 'bg-critical' : variant === 'high' ? 'bg-primary' : variant === 'warning' ? 'bg-warning' : 'bg-info'
          )} />
          <span className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            variant === 'critical' ? 'bg-critical' : variant === 'high' ? 'bg-primary' : variant === 'warning' ? 'bg-warning' : 'bg-info'
          )} />
        </span>
      )}
      {children}
    </span>
  );
}
