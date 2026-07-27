import { ChartTabShell, EmptyState } from './_shared';

/**
 * Generic section for chart areas whose dedicated data source is not yet wired
 * into this consolidated view. Renders a professional empty state describing
 * what the section will contain.
 */
export function PlaceholderSection({ icon, title, description, emptyTitle, emptyDescription, actionLabel, onAction }) {
  return (
    <ChartTabShell title={title} description={description}>
      <EmptyState
        icon={icon}
        title={emptyTitle || `No ${title.toLowerCase()} recorded.`}
        description={emptyDescription}
        action={onAction}
        actionLabel={onAction ? actionLabel : undefined}
      />
    </ChartTabShell>
  );
}
