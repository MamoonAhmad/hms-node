import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function CatalogStatusBadge({ isActive }) {
  return isActive !== false ? (
    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
      <Check className="h-3 w-3" />
      Active
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <X className="h-3 w-3" />
      Inactive
    </Badge>
  );
}

export function YesNoBadge({ value, yes = 'Yes', no = 'No' }) {
  return value ? (
    <Badge variant="secondary" className="bg-green-50 text-green-800 hover:bg-green-50">
      {yes}
    </Badge>
  ) : (
    <Badge variant="outline">{no}</Badge>
  );
}
