export type UserRole =
  | 'sysadmin'
  | 'dg'
  | 'hq_admin'
  | 'hq_logistics'
  | 'hq_procurement'
  | 'regional_manager'
  | 'district_officer'
  | 'field_officer'
  | 'auditor'
  | 'readonly';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Region {
  id: string;
  code: string;
  name: string;
  capital: string;
  risk_profile: Record<string, number>;
  created_at: string;
}

export interface District {
  id: string;
  region_id: string;
  name: string;
  capital: string;
  population: number | null;
  vulnerability_index: number | null;
  created_at: string;
}

export interface Warehouse {
  id: string;
  district_id: string | null;
  code: string;
  name: string;
  type: 'hq' | 'regional' | 'district';
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  manager_id: string | null;
  capacity_m3: number | null;
  status: 'operational' | 'limited' | 'closed';
  phone: string | null;
  email: string | null;
  created_at: string;
  district?: District;
  region?: Region;
}

export interface SkuCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  default_unit: string;
  default_shelf_life_days: number | null;
}

export interface Sku {
  id: string;
  sku_code: string;
  name: string;
  category_id: string;
  description: string | null;
  unit_of_measure: string;
  weight_kg: number | null;
  volume_m3: number | null;
  shelf_life_days: number | null;
  hazard_class: string | null;
  image_url: string | null;
  is_active: boolean;
  category?: SkuCategory;
}

export interface Inventory {
  id: string;
  warehouse_id: string;
  sku_id: string;
  batch_lot: string;
  expiry_date: string | null;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  storage_location: string | null;
  last_counted_at: string | null;
  sku?: Sku;
  warehouse?: Warehouse;
}

export type TransferStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'ready_for_dispatch'
  | 'in_transit'
  | 'received'
  | 'discrepancy'
  | 'rejected'
  | 'cancelled'
  | 'overdue';

export type TransferPriority = 'routine' | 'urgent' | 'emergency';

export type TransferScale = 'routine' | 'standard' | 'large' | 'strategic';

export type ApprovalAction = 'pending' | 'approved' | 'rejected' | 'escalated' | 'returned';

export type DiscrepancyStatus = 'none' | 'open' | 'resolved';

export interface TransferApprovalStep {
  id: string;
  transfer_id: string;
  step_number: number;
  required_level: number;
  action: ApprovalAction;
  actor_id: string | null;
  actor_role: UserRole | null;
  reason: string | null;
  sla_due_at: string | null;
  created_at: string;
  resolved_at: string | null;
  actor?: Profile;
}

export interface TransferOrder {
  id: string;
  transfer_number: string;
  source_warehouse_id: string;
  destination_warehouse_id: string;
  created_by: string;
  created_at: string;
  status: TransferStatus;
  priority: TransferPriority;
  scale: TransferScale;
  approved_by: string | null;
  approved_at: string | null;
  required_level: number | null;
  sla_due_at: string | null;
  escalation_count: number;
  submitted_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  discrepancy_status: DiscrepancyStatus;
  discrepancy_resolved_by: string | null;
  discrepancy_resolved_at: string | null;
  discrepancy_resolution_note: string | null;
  approval_steps?: TransferApprovalStep[];
  vehicle_registration: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  dispatcher_id: string | null;
  dispatched_at: string | null;
  received_by: string | null;
  received_at: string | null;
  expected_delivery_at: string | null;
  actual_delivery_at: string | null;
  digital_signature: string | null;
  notes: string | null;
  discrepancy_reason: string | null;
  source_warehouse?: Warehouse;
  destination_warehouse?: Warehouse;
  creator?: Profile;
  approver?: Profile;
  receiver?: Profile;
  items?: TransferItem[];
}

export interface TransferItem {
  id: string;
  transfer_id: string;
  sku_id: string;
  batch_lot: string;
  quantity_dispatched: number;
  quantity_received: number | null;
  condition: 'good' | 'damaged' | 'expired' | 'missing';
  notes: string | null;
  sku?: Sku;
}

export type NotificationType =
  | 'critical_stock'
  | 'amber_stock'
  | 'overdue_shipment'
  | 'discrepancy'
  | 'approval_required'
  | 'approval_escalation'
  | 'transfer_dispatched'
  | 'transfer_received'
  | 'expiry_warning'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  sent_at: string;
  read_at: string | null;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  user_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  user?: Profile;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: UserRole[];
}
