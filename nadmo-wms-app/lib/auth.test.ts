import { describe, it, expect } from 'vitest';
import { canApproveTransfer, canViewNationalDashboard, hasRole, ROLE_HIERARCHY } from './auth';
import {
  APPROVER_LADDER,
  requiredLevelForScale,
  nextRung,
  isApproverRole,
  canApproveAtLevel,
  canRejectAtLevel,
  canEscalateAtLevel,
} from './auth';

describe('auth helpers', () => {
  it('should determine role hierarchy', () => {
    expect(hasRole('dg', 'hq_logistics')).toBe(true);
    expect(hasRole('district_officer', 'regional_manager')).toBe(false);
    expect(ROLE_HIERARCHY.sysadmin).toBeGreaterThan(ROLE_HIERARCHY.dg);
  });

  it('should identify national dashboard access', () => {
    expect(canViewNationalDashboard('dg')).toBe(true);
    expect(canViewNationalDashboard('district_officer')).toBe(false);
  });

  it('should determine transfer approval permissions', () => {
    expect(canApproveTransfer('district_officer', 'routine')).toBe(true);
    expect(canApproveTransfer('district_officer', 'standard')).toBe(false);
    expect(canApproveTransfer('regional_manager', 'standard')).toBe(true);
    expect(canApproveTransfer('hq_logistics', 'large')).toBe(true);
    expect(canApproveTransfer('dg', 'strategic')).toBe(true);
  });
});

describe('approval chain helpers', () => {
  it('maps scale to its starting required level', () => {
    expect(requiredLevelForScale('routine')).toBe(2);
    expect(requiredLevelForScale('standard')).toBe(3);
    expect(requiredLevelForScale('large')).toBe(5);
    expect(requiredLevelForScale('strategic')).toBe(8);
  });

  it('escalates one rung up the ladder, capped at dg(8)', () => {
    expect(nextRung(2)).toBe(3);
    expect(nextRung(3)).toBe(5);
    expect(nextRung(5)).toBe(8);
    expect(nextRung(8)).toBe(8);
    // a non-ladder level rounds up to the next ladder rung
    expect(nextRung(4)).toBe(5);
  });

  it('identifies approver roles (ladder + sysadmin only)', () => {
    expect(APPROVER_LADDER).toEqual(['district_officer', 'regional_manager', 'hq_logistics', 'dg']);
    expect(isApproverRole('district_officer')).toBe(true);
    expect(isApproverRole('sysadmin')).toBe(true);
    expect(isApproverRole('auditor')).toBe(false);
    expect(isApproverRole('hq_admin')).toBe(false);
    expect(isApproverRole('hq_procurement')).toBe(false);
  });

  it('gates approval by ladder membership AND level', () => {
    expect(canApproveAtLevel('district_officer', 2)).toBe(true);
    expect(canApproveAtLevel('district_officer', 3)).toBe(false);
    expect(canApproveAtLevel('regional_manager', 3)).toBe(true);
    expect(canApproveAtLevel('hq_logistics', 5)).toBe(true);
    expect(canApproveAtLevel('dg', 8)).toBe(true);
    expect(canApproveAtLevel('sysadmin', 8)).toBe(true);
    // auditor outranks hq_logistics numerically but is not an approver
    expect(canApproveAtLevel('auditor', 5)).toBe(false);
    expect(canRejectAtLevel('regional_manager', 3)).toBe(true);
    expect(canEscalateAtLevel('district_officer', 2)).toBe(true);
  });
});
