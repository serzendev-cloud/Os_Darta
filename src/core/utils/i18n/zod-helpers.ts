// ========================================
// Zod Canonical Enum Validation Helpers
// Traceability: CIP-WP-004 | AN-WP004-002
// ========================================

import { z } from 'zod';
import {
  parseDisplayToCanonical,
  parseDbToCanonical,
  translateCanonicalToDb,
  translateEnumToDisplay,
} from './enum-translation';

/**
 * Creates a Zod schema that validates and coerces enum inputs.
 * Accepts display labels, DB codes, or canonical enum values, and normalizes them to the canonical enum value.
 */
export function zCanonicalEnum<T extends Record<string, string>>(
  enumName: string,
  enumObject: T
) {
  return z.preprocess((val) => {
    if (typeof val !== 'string') return val;
    
    const cleanVal = val.trim();
    // 1. If it is already a valid canonical value, return it
    if (Object.values(enumObject).includes(cleanVal)) {
      return cleanVal;
    }
    // 2. Try parsing from Display value to Canonical
    try {
      return parseDisplayToCanonical(enumName, cleanVal);
    } catch {
      // 3. Try parsing from DB code to Canonical
      try {
        return parseDbToCanonical(enumName, cleanVal);
      } catch {
        return val;
      }
    }
  }, z.nativeEnum(enumObject));
}

/**
 * Wraps an enum schema with a transformer that outputs the database representation code.
 */
export function zCanonicalToDb<T extends z.ZodTypeAny>(
  enumName: string,
  baseSchema: T
) {
  return baseSchema.transform((val) => translateCanonicalToDb(enumName, String(val)));
}

/**
 * Wraps an enum schema with a transformer that outputs the Indonesian display label.
 */
export function zCanonicalToDisplay<T extends z.ZodTypeAny>(
  enumName: string,
  baseSchema: T
) {
  return baseSchema.transform((val) => translateEnumToDisplay(enumName, String(val)));
}
