export interface WalletCodeParams {
  tenantCode: string;
  santriId: string;
  angkatanMasuk?: number | string | null;
  joinDate?: string | Date | null;
  pocketNumber?: string | number;
}

const MIN_YEAR = 1990;
const MAX_YEAR = 2100;

/**
 * Validates whether a given 4-digit number is within the valid admission year range [1990-2100].
 */
export function isValidYearRange(year: number): boolean {
  return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR;
}

/**
 * Safely parses and validates a calendar date string (YYYY-MM-DD) or Date object,
 * verifying that the date actually exists on the calendar (handling leap years, Feb 30, etc.).
 * Returns the 4-digit year if valid, or null if invalid.
 */
export function extractValidCalendarYear(
  angkatanMasuk?: number | string | null,
  joinDate?: string | Date | null
): number | null {
  // 1. Try angkatanMasuk first
  if (angkatanMasuk !== undefined && angkatanMasuk !== null && angkatanMasuk !== '') {
    const parsedYear = Number(angkatanMasuk);
    if (isValidYearRange(parsedYear)) {
      return parsedYear;
    }
  }

  // 2. Try joinDate fallback
  if (joinDate) {
    if (joinDate instanceof Date) {
      if (!isNaN(joinDate.getTime())) {
        const y = joinDate.getFullYear();
        if (isValidYearRange(y)) {
          return y;
        }
      }
      return null;
    }

    if (typeof joinDate === 'string') {
      const trimmed = joinDate.trim();
      // Match ISO YYYY-MM-DD
      const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const y = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const d = parseInt(match[3], 10);

        if (m < 1 || m > 12 || d < 1 || d > 31) {
          return null;
        }

        // Validate actual calendar days (including leap year)
        const daysInMonth = new Date(y, m, 0).getDate();
        if (d > daysInMonth) {
          return null; // e.g. Feb 30 or Feb 29 on non-leap year
        }

        if (isValidYearRange(y)) {
          return y;
        }
      }
    }
  }

  return null;
}

/**
 * Generates the standardized deterministic business wallet code:
 * US-{KODE_TENANT}-{TAHUN_MASUK}-{ID_SANTRI}-{NOMOR_DOMPET}
 * Example: US-T001-2024-S000123-01
 * 
 * Enforces fail-closed: throws an error if any component is invalid.
 */
export function generateWalletCode(params: WalletCodeParams): string {
  const { tenantCode, santriId, angkatanMasuk, joinDate, pocketNumber = '01' } = params;

  if (!tenantCode || typeof tenantCode !== 'string' || !tenantCode.trim()) {
    throw new Error('FAIL_CLOSED: tenantCode is required to generate wallet code.');
  }

  if (!santriId || typeof santriId !== 'string' || !santriId.trim()) {
    throw new Error('FAIL_CLOSED: santriId is required to generate wallet code.');
  }

  const validYear = extractValidCalendarYear(angkatanMasuk, joinDate);
  if (!validYear) {
    throw new Error(
      `FAIL_CLOSED: Valid admission calendar year [${MIN_YEAR}-${MAX_YEAR}] could not be verified from angkatanMasuk or joinDate.`
    );
  }

  const cleanTenant = tenantCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanSantri = santriId.trim();
  const pocketStr = String(pocketNumber).padStart(2, '0');

  return `US-${cleanTenant}-${validYear}-${cleanSantri}-${pocketStr}`;
}

/**
 * Validates whether a wallet code strictly conforms to the business format pattern.
 */
export function isValidWalletCodeFormat(code: string): boolean {
  if (typeof code !== 'string') return false;
  const regex = /^US-[A-Z0-9]+-(199\d|20\d\d|2100)-[A-Za-z0-9_-]+-\d{2}$/;
  return regex.test(code);
}
