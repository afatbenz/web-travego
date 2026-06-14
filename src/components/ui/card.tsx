import * as React from 'react';

import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-[28px] border border-gray-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)] pb-6',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

type CardHeaderWithBadgeProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badgeIcon: React.ElementType<{ className?: string }> | React.ReactNode;
  actions?: React.ReactNode;
};

const CardHeaderWithBadge = React.forwardRef<HTMLDivElement, CardHeaderWithBadgeProps>(
  ({ className, title, subtitle, badgeIcon, actions, ...props }, ref) => (
    <CardHeader ref={ref} className={cn('pb-0', className)} {...props}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-8 w-8 md:h-12 md:w-12 mt-1 items-center justify-center rounded-2xl bg-blue-50 dark:bg-[#0b111a] dark:text-white text-blue-700 ring-1 ring-blue-100 dark:ring-gray-600">
            {React.isValidElement(badgeIcon)
              ? badgeIcon
              : badgeIcon && (typeof badgeIcon === 'function' || typeof badgeIcon === 'object')
                ? React.createElement(badgeIcon as React.ElementType<{ className?: string }>, { className: 'h-6 w-6' })
                : null}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="border-0 pb-0 text-lg font-semibold text-gray-900 dark:text-white/80">{title}</CardTitle>
            <div className='border-b border-blue-200/50 mb-1'></div>
            {subtitle ? <p className="mt-1 text-xs text-gray-500 dark:text-white/40">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </CardHeader>
  )
);
CardHeaderWithBadge.displayName = 'CardHeaderWithBadge';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight border-b border-gray-200 dark:border-gray-700 pb-2', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardHeaderWithBadge,
};
