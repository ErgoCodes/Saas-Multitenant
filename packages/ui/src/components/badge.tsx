import { Badge as ShadcnBadge } from './ui/badge';
import type { badgeVariants } from './ui/badge';
import type { VariantProps } from 'class-variance-authority';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantMap: Record<BadgeVariant, VariantProps<typeof badgeVariants>['variant']> = {
  default: 'secondary',
  success: 'default',
  warning: 'default',
  danger: 'destructive',
  info: 'default',
};

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return <ShadcnBadge variant={variantMap[variant]} className={className} {...props} />;
}
