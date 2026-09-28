import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  getDocFromServer,
  onSnapshot, 
  writeBatch,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  Customer, 
  ProductLiquid, 
  VisitSchedule, 
  DailySalesReport, 
  AppUser, 
  RolePermission, 
  CompanyBranding,
  DailyTargetConfig 
} from './types';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: The app will break without passing firebaseConfig.firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Error Handling Specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test Connection
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline or initializing.");
    }
    return false;
  }
}

// ==========================================
// REAL-TIME SUBSCRIBERS (onSnapshot)
// ==========================================

export function subscribeCustomers(
  onUpdate: (customers: Customer[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'customers');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Customer[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Customer);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'customers');
      onError?.(error);
    }
  );
}

export function subscribeProducts(
  onUpdate: (products: ProductLiquid[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'products');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ProductLiquid[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as ProductLiquid);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
      onError?.(error);
    }
  );
}

export function subscribeVisits(
  onUpdate: (visits: VisitSchedule[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'visits');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: VisitSchedule[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as VisitSchedule);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'visits');
      onError?.(error);
    }
  );
}

export function subscribeSalesReports(
  onUpdate: (reports: DailySalesReport[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'salesReports');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: DailySalesReport[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DailySalesReport);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'salesReports');
      onError?.(error);
    }
  );
}

export function subscribeUsers(
  onUpdate: (users: AppUser[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'users');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: AppUser[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as AppUser);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
      onError?.(error);
    }
  );
}

export function subscribeRolePermissions(
  onUpdate: (roles: RolePermission[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'rolePermissions');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: RolePermission[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as RolePermission);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'rolePermissions');
      onError?.(error);
    }
  );
}

export function subscribeBranding(
  onUpdate: (branding: CompanyBranding) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const docRef = doc(db, 'settings', 'branding');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as CompanyBranding);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/branding');
      onError?.(error);
    }
  );
}

export function subscribeDailyTarget(
  onUpdate: (target: DailyTargetConfig) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const docRef = doc(db, 'settings', 'dailyTarget');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as DailyTargetConfig);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/dailyTarget');
      onError?.(error);
    }
  );
}

// ==========================================
// CLOUD MUTATION HELPERS (WRITES / DELETES)
// ==========================================

export async function cloudSaveCustomer(customer: Customer) {
  try {
    const docRef = doc(db, 'customers', customer.id);
    await setDoc(docRef, customer, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `customers/${customer.id}`);
  }
}

export async function cloudDeleteCustomer(customerId: string) {
  try {
    const docRef = doc(db, 'customers', customerId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `customers/${customerId}`);
  }
}

export async function cloudBatchSaveCustomers(customers: Customer[]) {
  try {
    const batch = writeBatch(db);
    customers.forEach((c) => {
      const docRef = doc(db, 'customers', c.id);
      batch.set(docRef, c, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'customers (batch)');
  }
}

export async function cloudSaveProduct(product: ProductLiquid) {
  try {
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, product, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
  }
}

export async function cloudBatchSaveProducts(products: ProductLiquid[]) {
  try {
    const batch = writeBatch(db);
    products.forEach((p) => {
      const docRef = doc(db, 'products', p.id);
      batch.set(docRef, p, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products (batch)');
  }
}

export async function cloudSaveVisit(visit: VisitSchedule) {
  try {
    const docRef = doc(db, 'visits', visit.id);
    await setDoc(docRef, visit, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `visits/${visit.id}`);
  }
}

export async function cloudDeleteVisit(visitId: string) {
  try {
    const docRef = doc(db, 'visits', visitId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `visits/${visitId}`);
  }
}

export async function cloudSaveSalesReport(report: DailySalesReport) {
  try {
    const docRef = doc(db, 'salesReports', report.id);
    await setDoc(docRef, report, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `salesReports/${report.id}`);
  }
}

export async function cloudSaveUser(user: AppUser) {
  try {
    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, user, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
  }
}

export async function cloudDeleteUser(userId: string) {
  try {
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
  }
}

export async function cloudSaveRolePermissions(roles: RolePermission[]) {
  try {
    const batch = writeBatch(db);
    roles.forEach((r) => {
      const safeId = r.role.replace(/[^a-zA-Z0-9]/g, '_');
      const docRef = doc(db, 'rolePermissions', safeId);
      batch.set(docRef, r, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'rolePermissions (batch)');
  }
}

export async function cloudSaveBranding(branding: CompanyBranding) {
  try {
    const docRef = doc(db, 'settings', 'branding');
    await setDoc(docRef, branding, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/branding');
  }
}

export async function cloudSaveDailyTarget(target: DailyTargetConfig) {
  try {
    const docRef = doc(db, 'settings', 'dailyTarget');
    await setDoc(docRef, target, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/dailyTarget');
  }
}

// Initial Data Seeding Check
export async function seedInitialDataIfEmpty(initial: {
  customers: Customer[];
  products: ProductLiquid[];
  visits: VisitSchedule[];
  salesReports: DailySalesReport[];
  users: AppUser[];
  rolePermissions: RolePermission[];
  branding: CompanyBranding;
  dailyTarget: DailyTargetConfig;
}) {
  try {
    const custSnap = await getDocs(collection(db, 'customers'));
    if (custSnap.empty) {
      console.log('Seeding initial customers to cloud...');
      await cloudBatchSaveCustomers(initial.customers);
    }

    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.empty) {
      console.log('Seeding initial products to cloud...');
      await cloudBatchSaveProducts(initial.products);
    }

    const visitSnap = await getDocs(collection(db, 'visits'));
    if (visitSnap.empty) {
      console.log('Seeding initial visits to cloud...');
      const batch = writeBatch(db);
      initial.visits.forEach((v) => {
        batch.set(doc(db, 'visits', v.id), v, { merge: true });
      });
      await batch.commit();
    }

    const salesSnap = await getDocs(collection(db, 'salesReports'));
    if (salesSnap.empty) {
      console.log('Seeding initial sales reports to cloud...');
      const batch = writeBatch(db);
      initial.salesReports.forEach((s) => {
        batch.set(doc(db, 'salesReports', s.id), s, { merge: true });
      });
      await batch.commit();
    }

    const userSnap = await getDocs(collection(db, 'users'));
    if (userSnap.empty) {
      console.log('Seeding initial users to cloud...');
      const batch = writeBatch(db);
      initial.users.forEach((u) => {
        batch.set(doc(db, 'users', u.id), u, { merge: true });
      });
      await batch.commit();
    }

    const roleSnap = await getDocs(collection(db, 'rolePermissions'));
    if (roleSnap.empty) {
      console.log('Seeding initial roles to cloud...');
      await cloudSaveRolePermissions(initial.rolePermissions);
    }

    const brandDoc = await getDoc(doc(db, 'settings', 'branding'));
    if (!brandDoc.exists()) {
      await cloudSaveBranding(initial.branding);
    }

    const targetDoc = await getDoc(doc(db, 'settings', 'dailyTarget'));
    if (!targetDoc.exists()) {
      await cloudSaveDailyTarget(initial.dailyTarget);
    }
  } catch (error) {
    console.warn('Initial seeding encountered an error, falling back to local:', error);
  }
}
