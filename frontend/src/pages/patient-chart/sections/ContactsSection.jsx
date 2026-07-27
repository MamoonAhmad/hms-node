import { Contact as ContactIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChartTabShell, EmptyState, SectionCard } from './_shared';
import { normalizeContacts } from '../patientChartHelpers';

export function ContactsSection({ patient }) {
  const contacts = normalizeContacts(patient);

  return (
    <ChartTabShell
      title="Contacts"
      description="Emergency contacts, next of kin, and authorized representatives on file."
    >
      {contacts.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map((c) => (
            <SectionCard key={c.id} title={c.name} description={c.type} icon={ContactIcon} accent={c.primary ? 'primary' : 'default'}>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Relationship</dt>
                  <dd className="font-medium">{c.relationship}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{c.phone}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{c.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Address</dt>
                  <dd className="max-w-[60%] text-right font-medium">{c.address}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.primary && <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Primary</Badge>}
                {c.authorized != null && (
                  <Badge variant="outline">{c.authorized ? 'Authorized to receive info' : 'Not authorized'}</Badge>
                )}
                <Badge variant="outline" className={c.active ? 'border-green-300 bg-green-50 text-green-800' : ''}>
                  {c.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </SectionCard>
          ))}
        </div>
      ) : (
        <EmptyState icon={ContactIcon} title="No contacts recorded." description="Contacts added during registration will appear here." />
      )}
    </ChartTabShell>
  );
}
