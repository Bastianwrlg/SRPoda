import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Settings, 
  Key, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Search, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ArrowRightLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Layers,
  TrendingUp,
  FileText,
  Package
} from 'lucide-react';
import { AppUser, RolePermission, UserRole, AppTab, CompanyBranding } from '../types';

interface RoleAccessManagementProps {
  currentUser: AppUser;
  users: AppUser[];
  rolePermissions: RolePermission[];
  onUpdateRolePermissions: (updatedRoles: RolePermission[]) => void;
  onAddUser: (newUser: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onUpdateUser: (updatedUser: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser: (user: AppUser) => void;
  branding?: CompanyBranding;
  onOpenCompanyLogoModal?: () => void;
}

export const RoleAccessManagement: React.FC<RoleAccessManagementProps> = ({
  currentUser,
  users,
  rolePermissions,
  onUpdateRolePermissions,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser,
  branding,
  onOpenCompanyLogoModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'roles' | 'users'>('roles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Sales Representative');
  const [newUserArea, setNewUserArea] = useState('Jakarta Selatan');
  const [newUserPhone, setNewUserPhone] = useState('08');
  const [newUserStatus, setNewUserStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [formError, setFormError] = useState('');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Available Menus Definition
  const ALL_MENUS: { tab: AppTab; label: string; description: string; icon: React.ReactNode }[] = [
    { 
      tab: 'dashboard', 
      label: 'Dashboard Analitik', 
      description: 'Ringkasan performa omzet harian, target bulanan, dan grafik distribusi',
      icon: <TrendingUp className="w-4 h-4 text-emerald-600" />
    },
    { 
      tab: 'customers', 
      label: 'Data Pelanggan (Vape Store)', 
      description: 'Daftar toko mitra, plafon kredit tempo, lokasi maps, dan riwayat belanja',
      icon: <Users className="w-4 h-4 text-sky-600" />
    },
    { 
      tab: 'visits', 
      label: 'Jadwal & Check-in Kunjungan', 
      description: 'Agenda visit harian sales, validasi GPS radius toko, dan audit display toko',
      icon: <Calendar className="w-4 h-4 text-amber-600" />
    },
    { 
      tab: 'sales', 
      label: 'Laporan Target & Transaksi', 
      description: 'Pencatatan nota e-liquid, perhitungan kuota botol, dan cetak invoice',
      icon: <FileText className="w-4 h-4 text-indigo-600" />
    },
    { 
      tab: 'products', 
      label: 'Katalog & Stok Produk', 
      description: 'Master data produk e-liquid, penyesuaian stok gudang, dan impor data massal via CSV/Excel',
      icon: <Package className="w-4 h-4 text-teal-600" />
    },
    { 
      tab: 'roles', 
      label: 'Role Akses & Pengguna', 
      description: 'Pengaturan visibilitas menu aplikasi dan manajemen penambahan akun tim',
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />
    }
  ];

  // Toggle Tab Permission for a specific role
  const handleToggleTabPermission = (roleName: UserRole, tab: AppTab) => {
    // Strictly restrict 'dashboard' and 'roles' to Super Admin only
    if (tab === 'dashboard' || tab === 'roles') {
      return;
    }

    const updated = rolePermissions.map(rp => {
      if (rp.role === roleName) {
        const hasTab = rp.allowedTabs.includes(tab);
        const newAllowed = hasTab 
          ? rp.allowedTabs.filter(t => t !== tab) 
          : [...rp.allowedTabs, tab];
        
        // Ensure at least one tab remains
        if (newAllowed.length === 0) {
          return rp;
        }

        return {
          ...rp,
          allowedTabs: newAllowed
        };
      }
      return rp;
    });

    onUpdateRolePermissions(updated);
  };

  // Submit Add User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newUserName.trim() || !newUserUsername.trim() || !newUserEmail.trim()) {
      setFormError('Nama, username, dan email wajib diisi.');
      return;
    }

    // Check duplicate username
    const exists = users.some(u => u.username.toLowerCase() === newUserUsername.trim().toLowerCase());
    if (exists) {
      setFormError('Username sudah digunakan oleh akun lain.');
      return;
    }

    // Initials generator
    const parts = newUserName.trim().split(' ');
    const initials = parts.length > 1 
      ? (parts[0][0] + parts[1][0]).toUpperCase() 
      : newUserName.slice(0, 2).toUpperCase();

    // Auto code
    const randNum = Math.floor(10 + Math.random() * 90);
    const rolePrefix = newUserRole === 'Super Admin' ? 'ADMIN' : newUserRole === 'Sales Manager' ? 'MGR' : newUserRole === 'Staff Keuangan' ? 'FIN' : 'SR';
    const salesRepCode = `PODA-${rolePrefix}-${randNum}`;

    onAddUser({
      name: newUserName.trim(),
      username: newUserUsername.trim().toLowerCase(),
      email: newUserEmail.trim().toLowerCase(),
      password: newUserPassword || 'password123',
      role: newUserRole,
      salesRepCode,
      area: newUserArea,
      phone: newUserPhone,
      status: newUserStatus,
      avatarInitials: initials,
      lastLogin: '-'
    });

    // Reset Form
    setNewUserName('');
    setNewUserUsername('');
    setNewUserEmail('');
    setNewUserPassword('password123');
    setNewUserArea('Jakarta Selatan');
    setNewUserPhone('08');
    setIsAddUserModalOpen(false);
  };

  // Submit Edit User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    onUpdateUser(editingUser);
    setEditingUser(null);
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const matchSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.area.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Summary & Sub-Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Manajemen Role & Hak Akses Menu
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  RBAC Matrix
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur visibilitas menu untuk setiap peran jabatan dan kelola akun pengguna PODA E-Liquid.
              </p>
            </div>
          </div>

          {/* Sub Navigation: Matriks Menu vs Daftar Pengguna */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-stretch sm:self-auto">
            <button
              id="subtab-roles"
              onClick={() => setActiveSubTab('roles')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'roles'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-purple-600" />
              <span>Hak Akses Menu</span>
            </button>

            <button
              id="subtab-users"
              onClick={() => setActiveSubTab('users')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'users'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Daftar Pengguna ({users.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Company Branding & Encrypted Session Banner for Admin */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-700/60">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
            branding?.logoUrl ? 'bg-white p-1' : 'bg-emerald-600 text-white'
          }`}>
            {branding?.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt="Company Logo" 
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <ShieldCheck className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white tracking-tight">
                {branding?.companyName || 'PODA E-LIQUID COMPANY'}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Terproteksi Enkripsi Sesi
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Identitas resmi & logo perusahaan aktif. {branding?.lastUpdated ? `Diperbarui: ${branding.lastUpdated}` : 'Enkripsi AES-256 Sesi Aktif'}
            </p>
          </div>
        </div>

        {currentUser.role === 'Super Admin' && onOpenCompanyLogoModal && (
          <button
            type="button"
            onClick={onOpenCompanyLogoModal}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Upload / Atur Logo Perusahaan</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: ROLE ACCESS MATRIX */}
      {activeSubTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-700">
              <span className="font-bold text-slate-900">Perubahan Menu Langsung Diterapkan Secara Real-Time: </span>
              Centang atau hilangkan centang menu untuk menentukan tab navigasi apa saja yang dapat dilihat oleh akun dengan role terkait. Pengguna hanya dapat mengakses menu yang telah Anda izinkan.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {rolePermissions.map((roleConfig) => {
              const usersInThisRole = users.filter(u => u.role === roleConfig.role);

              return (
                <div
                  key={roleConfig.role}
                  className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${roleConfig.badgeColor}`}>
                            {roleConfig.role}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            • {usersInThisRole.length} Akun Terdaftar
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {roleConfig.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {roleConfig.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Accessible Menus Checklist */}
                  <div className="p-4 sm:p-5 flex-1 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Menu Yang Ditampilkan ({roleConfig.allowedTabs.length} dari {ALL_MENUS.length})
                    </span>

                    <div className="space-y-2">
                      {ALL_MENUS.map((menu) => {
                        const isRestrictedToAdmin = menu.tab === 'dashboard' || menu.tab === 'roles';
                        const isSuperAdmin = roleConfig.role === 'Super Admin';
                        const isChecked = isSuperAdmin 
                          ? roleConfig.allowedTabs.includes(menu.tab) 
                          : (!isRestrictedToAdmin && roleConfig.allowedTabs.includes(menu.tab));
                        const isLocked = isRestrictedToAdmin;

                        return (
                          <div
                            key={menu.tab}
                            onClick={() => !isLocked && handleToggleTabPermission(roleConfig.role, menu.tab)}
                            className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                              isChecked 
                                ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300' 
                                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 opacity-60'
                            } ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5 shrink-0">
                                {menu.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold ${isChecked ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {menu.label}
                                  </span>
                                  {isSuperAdmin && isRestrictedToAdmin && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-purple-100 text-purple-700 border border-purple-200">
                                      Wajib Admin
                                    </span>
                                  )}
                                  {!isSuperAdmin && isRestrictedToAdmin && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">
                                      Khusus Administrator
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                  {!isSuperAdmin && isRestrictedToAdmin
                                    ? 'Menu ini dikhususkan eksklusif hanya untuk hak akses Administrator.'
                                    : menu.description}
                                </p>
                              </div>
                            </div>

                            {/* Switch Checkbox */}
                            <div className="mt-0.5 shrink-0">
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                                isChecked 
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                                  : 'border-slate-300 bg-white'
                              }`}>
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Footer: Users Preview */}
                  <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <span>Pengguna:</span>
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {usersInThisRole.slice(0, 3).map(u => (
                          <div
                            key={u.id}
                            title={`${u.name} (${u.email})`}
                            className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center"
                          >
                            {u.avatarInitials}
                          </div>
                        ))}
                      </div>
                      <span className="font-semibold text-slate-700 ml-1">
                        {usersInThisRole.map(u => u.name.split(' ')[0]).join(', ') || 'Belum ada'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: USER MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Search, Role Filter & Add User Button */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama pengguna, username, email, atau area..."
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Role Filter */}
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Peran ({users.length})</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Sales Manager">Sales Manager</option>
                <option value="Sales Representative">Sales Representative</option>
                <option value="Staff Keuangan">Staff Keuangan</option>
              </select>
            </div>

            {/* Add User Button */}
            <button
              id="btn-open-add-user"
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah User Baru</span>
            </button>

          </div>

          {/* User Cards / Responsive Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const isMe = user.id === currentUser.id;

              const roleBadgeColors: Record<string, string> = {
                'Super Admin': 'bg-purple-50 text-purple-700 border-purple-200',
                'Sales Manager': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                'Sales Representative': 'bg-blue-50 text-blue-700 border-blue-200',
                'Staff Keuangan': 'bg-amber-50 text-amber-700 border-amber-200'
              };

              return (
                <div
                  key={user.id}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all ${
                    isMe ? 'border-emerald-400 ring-1 ring-emerald-300' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Top Row: Avatar, Name & Current User Tag */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-800 shrink-0">
                          {user.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {user.name}
                            </h4>
                            {isMe && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Sesi Anda
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            @{user.username}
                          </p>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        user.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        <span>{user.status}</span>
                      </span>
                    </div>

                    {/* Role & Details */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Role Jabatan:</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadgeColors[user.role]}`}>
                          {user.role}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Kode ID:</span>
                        <span className="font-mono text-slate-700 font-semibold text-[11px]">
                          {user.salesRepCode || '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Area Wilayah:</span>
                        <span className="text-slate-700 font-medium text-[11px] truncate max-w-[150px]">
                          {user.area}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Email:</span>
                        <span className="text-slate-700 font-medium text-[11px] truncate max-w-[160px]">
                          {user.email}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">No. Telepon:</span>
                        <span className="text-slate-700 font-medium text-[11px]">
                          {user.phone}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Login Terakhir:</span>
                        <span>{user.lastLogin || 'Belum pernah'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {!isMe ? (
                      <button
                        onClick={() => onSwitchUser(user)}
                        title="Masuk & simulasikan sistem sebagai user ini"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Ganti ke Akun Ini</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Sedang Digunakan
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingUser(user)}
                        title="Edit Data User"
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {!isMe && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Yakin ingin menghapus akun ${user.name}?`)) {
                              onDeleteUser(user.id);
                            }
                          }}
                          title="Hapus Akun Pengguna"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* MODAL: TAMBAH USER BARU */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Tambah Pengguna Sistem Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftarkan akun sales representative, supervisor, atau staf lainnya.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="misal: Dimas Aditya"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Username & Role Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="misal: dimas.aditya"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peran / Role Akses <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                  >
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Staff Keuangan">Staff Keuangan</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>

              {/* Email & Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Perusahaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="dimas@poda.id"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi Awal
                  </label>
                  <input
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="password123"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Area & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area Wilayah Penugasan
                  </label>
                  <input
                    type="text"
                    value={newUserArea}
                    onChange={(e) => setNewUserArea(e.target.value)}
                    placeholder="misal: Tangerang & Serpong"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Akun
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={newUserStatus === 'Aktif'}
                      onChange={() => setNewUserStatus('Aktif')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Aktif (Bisa Langsung Login)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={newUserStatus === 'Nonaktif'}
                      onChange={() => setNewUserStatus('Nonaktif')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Nonaktif (Ditangguhkan)</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Simpan & Daftarkan Akun</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ubah Data Pengguna: {editingUser.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perbarui role jabatan, wilayah kerja, atau status aktif akun.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role Jabatan
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Staff Keuangan">Staff Keuangan</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'Aktif' | 'Nonaktif' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area Wilayah
                  </label>
                  <input
                    type="text"
                    value={editingUser.area}
                    onChange={(e) => setEditingUser({ ...editingUser, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Telepon / WA
                  </label>
                  <input
                    type="text"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
