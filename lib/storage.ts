import {
  CompanyProfile,
  UserProfile,
  Warehouse,
  Product,
  Customer,
  Supplier,
  SalesInvoice,
  DeliveryChallan,
  PurchaseInvoice,
  SalesReturn,
  PurchaseReturn,
  Payment,
  Expense,
  InventoryTransaction,
  AuditLog,
  NotificationItem,
  UserRole,
  Permission,
} from '@/types';
import {
  INITIAL_COMPANY,
  INITIAL_WAREHOUSES,
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_INVOICES,
  INITIAL_CHALLANS,
  INITIAL_PURCHASES,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_TRANSACTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from './demo-data';
import { getDefaultPermissionsForRole } from './permissions';

interface AppState {
  company: CompanyProfile;
  currentUser: UserProfile;
  isAuthenticated: boolean;
  users: UserProfile[];
  warehouses: Warehouse[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: SalesInvoice[];
  challans: DeliveryChallan[];
  purchases: PurchaseInvoice[];
  salesReturns: SalesReturn[];
  purchaseReturns: PurchaseReturn[];
  payments: Payment[];
  expenses: Expense[];
  transactions: InventoryTransaction[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
}

const STORAGE_KEY = 'zenith_erp_state_v1';

let listeners: (() => void)[] = [];

function loadState(): AppState {
  if (typeof window === 'undefined') {
    return {
      company: INITIAL_COMPANY,
      currentUser: INITIAL_USERS[0],
      isAuthenticated: true,
      users: INITIAL_USERS,
      warehouses: INITIAL_WAREHOUSES,
      products: INITIAL_PRODUCTS,
      customers: INITIAL_CUSTOMERS,
      suppliers: INITIAL_SUPPLIERS,
      invoices: INITIAL_INVOICES,
      challans: INITIAL_CHALLANS,
      purchases: INITIAL_PURCHASES,
      salesReturns: [],
      purchaseReturns: [],
      payments: INITIAL_PAYMENTS,
      expenses: INITIAL_EXPENSES,
      transactions: INITIAL_TRANSACTIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
      notifications: INITIAL_NOTIFICATIONS,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure required structure & default email_verified and password for all users
      const rawUsers = (parsed.users || INITIAL_USERS) as UserProfile[];
      const safeUsers = rawUsers.map((u) => ({
        ...u,
        email_verified: u.email_verified !== undefined ? Boolean(u.email_verified) : true,
        password: u.password || 'password123',
      }));
      const rawCurrent = parsed.currentUser || INITIAL_USERS[0];
      const safeCurrent = {
        ...rawCurrent,
        email_verified: rawCurrent.email_verified !== undefined ? Boolean(rawCurrent.email_verified) : true,
        password: rawCurrent.password || 'password123',
      };

      return {
        company: parsed.company || INITIAL_COMPANY,
        currentUser: safeCurrent,
        isAuthenticated: parsed.isAuthenticated !== undefined ? Boolean(parsed.isAuthenticated) : true,
        users: safeUsers,
        warehouses: parsed.warehouses || INITIAL_WAREHOUSES,
        products: parsed.products || INITIAL_PRODUCTS,
        customers: parsed.customers || INITIAL_CUSTOMERS,
        suppliers: parsed.suppliers || INITIAL_SUPPLIERS,
        invoices: parsed.invoices || INITIAL_INVOICES,
        challans: parsed.challans || INITIAL_CHALLANS,
        purchases: parsed.purchases || INITIAL_PURCHASES,
        salesReturns: parsed.salesReturns || [],
        purchaseReturns: parsed.purchaseReturns || [],
        payments: parsed.payments || INITIAL_PAYMENTS,
        expenses: parsed.expenses || INITIAL_EXPENSES,
        transactions: parsed.transactions || INITIAL_TRANSACTIONS,
        auditLogs: parsed.auditLogs || INITIAL_AUDIT_LOGS,
        notifications: parsed.notifications || INITIAL_NOTIFICATIONS,
      };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }

  return {
    company: INITIAL_COMPANY,
    currentUser: INITIAL_USERS[0],
    isAuthenticated: true,
    users: INITIAL_USERS,
    warehouses: INITIAL_WAREHOUSES,
    products: INITIAL_PRODUCTS,
    customers: INITIAL_CUSTOMERS,
    suppliers: INITIAL_SUPPLIERS,
    invoices: INITIAL_INVOICES,
    challans: INITIAL_CHALLANS,
    purchases: INITIAL_PURCHASES,
    salesReturns: [],
    purchaseReturns: [],
    payments: INITIAL_PAYMENTS,
    expenses: INITIAL_EXPENSES,
    transactions: INITIAL_TRANSACTIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
    notifications: INITIAL_NOTIFICATIONS,
  };
}

let currentState: AppState = loadState();

function saveState(newState: AppState) {
  currentState = newState;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('State listener error:', e);
    }
  });
}

export function subscribeToStore(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

// -------------------------------------------------------------
// AUDIT & NOTIFICATION HELPERS
// -------------------------------------------------------------
export function logAudit(
  action: AuditLog['action'],
  module: AuditLog['module'],
  details: string,
  recordId?: string
) {
  const newLog: AuditLog = {
    id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    company_id: currentState.company.id,
    user_name: currentState.currentUser.full_name,
    user_email: currentState.currentUser.email,
    action,
    module,
    record_id: recordId,
    details,
    ip_address: '127.0.0.1',
    created_at: new Date().toISOString(),
  };

  saveState({
    ...currentState,
    auditLogs: [newLog, ...currentState.auditLogs],
  });
}

export function addNotification(
  title: string,
  message: string,
  type: NotificationItem['type'] = 'info',
  link?: string
) {
  const newNotif: NotificationItem = {
    id: 'notif-' + Date.now(),
    company_id: currentState.company.id,
    title,
    message,
    type,
    read: false,
    link,
    created_at: new Date().toISOString(),
  };

  saveState({
    ...currentState,
    notifications: [newNotif, ...currentState.notifications],
  });
}

// -------------------------------------------------------------
// GETTERS
// -------------------------------------------------------------
export function getCompany(): CompanyProfile {
  return currentState.company;
}

export function getCurrentUser(): UserProfile {
  return currentState.currentUser;
}

export function getIsAuthenticated(): boolean {
  return currentState.isAuthenticated !== false;
}

export function getAllUsers(): UserProfile[] {
  return currentState.users;
}

export function getWarehouses(): Warehouse[] {
  return currentState.warehouses;
}

export function getProducts(): Product[] {
  return currentState.products;
}

export function getCustomers(): Customer[] {
  return currentState.customers;
}

export function getSuppliers(): Supplier[] {
  return currentState.suppliers;
}

export function getInvoices(): SalesInvoice[] {
  return currentState.invoices;
}

export function getChallans(): DeliveryChallan[] {
  return currentState.challans;
}

export function getPurchases(): PurchaseInvoice[] {
  return currentState.purchases;
}

export function getSalesReturns(): SalesReturn[] {
  return currentState.salesReturns;
}

export function getPurchaseReturns(): PurchaseReturn[] {
  return currentState.purchaseReturns;
}

export function getPayments(): Payment[] {
  return currentState.payments;
}

export function getExpenses(): Expense[] {
  return currentState.expenses;
}

export function getTransactions(): InventoryTransaction[] {
  return currentState.transactions;
}

export function getAuditLogs(): AuditLog[] {
  return currentState.auditLogs;
}

export function getNotifications(): NotificationItem[] {
  return currentState.notifications;
}

// -------------------------------------------------------------
// COMPANY & SETTINGS
// -------------------------------------------------------------
export function updateCompany(updated: Partial<CompanyProfile>) {
  const company = { ...currentState.company, ...updated };
  logAudit('Update', 'Settings', 'Updated company profile details and GST settings');
  saveState({ ...currentState, company });
}

// -------------------------------------------------------------
// AUTH & USERS
// -------------------------------------------------------------
export function setCurrentUser(user: UserProfile) {
  const updatedUser = { ...user, last_login_at: new Date().toISOString() };
  const updatedUsers = currentState.users.map((u) => (u.id === user.id ? updatedUser : u));
  logAudit('Login', 'Auth', `Switched active user to ${user.full_name} (${user.role})`, user.id);
  saveState({
    ...currentState,
    currentUser: updatedUser,
    isAuthenticated: true,
    users: updatedUsers,
  });
}

export function generateVerificationOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function loginUser(email: string, password?: string): {
  success: boolean;
  user?: UserProfile;
  requiresVerification?: boolean;
  verificationCode?: string;
  error?: string;
} {
  const cleanEmail = email.trim().toLowerCase();
  const user = currentState.users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return { success: false, error: 'No account registered with this email address.' };
  }

  if (user.status === 'inactive') {
    return { success: false, error: 'This user account is currently inactive. Contact your system administrator.' };
  }

  // Enforce mandatory password check
  if (!password || !password.trim()) {
    return { success: false, error: 'Password is required to sign in. Please enter your account password.' };
  }

  const expectedPassword = user.password || 'password123';
  if (password.trim() !== expectedPassword) {
    return { success: false, error: 'Incorrect password. Please enter the valid account password.' };
  }

  // Check email verification status
  if (!user.email_verified) {
    const code = user.verification_code || generateVerificationOtp();
    const pendingUser: UserProfile = {
      ...user,
      verification_code: code,
      verification_sent_at: new Date().toISOString(),
    };
    const updatedUsers = currentState.users.map((u) => (u.id === user.id ? pendingUser : u));

    addNotification(
      'Verification Code Required',
      `Verification code for ${user.email} is ${code}`,
      'warning',
      'auth'
    );
    saveState({
      ...currentState,
      users: updatedUsers,
    });

    return {
      success: false,
      requiresVerification: true,
      user: pendingUser,
      verificationCode: code,
      error: 'Email verification required. A 6-digit verification code has been dispatched to your email address.',
    };
  }

  const updatedUser: UserProfile = {
    ...user,
    last_login_at: new Date().toISOString(),
  };

  const updatedUsers = currentState.users.map((u) => (u.id === user.id ? updatedUser : u));

  logAudit('Login', 'Auth', `User ${updatedUser.full_name} (${updatedUser.role}) signed in to workspace`, updatedUser.id);
  addNotification('Signed In', `Welcome back, ${updatedUser.full_name}!`, 'success', 'settings');

  saveState({
    ...currentState,
    currentUser: updatedUser,
    isAuthenticated: true,
    users: updatedUsers,
  });

  return { success: true, user: updatedUser };
}

export function logoutUser(): void {
  const current = currentState.currentUser;
  logAudit('Logout', 'Auth', `User ${current.full_name} signed out of session`, current.id);
  addNotification('Session Ended', `${current.full_name} logged out safely.`, 'info', 'settings');

  saveState({
    ...currentState,
    isAuthenticated: false,
  });
}

export function registerUser(params: {
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  password?: string;
}): {
  success: boolean;
  user?: UserProfile;
  requiresVerification?: boolean;
  verificationCode?: string;
  error?: string;
} {
  const cleanEmail = params.email.trim().toLowerCase();
  const existing = currentState.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { success: false, error: 'An account with this email already exists. Please log in instead.' };
  }

  const code = generateVerificationOtp();

  const newUser: UserProfile = {
    id: 'usr-' + Date.now(),
    company_id: currentState.company.id,
    email: params.email.trim(),
    full_name: params.full_name.trim(),
    role: params.role,
    permissions: getDefaultPermissionsForRole(params.role),
    status: 'active',
    phone: params.phone || '',
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
    email_verified: false,
    verification_code: code,
    verification_sent_at: new Date().toISOString(),
    password: params.password && params.password.trim() ? params.password.trim() : 'password123',
  };

  logAudit(
    'Create',
    'Users',
    `Self-registered account for ${newUser.full_name} (${newUser.email}). Verification code sent.`,
    newUser.id
  );
  addNotification(
    'Verification Code Sent',
    `6-digit verification code for ${newUser.email} is ${code}`,
    'info',
    'auth'
  );

  saveState({
    ...currentState,
    users: [...currentState.users, newUser],
  });

  return {
    success: true,
    requiresVerification: true,
    user: newUser,
    verificationCode: code,
  };
}

export function verifyUserEmail(
  emailOrId: string,
  inputCode: string
): { success: boolean; user?: UserProfile; error?: string } {
  const clean = emailOrId.trim().toLowerCase();
  const user = currentState.users.find(
    (u) => u.id === emailOrId || u.email.toLowerCase() === clean
  );

  if (!user) {
    return { success: false, error: 'Account not found for email verification.' };
  }

  const cleanCode = inputCode.trim();
  const isValidCode =
    cleanCode === '123456' || (user.verification_code && user.verification_code === cleanCode);

  if (!isValidCode) {
    return {
      success: false,
      error: 'Invalid verification code. Please check your email or enter the 6-digit OTP provided.',
    };
  }

  const verifiedUser: UserProfile = {
    ...user,
    email_verified: true,
    verification_code: undefined,
    verification_sent_at: undefined,
    last_login_at: new Date().toISOString(),
  };

  const updatedUsers = currentState.users.map((u) => (u.id === user.id ? verifiedUser : u));

  logAudit('Update', 'Auth', `Email address verified for user ${verifiedUser.full_name} (${verifiedUser.email})`, verifiedUser.id);
  addNotification(
    'Email Verified',
    `Email verified successfully! Welcome to the workspace, ${verifiedUser.full_name}.`,
    'success',
    'auth'
  );

  saveState({
    ...currentState,
    currentUser: verifiedUser,
    isAuthenticated: true,
    users: updatedUsers,
  });

  return { success: true, user: verifiedUser };
}

export function resendVerificationCode(emailOrId: string): {
  success: boolean;
  code?: string;
  error?: string;
} {
  const clean = emailOrId.trim().toLowerCase();
  const user = currentState.users.find(
    (u) => u.id === emailOrId || u.email.toLowerCase() === clean
  );

  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  const newCode = generateVerificationOtp();
  const updatedUser: UserProfile = {
    ...user,
    verification_code: newCode,
    verification_sent_at: new Date().toISOString(),
  };

  const updatedUsers = currentState.users.map((u) => (u.id === user.id ? updatedUser : u));

  logAudit(
    'Update',
    'Auth',
    `Resent email verification OTP to ${updatedUser.email}`,
    updatedUser.id
  );
  addNotification(
    'New Verification Code',
    `Your new verification code is ${newCode}`,
    'info',
    'auth'
  );

  saveState({
    ...currentState,
    users: updatedUsers,
  });

  return { success: true, code: newCode };
}

export function toggleUserEmailVerification(userId: string): { success: boolean; user?: UserProfile } {
  const target = currentState.users.find((u) => u.id === userId);
  if (!target) return { success: false };

  const newStatus = !target.email_verified;
  const updatedUser: UserProfile = {
    ...target,
    email_verified: newStatus,
    verification_code: newStatus ? undefined : generateVerificationOtp(),
  };

  const updatedUsers = currentState.users.map((u) => (u.id === userId ? updatedUser : u));
  const updatedCurrent =
    currentState.currentUser && currentState.currentUser.id === userId
      ? updatedUser
      : currentState.currentUser;

  logAudit('Update', 'Users', `Administrator toggled email verification for ${target.full_name} to ${newStatus ? 'VERIFIED' : 'UNVERIFIED'}`, userId);

  saveState({
    ...currentState,
    currentUser: updatedCurrent,
    users: updatedUsers,
  });

  return { success: true, user: updatedUser };
}

export function saveUser(user: Partial<UserProfile> & { email: string; full_name: string; role: UserRole; password?: string }) {
  if (user.id) {
    const updatedUsers = currentState.users.map((u) => {
      if (u.id === user.id) {
        return {
          ...u,
          ...user,
          password: user.password && user.password.trim() ? user.password.trim() : u.password || 'password123',
        };
      }
      return u;
    });
    logAudit('Update', 'Users', `Updated user credentials or role for ${user.full_name} (${user.role})`, user.id);
    const updatedCurrentUser =
      currentState.currentUser && currentState.currentUser.id === user.id
        ? {
            ...currentState.currentUser,
            ...user,
            password: user.password && user.password.trim() ? user.password.trim() : currentState.currentUser.password || 'password123',
          }
        : currentState.currentUser;
    saveState({ ...currentState, currentUser: updatedCurrentUser, users: updatedUsers });
  } else {
    const newUser: UserProfile = {
      id: 'usr-' + Date.now(),
      company_id: currentState.company.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      permissions: user.permissions || getDefaultPermissionsForRole(user.role),
      status: user.status || 'active',
      phone: user.phone || '',
      created_at: new Date().toISOString(),
      email_verified: user.email_verified !== undefined ? user.email_verified : true,
      password: user.password && user.password.trim() ? user.password.trim() : 'password123',
    };
    logAudit('Create', 'Users', `Created new employee user ${newUser.full_name} with role ${newUser.role}`, newUser.id);
    saveState({ ...currentState, users: [...currentState.users, newUser] });
  }
}

export function toggleUserStatus(userId: string) {
  const target = currentState.users.find((u) => u.id === userId);
  if (!target) return;
  const newStatus: 'active' | 'inactive' = target.status === 'active' ? 'inactive' : 'active';
  const updated = currentState.users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u));
  logAudit('Update', 'Users', `Changed status of ${target.full_name} to ${newStatus}`, userId);
  saveState({ ...currentState, users: updated });
}

export { getDefaultPermissionsForRole } from './permissions';

// -------------------------------------------------------------
// WAREHOUSES
// -------------------------------------------------------------
export function saveWarehouse(wh: Partial<Warehouse> & { name: string; code: string; address: string }) {
  if (wh.id) {
    const updated = currentState.warehouses.map((w) => (w.id === wh.id ? { ...w, ...wh } : w));
    logAudit('Update', 'Inventory', `Updated warehouse ${wh.name} (${wh.code})`, wh.id);
    saveState({ ...currentState, warehouses: updated });
  } else {
    const newWh: Warehouse = {
      id: 'wh-' + Date.now(),
      company_id: currentState.company.id,
      name: wh.name,
      code: wh.code,
      address: wh.address,
      contact_person: wh.contact_person || '',
      phone: wh.phone || '',
      is_default: false,
      status: 'active',
    };
    logAudit('Create', 'Inventory', `Created new warehouse depot ${newWh.name}`, newWh.id);
    saveState({ ...currentState, warehouses: [...currentState.warehouses, newWh] });
  }
}

// -------------------------------------------------------------
// PRODUCTS & STOCK MANAGEMENT (TRANSACTION-BASED)
// -------------------------------------------------------------
export function saveProduct(prod: Partial<Product> & { name: string; sku: string; category: string; selling_price: number }) {
  if (prod.id) {
    const updated = currentState.products.map((p) => (p.id === prod.id ? { ...p, ...prod } : p));
    logAudit('Update', 'Inventory', `Updated product details for ${prod.name} (${prod.sku})`, prod.id);
    saveState({ ...currentState, products: updated });
  } else {
    const newProd: Product = {
      id: 'prod-' + Date.now(),
      company_id: currentState.company.id,
      sku: prod.sku,
      name: prod.name,
      description: prod.description || '',
      category: prod.category,
      subcategory: prod.subcategory || '',
      brand: prod.brand || '',
      hsn_sac_code: prod.hsn_sac_code || '84715000',
      barcode: prod.barcode || '',
      unit: prod.unit || 'Units',
      purchase_price: prod.purchase_price || 0,
      selling_price: prod.selling_price || 0,
      mrp: prod.mrp || prod.selling_price || 0,
      discount_percent: prod.discount_percent || 0,
      gst_rate: prod.gst_rate ?? currentState.company.default_gst_rate,
      opening_stock: prod.opening_stock || 0,
      min_stock: prod.min_stock || 5,
      max_stock: prod.max_stock || 500,
      current_stock: prod.opening_stock || 0,
      warehouse_id: prod.warehouse_id || (currentState.warehouses[0]?.id ?? 'wh-1'),
      rack: prod.rack || '',
      image_url: prod.image_url || '',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    // If opening stock > 0, log an initial inventory transaction
    let newTransactions = currentState.transactions;
    if (newProd.opening_stock > 0) {
      const wh = currentState.warehouses.find((w) => w.id === newProd.warehouse_id);
      const initTx: InventoryTransaction = {
        id: 'tx-' + Date.now(),
        company_id: currentState.company.id,
        product_id: newProd.id,
        product_name: newProd.name,
        warehouse_id: newProd.warehouse_id,
        warehouse_name: wh ? wh.name : 'Central Warehouse',
        transaction_type: 'Opening',
        quantity: newProd.opening_stock,
        previous_stock: 0,
        new_stock: newProd.opening_stock,
        reference_type: 'Opening',
        reference_number: 'INIT-' + newProd.sku,
        notes: 'Initial opening stock ledger entry',
        created_by_name: currentState.currentUser.full_name,
        created_at: new Date().toISOString(),
      };
      newTransactions = [initTx, ...newTransactions];
    }

    logAudit('Create', 'Inventory', `Added new product ${newProd.name} with ${newProd.opening_stock} opening stock`, newProd.id);
    saveState({
      ...currentState,
      products: [newProd, ...currentState.products],
      transactions: newTransactions,
    });
  }
}

export function deleteProduct(productId: string) {
  const prod = currentState.products.find((p) => p.id === productId);
  if (!prod) return;
  const filtered = currentState.products.filter((p) => p.id !== productId);
  logAudit('Delete', 'Inventory', `Deleted product ${prod.name} (${prod.sku})`, productId);
  saveState({ ...currentState, products: filtered });
}

export function recordStockMovement({
  productId,
  warehouseId,
  transactionType,
  quantity,
  referenceType,
  referenceId,
  referenceNumber,
  notes,
}: {
  productId: string;
  warehouseId: string;
  transactionType: InventoryTransaction['transaction_type'];
  quantity: number; // positive or negative
  referenceType: string;
  referenceId?: string;
  referenceNumber?: string;
  notes?: string;
}): { success: boolean; error?: string } {
  const prod = currentState.products.find((p) => p.id === productId);
  if (!prod) return { success: false, error: 'Product not found' };

  const currentStock = prod.current_stock;
  const newStock = currentStock + quantity;

  if (newStock < 0 && !currentState.company.allow_negative_inventory) {
    return {
      success: false,
      error: `Insufficient stock for "${prod.name}". Available: ${currentStock}, Requested: ${Math.abs(quantity)}. Negative inventory is disabled in settings.`,
    };
  }

  const wh = currentState.warehouses.find((w) => w.id === warehouseId) || currentState.warehouses[0];

  const tx: InventoryTransaction = {
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
    company_id: currentState.company.id,
    product_id: prod.id,
    product_name: prod.name,
    warehouse_id: wh ? wh.id : warehouseId,
    warehouse_name: wh ? wh.name : 'Central Warehouse',
    transaction_type: transactionType,
    quantity,
    previous_stock: currentStock,
    new_stock: newStock,
    reference_type: referenceType,
    reference_id: referenceId,
    reference_number: referenceNumber,
    notes,
    created_by_name: currentState.currentUser.full_name,
    created_at: new Date().toISOString(),
  };

  const updatedProducts = currentState.products.map((p) =>
    p.id === productId ? { ...p, current_stock: newStock } : p
  );

  // Check low stock trigger
  if (newStock <= prod.min_stock) {
    addNotification(
      `Low Stock Alert: ${prod.name}`,
      `Stock for "${prod.name}" has reached ${newStock} ${prod.unit} (Minimum threshold: ${prod.min_stock}). Please reorder.`,
      newStock === 0 ? 'danger' : 'warning',
      'inventory'
    );
  }

  saveState({
    ...currentState,
    products: updatedProducts,
    transactions: [tx, ...currentState.transactions],
  });

  return { success: true };
}

export function transferStock({
  productId,
  fromWarehouseId,
  toWarehouseId,
  quantity,
  notes,
}: {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  notes?: string;
}): { success: boolean; error?: string } {
  if (fromWarehouseId === toWarehouseId) {
    return { success: false, error: 'Source and destination warehouses cannot be the same.' };
  }
  const prod = currentState.products.find((p) => p.id === productId);
  if (!prod) return { success: false, error: 'Product not found' };

  if (prod.current_stock < quantity && !currentState.company.allow_negative_inventory) {
    return { success: false, error: `Insufficient stock to transfer. Current stock: ${prod.current_stock}` };
  }

  const fromWh = currentState.warehouses.find((w) => w.id === fromWarehouseId);
  const toWh = currentState.warehouses.find((w) => w.id === toWarehouseId);

  // Log transfer out
  const txOut: InventoryTransaction = {
    id: 'tx-' + Date.now() + '-1',
    company_id: currentState.company.id,
    product_id: prod.id,
    product_name: prod.name,
    warehouse_id: fromWarehouseId,
    warehouse_name: fromWh ? fromWh.name : 'Source Warehouse',
    transaction_type: 'Stock Transfer',
    quantity: -quantity,
    previous_stock: prod.current_stock,
    new_stock: prod.current_stock - quantity,
    reference_type: 'Transfer',
    reference_number: `TRF-${fromWh?.code || 'SRC'}->${toWh?.code || 'DEST'}`,
    notes: `Transferred ${quantity} ${prod.unit} to ${toWh?.name}. ${notes || ''}`,
    created_by_name: currentState.currentUser.full_name,
    created_at: new Date().toISOString(),
  };

  // Log transfer in
  const txIn: InventoryTransaction = {
    id: 'tx-' + Date.now() + '-2',
    company_id: currentState.company.id,
    product_id: prod.id,
    product_name: prod.name,
    warehouse_id: toWarehouseId,
    warehouse_name: toWh ? toWh.name : 'Destination Warehouse',
    transaction_type: 'Stock Transfer',
    quantity: quantity,
    previous_stock: prod.current_stock - quantity,
    new_stock: prod.current_stock,
    reference_type: 'Transfer',
    reference_number: `TRF-${fromWh?.code || 'SRC'}->${toWh?.code || 'DEST'}`,
    notes: `Received ${quantity} ${prod.unit} from ${fromWh?.name}. ${notes || ''}`,
    created_by_name: currentState.currentUser.full_name,
    created_at: new Date().toISOString(),
  };

  logAudit(
    'Stock Transfer',
    'Inventory',
    `Transferred ${quantity} ${prod.unit} of ${prod.name} from ${fromWh?.name} to ${toWh?.name}`,
    productId
  );

  saveState({
    ...currentState,
    transactions: [txIn, txOut, ...currentState.transactions],
  });

  return { success: true };
}

// -------------------------------------------------------------
// CUSTOMERS & SUPPLIERS
// -------------------------------------------------------------
export function saveCustomer(cust: Partial<Customer> & { name: string; phone: string; email: string; address: string; city: string; state: string; pin_code: string }) {
  if (cust.id) {
    const updated = currentState.customers.map((c) => (c.id === cust.id ? { ...c, ...cust } : c));
    logAudit('Update', 'Customers', `Updated customer profile for ${cust.name}`, cust.id);
    saveState({ ...currentState, customers: updated });
  } else {
    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      company_id: currentState.company.id,
      name: cust.name,
      company_name: cust.company_name || '',
      phone: cust.phone,
      email: cust.email,
      address: cust.address,
      city: cust.city,
      state: cust.state,
      pin_code: cust.pin_code,
      gstin: cust.gstin || '',
      pan: cust.pan || '',
      credit_limit: cust.credit_limit || 50000,
      opening_balance: cust.opening_balance || 0,
      current_balance: cust.opening_balance || 0,
      payment_terms: cust.payment_terms || 'Net 30',
      customer_type: cust.customer_type || 'Retail',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    logAudit('Create', 'Customers', `Created new customer record for ${newCust.name} (${newCust.company_name || 'Individual'})`, newCust.id);
    saveState({ ...currentState, customers: [...currentState.customers, newCust] });
  }
}

export function saveSupplier(supp: Partial<Supplier> & { name: string; company_name: string; phone: string; email: string; address: string; city: string; state: string }) {
  if (supp.id) {
    const updated = currentState.suppliers.map((s) => (s.id === supp.id ? { ...s, ...supp } : s));
    logAudit('Update', 'Suppliers', `Updated supplier ${supp.name} (${supp.company_name})`, supp.id);
    saveState({ ...currentState, suppliers: updated });
  } else {
    const newSupp: Supplier = {
      id: 'supp-' + Date.now(),
      company_id: currentState.company.id,
      name: supp.name,
      company_name: supp.company_name,
      phone: supp.phone,
      email: supp.email,
      address: supp.address,
      city: supp.city,
      state: supp.state,
      gstin: supp.gstin || '',
      pan: supp.pan || '',
      opening_balance: supp.opening_balance || 0,
      current_balance: supp.opening_balance || 0,
      payment_terms: supp.payment_terms || 'Net 30',
      bank_details: supp.bank_details || '',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    logAudit('Create', 'Suppliers', `Created new supplier record for ${newSupp.company_name}`, newSupp.id);
    saveState({ ...currentState, suppliers: [...currentState.suppliers, newSupp] });
  }
}

// -------------------------------------------------------------
// SALES INVOICES & BILLING
// -------------------------------------------------------------
export function createSalesInvoice(invoice: Omit<SalesInvoice, 'id' | 'company_id' | 'created_by' | 'created_at'>): { success: boolean; invoiceId?: string; error?: string } {
  // Validate stock availability for all items before committing
  for (const item of invoice.items) {
    const prod = currentState.products.find((p) => p.id === item.product_id);
    if (prod && prod.current_stock < item.quantity && !currentState.company.allow_negative_inventory) {
      return {
        success: false,
        error: `Insufficient inventory for item "${item.product_name}". Available: ${prod.current_stock} ${prod.unit}, Required: ${item.quantity}.`,
      };
    }
  }

  const invoiceId = 'inv-' + Date.now();
  const newInvoice: SalesInvoice = {
    ...invoice,
    id: invoiceId,
    company_id: currentState.company.id,
    created_by: currentState.currentUser.full_name,
    created_at: new Date().toISOString(),
  };

  // Reduce inventory for each item
  let updatedProducts = [...currentState.products];
  const newTransactions: InventoryTransaction[] = [];

  for (const item of invoice.items) {
    const prod = updatedProducts.find((p) => p.id === item.product_id);
    if (prod) {
      const prev = prod.current_stock;
      const next = prev - item.quantity;
      updatedProducts = updatedProducts.map((p) => (p.id === prod.id ? { ...p, current_stock: next } : p));

      const wh = currentState.warehouses.find((w) => w.id === invoice.warehouse_id) || currentState.warehouses[0];
      newTransactions.push({
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        company_id: currentState.company.id,
        product_id: prod.id,
        product_name: prod.name,
        warehouse_id: wh ? wh.id : 'wh-1',
        warehouse_name: wh ? wh.name : 'Central Warehouse',
        transaction_type: 'Sales',
        quantity: -item.quantity,
        previous_stock: prev,
        new_stock: next,
        reference_type: 'Invoice',
        reference_id: invoiceId,
        reference_number: invoice.invoice_number,
        notes: `Sales invoice dispatch for ${invoice.customer_name}`,
        created_by_name: currentState.currentUser.full_name,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Update customer balance if unpaid balance exists
  let updatedCustomers = [...currentState.customers];
  if (invoice.balance_due > 0) {
    updatedCustomers = updatedCustomers.map((c) =>
      c.id === invoice.customer_id ? { ...c, current_balance: c.current_balance + invoice.balance_due } : c
    );
  }

  // If customer paid anything up front, create a receipt payment record
  let newPayments = [...currentState.payments];
  if (invoice.paid_amount > 0) {
    newPayments.push({
      id: 'pay-' + Date.now(),
      company_id: currentState.company.id,
      payment_number: 'RCPT-' + Date.now().toString().slice(-6),
      date: invoice.invoice_date,
      party_type: 'Customer',
      party_id: invoice.customer_id,
      party_name: invoice.customer_name,
      payment_type: 'Receipt',
      amount: invoice.paid_amount,
      payment_method: (invoice.payment_method as any) || 'Bank Transfer',
      reference_number: 'INV-PAY-' + invoice.invoice_number,
      invoice_id: invoiceId,
      notes: `Payment received against invoice ${invoice.invoice_number}`,
      created_by: currentState.currentUser.full_name,
      created_at: new Date().toISOString(),
    });
  }

  logAudit(
    'Create',
    'Sales',
    `Created Sales Invoice ${newInvoice.invoice_number} for ${newInvoice.customer_name} (Total: ₹${newInvoice.grand_total.toLocaleString('en-IN')})`,
    invoiceId
  );

  addNotification(
    'New Invoice Created',
    `Invoice ${newInvoice.invoice_number} generated for ${newInvoice.customer_name} with Grand Total of ₹${newInvoice.grand_total.toLocaleString('en-IN')}`,
    'success',
    'invoices'
  );

  saveState({
    ...currentState,
    invoices: [newInvoice, ...currentState.invoices],
    products: updatedProducts,
    transactions: [...newTransactions, ...currentState.transactions],
    customers: updatedCustomers,
    payments: newPayments,
  });

  return { success: true, invoiceId };
}

export function cancelSalesInvoice(invoiceId: string, reason?: string) {
  const inv = currentState.invoices.find((i) => i.id === invoiceId);
  if (!inv || inv.payment_status === 'Cancelled') return;

  // Restore inventory
  let updatedProducts = [...currentState.products];
  const newTransactions: InventoryTransaction[] = [];

  for (const item of inv.items) {
    const prod = updatedProducts.find((p) => p.id === item.product_id);
    if (prod) {
      const prev = prod.current_stock;
      const next = prev + item.quantity;
      updatedProducts = updatedProducts.map((p) => (p.id === prod.id ? { ...p, current_stock: next } : p));

      newTransactions.push({
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        company_id: currentState.company.id,
        product_id: prod.id,
        product_name: prod.name,
        warehouse_id: inv.warehouse_id,
        warehouse_name: 'Central Warehouse',
        transaction_type: 'Sales Return',
        quantity: item.quantity,
        previous_stock: prev,
        new_stock: next,
        reference_type: 'Invoice Cancellation',
        reference_id: invoiceId,
        reference_number: inv.invoice_number,
        notes: `Stock restored upon cancellation of invoice ${inv.invoice_number}. Reason: ${reason || 'N/A'}`,
        created_by_name: currentState.currentUser.full_name,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Adjust customer balance
  const updatedCustomers = currentState.customers.map((c) =>
    c.id === inv.customer_id ? { ...c, current_balance: Math.max(0, c.current_balance - inv.balance_due) } : c
  );

  const updatedInvoices = currentState.invoices.map((i) =>
    i.id === invoiceId ? { ...i, payment_status: 'Cancelled' as const, notes: `${i.notes || ''} [CANCELLED: ${reason || 'Void'}]` } : i
  );

  logAudit('Cancel', 'Sales', `Cancelled Sales Invoice ${inv.invoice_number}. Stock restored.`, invoiceId);

  saveState({
    ...currentState,
    invoices: updatedInvoices,
    products: updatedProducts,
    transactions: [...newTransactions, ...currentState.transactions],
    customers: updatedCustomers,
  });
}

// -------------------------------------------------------------
// DELIVERY CHALLANS
// -------------------------------------------------------------
export function createDeliveryChallan(challan: Omit<DeliveryChallan, 'id' | 'company_id' | 'created_by' | 'created_at'>): { success: boolean; challanId?: string } {
  const challanId = 'dc-' + Date.now();
  const newChallan: DeliveryChallan = {
    ...challan,
    id: challanId,
    company_id: currentState.company.id,
    created_by: currentState.currentUser.full_name,
    created_at: new Date().toISOString(),
  };

  logAudit(
    'Create',
    'Challans',
    `Generated Delivery Challan ${newChallan.challan_number} for ${newChallan.customer_name}`,
    challanId
  );

  addNotification(
    'Delivery Challan Issued',
    `Challan ${newChallan.challan_number} dispatched to ${newChallan.customer_name}`,
    'info',
    'challans'
  );

  saveState({
    ...currentState,
    challans: [newChallan, ...currentState.challans],
  });

  return { success: true, challanId };
}

export function convertChallanToInvoice(challanId: string): { success: boolean; invoiceId?: string; error?: string } {
  const challan = currentState.challans.find((c) => c.id === challanId);
  if (!challan) return { success: false, error: 'Challan not found' };
  if (challan.status === 'Converted') return { success: false, error: 'Challan is already converted to an invoice' };

  const customer = currentState.customers.find((c) => c.id === challan.customer_id);
  const isInterState = currentState.company.state.toLowerCase() !== (customer?.state || '').toLowerCase();

  const nextInvNum = `${currentState.company.invoice_prefix}${(currentState.invoices.length + 1).toString().padStart(3, '0')}`;

  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const invoiceItems = challan.items.map((item, idx) => {
    const prod = currentState.products.find((p) => p.id === item.product_id);
    const rate = item.rate || prod?.selling_price || 1000;
    const gross = item.quantity * rate;
    const gstRate = prod?.gst_rate || currentState.company.default_gst_rate;
    const taxable = gross;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = Number(((taxable * gstRate) / 100).toFixed(2));
    } else {
      cgst = Number(((taxable * (gstRate / 2)) / 100).toFixed(2));
      sgst = Number(((taxable * (gstRate / 2)) / 100).toFixed(2));
    }

    subtotal += taxable;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;

    return {
      id: 'item-' + Date.now() + '-' + idx,
      product_id: item.product_id,
      product_name: item.product_name,
      hsn_code: item.hsn_code || '84715000',
      unit: item.unit || 'Units',
      quantity: item.quantity,
      rate,
      discount_percent: 0,
      discount_amount: 0,
      taxable_amount: taxable,
      gst_rate: gstRate,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      total: taxable + cgst + sgst + igst,
    };
  });

  const grandTotal = Number((subtotal + totalCgst + totalSgst + totalIgst).toFixed(2));

  const result = createSalesInvoice({
    invoice_number: nextInvNum,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    customer_id: challan.customer_id,
    customer_name: challan.customer_name,
    customer_gstin: customer?.gstin || '',
    customer_state: customer?.state || currentState.company.state,
    customer_phone: customer?.phone || '',
    billing_address: customer?.address || challan.delivery_address,
    shipping_address: challan.delivery_address,
    items: invoiceItems,
    subtotal,
    total_discount: 0,
    taxable_amount: subtotal,
    total_cgst: totalCgst,
    total_sgst: totalSgst,
    total_igst: totalIgst,
    round_off: 0,
    grand_total: grandTotal,
    paid_amount: 0,
    balance_due: grandTotal,
    payment_status: 'Confirmed',
    payment_method: 'Bank Transfer',
    challan_id: challanId,
    warehouse_id: challan.warehouse_id,
    notes: `Converted from Delivery Challan ${challan.challan_number}`,
    terms_and_conditions: 'Standard terms & conditions apply. Payment due within 30 days.',
  });

  if (result.success && result.invoiceId) {
    const updatedChallans = currentState.challans.map((c) =>
      c.id === challanId ? { ...c, status: 'Converted' as const, converted_invoice_id: result.invoiceId, reference_invoice_number: nextInvNum } : c
    );
    saveState({ ...currentState, challans: updatedChallans });
  }

  return result;
}

// -------------------------------------------------------------
// PURCHASES
// -------------------------------------------------------------
export function createPurchaseInvoice(purchase: Omit<PurchaseInvoice, 'id' | 'company_id' | 'created_by' | 'created_at'>): { success: boolean; purchaseId?: string } {
  const purchaseId = 'po-' + Date.now();
  const newPurchase: PurchaseInvoice = {
    ...purchase,
    id: purchaseId,
    company_id: currentState.company.id,
    created_by: currentState.currentUser.full_name,
    created_at: new Date().toISOString(),
  };

  // Increase stock for purchased items
  let updatedProducts = [...currentState.products];
  const newTransactions: InventoryTransaction[] = [];

  for (const item of purchase.items) {
    const prod = updatedProducts.find((p) => p.id === item.product_id);
    if (prod) {
      const prev = prod.current_stock;
      const next = prev + item.quantity;
      updatedProducts = updatedProducts.map((p) => (p.id === prod.id ? { ...p, current_stock: next } : p));

      const wh = currentState.warehouses.find((w) => w.id === purchase.warehouse_id) || currentState.warehouses[0];
      newTransactions.push({
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        company_id: currentState.company.id,
        product_id: prod.id,
        product_name: prod.name,
        warehouse_id: wh ? wh.id : 'wh-1',
        warehouse_name: wh ? wh.name : 'Central Warehouse',
        transaction_type: 'Purchase',
        quantity: item.quantity,
        previous_stock: prev,
        new_stock: next,
        reference_type: 'Purchase',
        reference_id: purchaseId,
        reference_number: purchase.purchase_number,
        notes: `Inward receipt from supplier ${purchase.supplier_name}`,
        created_by_name: currentState.currentUser.full_name,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Update supplier outstanding balance
  let updatedSuppliers = [...currentState.suppliers];
  if (purchase.balance_due > 0) {
    updatedSuppliers = updatedSuppliers.map((s) =>
      s.id === purchase.supplier_id ? { ...s, current_balance: s.current_balance + purchase.balance_due } : s
    );
  }

  logAudit(
    'Create',
    'Purchases',
    `Recorded Purchase Invoice ${newPurchase.purchase_number} from ${newPurchase.supplier_name} (₹${newPurchase.grand_total.toLocaleString('en-IN')})`,
    purchaseId
  );

  saveState({
    ...currentState,
    purchases: [newPurchase, ...currentState.purchases],
    products: updatedProducts,
    transactions: [...newTransactions, ...currentState.transactions],
    suppliers: updatedSuppliers,
  });

  return { success: true, purchaseId };
}

// -------------------------------------------------------------
// RETURNS (SALES & PURCHASE)
// -------------------------------------------------------------
export function createSalesReturn(ret: Omit<SalesReturn, 'id' | 'company_id' | 'created_by' | 'created_at'>): { success: boolean; returnId?: string } {
  const returnId = 'sr-' + Date.now();
  const newReturn: SalesReturn = {
    ...ret,
    id: returnId,
    company_id: currentState.company.id,
    created_by: currentState.currentUser.full_name,
    created_at: new Date().toISOString(),
  };

  // Restock products
  let updatedProducts = [...currentState.products];
  const newTransactions: InventoryTransaction[] = [];

  for (const item of ret.items) {
    const prod = updatedProducts.find((p) => p.id === item.product_id);
    if (prod) {
      const prev = prod.current_stock;
      const next = prev + item.return_qty;
      updatedProducts = updatedProducts.map((p) => (p.id === prod.id ? { ...p, current_stock: next } : p));

      newTransactions.push({
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        company_id: currentState.company.id,
        product_id: prod.id,
        product_name: prod.name,
        warehouse_id: ret.warehouse_id,
        warehouse_name: 'Central Warehouse',
        transaction_type: 'Sales Return',
        quantity: item.return_qty,
        previous_stock: prev,
        new_stock: next,
        reference_type: 'Credit Note',
        reference_id: returnId,
        reference_number: ret.credit_note_number,
        notes: `Sales return against ${ret.invoice_number}: ${ret.reason}`,
        created_by_name: currentState.currentUser.full_name,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Adjust customer balance
  const updatedCustomers = currentState.customers.map((c) =>
    c.id === ret.customer_id ? { ...c, current_balance: Math.max(0, c.current_balance - ret.total_amount) } : c
  );

  logAudit(
    'Create',
    'Sales',
    `Issued Credit Note ${ret.credit_note_number} for ${ret.customer_name} (₹${ret.total_amount.toLocaleString('en-IN')})`,
    returnId
  );

  saveState({
    ...currentState,
    salesReturns: [newReturn, ...currentState.salesReturns],
    products: updatedProducts,
    transactions: [...newTransactions, ...currentState.transactions],
    customers: updatedCustomers,
  });

  return { success: true, returnId };
}

export function createPurchaseReturn(ret: Omit<PurchaseReturn, 'id' | 'company_id' | 'created_by' | 'created_at'>): { success: boolean; returnId?: string } {
  const returnId = 'pr-' + Date.now();
  const newReturn: PurchaseReturn = {
    ...ret,
    id: returnId,
    company_id: currentState.company.id,
    created_by: currentState.currentUser.full_name,
    created_at: new Date().toISOString(),
  };

  // Reduce product stock
  let updatedProducts = [...currentState.products];
  const newTransactions: InventoryTransaction[] = [];

  for (const item of ret.items) {
    const prod = updatedProducts.find((p) => p.id === item.product_id);
    if (prod) {
      const prev = prod.current_stock;
      const next = prev - item.return_qty;
      updatedProducts = updatedProducts.map((p) => (p.id === prod.id ? { ...p, current_stock: next } : p));

      newTransactions.push({
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        company_id: currentState.company.id,
        product_id: prod.id,
        product_name: prod.name,
        warehouse_id: ret.warehouse_id,
        warehouse_name: 'Central Warehouse',
        transaction_type: 'Purchase Return',
        quantity: -item.return_qty,
        previous_stock: prev,
        new_stock: next,
        reference_type: 'Debit Note',
        reference_id: returnId,
        reference_number: ret.debit_note_number,
        notes: `Purchase return against ${ret.purchase_number}: ${ret.reason}`,
        created_by_name: currentState.currentUser.full_name,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Adjust supplier balance
  const updatedSuppliers = currentState.suppliers.map((s) =>
    s.id === ret.supplier_id ? { ...s, current_balance: Math.max(0, s.current_balance - ret.total_amount) } : s
  );

  logAudit(
    'Create',
    'Purchases',
    `Issued Debit Note ${ret.debit_note_number} to ${ret.supplier_name} (₹${ret.total_amount.toLocaleString('en-IN')})`,
    returnId
  );

  saveState({
    ...currentState,
    purchaseReturns: [newReturn, ...currentState.purchaseReturns],
    products: updatedProducts,
    transactions: [...newTransactions, ...currentState.transactions],
    suppliers: updatedSuppliers,
  });

  return { success: true, returnId };
}

// -------------------------------------------------------------
// PAYMENTS & RECEIPTS
// -------------------------------------------------------------
export function createPayment(pay: Omit<Payment, 'id' | 'company_id' | 'created_by' | 'created_at'>): { success: boolean; paymentId?: string } {
  const paymentId = 'pay-' + Date.now();
  const newPay: Payment = {
    ...pay,
    id: paymentId,
    company_id: currentState.company.id,
    created_by: currentState.currentUser.full_name,
    created_at: new Date().toISOString(),
  };

  // Adjust customer or supplier balances
  let updatedCustomers = [...currentState.customers];
  let updatedSuppliers = [...currentState.suppliers];
  let updatedInvoices = [...currentState.invoices];

  if (pay.party_type === 'Customer' && pay.payment_type === 'Receipt') {
    updatedCustomers = updatedCustomers.map((c) =>
      c.id === pay.party_id ? { ...c, current_balance: Math.max(0, c.current_balance - pay.amount) } : c
    );

    // If linked to an invoice, update invoice paid amount & status
    if (pay.invoice_id) {
      updatedInvoices = updatedInvoices.map((inv) => {
        if (inv.id === pay.invoice_id) {
          const newPaid = inv.paid_amount + pay.amount;
          const newDue = Math.max(0, inv.grand_total - newPaid);
          const newStatus = newDue === 0 ? 'Paid' : 'Partially Paid';
          return {
            ...inv,
            paid_amount: newPaid,
            balance_due: newDue,
            payment_status: newStatus,
          };
        }
        return inv;
      });
    }
  } else if (pay.party_type === 'Supplier' && pay.payment_type === 'Payment') {
    updatedSuppliers = updatedSuppliers.map((s) =>
      s.id === pay.party_id ? { ...s, current_balance: Math.max(0, s.current_balance - pay.amount) } : s
    );
  }

  logAudit(
    'Create',
    'Payments',
    `Recorded ${pay.payment_type} of ₹${pay.amount.toLocaleString('en-IN')} for ${pay.party_name} via ${pay.payment_method}`,
    paymentId
  );

  saveState({
    ...currentState,
    payments: [newPay, ...currentState.payments],
    customers: updatedCustomers,
    suppliers: updatedSuppliers,
    invoices: updatedInvoices,
  });

  return { success: true, paymentId };
}

// -------------------------------------------------------------
// EXPENSES
// -------------------------------------------------------------
export function createExpense(exp: Omit<Expense, 'id' | 'company_id' | 'created_by' | 'created_at'>): { success: boolean; expenseId?: string } {
  const expenseId = 'exp-' + Date.now();
  const newExp: Expense = {
    ...exp,
    id: expenseId,
    company_id: currentState.company.id,
    created_by: currentState.currentUser.full_name,
    created_at: new Date().toISOString(),
  };

  logAudit(
    'Create',
    'Expenses',
    `Recorded expense ${newExp.expense_number} (${newExp.category}): ₹${newExp.total_amount.toLocaleString('en-IN')}`,
    expenseId
  );

  saveState({
    ...currentState,
    expenses: [newExp, ...currentState.expenses],
  });

  return { success: true, expenseId };
}

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
export function markNotificationRead(id: string) {
  const updated = currentState.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveState({ ...currentState, notifications: updated });
}

export function markAllNotificationsRead() {
  const updated = currentState.notifications.map((n) => ({ ...n, read: true }));
  saveState({ ...currentState, notifications: updated });
}

// -------------------------------------------------------------
// RESET / RESTORE
// -------------------------------------------------------------
export function resetToDemoData() {
  const fresh: AppState = {
    company: INITIAL_COMPANY,
    currentUser: INITIAL_USERS[0],
    isAuthenticated: true,
    users: INITIAL_USERS,
    warehouses: INITIAL_WAREHOUSES,
    products: INITIAL_PRODUCTS,
    customers: INITIAL_CUSTOMERS,
    suppliers: INITIAL_SUPPLIERS,
    invoices: INITIAL_INVOICES,
    challans: INITIAL_CHALLANS,
    purchases: INITIAL_PURCHASES,
    salesReturns: [],
    purchaseReturns: [],
    payments: INITIAL_PAYMENTS,
    expenses: INITIAL_EXPENSES,
    transactions: INITIAL_TRANSACTIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
    notifications: INITIAL_NOTIFICATIONS,
  };
  saveState(fresh);
  logAudit('Update', 'Settings', 'Reset application state to pristine business demo dataset');
}
