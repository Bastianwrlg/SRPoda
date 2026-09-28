import { 
  Customer, 
  ProductLiquid, 
  VisitSchedule, 
  DailySalesReport, 
  DailyTargetConfig,
  AppUser,
  RolePermission
} from '../types';

export const INITIAL_PRODUCTS: ProductLiquid[] = [
  {
    id: 'prod-1',
    name: 'PODA Frost Mint Ice',
    variant: 'Menthol & Spearmint Blast',
    category: 'Saltnic',
    nicotine: '30mg',
    volume: '30ml',
    retailPrice: 115000,
    wholesalePrice: 85000,
    stock: 450,
    badgeColor: 'from-cyan-500 to-blue-600',
    description: 'Sensasi dingin arctic mint menyegarkan dengan throat hit halus seimbang.'
  },
  {
    id: 'prod-2',
    name: 'PODA Mango Freeze Blast',
    variant: 'Sweet Harumanis Mango Ice',
    category: 'Saltnic',
    nicotine: '30mg',
    volume: '30ml',
    retailPrice: 115000,
    wholesalePrice: 85000,
    stock: 380,
    badgeColor: 'from-amber-400 to-orange-500',
    description: 'Perpaduan mangga harumanis ranum dengan sentuhan kristal es yang pekat.'
  },
  {
    id: 'prod-3',
    name: 'PODA Butterscotch Cream Reserve',
    variant: 'Creamy Salted Caramel Custard',
    category: 'Freebase',
    nicotine: '3mg',
    volume: '60ml',
    retailPrice: 155000,
    wholesalePrice: 115000,
    stock: 290,
    badgeColor: 'from-amber-600 to-yellow-700',
    description: 'Karamel gurih leleh berpadu krim custard vanila madagaskar bertekstur tebal.'
  },
  {
    id: 'prod-4',
    name: 'PODA Butterscotch Cream Reserve 6mg',
    variant: 'Creamy Salted Caramel Custard',
    category: 'Freebase',
    nicotine: '6mg',
    volume: '60ml',
    retailPrice: 155000,
    wholesalePrice: 115000,
    stock: 210,
    badgeColor: 'from-amber-700 to-stone-800',
    description: 'Varian 6mg throat hit mantap untuk vaper pecinta rasa creamy pekat.'
  },
  {
    id: 'prod-5',
    name: 'PODA Tokyo Banana Poundcake',
    variant: 'Rich Banana Sponge Cake',
    category: 'Freebase',
    nicotine: '3mg',
    volume: '60ml',
    retailPrice: 155000,
    wholesalePrice: 115000,
    stock: 315,
    badgeColor: 'from-yellow-400 to-amber-500',
    description: 'Kue bolu pisang khas tokyo berlapis krim kental manis menggoda selera.'
  },
  {
    id: 'prod-6',
    name: 'PODA Grape Candy Pop',
    variant: 'Sweet Concord Grape Sparkle',
    category: 'Pods Friendly',
    nicotine: '12mg',
    volume: '30ml',
    retailPrice: 95000,
    wholesalePrice: 70000,
    stock: 520,
    badgeColor: 'from-purple-500 to-fuchsia-600',
    description: 'Rasa permen anggur ungu segar cocok untuk pod cartridge koil 0.6 - 0.8 ohm.'
  },
  {
    id: 'prod-7',
    name: 'PODA Watermelon Chill Splash',
    variant: 'Juicy Watermelon Ice',
    category: 'Pods Friendly',
    nicotine: '12mg',
    volume: '30ml',
    retailPrice: 95000,
    wholesalePrice: 70000,
    stock: 480,
    badgeColor: 'from-rose-500 to-red-600',
    description: 'Semangka merah ranum berair dengan dingin ekstra menyegarkan hari panas.'
  },
  {
    id: 'prod-8',
    name: 'PODA Caramel Tobacco Blend',
    variant: 'Aromatic Virginia & Burley',
    category: 'Saltnic',
    nicotine: '35mg',
    volume: '30ml',
    retailPrice: 120000,
    wholesalePrice: 88000,
    stock: 190,
    badgeColor: 'from-stone-600 to-amber-900',
    description: 'Tembakau kelas cerutu dunia dipadu hint karamel lembut yang elegan.'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Cloud Nine Vape Store',
    ownerName: 'Hendra Wijaya',
    phone: '0812-8877-6621',
    email: 'cloudnine.vape@gmail.com',
    address: 'Jl. Senopati Raya No. 42, Kebayoran Baru, Jakarta Selatan',
    area: 'Jakarta Selatan',
    tier: 'Wholesaler',
    status: 'Aktif',
    creditLimit: 50000000,
    currentDebt: 12500000,
    totalOrdersCount: 24,
    totalRevenue: 148500000,
    lastVisitDate: '2026-09-14',
    notes: 'Prioritas restock PODA Frost Mint & Mango Freeze. Selalu minta display tester baru di etalase depan.',
    coordinates: { lat: -6.2297, lng: 106.8166 }
  },
  {
    id: 'cust-2',
    name: 'Vapeboss Flagship Kemang',
    ownerName: 'Bima Santoso',
    phone: '0813-1922-3849',
    email: 'kemang@vapeboss.co.id',
    address: 'Jl. Kemang Raya No. 18B, Bangka, Mampang Prapatan, Jakarta Selatan',
    area: 'Jakarta Selatan',
    tier: 'Distributor',
    status: 'Aktif',
    creditLimit: 120000000,
    currentDebt: 35000000,
    totalOrdersCount: 42,
    totalRevenue: 385000000,
    lastVisitDate: '2026-09-12',
    notes: 'Distributor terkuat di area Kemang & Jaksel. Rutin order kuota 300-500 botol per 2 minggu.',
    coordinates: { lat: -6.2625, lng: 106.8158 }
  },
  {
    id: 'cust-3',
    name: 'Juice Station Gading Serpong',
    ownerName: 'Kevin Leonardo',
    phone: '0857-7721-9034',
    email: 'juicestation.gs@gmail.com',
    address: 'Ruko Boulevard Gading Serpong Blok AA3 No. 15, Tangerang',
    area: 'Tangerang',
    tier: 'Retail Premium',
    status: 'Menunggu Restock',
    creditLimit: 25000000,
    currentDebt: 0,
    totalOrdersCount: 16,
    totalRevenue: 72000000,
    lastVisitDate: '2026-09-08',
    notes: 'Stok varian Pods Friendly Grape dan Butterscotch 60ml habis. Butuh kunjungan segera hari ini.',
    coordinates: { lat: -6.2411, lng: 106.6288 }
  },
  {
    id: 'cust-4',
    name: 'Vaporitz BSD City',
    ownerName: 'Rian Fahrezi',
    phone: '0811-9283-4411',
    email: 'vaporitz.bsd@yahoo.com',
    address: 'Kavling Commercial Park BSD Blok D No. 7, Tangerang Selatan',
    area: 'Tangerang Selatan',
    tier: 'Retail Premium',
    status: 'Aktif',
    creditLimit: 30000000,
    currentDebt: 7500000,
    totalOrdersCount: 19,
    totalRevenue: 98000000,
    lastVisitDate: '2026-09-15',
    notes: 'Toko vaper komunitas anak muda. Sangat antusias dengan program loyalty PODA.',
    coordinates: { lat: -6.3015, lng: 106.6542 }
  },
  {
    id: 'cust-5',
    name: 'Brotherhood Vape Store Bekasi',
    ownerName: 'Dimas Aditya',
    phone: '0818-0922-1134',
    email: 'bhvapebekasi@gmail.com',
    address: 'Jl. KH. Noer Ali No. 88, Kalimalang, Bekasi Barat',
    area: 'Bekasi',
    tier: 'Wholesaler',
    status: 'Perlu Kunjungan',
    creditLimit: 40000000,
    currentDebt: 18000000,
    totalOrdersCount: 22,
    totalRevenue: 135000000,
    lastVisitDate: '2026-09-02',
    notes: 'Perlu penagihan tempo invoice INV-2026-08-41 dan penawaran varian baru PODA Frost Mint.',
    coordinates: { lat: -6.2472, lng: 106.9924 }
  },
  {
    id: 'cust-6',
    name: 'Vape Corner Tebet',
    ownerName: 'Alifia Putri',
    phone: '0812-3344-9988',
    email: 'vapecornertebet@gmail.com',
    address: 'Jl. Tebet Timur Dalam Raya No. 55, Jakarta Selatan',
    area: 'Jakarta Selatan',
    tier: 'Retail Regular',
    status: 'Aktif',
    creditLimit: 15000000,
    currentDebt: 3200000,
    totalOrdersCount: 11,
    totalRevenue: 34500000,
    lastVisitDate: '2026-09-11',
    notes: 'Toko strategis di pusat kuliner Tebet. Pembayaran selalu tepat waktu tunai/QRIS.',
    coordinates: { lat: -6.2341, lng: 106.8523 }
  },
  {
    id: 'cust-7',
    name: 'Empire Vaporizer Kelapa Gading',
    ownerName: 'Stevanus Tan',
    phone: '0819-8812-7766',
    email: 'empirevapor.kg@gmail.com',
    address: 'Boulevard Barat Raya Ruko Plaza Pasifik Blok B No. 9, Jakarta Utara',
    area: 'Jakarta Utara',
    tier: 'Wholesaler',
    status: 'Aktif',
    creditLimit: 60000000,
    currentDebt: 22000000,
    totalOrdersCount: 31,
    totalRevenue: 215000000,
    lastVisitDate: '2026-09-10',
    notes: 'Pembeli partai besar liquid Saltnic PODA rasa mangga dan semangka.',
    coordinates: { lat: -6.1554, lng: 106.9031 }
  },
  {
    id: 'cust-8',
    name: 'District Pods & Mods Bintaro',
    ownerName: 'Ferry Gunawan',
    phone: '0878-1234-5678',
    email: 'district.bintaro@gmail.com',
    address: 'Sektor 7 Bintaro Jaya Ruko Kebayoran Arcade 2 Blok B2 No. 11, Tangerang Selatan',
    area: 'Tangerang Selatan',
    tier: 'Retail Premium',
    status: 'Menunggu Restock',
    creditLimit: 25000000,
    currentDebt: 4500000,
    totalOrdersCount: 14,
    totalRevenue: 61000000,
    lastVisitDate: '2026-09-07',
    notes: 'Permintaan tinggi untuk PODA Tokyo Banana dan Frost Mint.',
    coordinates: { lat: -6.2831, lng: 106.7118 }
  }
];

export const INITIAL_VISITS: VisitSchedule[] = [
  {
    id: 'vis-1',
    customerId: 'cust-3',
    customerName: 'Juice Station Gading Serpong',
    customerArea: 'Tangerang',
    date: '2026-09-16',
    time: '10:30',
    purpose: 'Restock Order',
    status: 'Selesai',
    priority: 'Tinggi',
    notes: 'Restock mendesak 45 botol Poda Pods Friendly Grape dan 20 botol Freebase Butterscotch.',
    checkInTime: '10:32',
    checkOutTime: '11:20',
    durationMinutes: 48,
    salesResult: 5450000,
    locationVerified: true,
    checklist: {
      stockCheck: true,
      testerProvided: true,
      promoMaterialInstalled: true,
      paymentFollowUp: true
    },
    photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'vis-2',
    customerId: 'cust-4',
    customerName: 'Vaporitz BSD City',
    customerArea: 'Tangerang Selatan',
    date: '2026-09-16',
    time: '13:00',
    purpose: 'Pengenalan Varian Baru',
    status: 'Selesai',
    priority: 'Sedang',
    notes: 'Edukasi staf toko mengenai tester PODA Butterscotch Reserve 6mg dan sampling ke pengunjung.',
    checkInTime: '13:05',
    checkOutTime: '13:50',
    durationMinutes: 45,
    salesResult: 3850000,
    locationVerified: true,
    checklist: {
      stockCheck: true,
      testerProvided: true,
      promoMaterialInstalled: true,
      paymentFollowUp: false
    },
    photoUrl: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'vis-3',
    customerId: 'cust-8',
    customerName: 'District Pods & Mods Bintaro',
    customerArea: 'Tangerang Selatan',
    date: '2026-09-16',
    time: '15:30',
    purpose: 'Restock Order',
    status: 'Sedang Berlangsung',
    priority: 'Tinggi',
    notes: 'Sedang melakukan audit stok rak & finalisasi order 40 botol Saltnic series.',
    checkInTime: '15:35',
    durationMinutes: 25,
    locationVerified: true,
    checklist: {
      stockCheck: true,
      testerProvided: false,
      promoMaterialInstalled: false,
      paymentFollowUp: false
    }
  },
  {
    id: 'vis-4',
    customerId: 'cust-1',
    customerName: 'Cloud Nine Vape Store',
    customerArea: 'Jakarta Selatan',
    date: '2026-09-16',
    time: '17:30',
    purpose: 'Display & Merchandising',
    status: 'Terjadwal',
    priority: 'Sedang',
    notes: 'Pemasangan standing acrylic banner promosi PODA E-Liquid edisi Q3 2026.',
    checklist: {
      stockCheck: false,
      testerProvided: false,
      promoMaterialInstalled: false,
      paymentFollowUp: false
    }
  },
  {
    id: 'vis-5',
    customerId: 'cust-5',
    customerName: 'Brotherhood Vape Store Bekasi',
    customerArea: 'Bekasi',
    date: '2026-09-17',
    time: '11:00',
    purpose: 'Penagihan Piutang',
    status: 'Terjadwal',
    priority: 'Tinggi',
    notes: 'Jadwal temu dengan pemilik toko Hendra untuk pembayaran invoice jatuh tempo tempo 14 hari.'
  },
  {
    id: 'vis-6',
    customerId: 'cust-2',
    customerName: 'Vapeboss Flagship Kemang',
    customerArea: 'Jakarta Selatan',
    date: '2026-09-17',
    time: '14:30',
    purpose: 'Restock Order',
    status: 'Terjadwal',
    priority: 'Tinggi',
    notes: 'Rapat koordinasi restock grosir 250 botol Poda E-Liquid untuk 3 cabang cabang satelit.'
  }
];

export const INITIAL_DAILY_REPORTS: DailySalesReport[] = [
  {
    id: 'rep-today-1',
    invoiceNumber: 'INV/PODA/20260916/001',
    date: '2026-09-16',
    time: '11:15',
    customerId: 'cust-3',
    customerName: 'Juice Station Gading Serpong',
    customerArea: 'Tangerang',
    salesRepName: 'Rian Pratama',
    items: [
      {
        productId: 'prod-6',
        productName: 'PODA Grape Candy Pop',
        category: 'Pods Friendly',
        quantity: 45,
        unitPrice: 70000,
        subtotal: 3150000
      },
      {
        productId: 'prod-3',
        productName: 'PODA Butterscotch Cream Reserve',
        category: 'Freebase',
        quantity: 20,
        unitPrice: 115000,
        subtotal: 2300000
      }
    ],
    totalBottles: 65,
    totalRevenue: 5450000,
    paymentMethod: 'Transfer Bank',
    paymentStatus: 'Lunas',
    notes: 'Order restock cepat. Pembayaran langsung via transfer BCA resmi PT Poda Liquid.',
    visitId: 'vis-1'
  },
  {
    id: 'rep-today-2',
    invoiceNumber: 'INV/PODA/20260916/002',
    date: '2026-09-16',
    time: '13:45',
    customerId: 'cust-4',
    customerName: 'Vaporitz BSD City',
    customerArea: 'Tangerang Selatan',
    salesRepName: 'Rian Pratama',
    items: [
      {
        productId: 'prod-1',
        productName: 'PODA Frost Mint Ice',
        category: 'Saltnic',
        quantity: 25,
        unitPrice: 85000,
        subtotal: 2125000
      },
      {
        productId: 'prod-4',
        productName: 'PODA Butterscotch Cream Reserve 6mg',
        category: 'Freebase',
        quantity: 15,
        unitPrice: 115000,
        subtotal: 1725000
      }
    ],
    totalBottles: 40,
    totalRevenue: 3850000,
    paymentMethod: 'Tunai',
    paymentStatus: 'Lunas',
    notes: 'Produk tester langsung dipasang di meja bar vape toko.',
    visitId: 'vis-2'
  },
  {
    id: 'rep-yesterday-1',
    invoiceNumber: 'INV/PODA/20260915/001',
    date: '2026-09-15',
    time: '14:20',
    customerId: 'cust-1',
    customerName: 'Cloud Nine Vape Store',
    customerArea: 'Jakarta Selatan',
    salesRepName: 'Rian Pratama',
    items: [
      {
        productId: 'prod-1',
        productName: 'PODA Frost Mint Ice',
        category: 'Saltnic',
        quantity: 50,
        unitPrice: 85000,
        subtotal: 4250000
      },
      {
        productId: 'prod-2',
        productName: 'PODA Mango Freeze Blast',
        category: 'Saltnic',
        quantity: 50,
        unitPrice: 85000,
        subtotal: 4250000
      },
      {
        productId: 'prod-5',
        productName: 'PODA Tokyo Banana Poundcake',
        category: 'Freebase',
        quantity: 30,
        unitPrice: 115000,
        subtotal: 3450000
      }
    ],
    totalBottles: 130,
    totalRevenue: 11950000,
    paymentMethod: 'Tempo 14 Hari',
    paymentStatus: 'Tempo',
    notes: 'Invoice tempo 14 hari disetujui Supervisor Sales.'
  },
  {
    id: 'rep-yesterday-2',
    invoiceNumber: 'INV/PODA/20260915/002',
    date: '2026-09-15',
    time: '16:40',
    customerId: 'cust-6',
    customerName: 'Vape Corner Tebet',
    customerArea: 'Jakarta Selatan',
    salesRepName: 'Rian Pratama',
    items: [
      {
        productId: 'prod-7',
        productName: 'PODA Watermelon Chill Splash',
        category: 'Pods Friendly',
        quantity: 30,
        unitPrice: 70000,
        subtotal: 2100000
      },
      {
        productId: 'prod-8',
        productName: 'PODA Caramel Tobacco Blend',
        category: 'Saltnic',
        quantity: 15,
        unitPrice: 88000,
        subtotal: 1320000
      }
    ],
    totalBottles: 45,
    totalRevenue: 3420000,
    paymentMethod: 'Transfer Bank',
    paymentStatus: 'Lunas',
    notes: 'PODA Watermelon Chill sangat laris di Tebet.'
  },
  {
    id: 'rep-prev-1',
    invoiceNumber: 'INV/PODA/20260914/001',
    date: '2026-09-14',
    time: '12:10',
    customerId: 'cust-2',
    customerName: 'Vapeboss Flagship Kemang',
    customerArea: 'Jakarta Selatan',
    salesRepName: 'Rian Pratama',
    items: [
      {
        productId: 'prod-1',
        productName: 'PODA Frost Mint Ice',
        category: 'Saltnic',
        quantity: 100,
        unitPrice: 85000,
        subtotal: 8500000
      },
      {
        productId: 'prod-2',
        productName: 'PODA Mango Freeze Blast',
        category: 'Saltnic',
        quantity: 80,
        unitPrice: 85000,
        subtotal: 6800000
      },
      {
        productId: 'prod-3',
        productName: 'PODA Butterscotch Cream Reserve',
        category: 'Freebase',
        quantity: 50,
        unitPrice: 115000,
        subtotal: 5750000
      }
    ],
    totalBottles: 230,
    totalRevenue: 21050000,
    paymentMethod: 'Transfer Bank',
    paymentStatus: 'Lunas',
    notes: 'Order partai besar awal pekan.'
  },
  {
    id: 'rep-prev-2',
    invoiceNumber: 'INV/PODA/20260913/001',
    date: '2026-09-13',
    time: '15:10',
    customerId: 'cust-7',
    customerName: 'Empire Vaporizer Kelapa Gading',
    customerArea: 'Jakarta Utara',
    salesRepName: 'Rian Pratama',
    items: [
      {
        productId: 'prod-6',
        productName: 'PODA Grape Candy Pop',
        category: 'Pods Friendly',
        quantity: 60,
        unitPrice: 70000,
        subtotal: 4200000
      },
      {
        productId: 'prod-7',
        productName: 'PODA Watermelon Chill Splash',
        category: 'Pods Friendly',
        quantity: 50,
        unitPrice: 70000,
        subtotal: 3500000
      },
      {
        productId: 'prod-1',
        productName: 'PODA Frost Mint Ice',
        category: 'Saltnic',
        quantity: 40,
        unitPrice: 85000,
        subtotal: 3400000
      }
    ],
    totalBottles: 150,
    totalRevenue: 11100000,
    paymentMethod: 'Transfer Bank',
    paymentStatus: 'Lunas',
    notes: 'Restock varian fruity ice menyambut akhir pekan.'
  }
];

export const INITIAL_DAILY_TARGET: DailyTargetConfig = {
  date: '2026-09-16',
  targetRevenue: 15000000, // Rp 15.000.000
  targetBottles: 150,       // 150 botol liquid
  targetVisits: 4           // 4 kunjungan toko
};

export const MONTHLY_TARGET_CONFIG = {
  month: 'September 2026',
  targetRevenue: 350000000, // Rp 350.000.000
  targetBottles: 3800,      // 3.800 botol liquid
  targetVisits: 90,         // 90 kunjungan toko
  workingDays: 24
};

// Historical daily data for Monthly Analytics Trend (16 days so far in September 2026)
export const MONTHLY_TREND_DATA = [
  { day: '01', date: '01 Sep', revenue: 14200000, target: 14500000, bottles: 140, visits: 4 },
  { day: '02', date: '02 Sep', revenue: 16800000, target: 14500000, bottles: 165, visits: 5 },
  { day: '03', date: '03 Sep', revenue: 13500000, target: 14500000, bottles: 130, visits: 3 },
  { day: '04', date: '04 Sep', revenue: 18200000, target: 14500000, bottles: 180, visits: 5 },
  { day: '05', date: '05 Sep', revenue: 21500000, target: 14500000, bottles: 210, visits: 6 },
  { day: '06', date: '06 Sep', revenue: 8900000,  target: 10000000, bottles: 85,  visits: 2 },
  { day: '07', date: '07 Sep', revenue: 15400000, target: 14500000, bottles: 150, visits: 4 },
  { day: '08', date: '08 Sep', revenue: 17100000, target: 14500000, bottles: 170, visits: 4 },
  { day: '09', date: '09 Sep', revenue: 19800000, target: 14500000, bottles: 195, visits: 5 },
  { day: '10', date: '10 Sep', revenue: 22400000, target: 14500000, bottles: 225, visits: 6 },
  { day: '11', date: '11 Sep', revenue: 16500000, target: 14500000, bottles: 160, visits: 4 },
  { day: '12', date: '12 Sep', revenue: 20100000, target: 14500000, bottles: 198, visits: 5 },
  { day: '13', date: '13 Sep', revenue: 11100000, target: 14500000, bottles: 150, visits: 3 },
  { day: '14', date: '14 Sep', revenue: 21050000, target: 14500000, bottles: 230, visits: 5 },
  { day: '15', date: '15 Sep', revenue: 15370000, target: 14500000, bottles: 175, visits: 4 },
  { day: '16', date: '16 Sep (Hari ini)', revenue: 9300000, target: 15000000, bottles: 105, visits: 3 }
];

export const INITIAL_ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: 'Super Admin',
    title: 'Super Administrator',
    description: 'Akses penuh ke seluruh modul sistem, pengaturan role & permissions, analitik bisnis, serta penambahan akun user.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    allowedTabs: ['dashboard', 'customers', 'visits', 'sales', 'products', 'roles'],
    canAddUser: true,
    canEditRoleAccess: true,
    canDeleteUser: true
  },
  {
    role: 'Sales Manager',
    title: 'Sales Manager & Supervisor',
    description: 'Akses monitoring tim sales, persetujuan target, audit kunjungan gerai, dan kelola operasional pelanggan.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    allowedTabs: ['customers', 'visits', 'sales', 'products'],
    canAddUser: true,
    canEditRoleAccess: false,
    canDeleteUser: false
  },
  {
    role: 'Sales Representative',
    title: 'Sales Representative Lapangan',
    description: 'Fokus operasional lapangan: kunjungan gerai mitra, verifikasi GPS, penawaran produk, dan input nota.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    allowedTabs: ['customers', 'visits', 'sales', 'products'],
    canAddUser: false,
    canEditRoleAccess: false,
    canDeleteUser: false
  },
  {
    role: 'Staff Keuangan',
    title: 'Finance & Piutang Dagang',
    description: 'Fokus rekapitulasi pembayaran invoice, monitoring plafon kredit toko, dan pelunasan tempo piutang.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    allowedTabs: ['customers', 'sales', 'products'],
    canAddUser: false,
    canEditRoleAccess: false,
    canDeleteUser: false
  }
];

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'user-1',
    name: 'Bastian Waralaga',
    username: 'admin',
    email: 'bastian@poda.id',
    password: 'admin',
    role: 'Super Admin',
    salesRepCode: 'PODA-ADMIN-01',
    area: 'Headquarter Jakarta',
    phone: '0812-8888-9999',
    status: 'Aktif',
    avatarInitials: 'BW',
    lastLogin: '16 Sep 2026, 20:30 WIB',
    createdAt: '2026-01-10'
  },
  {
    id: 'user-2',
    name: 'Hendra Wijaya',
    username: 'manager',
    email: 'hendra.wijaya@poda.id',
    password: 'password123',
    role: 'Sales Manager',
    salesRepCode: 'PODA-MGR-02',
    area: 'Jabodetabek & Jabar',
    phone: '0813-1122-3344',
    status: 'Aktif',
    avatarInitials: 'HW',
    lastLogin: '16 Sep 2026, 18:15 WIB',
    createdAt: '2026-02-01'
  },
  {
    id: 'user-3',
    name: 'Rian Pratama',
    username: 'rian',
    email: 'rian.pratama@poda.id',
    password: 'password123',
    role: 'Sales Representative',
    salesRepCode: 'PODA-SR-048',
    area: 'Jakarta Selatan & Timur',
    phone: '0857-7654-3210',
    status: 'Aktif',
    avatarInitials: 'RP',
    lastLogin: '16 Sep 2026, 19:45 WIB',
    createdAt: '2026-03-15'
  },
  {
    id: 'user-4',
    name: 'Siti Rahmawati',
    username: 'keuangan',
    email: 'siti.rahma@poda.id',
    password: 'password123',
    role: 'Staff Keuangan',
    salesRepCode: 'PODA-FIN-07',
    area: 'Headquarter Jakarta',
    phone: '0819-3344-5566',
    status: 'Aktif',
    avatarInitials: 'SR',
    lastLogin: '16 Sep 2026, 16:40 WIB',
    createdAt: '2026-04-20'
  }
];
