/**
 * CAAP (Civil Aviation Authority of the Philippines) compliance constants + helpers.
 *
 * Researched 2026-06 from CAAP RPAS regulations. These encode the legal envelope
 * that EVERY Aloft flight must sit inside. The operator dashboard enforces them.
 *
 * Key rules for the FlyCart class (25–95 kg → "above 7 kg to 150 kg" category):
 *  - Mandatory drone registration with CAAP.
 *  - Pilot must hold an RPA Controller Certificate / Remote Pilot Licence (RPL).
 *  - The company must hold an RPAS Operator Certificate (ROC).
 *  - Mandatory third-party liability insurance.
 *  - Default ops: VLOS only, ≤120 m AGL, not over crowds, >10 km from airports.
 *  - Real delivery = BVLOS → needs a Special Flight Permit per corridor/operation.
 */

export const CAAP = {
  /** Max altitude above ground level without a special permit, meters. */
  maxAltitudeAglM: 120,
  /** Minimum distance from any airport without coordination, km. */
  minAirportDistanceKm: 10,
  /** Weight class thresholds, kg. */
  weightClasses: {
    light: 7, // ≤7 kg: general safety rules
    heavy: 150, // 7–150 kg: registration + RPL + ROC + insurance
  },
} as const;

/** Which CAAP weight class a drone falls into. */
export function caapWeightClass(grossWeightKg: number): "light" | "heavy" | "special" {
  if (grossWeightKg <= CAAP.weightClasses.light) return "light";
  if (grossWeightKg <= CAAP.weightClasses.heavy) return "heavy";
  return "special";
}

/** Compliance documents a flight requires before it can be dispatched. */
export type ComplianceDocType =
  | "drone_registration" // CAAP RPAS registration certificate
  | "pilot_rpl" // Remote Pilot Licence / RPA Controller Certificate
  | "operator_roc" // RPAS Operator Certificate
  | "insurance" // Third-party liability insurance
  | "special_flight_permit"; // BVLOS / night / >120 m / over-people corridor permit

export const COMPLIANCE_DOC_LABELS: Record<ComplianceDocType, string> = {
  drone_registration: "CAAP Drone Registration",
  pilot_rpl: "Remote Pilot Licence (RPL)",
  operator_roc: "RPAS Operator Certificate (ROC)",
  insurance: "Third-Party Liability Insurance",
  special_flight_permit: "Special Flight Permit (BVLOS)",
};

export interface FlightComplianceInput {
  droneRegistrationValid: boolean;
  pilotLicenceValid: boolean;
  operatorRocValid: boolean;
  insuranceValid: boolean;
  /** Does this corridor go beyond visual line of sight? Most island runs do. */
  isBvlos: boolean;
  specialPermitValid: boolean;
  plannedAltitudeM: number;
  nearestAirportKm: number;
}

export interface FlightComplianceResult {
  cleared: boolean;
  blockers: string[];
  warnings: string[];
}

/**
 * Gate a planned flight against CAAP requirements.
 * `cleared === false` must HARD-BLOCK dispatch in the operator UI.
 */
export function checkFlightCompliance(
  input: FlightComplianceInput,
): FlightComplianceResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.droneRegistrationValid)
    blockers.push("Drone is not registered with CAAP (or registration expired).");
  if (!input.pilotLicenceValid)
    blockers.push("Assigned pilot has no valid Remote Pilot Licence.");
  if (!input.operatorRocValid)
    blockers.push("Operator has no valid RPAS Operator Certificate (ROC).");
  if (!input.insuranceValid)
    blockers.push("No valid third-party liability insurance on file.");

  const needsPermit =
    input.isBvlos || input.plannedAltitudeM > CAAP.maxAltitudeAglM;
  if (needsPermit && !input.specialPermitValid) {
    blockers.push(
      "Flight requires a CAAP Special Flight Permit (BVLOS or >120 m AGL) and none is valid for this corridor.",
    );
  }

  if (input.plannedAltitudeM > CAAP.maxAltitudeAglM) {
    warnings.push(
      `Planned altitude ${input.plannedAltitudeM} m exceeds the standard ${CAAP.maxAltitudeAglM} m AGL ceiling.`,
    );
  }
  if (input.nearestAirportKm < CAAP.minAirportDistanceKm) {
    warnings.push(
      `Corridor is ${input.nearestAirportKm} km from an airport (<${CAAP.minAirportDistanceKm} km) — coordinate with ATC.`,
    );
  }

  return { cleared: blockers.length === 0, blockers, warnings };
}
