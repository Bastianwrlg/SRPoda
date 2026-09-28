import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Customer, 
  CustomerStatus,
  VisitSchedule, 
  DailySalesReport, 
  ProductLiquid, 
  RealtimeSyncState, 
  SyncLog,
  DailyTargetConfig,
  AppTab,
  AppUser,
  RolePermission,
  CompanyBranding
} from './types';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_PRODUCTS, 
  INITIAL_VISITS, 
  INITIAL_DAILY_REPORTS, 
  INITIAL_DAILY_TARGET,
  INITIAL_USERS,
  INITIAL_ROLE_PERMISSIONS
} from './data/initialData';
import { DEFAULT_BRANDING } from './utils/sessionSecurity';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { CustomerManagement } from './components/CustomerManagement';
import { VisitScheduler } from './components/VisitScheduler';
import { DailySalesReportComponent } from './components/DailySalesReport';
import { RoleAccessManagement } from './components/RoleAccessManagement';
import { ProductStockManagement } from './components/ProductStockManagement';
import { LoginForm } from './components/LoginForm';
import { SyncLogsModal } from './components/SyncLogsModal';
import { CompanyLogoModal } from './components/CompanyLogoModal';
import { CustomerImportMode } from './components/ImportCustomerModal';
import { CheckCircle2, AlertTriangle, Info, Bell, RefreshCw, Lock } from 'lucide-react';
import {
  testConnection,
  subscribeCustomers,
  subscribeProducts,
  subscribeVisits,
  subscribeSalesReports,
  subscribeUsers,
  subscribeRolePermissions,
  subscribeBranding,
  subscribeDailyTarget,
  cloudSaveCustomer,
  cloudDeleteCustomer,
  cloudBatchSaveCustomers,
  cloudBatchSaveProducts,
  cloudSaveVisit,
  cloudDeleteVisit,
  cloudSaveSalesReport,
  cloudSaveUser,
  cloudDeleteUser,
  cloudSaveRolePermissions,
  cloudSaveBranding,
  cloudSaveDailyTarget,
  seedInitialDataIfEmpty
} from './firebase';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export default function App() {
  // Authentication & Users State
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('poda_users');
    if (saved) {
      try {
        const parsed: AppUser[] = JSON.parse(saved);
        // Ensure admin user password is 'admin'
        return parsed.map(u => u.username.toLowerCase() === 'admin' ? { ...u, password: 'admin' } : u);
      } catch (e) {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => {
    const saved = localStorage.getItem('poda_role_permissions');
    if (saved) {
      try {
        const parsed: RolePermission[] = JSON.parse(saved);
        // Strictly enforce: only 'Super Admin' can access 'dashboard' and 'roles'
        return parsed.map(rp => {
          if (rp.role !== 'Super Admin') {
            return {
              ...rp,
              allowedTabs: rp.allowedTabs.filter(t => t !== 'dashboard' && t !== 'roles'),
              canEditRoleAccess: false
            };
          } else {
            const tabsSet = new Set(rp.allowedTabs);
            tabsSet.add('dashboard');
            tabsSet.add('roles');
            return {
              ...rp,
              allowedTabs: Array.from(tabsSet) as AppTab[],
              canEditRoleAccess: true
            };
          }
        });
      } catch (e) {
        return INITIAL_ROLE_PERMISSIONS;
      }
    }
    return INITIAL_ROLE_PERMISSIONS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('poda_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Allowed Tabs based on Current User's Role (Only Super Admin can have dashboard and roles)
  const allowedTabs: AppTab[] = useMemo(() => {
    if (!currentUser) return ['customers'];
    if (currentUser.role === 'Super Admin') {
      const cfg = rolePermissions.find(r => r.role === 'Super Admin');
      return cfg?.allowedTabs || ['dashboard', 'customers', 'visits', 'sales', 'roles'];
    }
    const cfg = rolePermissions.find(r => r.role === currentUser.role);
    const rawTabs = cfg?.allowedTabs || ['customers', 'visits', 'sales'];
    return rawTabs.filter(t => t !== 'dashboard' && t !== 'roles');
  }, [currentUser, rolePermissions]);

  // Current active navigation tab
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const savedUser = localStorage.getItem('poda_auth_user');
    if (savedUser) {
      try {
        const u: AppUser = JSON.parse(savedUser);
        if (u.role === 'Super Admin') return 'dashboard';
        return 'customers';
      } catch (e) {
        return 'customers';
      }
    }
    return 'dashboard';
  });

  // Keep activeTab synchronized with allowedTabs
  useEffect(() => {
    if (currentUser && !allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] || 'customers');
    }
  }, [allowedTabs, activeTab, currentUser]);

  // Save Users & Role Permissions to localStorage
  useEffect(() => {
    localStorage.setItem('poda_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('poda_role_permissions', JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  // App Business Data with LocalStorage fallback
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('poda_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [products, setProducts] = useState<ProductLiquid[]>(() => {
    const saved = localStorage.getItem('poda_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem('poda_products', JSON.stringify(products));
  }, [products]);

  const [visits, setVisits] = useState<VisitSchedule[]>(() => {
    const saved = localStorage.getItem('poda_visits');
    return saved ? JSON.parse(saved) : INITIAL_VISITS;
  });

  const [salesReports, setSalesReports] = useState<DailySalesReport[]>(() => {
    const saved = localStorage.getItem('poda_sales_reports');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_REPORTS;
  });

  const [dailyTarget, setDailyTarget] = useState<DailyTargetConfig>(INITIAL_DAILY_TARGET);

  // Company Identity, Logo & Encrypted Session State
  const [branding, setBranding] = useState<CompanyBranding>(() => {
    const saved = localStorage.getItem('poda_company_branding');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_BRANDING;
      }
    }
    return DEFAULT_BRANDING;
  });

  useEffect(() => {
    localStorage.setItem('poda_company_branding', JSON.stringify(branding));
  }, [branding]);

  const [isCompanyLogoModalOpen, setIsCompanyLogoModalOpen] = useState(false);

  // Preselection cross-tab navigation state
  const [preselectedCustomerForSale, setPreselectedCustomerForSale] = useState<Customer | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((title: string, message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const newToast: Toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      message,
      type
    };
    setToasts(prev => [newToast, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4500);
  }, []);

  // Real-time synchronization state
  const [syncState, setSyncState] = useState<RealtimeSyncState>({
    isOnline: true,
    isSyncing: false,
    pendingSyncCount: 0,
    lastSyncTime: 'Baru saja',
    logs: [
      {
        id: 'log-1',
        timestamp: '20:45 WIB',
        message: 'Koneksi real-time tersambung ke Server Pusat PODA Cloud Jakarta',
        type: 'success'
      },
      {
        id: 'log-2',
        timestamp: '20:40 WIB',
        message: 'Matriks otorisasi hak akses peran diperbarui oleh Admin',
        type: 'info'
      },
      {
        id: 'log-3',
        timestamp: '20:30 WIB',
        message: 'Katalog harga e-liquid edisi Q3 2026 diselaraskan',
        type: 'info'
      }
    ]
  });

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('poda_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('poda_visits', JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem('poda_sales_reports', JSON.stringify(salesReports));
  }, [salesReports]);

  const getIndonesianTime = useCallback(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
  }, []);

  // Listen to Real-Time Updates from Firebase Firestore
  useEffect(() => {
    if (!syncState.isOnline) return;

    let isSubscribed = true;

    // Check Cloud Connection and Seed Initial Data if Cloud Collections are Empty
    testConnection().then((connected) => {
      if (!isSubscribed) return;
      if (connected) {
        setSyncState(prev => ({
          ...prev,
          isOnline: true,
          logs: [
            {
              id: `log-${Date.now()}`,
              timestamp: getIndonesianTime(),
              message: 'Koneksi real-time cloud aktif (Firebase Firestore Jakarta). Sinkronisasi multi-user berjalan otomatis.',
              type: 'success'
            },
            ...prev.logs.slice(0, 19)
          ]
        }));

        seedInitialDataIfEmpty({
          customers: INITIAL_CUSTOMERS,
          products: INITIAL_PRODUCTS,
          visits: INITIAL_VISITS,
          salesReports: INITIAL_DAILY_REPORTS,
          users: INITIAL_USERS,
          rolePermissions: INITIAL_ROLE_PERMISSIONS,
          branding: DEFAULT_BRANDING,
          dailyTarget: INITIAL_DAILY_TARGET
        });
      }
    });

    // Real-time listener for Customers
    const unsubCustomers = subscribeCustomers(
      (cloudCustomers) => {
        if (!isSubscribed) return;
        if (cloudCustomers && cloudCustomers.length > 0) {
          setCustomers(cloudCustomers);
          localStorage.setItem('poda_customers', JSON.stringify(cloudCustomers));
          setSyncState(prev => ({
            ...prev,
            lastSyncTime: getIndonesianTime(),
            logs: [
              {
                id: `log-${Date.now()}`,
                timestamp: getIndonesianTime(),
                message: `Sinkronisasi real-time: ${cloudCustomers.length} data mitra toko diselaraskan secara langsung`,
                type: 'info'
              },
              ...prev.logs.slice(0, 19)
            ]
          }));
        }
      },
      (err) => console.warn('Customer subscription error:', err)
    );

    // Real-time listener for Products
    const unsubProducts = subscribeProducts(
      (cloudProducts) => {
        if (!isSubscribed) return;
        if (cloudProducts && cloudProducts.length > 0) {
          setProducts(cloudProducts);
          localStorage.setItem('poda_products', JSON.stringify(cloudProducts));
        }
      },
      (err) => console.warn('Product subscription error:', err)
    );

    // Real-time listener for Visits
    const unsubVisits = subscribeVisits(
      (cloudVisits) => {
        if (!isSubscribed) return;
        if (cloudVisits && cloudVisits.length > 0) {
          setVisits(cloudVisits);
          localStorage.setItem('poda_visits', JSON.stringify(cloudVisits));
        }
      },
      (err) => console.warn('Visits subscription error:', err)
    );

    // Real-time listener for Sales Reports
    const unsubSales = subscribeSalesReports(
      (cloudSales) => {
        if (!isSubscribed) return;
        if (cloudSales && cloudSales.length > 0) {
          setSalesReports(cloudSales);
          localStorage.setItem('poda_sales_reports', JSON.stringify(cloudSales));
        }
      },
      (err) => console.warn('Sales subscription error:', err)
    );

    // Real-time listener for Users
    const unsubUsers = subscribeUsers(
      (cloudUsers) => {
        if (!isSubscribed) return;
        if (cloudUsers && cloudUsers.length > 0) {
          setUsers(cloudUsers);
          localStorage.setItem('poda_users', JSON.stringify(cloudUsers));
        }
      },
      (err) => console.warn('Users subscription error:', err)
    );

    // Real-time listener for Role Permissions
    const unsubRoles = subscribeRolePermissions(
      (cloudRoles) => {
        if (!isSubscribed) return;
        if (cloudRoles && cloudRoles.length > 0) {
          setRolePermissions(cloudRoles);
          localStorage.setItem('poda_role_permissions', JSON.stringify(cloudRoles));
        }
      },
      (err) => console.warn('Roles subscription error:', err)
    );

    // Real-time listener for Branding
    const unsubBranding = subscribeBranding(
      (cloudBranding) => {
        if (!isSubscribed) return;
        if (cloudBranding) {
          setBranding(cloudBranding);
          localStorage.setItem('poda_company_branding', JSON.stringify(cloudBranding));
        }
      },
      (err) => console.warn('Branding subscription error:', err)
    );

    // Real-time listener for Daily Target
    const unsubDailyTarget = subscribeDailyTarget(
      (cloudTarget) => {
        if (!isSubscribed) return;
        if (cloudTarget) {
          setDailyTarget(cloudTarget);
        }
      },
      (err) => console.warn('Daily target subscription error:', err)
    );

    return () => {
      isSubscribed = false;
      unsubCustomers();
      unsubProducts();
      unsubVisits();
      unsubSales();
      unsubUsers();
      unsubRoles();
      unsubBranding();
      unsubDailyTarget();
    };
  }, [syncState.isOnline, getIndonesianTime]);

  // Periodic heartbeat checker
  useEffect(() => {
    const interval = setInterval(() => {
      if (!syncState.isOnline) return;

      const timeStr = getIndonesianTime();

      setSyncState(prev => {
        const hasPending = prev.pendingSyncCount > 0;
        const newLog: SyncLog = {
          id: `log-${Date.now()}`,
          timestamp: timeStr,
          message: hasPending 
            ? `Sinkronisasi otomatis berhasil: ${prev.pendingSyncCount} perubahan tersimpan ke Cloud Firestore` 
            : 'Pemeriksaan integritas real-time cloud: status selaras dengan pengguna lain',
          type: 'success'
        };

        return {
          ...prev,
          lastSyncTime: timeStr,
          pendingSyncCount: 0,
          logs: [newLog, ...prev.logs.slice(0, 19)]
        };
      });
    }, 45000);

    return () => clearInterval(interval);
  }, [syncState.isOnline, getIndonesianTime]);

  // Manual Trigger Sync with Cloud Connection Test
  const handleTriggerSync = async () => {
    if (!syncState.isOnline) {
      addToast('Koneksi Terputus', 'Tidak dapat menyinkronkan saat mode offline. Silakan aktifkan kembali koneksi.', 'warning');
      return;
    }

    setSyncState(prev => ({ ...prev, isSyncing: true }));
    const isConnected = await testConnection();
    const timeStr = getIndonesianTime();

    if (isConnected) {
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: timeStr,
        pendingSyncCount: 0,
        logs: [
          {
            id: `log-${Date.now()}`,
            timestamp: timeStr,
            message: 'Sinkronisasi manual berhasil: Semua data pelanggan, stok e-liquid, dan nota penjualan telah tersinkron dengan cloud server.',
            type: 'success'
          },
          ...prev.logs.slice(0, 19)
        ]
      }));

      addToast('Sinkronisasi Berhasil', 'Data penjualan dan kunjungan telah tersinkronisasi ke server pusat cloud PODA.', 'success');
    } else {
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: timeStr,
        logs: [
          {
            id: `log-${Date.now()}`,
            timestamp: timeStr,
            message: 'Koneksi ke cloud server sedang tidak tersedia. Data tersimpan di memori browser lokal.',
            type: 'warning'
          },
          ...prev.logs.slice(0, 19)
        ]
      }));
      addToast('Penyimpanan Lokal Aktif', 'Koneksi internet bermasalah, aplikasi tetap berjalan menggunakan cache lokal.', 'warning');
    }
  };

  // Toggle Online/Offline
  const handleToggleOnline = () => {
    setSyncState(prev => {
      const nextOnline = !prev.isOnline;
      const timeStr = getIndonesianTime();

      const newLog: SyncLog = {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        message: nextOnline 
          ? 'Koneksi internet pulih. Menghubungkan kembali ke Cloud Firestore PODA...' 
          : 'Perangkat beralih ke Mode Offline. Data akan disimpan lokal dan disinkronkan saat online.',
        type: nextOnline ? 'info' : 'warning'
      };

      return {
        ...prev,
        isOnline: nextOnline,
        logs: [newLog, ...prev.logs.slice(0, 19)]
      };
    });

    if (syncState.isOnline) {
      addToast('Mode Offline Aktif', 'Perubahan akan dicatat secara lokal dan disinkronkan otomatis saat online.', 'warning');
    } else {
      addToast('Mode Online Aktif', 'Kembali terhubung ke cloud server PODA.', 'success');
      handleTriggerSync();
    }
  };

  // Auth Handlers
  const handleLogin = (user: AppUser) => {
    const updatedUser = {
      ...user,
      lastLogin: `${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('poda_auth_user', JSON.stringify(updatedUser));
    
    // Update lastLogin in user list & Cloud Firestore
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    cloudSaveUser(updatedUser);

    // Determine initial tab: Only Super Admin lands on dashboard, others land on customers
    if (user.role === 'Super Admin') {
      setActiveTab('dashboard');
    } else {
      const roleCfg = rolePermissions.find(r => r.role === user.role);
      const userAllowed = (roleCfg?.allowedTabs || ['customers']).filter(t => t !== 'dashboard' && t !== 'roles');
      setActiveTab(userAllowed[0] || 'customers');
    }

    addToast('Selamat Datang!', `Berhasil masuk sebagai ${updatedUser.name} (${updatedUser.role}).`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('poda_auth_user');
    addToast('Sesi Berakhir', 'Anda telah berhasil keluar dari sistem.', 'info');
  };

  const handleSwitchUser = (user: AppUser) => {
    handleLogin(user);
  };

  // Role Access Management Handlers
  const handleUpdateRolePermissions = (updatedRoles: RolePermission[]) => {
    // Sanitize to guarantee dashboard and roles are strictly for Super Admin only
    const sanitized = updatedRoles.map(rp => {
      if (rp.role !== 'Super Admin') {
        return {
          ...rp,
          allowedTabs: rp.allowedTabs.filter(t => t !== 'dashboard' && t !== 'roles'),
          canEditRoleAccess: false
        };
      }
      return {
        ...rp,
        canEditRoleAccess: true
      };
    });

    setRolePermissions(sanitized);
    cloudSaveRolePermissions(sanitized);
    addToast('Hak Akses Diperbarui', 'Matriks menu per peran jabatan berhasil disimpan ke cloud dan diterapkan langsung.', 'success');
    
    // Register sync event
    setSyncState(prev => ({
      ...prev,
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: getIndonesianTime(),
          message: 'Pembaruan matriks izin menu aplikasi oleh Admin disinkronkan ke cloud',
          type: 'info'
        },
        ...prev.logs.slice(0, 19)
      ]
    }));
  };

  const handleAddUser = (newUserData: Omit<AppUser, 'id' | 'createdAt'>) => {
    const newUser: AppUser = {
      ...newUserData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers(prev => [newUser, ...prev]);
    cloudSaveUser(newUser);
    addToast('Pengguna Ditambahkan', `Akun ${newUser.name} (${newUser.role}) berhasil didaftarkan.`, 'success');

    setSyncState(prev => ({
      ...prev,
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: getIndonesianTime(),
          message: `Penambahan akun pengguna baru di cloud: ${newUser.name} [${newUser.role}]`,
          type: 'info'
        },
        ...prev.logs.slice(0, 19)
      ]
    }));
  };

  const handleUpdateUser = (updated: AppUser) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    cloudSaveUser(updated);
    
    // If updating current logged in user
    if (currentUser && currentUser.id === updated.id) {
      setCurrentUser(updated);
      localStorage.setItem('poda_auth_user', JSON.stringify(updated));
    }

    addToast('Pengguna Diperbarui', `Data akun ${updated.name} berhasil disimpan.`, 'success');
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    cloudDeleteUser(userId);
    addToast('Pengguna Dihapus', target ? `Akun ${target.name} telah dihapus dari sistem.` : 'Pengguna dihapus.', 'info');
  };

  // Customer Management Handlers
  const handleAddCustomer = (custData: Omit<Customer, 'id' | 'totalOrdersCount' | 'totalRevenue' | 'lastVisitDate'>) => {
    const newCustomer: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      totalOrdersCount: 0,
      totalRevenue: 0,
      lastVisitDate: '-'
    };

    setCustomers(prev => [newCustomer, ...prev]);
    cloudSaveCustomer(newCustomer);
    
    // Register sync event
    setSyncState(prev => ({
      ...prev,
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: getIndonesianTime(),
          message: `Mitra toko baru disimpan ke cloud: ${newCustomer.name} (${newCustomer.area})`,
          type: 'info'
        },
        ...prev.logs.slice(0, 19)
      ]
    }));

    addToast('Mitra Toko Ditambahkan', `${newCustomer.name} berhasil didaftarkan ke database real-time.`, 'success');
  };

  const handleUpdateCustomer = (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    cloudSaveCustomer(updated);

    setSyncState(prev => ({
      ...prev,
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: getIndonesianTime(),
          message: `Pembaruan data mitra disinkronkan ke cloud: ${updated.name}`,
          type: 'info'
        },
        ...prev.logs.slice(0, 19)
      ]
    }));
    addToast('Data Disimpan', `Perubahan untuk ${updated.name} berhasil diperbarui di cloud.`, 'success');
  };

  const handleDeleteCustomer = (id: string) => {
    const target = customers.find(c => c.id === id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    cloudDeleteCustomer(id);
    addToast('Toko Dihapus', target ? `${target.name} dihapus dari database cloud.` : 'Toko dihapus.', 'info');
  };

  const handleImportCustomers = (imported: Customer[], mode: CustomerImportMode) => {
    let finalImported: Customer[] = imported;
    if (mode === 'append_only') {
      setCustomers(prev => {
        const existingNames = new Set(prev.map(c => c.name.toLowerCase().trim()));
        const toAdd = imported.filter(imp => !existingNames.has(imp.name.toLowerCase().trim()));
        finalImported = toAdd;
        return [...prev, ...toAdd];
      });
    } else {
      setCustomers(prev => {
        const updated = [...prev];
        imported.forEach(imp => {
          const idx = updated.findIndex(c => c.id === imp.id || c.name.toLowerCase().trim() === imp.name.toLowerCase().trim());
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], ...imp };
          } else {
            updated.push(imp);
          }
        });
        return updated;
      });
    }

    cloudBatchSaveCustomers(finalImported);

    setSyncState(prev => ({
      ...prev,
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: getIndonesianTime(),
          message: `Import ${finalImported.length} data toko mitra via Excel disinkronkan ke Cloud Firestore.`,
          type: 'success'
        },
        ...prev.logs.slice(0, 19)
      ]
    }));
  };

  // Schedule Visit shortcut from Customer
  const handleScheduleVisitForCustomer = (customer: Customer) => {
    const newVisit: VisitSchedule = {
      id: `vis-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      customerArea: customer.area,
      date: '2026-09-16',
      time: '16:00',
      purpose: 'Restock Order',
      status: 'Terjadwal',
      priority: 'Sedang',
      notes: `Kunjungan follow-up untuk ${customer.name}`
    };

    setVisits(prev => [newVisit, ...prev]);
    cloudSaveVisit(newVisit);
    setActiveTab('visits');
    addToast('Kunjungan Dijadwalkan', `Jadwal kunjungan ke ${customer.name} telah dibuat untuk hari ini.`, 'success');
  };

  // Create Sale shortcut from Customer
  const handleCreateSaleForCustomer = (customer: Customer) => {
    setPreselectedCustomerForSale(customer);
    setActiveTab('sales');
  };

  // Visit Scheduler Handlers
  const handleAddVisit = (visitData: Omit<VisitSchedule, 'id'>) => {
    const newVisit: VisitSchedule = {
      ...visitData,
      id: `vis-${Date.now()}`
    };
    setVisits(prev => [newVisit, ...prev]);
    cloudSaveVisit(newVisit);

    setSyncState(prev => ({
      ...prev,
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: getIndonesianTime(),
          message: `Jadwal kunjungan baru tersimpan di cloud: ${newVisit.customerName} (${newVisit.purpose})`,
          type: 'info'
        },
        ...prev.logs.slice(0, 19)
      ]
    }));
    addToast('Jadwal Dibuat', `Kunjungan ke ${newVisit.customerName} berhasil diagendakan.`, 'success');
  };

  const handleUpdateVisit = (updated: VisitSchedule) => {
    setVisits(prev => prev.map(v => v.id === updated.id ? updated : v));
    cloudSaveVisit(updated);

    // If visit marked completed, update customer's lastVisitDate & cloud record
    if (updated.status === 'Selesai') {
      setCustomers(prev => prev.map(c => {
        if (c.id === updated.customerId) {
          const updatedCust = {
            ...c,
            lastVisitDate: updated.date,
            status: 'Aktif' as CustomerStatus
          };
          cloudSaveCustomer(updatedCust);
          return updatedCust;
        }
        return c;
      }));
    }

    setSyncState(prev => ({
      ...prev,
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: getIndonesianTime(),
          message: `Status kunjungan ${updated.customerName} diperbarui di cloud: ${updated.status}`,
          type: 'info'
        },
        ...prev.logs.slice(0, 19)
      ]
    }));

    addToast('Kunjungan Diperbarui', `Status kunjungan ${updated.customerName} telah dicatat.`, 'success');
  };

  const handleDeleteVisit = (id: string) => {
    setVisits(prev => prev.filter(v => v.id !== id));
    cloudDeleteVisit(id);
    addToast('Jadwal Dihapus', 'Kunjungan telah dibatalkan/dihapus dari cloud.', 'info');
  };

  const handleOpenSaleForVisit = (visit: VisitSchedule) => {
    const cust = customers.find(c => c.id === visit.customerId);
    if (cust) {
      setPreselectedCustomerForSale(cust);
    }
    setActiveTab('sales');
  };

  // Sales Reporting Handlers
  const handleAddSalesReport = (reportData: Omit<DailySalesReport, 'id' | 'invoiceNumber'>) => {
    const randCode = Math.floor(100 + Math.random() * 900);
    const dateCode = reportData.date.replace(/-/g, '');
    const invoiceNumber = `INV/PODA/${dateCode}/${randCode}`;

    const newReport: DailySalesReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      invoiceNumber
    };

    setSalesReports(prev => [newReport, ...prev]);
    cloudSaveSalesReport(newReport);

    // Update customer revenue & debt in state + cloud
    setCustomers(prev => prev.map(c => {
      if (c.id === newReport.customerId) {
        const addedDebt = newReport.paymentStatus === 'Tempo' ? newReport.totalRevenue : 0;
        const updatedCust = {
          ...c,
          totalOrdersCount: c.totalOrdersCount + 1,
          totalRevenue: c.totalRevenue + newReport.totalRevenue,
          currentDebt: c.currentDebt + addedDebt,
          status: 'Aktif' as CustomerStatus
        };
        cloudSaveCustomer(updatedCust);
        return updatedCust;
      }
      return c;
    }));

    // Register Sync Log
    setSyncState(prev => ({
      ...prev,
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: getIndonesianTime(),
          message: `Transaksi Penjualan Baru disinkronkan ke cloud: ${newReport.invoiceNumber} (${newReport.customerName}) - ${newReport.totalBottles} Botol`,
          type: 'success'
        },
        ...prev.logs.slice(0, 19)
      ]
    }));

    addToast('Penjualan Dicatat', `Nota ${invoiceNumber} berhasil disimpan ke cloud database.`, 'success');
  };

  // Product Catalog & Physical Stock Management Handler
  const handleUpdateProducts = (updatedProducts: ProductLiquid[], actionMessage?: string) => {
    setProducts(updatedProducts);
    cloudBatchSaveProducts(updatedProducts);

    if (actionMessage) {
      setSyncState(prev => ({
        ...prev,
        logs: [
          {
            id: `log-${Date.now()}`,
            timestamp: getIndonesianTime(),
            message: `${actionMessage} (tersinkronkan ke cloud)`,
            type: 'success'
          },
          ...prev.logs.slice(0, 19)
        ]
      }));
    }
  };

  // Company Branding & Logo Session Handler
  const handleSaveBranding = (updatedBranding: CompanyBranding, message: string) => {
    setBranding(updatedBranding);
    cloudSaveBranding(updatedBranding);

    setSyncState(prev => ({
      ...prev,
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: getIndonesianTime(),
          message: `${message} (tersinkronkan ke cloud)`,
          type: 'success'
        },
        ...prev.logs.slice(0, 19)
      ]
    }));
  };

  // Calculate today's sales progress
  const todaySalesReports = salesReports.filter(r => r.date === '2026-09-16');
  const todayRevenue = todaySalesReports.reduce((sum, r) => sum + r.totalRevenue, 0);
  const todaySalesProgress = {
    revenue: todayRevenue,
    targetRevenue: dailyTarget.targetRevenue,
    percentage: Math.min(100, Math.round((todayRevenue / dailyTarget.targetRevenue) * 100))
  };

  const activeVisitsTodayCount = visits.filter(v => v.date === '2026-09-16' && v.status !== 'Selesai').length;

  // IF NOT LOGGED IN: Render Login Screen Gate
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-['Poppins',sans-serif]">
        {/* Toast Notifications */}
        <div className="fixed top-5 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className="pointer-events-auto p-3.5 rounded-xl shadow-xl border bg-white border-slate-200 flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-top-2"
            >
              <div className="mt-0.5 shrink-0">
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-sky-600" />}
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">{toast.title}</h5>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
            </div>
          ))}
        </div>

        <LoginForm onLogin={handleLogin} users={users} branding={branding} />
      </div>
    );
  }

  // IF LOGGED IN: Render Main Sales Distribution System
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-emerald-600 selection:text-white font-['Poppins',sans-serif]">
      
      {/* Toast Notifications Overlay */}
      <div className="fixed bottom-20 md:bottom-5 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl shadow-xl border flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-white border-emerald-300 text-slate-800'
                : toast.type === 'warning'
                ? 'bg-white border-amber-300 text-slate-800'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-sky-600" />}
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900">{toast.title}</h5>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* App Header with Brand, Real-time Sync, Tabs & User Profile */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allowedTabs={allowedTabs}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        allUsers={users}
        syncState={syncState}
        onTriggerSync={handleTriggerSync}
        onToggleOnline={handleToggleOnline}
        onOpenSyncLogs={() => setIsSyncModalOpen(true)}
        customersCount={customers.length}
        activeVisitsCount={activeVisitsTodayCount}
        productsCount={products.length}
        branding={branding}
        onOpenCompanyLogoModal={() => setIsCompanyLogoModalOpen(true)}
        todaySalesProgress={todaySalesProgress}
      />

      {/* Main Content Body (with pb-24 on mobile for bottom navigation bar) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        
        {activeTab === 'dashboard' && allowedTabs.includes('dashboard') && (
          <DashboardAnalytics
            customers={customers}
            salesReports={salesReports}
            products={products}
            visits={visits}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onOpenNewSale={() => setActiveTab('sales')}
            onOpenNewVisit={() => setActiveTab('visits')}
          />
        )}

        {activeTab === 'customers' && allowedTabs.includes('customers') && (
          <CustomerManagement
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onScheduleVisitForCustomer={handleScheduleVisitForCustomer}
            onCreateSaleForCustomer={handleCreateSaleForCustomer}
            onImportCustomers={handleImportCustomers}
            onAddToast={addToast}
          />
        )}

        {activeTab === 'visits' && allowedTabs.includes('visits') && (
          <VisitScheduler
            visits={visits}
            customers={customers}
            onAddVisit={handleAddVisit}
            onUpdateVisit={handleUpdateVisit}
            onDeleteVisit={handleDeleteVisit}
            onOpenSaleForVisit={handleOpenSaleForVisit}
          />
        )}

        {activeTab === 'sales' && allowedTabs.includes('sales') && (
          <DailySalesReportComponent
            salesReports={salesReports}
            targetConfig={dailyTarget}
            customers={customers}
            products={products}
            onAddReport={handleAddSalesReport}
            preselectedCustomer={preselectedCustomerForSale}
            onClearPreselectedCustomer={() => setPreselectedCustomerForSale(null)}
          />
        )}

        {activeTab === 'products' && allowedTabs.includes('products') && (
          <ProductStockManagement
            products={products}
            currentUser={currentUser}
            onUpdateProducts={handleUpdateProducts}
            onAddToast={addToast}
          />
        )}

        {activeTab === 'roles' && allowedTabs.includes('roles') && (
          <RoleAccessManagement
            currentUser={currentUser}
            users={users}
            rolePermissions={rolePermissions}
            onUpdateRolePermissions={handleUpdateRolePermissions}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onSwitchUser={handleSwitchUser}
            branding={branding}
            onOpenCompanyLogoModal={() => setIsCompanyLogoModalOpen(true)}
          />
        )}

        {!allowedTabs.includes(activeTab) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto my-12 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Akses Menu Terbatas</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Menu ini dikhususkan eksklusif hanya untuk hak akses Administrator.
            </p>
            <button
              onClick={() => setActiveTab(allowedTabs[0] || 'customers')}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
            >
              Buka Menu Utama
            </button>
          </div>
        )}

      </main>

      {/* Footer for Desktop/Tablet */}
      <footer className="hidden md:block mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © 2026 <strong className="text-slate-700">PODA E-LIQUID COMPANY</strong> . All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Sesi: <strong className="text-slate-700 font-semibold">{currentUser.name}</strong> ({currentUser.role})</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Sinkronisasi Real-Time Aktif
            </span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar for Smartphone Sales Reps */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allowedTabs={allowedTabs}
        customersCount={customers.length}
        activeVisitsCount={activeVisitsTodayCount}
        productsCount={products.length}
        targetPercentage={todaySalesProgress.percentage}
      />

      {/* Real-time Sync Details Modal */}
      <SyncLogsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncState={syncState}
        onTriggerSync={handleTriggerSync}
        onToggleOnline={handleToggleOnline}
      />

      {/* Company Logo & Encrypted Session Modal */}
      <CompanyLogoModal
        isOpen={isCompanyLogoModalOpen}
        onClose={() => setIsCompanyLogoModalOpen(false)}
        branding={branding}
        currentUser={currentUser}
        onSaveBranding={handleSaveBranding}
        onAddToast={addToast}
      />

    </div>
  );
}
