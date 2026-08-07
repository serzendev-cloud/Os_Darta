// ========================================
// Santri Domain Exceptions
// Traceability: CIP-WP-003 | AN-003 | BRR-MDS-003
// ========================================

export class DomainException extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code: string, status: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidStateTransitionException extends DomainException {
  constructor(fromState: string, toState: string) {
    super(
      `[MDS_4005] Invalid lifecycle state transition from '${fromState}' to '${toState}' is not permitted.`,
      'MDS_4005',
      422
    );
  }
}

export class PreconditionFailedException extends DomainException {
  constructor(message: string) {
    super(`[MDS_4006] ${message}`, 'MDS_4006', 422);
  }
}
