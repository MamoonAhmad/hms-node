import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { rcmApi } from '@/services/api';
import { claimStatusLabel } from '@/lib/claimConstants';

function Field({ label, value }) {
  return (
    <div className="print-field">
      <div className="print-label">{label}</div>
      <div className="print-value">{value || '—'}</div>
    </div>
  );
}

function patientName(patient) {
  if (!patient) return '';
  return [patient.lastName, [patient.firstName, patient.middleName].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

export function ClaimPrintPage() {
  const { claimId } = useParams();
  const [claim, setClaim] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await rcmApi.printClaim(claimId);
        if (!cancelled) setClaim(res.data || res);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load claim');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [claimId]);

  useEffect(() => {
    if (claim) {
      const t = setTimeout(() => window.print(), 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [claim]);

  if (loading) return <div className="p-8 text-sm">Loading claim…</div>;
  if (error) return <div className="p-8 text-sm text-red-700">{error}</div>;
  if (!claim) return <div className="p-8 text-sm">Claim not found.</div>;

  const primary = (claim.insurances || []).find((i) => i.tier === 'primary') || {};
  const additional = claim.additionalInfo || {};
  const ambulance = claim.ambulanceInfo || {};

  return (
    <div className="cms1500-print">
      <style>{`
        @page { size: letter portrait; margin: 0.45in; }
        @media print {
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
        }
        .cms1500-print {
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
          background: #fff;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 12px 16px 24px;
        }
        .cms1500-print h1 { font-size: 16px; margin: 0 0 4px; letter-spacing: 0.04em; }
        .cms1500-print h2 { font-size: 11px; margin: 12px 0 6px; border-bottom: 1px solid #111; padding-bottom: 2px; text-transform: uppercase; }
        .print-meta { font-size: 11px; margin-bottom: 8px; }
        .print-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 10px; }
        .print-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 10px; }
        .print-field { min-height: 28px; }
        .print-label { font-size: 8px; text-transform: uppercase; color: #444; }
        .print-value { font-size: 11px; border-bottom: 1px solid #ccc; min-height: 16px; }
        table.print-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        table.print-table th, table.print-table td { border: 1px solid #222; padding: 3px 4px; text-align: left; }
        table.print-table th { background: #f3f3f3; }
        .no-print { margin-bottom: 12px; }
      `}</style>

      <div className="no-print">
        <button type="button" onClick={() => window.print()}>Print</button>
      </div>

      <h1>CMS-1500 PROFESSIONAL CLAIM</h1>
      <div className="print-meta">
        Claim # {claim.claimNumber} · Status {claimStatusLabel(claim.claimStatus || claim.status)} · Printed {new Date().toLocaleDateString()}
      </div>

      <h2>Claim Information</h2>
      <div className="print-grid">
        <Field label="Patient" value={patientName(claim.patient) || claim.patientName} />
        <Field label="MRN" value={claim.patient?.mrn || claim.patientMrn} />
        <Field label="Patient DOB" value={claim.patient?.dateOfBirth ? String(claim.patient.dateOfBirth).slice(0, 10) : ''} />
        <Field label="Rendering Provider" value={claim.renderingProvider?.name} />
        <Field label="Billing Provider" value={claim.billingProvider?.name} />
        <Field label="Supervising Provider" value={claim.supervisingProvider?.name} />
        <Field label="Ordering Provider" value={claim.orderingProvider?.name} />
        <Field label="Referring / PCP" value={claim.referringProvider?.name} />
        <Field label="Facility" value={claim.facility?.name} />
      </div>

      <h2>Insurance Information</h2>
      <div className="print-grid">
        <Field label="Primary Payer" value={claim.primaryPayer?.name} />
        <Field label="Member / Subscriber ID" value={primary.memberId} />
        <Field label="Group Number" value={primary.groupNumber} />
        <Field label="Subscriber Name" value={primary.subscriberName} />
        <Field label="Subscriber DOB" value={primary.subscriberDob} />
        <Field label="Relationship" value={primary.subscriberRelationship} />
        <Field label="Secondary Payer" value={claim.secondaryPayer?.name} />
        <Field label="Tertiary Payer" value={claim.tertiaryPayer?.name} />
      </div>

      <h2>Charges</h2>
      <p style={{ fontSize: 10, margin: '0 0 6px' }}>
        Diagnosis: {(claim.diagnoses || []).map((dx) => `${dx.pointer}: ${dx.code}`).join('   ') || '—'}
      </p>
      <table className="print-table">
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>POS</th>
            <th>Procedure</th>
            <th>Mods</th>
            <th>DX</th>
            <th>Units</th>
            <th>Charge</th>
          </tr>
        </thead>
        <tbody>
          {(claim.charges || []).map((line) => (
            <tr key={line.id || line.lineNumber}>
              <td>{line.serviceFromDate || line.serviceDate || ''}</td>
              <td>{line.serviceToDate || ''}</td>
              <td>{line.placeOfService || ''}</td>
              <td>{line.procedureCode || line.cptCode || ''}</td>
              <td>{[line.modifier1, line.modifier2, line.modifier3, line.modifier4].filter(Boolean).join(' ')}</td>
              <td>{line.diagnosisPointer || line.diagnosisPointers || ''}</td>
              <td>{line.units}</td>
              <td>${Number(line.chargeAmount || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 11, marginTop: 6, textAlign: 'right' }}>
        <strong>Total charges: ${Number(claim.totalCharge || 0).toFixed(2)}</strong>
      </p>

      <h2>Additional Information</h2>
      <div className="print-grid">
        <Field label="Employment related" value={additional.employmentRelated ? 'Yes' : 'No'} />
        <Field label="Auto accident" value={additional.autoAccident ? `Yes ${additional.accidentState || ''}` : 'No'} />
        <Field label="Other accident" value={additional.otherAccident ? 'Yes' : 'No'} />
        <Field label="Onset date" value={additional.onsetDate} />
        <Field label="Initial treatment" value={additional.initialTreatmentDate} />
        <Field label="Unable to work" value={[additional.unableToWorkFrom, additional.unableToWorkTo].filter(Boolean).join(' – ')} />
        <Field label="Hospitalization" value={[additional.hospitalizationFrom, additional.hospitalizationTo].filter(Boolean).join(' – ')} />
        <Field label="Lab charge" value={additional.labCharge} />
        <Field label="Resubmission code" value={additional.resubmissionCode} />
        <Field label="Notes" value={additional.notes} />
      </div>

      {ambulance.isAmbulanceClaim ? (
        <>
          <h2>Ambulance Information</h2>
          <div className="print-grid">
            <Field label="Transport reason" value={ambulance.ambulanceTransportReason} />
            <Field label="Mileage" value={ambulance.transportMiles || ambulance.mileage} />
            <Field label="Pickup" value={[ambulance.pickupAddress?.line1, ambulance.pickupAddress?.city, ambulance.pickupAddress?.state].filter(Boolean).join(', ')} />
            <Field label="Dropoff" value={[ambulance.dropoffAddress?.name, ambulance.dropoffAddress?.line1, ambulance.dropoffAddress?.city].filter(Boolean).join(', ')} />
          </div>
        </>
      ) : null}
    </div>
  );
}
