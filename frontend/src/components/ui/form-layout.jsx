import { cn } from '@/lib/utils';

/**
 * Grouped form section with enterprise EHR header band.
 */
export function FormSection({ title, description, children, className }) {
  return (
    <section className={cn('ehr-form-section', className)}>
      {(title || description) && (
        <header className="ehr-form-section-header">
          {title && <h3 className="ehr-form-section-title">{title}</h3>}
          {description && (
            <p className="ehr-form-section-description">{description}</p>
          )}
        </header>
      )}
      <div className="ehr-form-section-body">{children}</div>
    </section>
  );
}

/**
 * Single label + control with consistent vertical rhythm.
 */
export function FormField({ label, htmlFor, required, hint, error, children, className }) {
  return (
    <div className={cn('ehr-field', className)}>
      {label && (
        <label htmlFor={htmlFor} className="ehr-field-label">
          {label}
          {required && (
            <span className="text-destructive ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {hint && !error && <p className="ehr-field-hint">{hint}</p>}
      {error && <p className="ehr-field-error">{error}</p>}
    </div>
  );
}

/**
 * Standard page content wrapper (title band + panels).
 */
export function PageContent({ children, className }) {
  return <div className={cn('ehr-page space-y-5', className)}>{children}</div>;
}
