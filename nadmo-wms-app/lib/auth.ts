import { UserRole } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  sysadmin: 'System Administrator',
  dg: 'Director-General',
  hq_logistics: 'HQ Logistics Officer',
  hq_procurement: 'HQ Procurement Officer',
  regional_manager: 'Regional Manager',
  district_officer: 'District Warehouse Officer',
  field_officer: 'Field Response Officer',
  auditor: 'Auditor',
  readonly: 'Read-Only Observer',
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  readonly: 0,
  field_officer: 1,
  district_officer: 2,
  regional_manager: 3,
  hq_procurement: 4,
  hq_logistics: 5,
  auditor: 6,
  dg: 7,
  sysadmin: 8,
};

export function hasRole(role: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
}

export function canViewNationalDashboard(role: UserRole): boolean {
  return ['dg', 'hq_logistics', 'hq_procurement', 'auditor', 'sysadmin'].includes(role);
}

export function canCreateTransfer(role: UserRole): boolean {
  return ['dg', 'hq_logistics', 'hq_procurement', 'regional_manager', 'sysadmin'].includes(role);
}

export function canApproveTransfer(role: UserRole, scale: string): boolean {
  switch (scale) {
    case 'routine':
      return ['district_officer', 'regional_manager', 'hq_logistics', 'dg', 'sysadmin'].includes(role);
    case 'standard':
      return ['regional_manager', 'hq_logistics', 'dg', 'sysadmin'].includes(role);
    case 'large':
      return ['hq_logistics', 'dg', 'sysadmin'].includes(role);
    case 'strategic':
      return ['dg', 'sysadmin'].includes(role);
    default:
      return false;
  }
}

export function canManageUsers(role: UserRole): boolean {
  return ['dg', 'sysadmin'].includes(role);
}

export function canViewAuditLog(role: UserRole): boolean {
  return ['dg', 'auditor', 'sysadmin'].includes(role);
}

export function canConfigureThresholds(role: UserRole): boolean {
  return ['dg', 'hq_logistics', 'hq_procurement', 'regional_manager', 'sysadmin'].includes(role);
}
