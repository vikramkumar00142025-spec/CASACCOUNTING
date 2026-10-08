import { Permission, UserProfile, UserRole } from '@/types';

export interface PermissionItem {
  key: Permission;
  label: string;
  description: string;
  tabs?: string[];
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  badge: string;
  color: string;
  items: PermissionItem[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'sales',
    name: 'Sales & Invoicing',
    description: 'Tax invoices, proformas, delivery challans, and credit notes',
    badge: 'Sales Category',
    color: 'blue',
    items: [
      {
        key: 'view_sales',
        label: 'View Sales Invoices & Credit Notes',
        description: 'Browse, view, and print customer tax invoices and sales returns',
        tabs: ['invoices', 'sales-returns'],
      },
      {
        key: 'create_sales',
        label: 'Create Sales Invoices',
        description: 'Generate new GST tax invoices and proforma billing',
      },
      {
        key: 'edit_sales',
        label: 'Edit Sales Invoices',
        description: 'Modify drafts and update sales invoice lines',
      },
      {
        key: 'delete_sales',
        label: 'Cancel & Delete Invoices',
        description: 'Void or remove unapproved sales invoices',
      },
      {
        key: 'manage_challans',
        label: 'Delivery Challans',
        description: 'Create, inspect, and convert delivery challans to tax invoices',
        tabs: ['challans'],
      },
    ],
  },
  {
    id: 'customers',
    name: 'Customer Directory',
    description: 'Client profiles, shipping addresses, GSTIN, and credit ledgers',
    badge: 'Sales Related',
    color: 'cyan',
    items: [
      {
        key: 'view_customers',
        label: 'View Customers Directory',
        description: 'Search and inspect customer master records',
        tabs: ['customers'],
      },
      {
        key: 'create_customers',
        label: 'Add New Customers',
        description: 'Onboard clients with GSTIN and billing address',
      },
      {
        key: 'edit_customers',
        label: 'Edit Customer Profiles',
        description: 'Update client details and credit terms',
      },
      {
        key: 'delete_customers',
        label: 'Delete Customers',
        description: 'Remove obsolete client accounts',
      },
    ],
  },
  {
    id: 'inventory',
    name: 'Stock Items & Warehouses',
    description: 'Product catalog, SKU inventory, stock adjustments, and depot transfers',
    badge: 'Inventory Category',
    color: 'amber',
    items: [
      {
        key: 'view_products',
        label: 'View Stock Items & Catalog',
        description: 'View inventory items, on-hand stock quantities, and HSN codes',
        tabs: ['products'],
      },
      {
        key: 'create_products',
        label: 'Add New Stock Items',
        description: 'Register new goods, raw materials, or services in catalog',
      },
      {
        key: 'edit_products',
        label: 'Edit Stock Items',
        description: 'Update selling prices, cost rates, and reorder levels',
      },
      {
        key: 'delete_products',
        label: 'Archive & Delete Stock Items',
        description: 'Remove discontinued products from inventory catalog',
      },
      {
        key: 'manage_inventory',
        label: 'Warehouses & Stock Movements',
        description: 'Perform stock adjustments, view movement logs, and manage warehouse depots',
        tabs: ['warehouses', 'inventory-transactions'],
      },
    ],
  },
  {
    id: 'purchases',
    name: 'Purchases & Suppliers',
    description: 'Vendor bills, procurement orders, and debit notes',
    badge: 'Procurement',
    color: 'emerald',
    items: [
      {
        key: 'view_purchases',
        label: 'View Purchase Bills',
        description: 'Inspect vendor purchase bills and debit notes',
        tabs: ['purchases', 'purchase-returns'],
      },
      {
        key: 'create_purchases',
        label: 'Record Purchase Bills',
        description: 'Enter new inward vendor tax invoices and goods receipts',
      },
      {
        key: 'edit_purchases',
        label: 'Edit Purchase Orders',
        description: 'Modify vendor bills and update unit cost prices',
      },
      {
        key: 'delete_purchases',
        label: 'Cancel Purchase Invoices',
        description: 'Void or cancel procurement records',
      },
      {
        key: 'view_suppliers',
        label: 'View Supplier Directory',
        description: 'Browse vendor profiles and payable balances',
        tabs: ['suppliers'],
      },
      {
        key: 'create_suppliers',
        label: 'Register New Suppliers',
        description: 'Add new vendors and distributors',
      },
    ],
  },
  {
    id: 'finance',
    name: 'Finance & Accounting',
    description: 'Payments, receipts, operational expenses, and general ledgers',
    badge: 'Accountant Only',
    color: 'purple',
    items: [
      {
        key: 'manage_payments',
        label: 'Payments & Receipts Register',
        description: 'Record customer payment collections and vendor disbursements',
        tabs: ['payments'],
      },
      {
        key: 'manage_expenses',
        label: 'Operational Expenses',
        description: 'Track office expenses, utilities, and vendor payouts',
        tabs: ['expenses'],
      },
      {
        key: 'view_accounting',
        label: 'General Account Ledgers',
        description: 'View double-entry journal ledgers and trial balances',
        tabs: ['accounting'],
      },
    ],
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Business summaries, tax analytics, and executive overview',
    badge: 'Reporting',
    color: 'indigo',
    items: [
      {
        key: 'view_dashboard',
        label: 'Executive Dashboard',
        description: 'Access main overview with sales, inventory, and revenue graphs',
        tabs: ['dashboard'],
      },
      {
        key: 'view_reports',
        label: 'Business & GST Reports',
        description: 'Access GSTR-1, GSTR-3B tax reports and profit & loss analytics',
        tabs: ['reports'],
      },
    ],
  },
  {
    id: 'admin',
    name: 'System Administration',
    description: 'User access control, security logs, and company settings',
    badge: 'Admin Only',
    color: 'slate',
    items: [
      {
        key: 'manage_users',
        label: 'User Management & Permissions Checklist',
        description: 'Add staff members and toggle their module access checklist',
        tabs: ['users'],
      },
      {
        key: 'manage_settings',
        label: 'Company Profile & GST Configuration',
        description: 'Configure legal entity name, GSTIN, and tax regimes',
        tabs: ['company-settings'],
      },
      {
        key: 'view_audit_logs',
        label: 'Security Audit Trail',
        description: 'Track timestamped employee actions and login history',
        tabs: ['audit-logs'],
      },
      {
        key: 'manage_database',
        label: 'Database & Cloud SQL Migration',
        description: 'Database backup and Supabase PostgreSQL syncing',
        tabs: ['database'],
      },
    ],
  },
];

/**
 * Returns default permissions for each staff role.
 * - Account holder (Accountant, Super Admin, Admin): Visible all data
 * - Sales holder (Sales Staff): Only sales invoice related category (Invoices, Challans, Returns, Customers)
 * - Inventory staff: Only stock items (Products, Warehouses, Stock movements)
 */
export function getDefaultPermissionsForRole(role: UserRole): Permission[] {
  switch (role) {
    case 'Super Admin':
    case 'Admin':
      return [
        'view_dashboard',
        'view_sales', 'create_sales', 'edit_sales', 'delete_sales', 'manage_challans',
        'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
        'view_products', 'create_products', 'edit_products', 'delete_products', 'manage_inventory',
        'view_purchases', 'create_purchases', 'edit_purchases', 'delete_purchases',
        'view_suppliers', 'create_suppliers', 'edit_suppliers', 'delete_suppliers',
        'manage_payments', 'manage_expenses', 'view_accounting',
        'view_reports',
        'manage_users', 'manage_settings', 'view_audit_logs', 'manage_database'
      ];

    case 'Accountant':
      // Account holder: Visible all operational and accounting data
      return [
        'view_dashboard',
        'view_sales', 'create_sales', 'edit_sales', 'manage_challans',
        'view_customers', 'create_customers', 'edit_customers',
        'view_products', 'manage_inventory',
        'view_purchases', 'create_purchases', 'edit_purchases',
        'view_suppliers', 'create_suppliers',
        'manage_payments', 'manage_expenses', 'view_accounting',
        'view_reports'
      ];

    case 'Manager':
      return [
        'view_dashboard',
        'view_sales', 'create_sales', 'edit_sales', 'manage_challans',
        'view_customers', 'create_customers', 'edit_customers',
        'view_products', 'create_products', 'edit_products', 'manage_inventory',
        'view_purchases', 'create_purchases', 'edit_purchases',
        'view_suppliers', 'create_suppliers',
        'manage_payments', 'manage_expenses', 'view_accounting',
        'view_reports'
      ];

    case 'Sales Staff':
      // Sales holder: ONLY sales invoice related categories (invoices, challans, returns, customers) + custom sales dashboard
      return [
        'view_dashboard',
        'view_sales',
        'create_sales',
        'edit_sales',
        'manage_challans',
        'view_customers',
        'create_customers'
      ];

    case 'Inventory Staff':
      // Inventory staff: ONLY stock items & inventory related categories (products, warehouses, adjustments) + stock dashboard
      return [
        'view_dashboard',
        'view_products',
        'create_products',
        'edit_products',
        'manage_inventory'
      ];

    case 'Purchase Staff':
      return [
        'view_dashboard',
        'view_purchases',
        'create_purchases',
        'edit_purchases',
        'view_suppliers',
        'create_suppliers'
      ];

    case 'Viewer':
    default:
      return [
        'view_dashboard',
        'view_sales',
        'view_products',
        'view_customers'
      ];
  }
}

/**
 * Checks whether a given user can access a specific tab/view in the application.
 */
export function canUserAccessTab(tab: string, user: UserProfile): boolean {
  if (!user) return false;
  if (user.role === 'Super Admin' || user.role === 'Admin') return true;

  const perms = user.permissions || [];

  switch (tab) {
    case 'dashboard':
      // Accessible if explicitly granted OR if role has any active category permissions
      if (perms.includes('view_dashboard')) return true;
      if (user.role === 'Accountant' || user.role === 'Manager') return true;
      if (
        perms.includes('view_sales') ||
        perms.includes('view_products') ||
        perms.includes('view_purchases') ||
        perms.includes('manage_inventory') ||
        perms.includes('view_accounting') ||
        perms.includes('manage_payments') ||
        perms.includes('manage_expenses')
      ) {
        return true;
      }
      return false;

    // Sales Invoice related category
    case 'invoices':
    case 'sales-returns':
      return perms.includes('view_sales');

    case 'challans':
      return perms.includes('manage_challans') || perms.includes('view_sales');

    case 'customers':
      return perms.includes('view_customers');

    // Stock items related category
    case 'products':
      return perms.includes('view_products');

    case 'warehouses':
    case 'inventory-transactions':
      return perms.includes('manage_inventory') || perms.includes('view_products');

    // Purchases & Suppliers
    case 'purchases':
    case 'purchase-returns':
      return perms.includes('view_purchases');

    case 'suppliers':
      return perms.includes('view_suppliers');

    // Finance & Accounts
    case 'payments':
      return perms.includes('manage_payments');

    case 'expenses':
      return perms.includes('manage_expenses');

    case 'accounting':
      return perms.includes('view_accounting') || perms.includes('manage_payments');

    case 'reports':
      return perms.includes('view_reports');

    // System Administration
    case 'users':
      return perms.includes('manage_users');

    case 'company-settings':
      return perms.includes('manage_settings');

    case 'audit-logs':
      return perms.includes('view_audit_logs') || perms.includes('manage_users');

    case 'database':
      return perms.includes('manage_database') || perms.includes('manage_settings');

    default:
      return false;
  }
}

/**
 * Returns the list of tabs this user is permitted to view.
 */
export function getPermittedTabs(user: UserProfile): string[] {
  const allTabs = [
    'dashboard',
    'invoices',
    'challans',
    'sales-returns',
    'products',
    'inventory-transactions',
    'warehouses',
    'purchases',
    'purchase-returns',
    'customers',
    'suppliers',
    'payments',
    'expenses',
    'accounting',
    'reports',
    'users',
    'company-settings',
    'database',
    'audit-logs',
  ];

  return allTabs.filter((tab) => canUserAccessTab(tab, user));
}

/**
 * Returns the default home tab for this user.
 * - Sales Staff -> 'invoices'
 * - Inventory Staff -> 'products'
 * - Others -> 'dashboard' (or first permitted tab)
 */
export function getDefaultTabForUser(user: UserProfile): string {
  if (!user) return 'invoices';
  if (user.role === 'Sales Staff' && !canUserAccessTab('dashboard', user)) {
    return 'invoices';
  }
  if (user.role === 'Inventory Staff' && !canUserAccessTab('dashboard', user)) {
    return 'products';
  }
  if (canUserAccessTab('dashboard', user)) {
    return 'dashboard';
  }
  const permitted = getPermittedTabs(user);
  return permitted.length > 0 ? permitted[0] : 'invoices';
}
