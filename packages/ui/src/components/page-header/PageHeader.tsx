import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@housing-platform/utils';
import { Badge } from '../badge/Badge';

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  headingLevel?: 'h1' | 'h2';
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  headingLevel = 'h1',
  className,
  ...props
}: PageHeaderProps) {
  const Heading = headingLevel;

  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)} {...props}>
      <div>
        {eyebrow ? <Badge variant="eyebrow">{eyebrow}</Badge> : null}
        <Heading className="text-ink text-2xl font-semibold">{title}</Heading>
        {description ? <p className="text-ink-muted mt-2 text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
