import { UserRole, TransferScale } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  sysadmin: 'System Administrator',
  dg: 'Director-General',
  hq_admin: 'HQ Administrator',
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
  hq_admin: 6,
  auditor: 7,
  dg: 8,
  sysadmin: 9,
};

export type ScopeLevel = 'national' | 'regional' | 'warehouse';

/** Roles with a nationwide oversight view (all regions, districts and warehouses). */
export function canSeeNational(role: UserRole): boolean {
  return ['dg', 'hq_admin', 'hq_logistics', 'hq_procurement', 'auditor', 'sysadmin'].includes(role);
}

/** The oversight breadth a role rolls up to. */
export function scopeLevel(role: UserRole): ScopeLevel {
  if (canSeeNational(role)) return 'national';
  if (role === 'regional_manager') return 'regional';
  return 'warehouse';
}

export function hasRole(role: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
}

export function canViewNationalDashboard(role: UserRole): boolean {
  return canSeeNational(role);
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
  return ['dg', 'sysadmin', 'hq_admin'].includes(role);
}

const ALL_ROLES: UserRole[] = [
  'hq_admin',
  'hq_logistics',
  'hq_procurement',
  'regional_manager',
  'district_officer',
  'field_officer',
  'auditor',
  'readonly',
  'dg',
  'sysadmin',
];

/** Roles a given admin is allowed to assign when creating users. */
export function assignableRoles(callerRole: UserRole): UserRole[] {
  if (callerRole === 'sysadmin') return ALL_ROLES;
  if (callerRole === 'dg') return ALL_ROLES.filter((r) => r !== 'sysadmin');
  if (callerRole === 'hq_admin') return ALL_ROLES.filter((r) => r !== 'sysadmin' && r !== 'dg');
  return [];
}

/** Whether a role must be tied to a specific warehouse it operates. */
export function roleRequiresWarehouse(role: UserRole): boolean {
  return ['hq_logistics', 'hq_procurement', 'regional_manager', 'district_officer', 'field_officer'].includes(
    role
  );
}

export function canViewAuditLog(role: UserRole): boolean {
  return ['dg', 'auditor', 'sysadmin'].includes(role);
}

export function canConfigureThresholds(role: UserRole): boolean {
  return ['dg', 'hq_logistics', 'hq_procurement', 'regional_manager', 'sysadmin'].includes(role);
}

/** Roles that may approve, lowest to highest authority. sysadmin clears any gate separately. */
export const APPROVER_LADDER: UserRole[] = [
  'district_officer',
  'regional_manager',
  'hq_logistics',
  'dg',
];

const SCALE_REQUIRED_ROLE: Record<TransferScale, UserRole> = {
  routine: 'district_officer',
  standard: 'regional_manager',
  large: 'hq_logistics',
  strategic: 'dg',
};

/** Starting authority level for a transfer of the given scale. */
export function requiredLevelForScale(scale: TransferScale): number {
  return ROLE_HIERARCHY[SCALE_REQUIRED_ROLE[scale]];
}

/** Next ladder rung strictly above `level`, capped at dg(8). */
export function nextRung(level: number): number {
  const ladderLevels = APPROVER_LADDER.map((r) => ROLE_HIERARCHY[r]);
  return ladderLevels.find((l) => l > level) ?? ROLE_HIERARCHY.dg;
}

/** Whether the role is an approver tier (ladder member or sysadmin). */
export function isApproverRole(role: UserRole): boolean {
  return role === 'sysadmin' || APPROVER_LADDER.includes(role);
}

/** Whether the role may clear a gate currently set to `requiredLevel`. */
export function canApproveAtLevel(role: UserRole, requiredLevel: number): boolean {
  if (role === 'sysadmin') return true;
  return isApproverRole(role) && ROLE_HIERARCHY[role] >= requiredLevel;
}

export const canRejectAtLevel = canApproveAtLevel;
export const canEscalateAtLevel = canApproveAtLevel;

/** The approver tier (ladder role) that a given authority level maps to. */
export function approverRoleForLevel(level: number): UserRole {
  return APPROVER_LADDER.find((r) => ROLE_HIERARCHY[r] >= level) ?? 'dg';
}

/** Roles that may confirm receipt (DB also checks destination-warehouse assignment). */
export const RECEIVER_ROLES: UserRole[] = [
  'district_officer',
  'field_officer',
  'hq_logistics',
  'dg',
  'sysadmin',
];

export function canReceiveTransfer(role: UserRole): boolean {
  return RECEIVER_ROLES.includes(role);
}

export function canResolveDiscrepancy(role: UserRole): boolean {
  return ['district_officer', 'field_officer', 'hq_logistics', 'dg', 'sysadmin'].includes(role);
}
