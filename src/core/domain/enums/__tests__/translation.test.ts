// ========================================
// Translation and Zod Helper Unit Tests
// Traceability: CIP-WP-004 | Rule SMB-221
// ========================================

import { describe, it, expect } from 'vitest';
import { Gender, TenantStatus, GeneralStatus, UserRole } from '../index';
import { SantriState } from '@/modules/santri/domain/state-machine';
import {
  translateEnumToDisplay,
  parseDisplayToCanonical,
  translateCanonicalToDb,
  parseDbToCanonical,
} from '@/core/utils/i18n/enum-translation';
import {
  zCanonicalEnum,
  zCanonicalToDb,
  zCanonicalToDisplay,
} from '@/core/utils/i18n/zod-helpers';

describe('Enum Centralized Translation Engine', () => {
  describe('Gender Translation mappings', () => {
    it('should translate canonical to Indonesian display', () => {
      expect(translateEnumToDisplay('Gender', Gender.MALE)).toBe('Laki-laki');
      expect(translateEnumToDisplay('Gender', Gender.FEMALE)).toBe('Perempuan');
    });

    it('should parse display text to canonical', () => {
      expect(parseDisplayToCanonical('Gender', 'Laki-laki')).toBe(Gender.MALE);
      expect(parseDisplayToCanonical('Gender', 'laki-laki ')).toBe(Gender.MALE);
      expect(parseDisplayToCanonical('Gender', 'Putra')).toBe(Gender.MALE);
      expect(parseDisplayToCanonical('Gender', 'Perempuan')).toBe(Gender.FEMALE);
      expect(parseDisplayToCanonical('Gender', 'Putri')).toBe(Gender.FEMALE);
    });

    it('should translate canonical to DB representations', () => {
      expect(translateCanonicalToDb('Gender', Gender.MALE)).toBe('L');
      expect(translateCanonicalToDb('Gender', Gender.FEMALE)).toBe('P');
    });

    it('should parse DB code to canonical enum', () => {
      expect(parseDbToCanonical('Gender', 'L')).toBe(Gender.MALE);
      expect(parseDbToCanonical('Gender', 'P')).toBe(Gender.FEMALE);
      expect(parseDbToCanonical('Gender', 'l')).toBe(Gender.MALE);
      expect(parseDbToCanonical('Gender', 'p')).toBe(Gender.FEMALE);
    });
  });

  describe('GeneralStatus & TenantStatus Translation mappings', () => {
    it('should handle english GeneralStatus', () => {
      expect(translateCanonicalToDb('GeneralStatus', GeneralStatus.ACTIVE)).toBe('active');
      expect(translateCanonicalToDb('GeneralStatus', GeneralStatus.INACTIVE)).toBe('inactive');
      expect(parseDbToCanonical('GeneralStatus', 'active')).toBe(GeneralStatus.ACTIVE);
      expect(parseDbToCanonical('GeneralStatus', 'aktif')).toBe(GeneralStatus.ACTIVE);
    });

    it('should handle indonesian GeneralStatusIndo', () => {
      expect(translateCanonicalToDb('GeneralStatusIndo', GeneralStatus.ACTIVE)).toBe('aktif');
      expect(translateCanonicalToDb('GeneralStatusIndo', GeneralStatus.INACTIVE)).toBe('non-aktif');
      expect(parseDbToCanonical('GeneralStatusIndo', 'aktif')).toBe(GeneralStatus.ACTIVE);
      expect(parseDbToCanonical('GeneralStatusIndo', 'active')).toBe(GeneralStatus.ACTIVE);
    });

    it('should translate TenantStatus display and db', () => {
      expect(translateEnumToDisplay('TenantStatus', TenantStatus.SUSPENDED)).toBe('Ditangguhkan');
      expect(translateCanonicalToDb('TenantStatus', TenantStatus.TRIAL)).toBe('trial');
      expect(parseDbToCanonical('TenantStatus', 'trial')).toBe(TenantStatus.TRIAL);
    });
  });

  describe('SantriState & UserRole Translation mappings', () => {
    it('should map state machine status properties', () => {
      expect(translateEnumToDisplay('SantriState', SantriState.ACTIVE)).toBe('Aktif');
      expect(translateEnumToDisplay('SantriState', SantriState.SUSPENDED)).toBe('Cuti/Skorsing');
      expect(translateCanonicalToDb('SantriState', SantriState.ACTIVE)).toBe('aktif');
      expect(translateCanonicalToDb('SantriState', SantriState.SUSPENDED)).toBe('cuti');
      expect(parseDbToCanonical('SantriState', 'cuti')).toBe(SantriState.SUSPENDED);
      expect(parseDbToCanonical('SantriState', 'skorsing')).toBe(SantriState.SUSPENDED);
    });

    it('should map roles cleanly', () => {
      expect(translateEnumToDisplay('UserRole', UserRole.WALI)).toBe('Wali Santri');
      expect(translateCanonicalToDb('UserRole', UserRole.WALI)).toBe('wali');
      expect(parseDbToCanonical('UserRole', 'orang_tua')).toBe(UserRole.WALI);
    });
  });
});

describe('Zod Schema Helpers integration', () => {
  const genderSchema = zCanonicalEnum('Gender', Gender);

  it('should parse valid inputs to canonical enums', () => {
    expect(genderSchema.parse(Gender.MALE)).toBe(Gender.MALE);
    expect(genderSchema.parse('Laki-laki')).toBe(Gender.MALE);
    expect(genderSchema.parse('Perempuan')).toBe(Gender.FEMALE);
    expect(genderSchema.parse('L')).toBe(Gender.MALE);
    expect(genderSchema.parse('p')).toBe(Gender.FEMALE);
  });

  it('should throw validation error on invalid input', () => {
    expect(() => genderSchema.parse('InvalidGender')).toThrow();
  });

  it('should transform canonical enums to DB format', () => {
    const genderDbSchema = zCanonicalToDb('Gender', genderSchema);
    expect(genderDbSchema.parse('Laki-laki')).toBe('L');
    expect(genderDbSchema.parse('P')).toBe('P');
    expect(genderDbSchema.parse(Gender.MALE)).toBe('L');
  });

  it('should transform canonical enums to Display format', () => {
    const genderDisplaySchema = zCanonicalToDisplay('Gender', genderSchema);
    expect(genderDisplaySchema.parse('L')).toBe('Laki-laki');
    expect(genderDisplaySchema.parse('Perempuan')).toBe('Perempuan');
    expect(genderDisplaySchema.parse(Gender.MALE)).toBe('Laki-laki');
  });
});
