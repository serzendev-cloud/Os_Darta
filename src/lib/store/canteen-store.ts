export interface CanteenUnit {
  id: string;
  name: string;
  code: string;
  location: string;
  operatingHours: string;
  receiptFooter: string;
  status: 'active' | 'inactive';
}

export interface CanteenCatalogItem {
  id: string;
  canteenId: string;
  name: string;
  code: string;
  category: 'makanan' | 'minuman' | 'snack' | 'alat_tulis';
  price: number;
  stock: number;
}

export const initialCanteenUnits: CanteenUnit[] = [
  { id: 'cnt-1', name: 'Kantin Utama Pesantren', code: 'KNT-01', location: 'Gedung Utama Lt. 1', operatingHours: '06:00 - 17:00', receiptFooter: 'Terima kasih telah berbelanja di Kantin Utama', status: 'active' },
  { id: 'cnt-2', name: 'Kantin Asrama Putra', code: 'KNT-02', location: 'Kompleks Asrama Putra', operatingHours: '06:00 - 21:00', receiptFooter: 'Selamat menikmati hidangan Asrama Putra', status: 'active' },
  { id: 'cnt-3', name: 'Kantin Asrama Putri', code: 'KNT-03', location: 'Kompleks Asrama Putri', operatingHours: '06:00 - 21:00', receiptFooter: 'Selamat menikmati hidangan Asrama Putri', status: 'active' },
  { id: 'cnt-4', name: 'Koperasi Pesantren', code: 'KOP-01', location: 'Gedung Serbaguna Lt. 1', operatingHours: '07:30 - 16:00', receiptFooter: 'Terima kasih mendukung Koperasi Pesantren', status: 'active' },
];

export const initialCanteenItems: CanteenCatalogItem[] = [
  // Kantin Utama Pesantren (cnt-1)
  { id: 'itm-1', canteenId: 'cnt-1', name: 'Nasi Goreng Spesial', code: 'MKN-01', category: 'makanan', price: 12000, stock: 50 },
  { id: 'itm-2', canteenId: 'cnt-1', name: 'Es Teh Manis', code: 'MNM-01', category: 'minuman', price: 3000, stock: 100 },
  { id: 'itm-3', canteenId: 'cnt-1', name: 'Ayam Geprek Nasi', code: 'MKN-02', category: 'makanan', price: 15000, stock: 40 },
  { id: 'itm-4', canteenId: 'cnt-1', name: 'Jus Alpukat', code: 'MNM-03', category: 'minuman', price: 8000, stock: 35 },

  // Kantin Asrama Putra (cnt-2)
  { id: 'itm-5', canteenId: 'cnt-2', name: 'Nasi Rames Asrama', code: 'MKN-03', category: 'makanan', price: 10000, stock: 60 },
  { id: 'itm-6', canteenId: 'cnt-2', name: 'Kopi Susu Warmindo', code: 'MNM-02', category: 'minuman', price: 4000, stock: 80 },
  { id: 'itm-7', canteenId: 'cnt-2', name: 'Indomie Telur Kornet', code: 'MKN-04', category: 'makanan', price: 9000, stock: 50 },
  { id: 'itm-8', canteenId: 'cnt-2', name: 'Teh Hangat', code: 'MNM-04', category: 'minuman', price: 3000, stock: 75 },

  // Kantin Asrama Putri (cnt-3)
  { id: 'itm-9', canteenId: 'cnt-3', name: 'Seblak Pedas Asrama', code: 'MKN-05', category: 'makanan', price: 10000, stock: 40 },
  { id: 'itm-10', canteenId: 'cnt-3', name: 'Boba Milk Tea', code: 'MNM-05', category: 'minuman', price: 8000, stock: 45 },
  { id: 'itm-11', canteenId: 'cnt-3', name: 'Nasi Soto Ayam', code: 'MKN-06', category: 'makanan', price: 12000, stock: 30 },
  { id: 'itm-12', canteenId: 'cnt-3', name: 'Es Jeruk Peras', code: 'MNM-06', category: 'minuman', price: 4000, stock: 60 },

  // Koperasi Pesantren (cnt-4)
  { id: 'itm-13', canteenId: 'cnt-4', name: 'Kitab Safinatun Najah', code: 'KTB-01', category: 'alat_tulis', price: 15000, stock: 30 },
  { id: 'itm-14', canteenId: 'cnt-4', name: 'Buku Tulis 50 Lembar', code: 'ALT-01', category: 'alat_tulis', price: 5000, stock: 200 },
  { id: 'itm-15', canteenId: 'cnt-4', name: 'Pulpen Gel Hitam', code: 'ALT-02', category: 'alat_tulis', price: 3500, stock: 150 },
  { id: 'itm-16', canteenId: 'cnt-4', name: 'Sarung Wadimor Asli', code: 'PRL-01', category: 'snack', price: 65000, stock: 25 },
];

const LOCAL_STORAGE_CANTEENS_KEY = 'mahad_canteen_units_v1';
const LOCAL_STORAGE_ITEMS_KEY = 'mahad_canteen_items_v1';

export function getStoredCanteenUnits(): CanteenUnit[] {
  if (typeof window === 'undefined') return initialCanteenUnits;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_CANTEENS_KEY);
    return data ? JSON.parse(data) : initialCanteenUnits;
  } catch {
    return initialCanteenUnits;
  }
}

export function saveStoredCanteenUnits(units: CanteenUnit[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CANTEENS_KEY, JSON.stringify(units));
  } catch (e) {
    console.error('Failed to save canteen units', e);
  }
}

export function getStoredCanteenItems(): CanteenCatalogItem[] {
  if (typeof window === 'undefined') return initialCanteenItems;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
    return data ? JSON.parse(data) : initialCanteenItems;
  } catch {
    return initialCanteenItems;
  }
}

export function saveStoredCanteenItems(items: CanteenCatalogItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save canteen items', e);
  }
}
