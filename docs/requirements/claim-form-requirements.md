# Professional Claim Form – Outpatient Clinic  
## Requirements Document

This document defines the requirements for a **professional claim form** (e.g. CMS-1500 / HCFA-1500 style) used in an outpatient clinic. The form must be **easy to read**, **easy to complete**, and **visually clear** so staff can enter and review information quickly.

---

## 1. Purpose & Scope

- **Purpose:** Capture all data required to generate a clean, billable professional (e.g. 1500) claim for outpatient encounters.
- **Scope:** Single encounter per form; one form per patient per date of service (or per encounter, if your workflow is encounter-based).
- **Users:** Front desk, billing staff, and clinicians who verify or add clinical data.

---

## 2. High-Level Data Sections (Logical Grouping)

The form MUST be organized into **clearly labeled sections** so that:
- Related fields sit together (e.g. all patient ID in one block).
- Sections can be visually separated (cards, borders, or spacing).
- Required vs optional is obvious (e.g. asterisk + helper text).

Recommended section order:

1. **Claim / encounter identification**
2. **Patient & subscriber (insured) demographics**
3. **Provider / facility information**
4. **Dates, place & type of service**
5. **Diagnosis (ICD)**
6. **Procedures / services (CPT/HCPCS)**
7. **Charges, adjustments & payment**
8. **Authorization / referral (if applicable)**
9. **Notes / remarks**
10. **Signature & submission**

---

## 3. Detailed Field Requirements

### 3.1 Claim / Encounter Identification

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Claim/Encounter ID | Yes | Text (auto or manual) | Unique per claim; optional auto-generation. |
| Claim type | Yes | Select | e.g. Original, Replacement, Void/Cancel. |
| Statement from / through dates | Yes | Date range | Service period this claim covers. |

**UI:** Compact header block; Claim ID and claim type on one row; date range below. Use muted background so it reads as “metadata.”

---

### 3.2 Patient & Subscriber (Insured) Demographics

**Patient**

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Patient last name | Yes | Text | |
| Patient first name | Yes | Text | |
| Patient middle name/initial | No | Text | |
| Patient date of birth | Yes | Date | |
| Patient gender | Yes | Select | e.g. Male, Female, Unknown, Other. |
| Patient address (street, city, state, ZIP) | Yes | Text / structured | Street; City; State (dropdown); ZIP. |
| Patient phone | Recommended | Tel | At least one contact. |
| Patient email | No | Email | Optional. |
| Patient SSN (last 4 or full per policy) | Conditional | Text / masked | Only if required by payer; mask in UI when not editing. |
| Patient account/MRN | Yes | Text | Internal account or MRN. |
| Relationship to subscriber | Yes | Select | Self, Spouse, Child, Other. |

**Subscriber (insured)**

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Subscriber last name | Yes | Text | |
| Subscriber first name | Yes | Text | |
| Subscriber middle name/initial | No | Text | |
| Subscriber DOB | Yes | Date | |
| Subscriber ID (member ID) | Yes | Text | Payer-assigned member ID. |
| Subscriber group number | Conditional | Text | When applicable. |
| Subscriber address | Yes | Same as patient or different | Street, city, state, ZIP. |
| Subscriber phone | No | Tel | Optional. |

**UI:** Two sub-cards or panels: “Patient” and “Subscriber (Insured).” Use a single column or two columns on large screens. Labels above fields; consistent input height and spacing. Optional: “Same as patient” checkbox for subscriber address to reduce data entry.

---

### 3.3 Insurance / Payer Information

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Payer name | Yes | Text or searchable select | From payer list if available. |
| Payer ID (e.g. EDI) | Yes | Text | For electronic submission. |
| Plan name | No | Text | |
| Insurance type | Yes | Select | Primary, Secondary, Tertiary; or Commercial, Medicare, Medicaid, etc. |
| Authorization / pre-auth number | Conditional | Text | When required by payer. |

**UI:** One compact block; payer and plan prominent. Authorization in same block or in a separate “Authorization” section.

---

### 3.4 Provider / Facility Information

**Billing provider (NPI / tax ID)**

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Billing provider name | Yes | Text | Practice or provider name. |
| NPI | Yes | Text | 10 digits. |
| Tax ID (EIN/TIN) | Yes | Text | Mask or format as XX-XXXXXXX. |
| Billing address | Yes | Structured | Street, city, state, ZIP. |
| Billing phone / fax | Recommended | Tel | |

**Rendering provider (if different)**

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Rendering provider name | Yes | Text or select | From provider list. |
| NPI | Yes | Text | 10 digits. |
| Taxonomy / specialty | No | Text or select | If needed for claim. |

**Facility (if applicable)**

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Facility name | Conditional | Text | When place of service is facility. |
| Facility address | Conditional | Structured | |
| Place of service (POS) code | Yes | Select | e.g. 11 Office, 21 Hospital, 22 Outpatient Hospital. |

**UI:** Collapsible or tabbed “Billing provider” and “Rendering provider”; or two cards. Place of service near date/type of service. NPI and Tax ID with clear formatting (e.g. spacing for NPI).

---

### 3.5 Dates, Place & Type of Service

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Date(s) of service | Yes | Date or date range | Single date or from/to. |
| Place of service (POS) | Yes | Select | Must match facility if facility is used. |
| Type of service | No | Select | e.g. Medical, Dental, Vision. |
| EM level or visit type | Conditional | Select | e.g. 99202–99205, 99212–99215. |
| Onset date (for certain diagnoses) | Conditional | Date | When required for ICD. |

**UI:** Single row or small grid: DOS, POS, type of service. Use date picker and dropdowns; keep labels short (“DOS”, “POS”, “Service type”).

---

### 3.6 Diagnosis (ICD)

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Diagnosis code 1 (primary) | Yes | Text or searchable | ICD-10 (and ICD-9 if legacy). |
| Diagnosis codes 2–12 | Conditional | Same | Up to 12 diagnosis pointers; order matters. |
| Pointer link to procedures | Yes | In procedure section | Each line item can point to 1+ diagnosis (e.g. 1, 2, 1-3). |

**UI:** Numbered list or table: “Diagnosis 1 (primary)”, “Diagnosis 2”, … Search/autocomplete by code or description. Show short description next to code. Optional: “Add diagnosis” button; max 12.

---

### 3.7 Procedures / Services (CPT/HCPCS)

Each line item should include:

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Procedure code | Yes | Text or searchable | CPT or HCPCS. |
| Modifiers | No | Text or multi-select | e.g. 25, 59, LT, RT; up to 4. |
| Diagnosis pointer(s) | Yes | Text or multi-select | e.g. 1, 2, 1-2. |
| Units | Yes | Number | Default 1; integer. |
| Charge amount | Yes | Currency | Per unit or total. |
| Service date (if different from DOS) | Conditional | Date | When line-level date differs. |
| Rendering provider (if multiple) | Conditional | Select | When multiple providers. |
| NDC (for drugs) | Conditional | Text | When required. |

**UI:** Table layout: columns Code, Modifiers, DX Pointer(s), Units, Charge, (optional) Date. “Add line” button. Inline validation (e.g. valid code, positive units/charge). Subtotals and total at bottom. Alternating row background for readability.

---

### 3.8 Charges, Adjustments & Payment

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Total charge | Yes | Currency | Sum of line items or manual override with warning. |
| Amount paid (e.g. patient paid) | No | Currency | |
| Balance due | Computed | Currency | Total − paid; display only. |
| Adjustments (write-off, contractual) | Optional | Currency or % | By type if needed. |

**UI:** Summary card or footer: Total charge, Amount paid, Balance due. Use bold for totals; align numbers right. Optional breakdown of adjustments.

---

### 3.9 Authorization / Referral

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Prior auth / referral number | Conditional | Text | When required. |
| Auth/referral effective dates | No | Date range | |
| Referring provider name & NPI | Conditional | Text | When required by payer. |

**UI:** Small section or collapsible; only show when “Authorization required” or similar is selected.

---

### 3.10 Notes / Remarks

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Claim-level notes / remarks | No | Textarea | Free text for special instructions. |
| Attachments / documentation | Optional | File upload or links | Link to clinical docs if needed. |

**UI:** Single textarea; optional “Add attachment” with clear file types/size.

---

### 3.11 Signature & Submission

| Field | Required | Type | Notes |
|-------|----------|------|--------|
| Signature (provider or authorized) | Yes | Checkbox + name/date or e-sign | “I certify that the information is accurate.” |
| Signature date | Yes | Date | |
| Submit as (electronic / print) | Yes | Select or default | e.g. Submit electronically, Print for mail. |

**UI:** Checkbox + “Sign and submit” or “Save as draft.” Clear primary action (Submit) and secondary (Save draft / Cancel).

---

## 4. UI/UX Requirements (Beauty & Usability)

### 4.1 Layout & Structure

- **Sections as cards or panels:** Each major section (patient, subscriber, provider, diagnosis, procedures, etc.) in its own card with a clear heading. Light border or shadow; consistent padding.
- **Single-column on mobile, optional two-column on desktop** for demographics (e.g. Patient left, Subscriber right).
- **Consistent spacing:** Use a 4/8px grid; same gap between sections and between label and input.
- **Max width for content:** e.g. 900–1000px for the form body so lines of text and inputs don’t stretch too wide on large screens.
- **Sticky header (optional):** Claim ID and “Save / Submit” always visible on scroll.

### 4.2 Typography & Readability

- **Clear hierarchy:** One H1 (e.g. “Professional Claim Form” or “CMS-1500”); section titles as H2 or strong card titles; labels as consistent, muted label style.
- **Font size:** Labels and inputs at least 14px; section titles slightly larger; avoid small decorative text for critical data.
- **Contrast:** Text and borders must meet WCAG AA (e.g. dark text on light background; avoid low-contrast gray for required fields).

### 4.3 Form Controls

- **Labels:** Always visible above or left-aligned; use `for`/`id` for accessibility. Required fields marked with asterisk (*) and “Required” in legend or footer.
- **Inputs:** Consistent height (e.g. 36–40px); sufficient padding; clear focus ring (e.g. 2px primary color).
- **Dropdowns:** Searchable where there are many options (e.g. diagnosis, procedure, payer, provider).
- **Dates:** Date picker (calendar); no free-format typing for date.
- **Currency:** Two decimals; right-aligned; optional “$” prefix or suffix.
- **Errors:** Inline under field; red border or icon; message short and actionable (e.g. “Enter a valid NPI (10 digits)”).

### 4.4 Visual Design

- **Color:** Primary color for primary actions (Submit, Save); neutral for secondary (Cancel, Back). Use one accent (e.g. blue or green) for links and key actions; red only for errors/destructive actions.
- **Tables (procedures):** Header row distinct (background + bold); alternating row background; hover highlight; align numbers right.
- **Empty state:** When there are no diagnosis or procedure lines, show “Add first diagnosis” / “Add first procedure” with a clear button.
- **Loading & saving:** Disable submit while saving; show spinner or “Saving…” so the form doesn’t look unresponsive.

### 4.5 Ease of Entry

- **Defaults:** Pre-fill from patient/encounter when opened from a visit (e.g. patient demographics, DOS, rendering provider).
- **Copy from previous:** Optional “Copy from last claim” for same patient or same provider.
- **Autocomplete:** For diagnosis and procedure codes (code + description); for provider and payer names.
- **Keyboard:** Tab order follows visual order; Enter submits when focus is in a single-line field only if it doesn’t add a new line.
- **Validation:** Validate on blur or on submit; do not block typing with aggressive live validation (e.g. allow typing before marking invalid).
- **Save draft:** Auto-save or explicit “Save draft” so users don’t lose data.

### 4.6 Responsiveness

- **Mobile/tablet:** Stack all sections in one column; table for procedures becomes horizontally scrollable or card-per-line; buttons full-width if needed.
- **Print:** Optional “Print claim” view: hide navigation and secondary UI; ensure all sections and table fit on printed page with clear section breaks.

---

## 5. Validation & Business Rules

- **NPI:** Exactly 10 digits.
- **Tax ID:** 9 digits (with or without hyphen).
- **Date of service:** Not in future; optional rule “not more than X months in past” per payer.
- **Diagnosis:** Valid ICD-10 (and ICD-9 if used); at least one diagnosis.
- **Procedure codes:** Valid CPT/HCPCS; units ≥ 1; charge ≥ 0.
- **Total charge:** Must equal sum of line charges (or show warning if overridden).
- **Required fields:** Block submit until all required fields are valid; show list of errors at top or per section.

---

## 6. Optional Enhancements

- **Multi-page wizard:** Step 1 Patient/Insured, Step 2 Provider/DOS, Step 3 Diagnosis, Step 4 Procedures, Step 5 Review & Sign.
- **Templates:** Save common procedure sets or diagnosis sets as templates and apply to new claims.
- **Payer-specific rules:** Show/hide or require fields based on selected payer (e.g. Medicaid vs Medicare).
- **Real-time eligibility:** Display eligibility status and last check date next to subscriber/insurance section.
- **Duplicate claim check:** Warn if a claim for same patient, same DOS, same provider already exists.

---

## 7. Summary Checklist for Implementation

- [ ] All sections from §3 implemented with correct required/optional and types.
- [ ] Layout: sections as cards; responsive; max width; consistent spacing.
- [ ] Typography and contrast meet readability and accessibility goals.
- [ ] Required fields marked; validation on blur/submit; clear error messages.
- [ ] Procedures in a table with add row, totals, and inline validation.
- [ ] Diagnosis with search/autocomplete; pointer link to procedures.
- [ ] Signature and submit/save draft actions clear and accessible.
- [ ] Optional: draft save, print view, and payer-specific rules.

Following these requirements will yield a **professional outpatient clinic claim form** that is **complete for billing**, **easy to read**, and **easy to enter information** while keeping a **clean, modern UI**.
