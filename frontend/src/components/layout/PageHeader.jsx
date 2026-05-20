import { cn } from '@/lib/utils';

/**
 * Consistent page title band for clinical / admin modules.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}) {
  return (
    <header className={cn('ehr-page-header', className)}>
      <div className="ehr-page-header-inner">
        <div className="min-w-0 flex-1 space-y-1.5">
          {breadcrumbs && (
            <p className="ehr-page-breadcrumb">{breadcrumbs}</p>
          )}
          <h1 className="ehr-page-title">{title}</h1>
          {description && (
            <p className="ehr-page-description">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
