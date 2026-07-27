/**
 * Maps clinical / workflow status strings to semantic badge variants.
 * Re-exports the shared clinical status system — keep all modules aligned.
 */

export {
  resolveStatusVariant,
  STATUS_BADGE_CLASSES,
  STATUS_SOFT,
  getStatusSoftClass,
} from '@/lib/statusColors';
