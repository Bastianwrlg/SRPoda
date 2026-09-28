export type CustomerTier = 'Distributor' | 'Wholesaler' | 'Retail Premium' | 'Retail Regular';

export type CustomerStatus = 'Aktif' | 'Perlu Kunjungan' | 'Menunggu Restock' | 'Non-Aktif';

export interface Customer {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  area: string;
  tier: CustomerTier;
  status: CustomerStatus;
  creditLimit: number;
  currentDebt: number;
  totalOrdersCount: number;
  totalRevenue: number;
  lastVisitDate: string;
  notes: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export type LiquidCategory = 'Saltnic' | 'Freebase' | 'Pods Friendly';

export interface ProductLiquid {
  id: string;
  name: string;
  variant: string;
  category: LiquidCategory;
  nicotine: string;
  volume: string;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  badgeColor: string;
  description: string;
}

export type VisitPurpose = 
  | 'Restock Order' 
  | 'Pengenalan Varian Baru' 
  | 'Penagihan Piutang' 
  | 'Display & Merchandising' 
  | 'Follow-up Rutin';

export type VisitStatus = 'Terjadwal' | 'Sedang Berlangsung' | 'Selesai' | 'Dibatalkan';

export type VisitPriority = 'Tinggi' | 'Sedang' | 'Rendah';

export interface VisitChecklist {
  stockCheck: boolean;
  testerProvided: boolean;
  promoMaterialInstalled: boolean;
  paymentFollowUp: boolean;
}

export interface VisitSchedule {
  id: string;
  customerId: string;
  customerName: string;
  customerArea: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  purpose: VisitPurpose;
  status: VisitStatus;
  priority: VisitPriority;
  notes?: string;
  checkInTime?: string;
  checkOutTime?: string;
  durationMinutes?: number;
  salesResult?: number;
  checklist?: VisitChecklist;
  photoUrl?: string;
  locationVerified?: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  category: LiquidCategory;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type PaymentMethod = 'Transfer Bank' | 'Tunai' | 'Tempo 14 Hari' | 'Tempo 30 Hari';

export type PaymentStatus = 'Lunas' | 'Pending' | 'Tempo';

export interface DailySalesReport {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  time: string;
  customerId: string;
  customerName: string;
  customerArea: string;
  salesRepName: string;
  items: OrderItem[];
  totalBottles: number;
  totalRevenue: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  visitId?: string;
}

export interface DailyTargetConfig {
  date: string;
  targetRevenue: number;
  targetBottles: number;
  targetVisits: number;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface RealtimeSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncTime: string;
  logs: SyncLog[];
}

export type AppTab = 'dashboard' | 'customers' | 'visits' | 'sales' | 'products' | 'roles';

export type UserRole = 'Super Admin' | 'Sales Manager' | 'Sales Representative' | 'Staff Keuangan';

export interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  salesRepCode?: string;
  area: string;
  phone: string;
  status: 'Aktif' | 'Nonaktif';
  avatarInitials: string;
  lastLogin?: string;
  createdAt: string;
}

export interface RolePermission {
  role: UserRole;
  title: string;
  description: string;
  badgeColor: string;
  allowedTabs: AppTab[];
  canAddUser: boolean;
  canEditRoleAccess: boolean;
  canDeleteUser: boolean;
}

export interface CompanyBranding {
  companyName: string;
  brandSubtext: string;
  logoUrl: string | null;
  logoShape: 'rounded' | 'square' | 'circle' | 'original';
  sessionToken: string;
  encryptionAlgorithm: string;
  sessionHash: string;
  lastUpdated: string;
  updatedBy: string;
  isVerifiedEncrypted: boolean;
}
