import { describe, it, expect } from 'vitest';
import { canApproveTransfer, canViewNationalDashboard, hasRole, ROLE_HIERARCHY } from './auth';

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
