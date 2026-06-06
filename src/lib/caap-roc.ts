/**
 * CAAP RPAS Operator Certificate (ROC) — the 21-item application checklist.
 *
 * This is the real "franchise to operate" requirement for running drone delivery in the
 * Philippines. The list below is the official CAAP RPAS ROC checklist. For several items
 * the app already holds the underlying record (insurance, pilot licences, aircraft
 * registration) and can auto-evidence them; the rest are documents/photos you prepare
 * for the (infamous) 3 dark-blue binders.
 *
 * Source of status comes from existing app data so the operator can see, at a glance,
 * exactly what's blocking submission.
 */

export type RocSource =
  | "auto" // the app holds the underlying record and can evidence it
  | "doc" // a document or photo you must prepare
  | "admin" // a procedural/admin step (fees, binders, letters)
  | "conditional"; // only required in certain cases (e.g. agricultural ops)

export type RocCategory =
  | "Legal & corporate"
  | "Personnel"
  | "Aircraft & equipment"
  | "Facilities"
  | "Manuals & procedures"
  | "Administrative";

export interface RocRequirement {
  no: number;
  title: string;
  category: RocCategory;
  source: RocSource;
  /** For auto items: which app record proves it. */
  autoKey?: "insurance" | "rpl" | "registration";
  note?: string;
}

export const ROC_REQUIREMENTS: RocRequirement[] = [
  { no: 1, title: "Letter of Intent", category: "Legal & corporate", source: "admin" },
  { no: 2, title: "Pre-Application Statement of Intent (PASI for RPAS)", category: "Legal & corporate", source: "admin" },
  { no: 3, title: "Corporation Documents (SEC / DTI)", category: "Legal & corporate", source: "doc" },
  { no: 4, title: "Secretary's Certificate (corporations, if applicable)", category: "Legal & corporate", source: "doc" },
  { no: 5, title: "Third-Party Liability Insurance (TPL) of the RPA", category: "Aircraft & equipment", source: "auto", autoKey: "insurance", note: "App tracks the policy + expiry; photocopy still goes in the binder." },
  { no: 6, title: "Organizational Chart", category: "Personnel", source: "doc" },
  { no: 7, title: "Resume of key management personnel", category: "Personnel", source: "doc" },
  { no: 8, title: "Photocopy of RPL (remote pilot licence/s), front & back", category: "Personnel", source: "auto", autoKey: "rpl", note: "App holds licence numbers + expiry for each pilot." },
  { no: 9, title: "User's Manual (soft copy)", category: "Manuals & procedures", source: "doc" },
  { no: 10, title: "Photocopy of the Certificate of Registration of the RPA", category: "Aircraft & equipment", source: "auto", autoKey: "registration", note: "App holds each drone's CAAP registration + expiry." },
  { no: 11, title: "Photos of RPA / drone", category: "Aircraft & equipment", source: "doc" },
  { no: 12, title: "Photos of other equipment", category: "Aircraft & equipment", source: "doc" },
  { no: 13, title: "Photos of the main base office", category: "Facilities", source: "doc" },
  { no: 14, title: "Photos of facility/ies", category: "Facilities", source: "doc" },
  { no: 15, title: "Special Certificate of Airworthiness", category: "Aircraft & equipment", source: "doc", note: "Per-airframe; not yet tracked in-app (roadmap)." },
  { no: 16, title: "Official receipt of appropriate fees (after Phase 4)", category: "Administrative", source: "admin" },
  { no: 17, title: "Certificate of Public Convenience & Necessity (CPCN, via CAB)", category: "Legal & corporate", source: "conditional", note: "Only for agricultural operations — N/A for medical / cargo last-mile." },
  { no: 18, title: "RPAS Operations Manual", category: "Manuals & procedures", source: "doc" },
  { no: 19, title: "RPAS Training Syllabus / Program", category: "Manuals & procedures", source: "doc" },
  { no: 20, title: "Operational checklists and forms", category: "Manuals & procedures", source: "doc", note: "App's flight gate + audit log can generate these." },
  { no: 21, title: "3 binders (dark blue, 2in, 3-hole, A4) — 3 printed copies", category: "Administrative", source: "admin", note: "CAAP, the Operator, and (if applicable) facilities." },
];

export type RocStatus = "evidenced" | "missing" | "prepare" | "na";

export interface RocItemResult extends RocRequirement {
  status: RocStatus;
}

export interface RocInputs {
  /** Whether the use case is agricultural (drives CPCN requirement). */
  isAgricultural: boolean;
  insuranceValid: boolean;
  anyValidRpl: boolean;
  anyRegisteredDrone: boolean;
}

/** Resolve each requirement to a concrete status using current app data. */
export function evaluateRoc(inputs: RocInputs): RocItemResult[] {
  return ROC_REQUIREMENTS.map((r) => {
    let status: RocStatus;
    if (r.source === "conditional") {
      status = inputs.isAgricultural ? "prepare" : "na";
    } else if (r.source === "auto") {
      const ok =
        r.autoKey === "insurance"
          ? inputs.insuranceValid
          : r.autoKey === "rpl"
            ? inputs.anyValidRpl
            : inputs.anyRegisteredDrone;
      status = ok ? "evidenced" : "missing";
    } else {
      status = "prepare"; // doc / admin — manual preparation
    }
    return { ...r, status };
  });
}

export interface RocSummary {
  evidenced: number;
  missing: number;
  prepare: number;
  applicable: number;
  pct: number;
}

export function summarizeRoc(items: RocItemResult[]): RocSummary {
  const applicableItems = items.filter((i) => i.status !== "na");
  const evidenced = items.filter((i) => i.status === "evidenced").length;
  const missing = items.filter((i) => i.status === "missing").length;
  const prepare = items.filter((i) => i.status === "prepare").length;
  const applicable = applicableItems.length;
  // "Done" = auto items the app can already evidence.
  const pct = applicable === 0 ? 0 : Math.round((evidenced / applicable) * 100);
  return { evidenced, missing, prepare, applicable, pct };
}
