import crypto from 'crypto';

export interface PinCredentialEnvelope {
  kdfVersion: string;
  pepperVersion: string;
  iterations: number;
  salt: string; // 32 hex chars (16 bytes)
  hashedPin: string; // 64 hex chars (HMAC-SHA256)
}

export interface VerifyPinResult {
  valid: boolean;
  needsRehash?: boolean;
  newEnvelope?: PinCredentialEnvelope;
  error?: string;
}

export const MIN_ITERATIONS = 1000;
export const MAX_ITERATIONS = 1000000;
export const DEFAULT_ITERATIONS = 100000;
export const CURRENT_KDF_VERSION = 'pbkdf2-v1';
export const CURRENT_PEPPER_VERSION = 'pep-2026-v1';

/**
 * Resolves pepper secret for a given pepper version from environment.
 * Enforces fail-closed: throws an error if the pepper is missing, empty, or insecure (< 32 bytes).
 * Strictly maps version to specific secret without cross-version fallbacks.
 */
export function resolvePepper(pepperVersion: string = CURRENT_PEPPER_VERSION): Buffer {
  let pepperSecret: string | undefined;

  if (pepperVersion === 'pep-2026-v1') {
    pepperSecret = process.env.RFID_PIN_PEPPER_V1 || process.env.RFID_PIN_PEPPER;
  } else if (pepperVersion === 'pep-2026-v2') {
    pepperSecret = process.env.RFID_PIN_PEPPER_V2;
  } else {
    // Specific version lookup without silent generic fallback
    const envKey = `RFID_PIN_PEPPER_${pepperVersion.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`;
    pepperSecret = process.env[envKey];
  }

  if (!pepperSecret || typeof pepperSecret !== 'string') {
    throw new Error(`FAIL_CLOSED: Mandatory server pepper secret is missing from environment for version '${pepperVersion}'.`);
  }

  const pepperBuffer = Buffer.from(pepperSecret, 'utf-8');
  if (pepperBuffer.length < 32) {
    throw new Error('FAIL_CLOSED: Mandatory server pepper secret must be at least 32 bytes (256 bits).');
  }

  return pepperBuffer;
}

/**
 * Validates that PIN is strictly a 6-digit numeric string.
 */
export function validatePinFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Validates 64-character hex string (SHA-256 output).
 */
export function isValidHex64(str: string): boolean {
  return typeof str === 'string' && /^[0-9a-fA-F]{64}$/.test(str);
}

/**
 * Validates 32-character hex string (16 bytes salt).
 */
export function isValidHex32(str: string): boolean {
  return typeof str === 'string' && /^[0-9a-fA-F]{32}$/.test(str);
}

/**
 * Computes Two-Layer Hash: HMAC-SHA256(Pepper, PBKDF2-HMAC-SHA256(PIN, Salt, N)).
 */
export function computePinHash(
  pin: string,
  saltHex: string,
  iterations: number = DEFAULT_ITERATIONS,
  pepperVersion: string = CURRENT_PEPPER_VERSION
): string {
  if (!validatePinFormat(pin)) {
    throw new Error('INVALID_PIN_FORMAT: PIN must be exactly 6 numeric digits.');
  }

  if (!isValidHex32(saltHex)) {
    throw new Error('INVALID_SALT_FORMAT: Salt must be a valid 32-character hex string (16 bytes).');
  }

  if (
    typeof iterations !== 'number' ||
    !Number.isInteger(iterations) ||
    iterations < MIN_ITERATIONS ||
    iterations > MAX_ITERATIONS
  ) {
    throw new Error(`INVALID_ITERATIONS: Iterations must be an integer between ${MIN_ITERATIONS} and ${MAX_ITERATIONS}.`);
  }

  const saltBuffer = Buffer.from(saltHex, 'hex');
  const derivedKey = crypto.pbkdf2Sync(pin, saltBuffer, iterations, 32, 'sha256');
  const pepperBuffer = resolvePepper(pepperVersion);

  const hmac = crypto.createHmac('sha256', pepperBuffer);
  hmac.update(derivedKey);
  return hmac.digest('hex');
}

/**
 * Derives a new credential envelope for a newly registered or reset PIN.
 */
export function deriveNewPinCredential(
  pin: string,
  iterations: number = DEFAULT_ITERATIONS,
  pepperVersion: string = CURRENT_PEPPER_VERSION
): PinCredentialEnvelope {
  const saltHex = crypto.randomBytes(16).toString('hex');
  const hashedPin = computePinHash(pin, saltHex, iterations, pepperVersion);

  return {
    kdfVersion: CURRENT_KDF_VERSION,
    pepperVersion,
    iterations,
    salt: saltHex,
    hashedPin,
  };
}

/**
 * Verifies a provided PIN against stored credentials using constant-time comparison.
 * Fail-closed on corrupted credentials, missing secrets, unknown KDF, or invalid iterations.
 */
export function verifyPinCredential(
  inputPin: string,
  storedEnvelope: {
    kdfVersion?: string | null;
    pepperVersion?: string | null;
    iterations?: number | null;
    salt?: string | null;
    hashedPin: string;
  }
): VerifyPinResult {
  if (!validatePinFormat(inputPin)) {
    return { valid: false, error: 'INVALID_PIN_FORMAT' };
  }

  const { salt, hashedPin, kdfVersion, pepperVersion, iterations } = storedEnvelope;

  // C1: Tolak salt yang kosong atau rusak fail-closed
  if (!salt || !isValidHex32(salt) || !isValidHex64(hashedPin)) {
    return { valid: false, error: 'CORRUPTED_CREDENTIAL_DATA' };
  }

  // C1: Jangan diam-diam menganggap versi KDF yang tidak dikenal sebagai versi saat ini.
  if (!kdfVersion || kdfVersion !== CURRENT_KDF_VERSION) {
    return { valid: false, error: 'UNSUPPORTED_KDF_VERSION' };
  }

  // C2: Validasi iteration count terhadap rentang eksplisit [1000 - 1000000]
  if (
    typeof iterations !== 'number' ||
    !Number.isInteger(iterations) ||
    iterations < MIN_ITERATIONS ||
    iterations > MAX_ITERATIONS
  ) {
    return { valid: false, error: 'INVALID_ITERATIONS' };
  }

  // C3: Pepper versioning
  const effectivePepperVersion = pepperVersion || CURRENT_PEPPER_VERSION;

  try {
    const computedHash = computePinHash(inputPin, salt, iterations, effectivePepperVersion);

    const storedBuffer = Buffer.from(hashedPin, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    if (storedBuffer.length !== computedBuffer.length) {
      return { valid: false };
    }

    const isValid = crypto.timingSafeEqual(storedBuffer, computedBuffer);
    if (!isValid) {
      return { valid: false };
    }

    // C5: Rehash check
    const isCurrentPepper = effectivePepperVersion === CURRENT_PEPPER_VERSION;
    const isCurrentIterations = iterations === DEFAULT_ITERATIONS;

    if (!isCurrentPepper || !isCurrentIterations) {
      const newEnvelope = deriveNewPinCredential(inputPin, DEFAULT_ITERATIONS, CURRENT_PEPPER_VERSION);
      return { valid: true, needsRehash: true, newEnvelope };
    }

    return { valid: true, needsRehash: false };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith('FAIL_CLOSED')) {
      throw err; // Propagate fatal configuration error
    }
    return { valid: false, error: 'VERIFICATION_ERROR' };
  }
}
