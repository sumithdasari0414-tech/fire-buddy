// Dispatch-service interface layer.
//
// This is the ONLY seam through which FireBuddy would ever hand an approved
// dispatch to an authorized fire-service system. There is deliberately NO live
// integration and NO simulation: the default provider is unconfigured and every
// submission fails honestly with `DispatchIntegrationUnavailableError`.
//
// To connect a real, authorized integration later:
//   1. Implement `DispatchServiceProvider` in a SERVER-SIDE backend function
//      (credentials must never reach the browser).
//   2. Have that function verify the caller's session and the dispatch's
//      `approved` status before forwarding anything.
//   3. Register a client provider here that only calls that backend function,
//      then persist the returned reference with `attachExternalReference()`.
import type { DispatchRecord } from '@/integrations/firebase/dispatches';

export interface DispatchSubmission {
  dispatchId: string;
  incidentId: string;
  stationId: string;
  vehicleId: string | null;
  location: { lat: number; lng: number } | null;
  approvedBy: string;
}

export interface DispatchSubmissionResult {
  /** Reference issued by the authorized external system. */
  externalReference: string;
  acceptedAt: Date;
}

export interface DispatchServiceProvider {
  /** Human-readable provider name shown in the dispatch console. */
  readonly name: string;
  /** True only when real, authorized credentials are wired server-side. */
  isConfigured(): boolean;
  submit(submission: DispatchSubmission): Promise<DispatchSubmissionResult>;
}

export class DispatchIntegrationUnavailableError extends Error {
  constructor(message = 'No authorized fire-service dispatch integration is connected.') {
    super(message);
    this.name = 'DispatchIntegrationUnavailableError';
  }
}

/** Default provider: intentionally inert. It never fakes an acceptance. */
const unconfiguredProvider: DispatchServiceProvider = {
  name: 'Not connected',
  isConfigured: () => false,
  submit: async () => {
    throw new DispatchIntegrationUnavailableError();
  },
};

let provider: DispatchServiceProvider = unconfiguredProvider;

/** Register a real provider once an authorized integration exists. */
export function registerDispatchServiceProvider(next: DispatchServiceProvider): void {
  provider = next;
}

export function getDispatchServiceProvider(): DispatchServiceProvider {
  return provider;
}

export function isDispatchServiceConnected(): boolean {
  return provider.isConfigured();
}

/**
 * Hand an APPROVED dispatch to the authorized external service.
 * Throws while no integration is connected — nothing is queued or simulated.
 */
export async function submitApprovedDispatch(
  dispatch: DispatchRecord,
  approvedBy: string,
): Promise<DispatchSubmissionResult> {
  if (dispatch.status !== 'approved') {
    throw new Error('Only a dispatcher-approved dispatch may be submitted.');
  }
  if (!provider.isConfigured()) throw new DispatchIntegrationUnavailableError();
  return provider.submit({
    dispatchId: dispatch.id,
    incidentId: dispatch.incidentId,
    stationId: dispatch.stationId,
    vehicleId: dispatch.vehicleId,
    location: dispatch.incidentLocation,
    approvedBy,
  });
}
