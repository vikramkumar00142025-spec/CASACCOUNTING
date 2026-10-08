'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import GlobalSearchModal from '@/components/layout/GlobalSearchModal';

// Domain Views
import DashboardView from '@/components/dashboard/DashboardView';
import InvoiceListView from '@/components/sales/InvoiceListView';
import CreateInvoiceModal from '@/components/sales/CreateInvoiceModal';
import InvoiceDetailModal from '@/components/sales/InvoiceDetailModal';

import ChallanListView from '@/components/challan/ChallanListView';
import CreateChallanModal from '@/components/challan/CreateChallanModal';
import ChallanDetailModal from '@/components/challan/ChallanDetailModal';

import PurchaseListView from '@/components/purchases/PurchaseListView';
import CreatePurchaseModal from '@/components/purchases/CreatePurchaseModal';

import SalesReturnView from '@/components/returns/SalesReturnView';
import PurchaseReturnView from '@/components/returns/PurchaseReturnView';

import ProductListView from '@/components/inventory/ProductListView';
import CreateProductModal from '@/components/inventory/CreateProductModal';
import StockAdjustmentModal from '@/components/inventory/StockAdjustmentModal';
import StockTransferModal from '@/components/inventory/StockTransferModal';
import InventoryTransactionsView from '@/components/inventory/InventoryTransactionsView';
import WarehouseListView from '@/components/inventory/WarehouseListView';

import CustomerListView from '@/components/parties/CustomerListView';
import SupplierListView from '@/components/parties/SupplierListView';

import PaymentListView from '@/components/payments/PaymentListView';
import DynamicUPIPaymentModal from '@/components/payments/DynamicUPIPaymentModal';
import ExpenseListView from '@/components/expenses/ExpenseListView';
import LedgerView from '@/components/accounting/LedgerView';
import ReportsDashboardView from '@/components/reports/ReportsDashboardView';

import UserManagementView from '@/components/admin/UserManagementView';
import CompanySettingsView from '@/components/admin/CompanySettingsView';
import DatabaseMigrationView from '@/components/admin/DatabaseMigrationView';
import AuditLogsView from '@/components/admin/AuditLogsView';

import AuthModal from '@/components/auth/AuthModal';
import LoginView from '@/components/auth/LoginView';
import DocUploadModal from '@/components/ai/DocUploadModal';

// Storage Engine
import {
  getCompany,
  getCurrentUser,
  getIsAuthenticated,
  loginUser,
  logoutUser,
  registerUser,
  verifyUserEmail,
  resendVerificationCode,
  toggleUserEmailVerification,
  getAllUsers,
  getWarehouses,
  getProducts,
  getCustomers,
  getSuppliers,
  getInvoices,
  getChallans,
  getPurchases,
  getSalesReturns,
  getPurchaseReturns,
  getPayments,
  getExpenses,
  getTransactions,
  getAuditLogs,
  getNotifications,
  subscribeToStore,
  setCurrentUser,
  saveUser,
  toggleUserStatus,
  updateCompany,
  saveWarehouse,
  saveProduct,
  deleteProduct,
  recordStockMovement,
  transferStock,
  saveCustomer,
  saveSupplier,
  createSalesInvoice,
  cancelSalesInvoice,
  createDeliveryChallan,
  convertChallanToInvoice,
  createPurchaseInvoice,
  createSalesReturn,
  createPurchaseReturn,
  createPayment,
  createExpense,
  resetToDemoData,
} from '@/lib/storage';
import { canUserAccessTab, getDefaultTabForUser } from '@/lib/permissions';
import { ShieldAlert, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

import {
  CompanyProfile,
  UserProfile,
  UserRole,
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
} from '@/types';
import { getTodayDateString, generateDocNumber } from '@/lib/utils';

export default function Home() {
  // Application State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Data Store Sync
  const [company, setCompany] = useState<CompanyProfile>(getCompany());
  const [currentUser, setUser] = useState<UserProfile>(getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getIsAuthenticated());
  const [users, setUsers] = useState<UserProfile[]>(getAllUsers());
  const [warehouses, setWarehouses] = useState<Warehouse[]>(getWarehouses());
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [customers, setCustomers] = useState<Customer[]>(getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(getSuppliers());
  const [invoices, setInvoices] = useState<SalesInvoice[]>(getInvoices());
  const [challans, setChallans] = useState<DeliveryChallan[]>(getChallans());
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(getPurchases());
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(getSalesReturns());
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(getPurchaseReturns());
  const [payments, setPayments] = useState<Payment[]>(getPayments());
  const [expenses, setExpenses] = useState<Expense[]>(getExpenses());
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(getTransactions());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(getAuditLogs());
  const [notifications, setNotifications] = useState<NotificationItem[]>(getNotifications());

  // Modal Visibility States
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [selectedInvoiceForUPI, setSelectedInvoiceForUPI] = useState<SalesInvoice | null>(null);

  const [showCreateChallan, setShowCreateChallan] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<DeliveryChallan | null>(null);

  const [showCreatePurchase, setShowCreatePurchase] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<Product | null>(null);
  const [selectedProductForTransfer, setSelectedProductForTransfer] = useState<Product | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanModalDocType, setScanModalDocType] = useState<'purchase' | 'stock' | 'auto'>('auto');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with store subscriptions
  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      setCompany(getCompany());
      setUser(getCurrentUser());
      setIsAuthenticated(getIsAuthenticated());
      setUsers(getAllUsers());
      setWarehouses(getWarehouses());
      setProducts(getProducts());
      setCustomers(getCustomers());
      setSuppliers(getSuppliers());
      setInvoices(getInvoices());
      setChallans(getChallans());
      setPurchases(getPurchases());
      setSalesReturns(getSalesReturns());
      setPurchaseReturns(getPurchaseReturns());
      setPayments(getPayments());
      setExpenses(getExpenses());
      setTransactions(getTransactions());
      setAuditLogs(getAuditLogs());
      setNotifications(getNotifications());
    });

    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogin = (email: string, password?: string) => {
    const res = loginUser(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
      if (!canUserAccessTab(activeTab, res.user)) {
        setActiveTab(getDefaultTabForUser(res.user));
      }
      showToast(`Welcome back, ${res.user.full_name}!`);
    }
    return res;
  };

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    showToast('You have been signed out.');
  };

  const handleRegister = (params: {
    email: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    password?: string;
  }) => {
    const res = registerUser(params);
    if (res.success && !res.requiresVerification && res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
      showToast(`Account registered! Welcome, ${res.user.full_name}.`);
    }
    return res;
  };

  const handleVerifyEmail = (emailOrId: string, code: string) => {
    const res = verifyUserEmail(emailOrId, code);
    if (res.success && res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
      if (!canUserAccessTab(activeTab, res.user)) {
        setActiveTab(getDefaultTabForUser(res.user));
      }
      showToast(`Email verified! Welcome to the workspace, ${res.user.full_name}.`);
    }
    return res;
  };

  const handleResendCode = (emailOrId: string) => {
    const res = resendVerificationCode(emailOrId);
    if (res.success) {
      showToast('New verification code sent to your email.');
    }
    return res;
  };

  const handleOpenCreateModal = (type: 'invoice' | 'challan' | 'purchase' | 'product') => {
    if (type === 'invoice') setShowCreateInvoice(true);
    if (type === 'challan') setShowCreateChallan(true);
    if (type === 'purchase') setShowCreatePurchase(true);
    if (type === 'product') {
      setSelectedProductForEdit(null);
      setShowCreateProduct(true);
    }
  };

  const handleQuickAddCustomer = (customerData: Partial<Customer>) => {
    saveCustomer(customerData as any);
    showToast(`Added customer "${customerData.name}"`);
  };

  const handleConvertToInvoice = (challanId: string) => {
    const res = convertChallanToInvoice(challanId);
    if (res.success && res.invoiceId) {
      showToast('Delivery challan successfully converted to Tax Invoice!');
      const newInv = getInvoices().find((i) => i.id === res.invoiceId);
      if (newInv) setSelectedInvoice(newInv);
    } else {
      showToast(res.error || 'Failed to convert challan');
    }
  };

  const handleRecordPaymentForInvoice = (inv: SalesInvoice) => {
    createPayment({
      payment_number: generateDocNumber('RCPT-'),
      date: getTodayDateString(),
      party_type: 'Customer',
      party_id: inv.customer_id,
      party_name: inv.customer_name,
      payment_type: 'Receipt',
      amount: inv.balance_due,
      payment_method: 'Bank Transfer',
      invoice_id: inv.id,
      reference_number: 'INV-PAY-' + inv.invoice_number,
      notes: `Settlement balance for ${inv.invoice_number}`,
    });
    showToast(`Collected full balance for invoice ${inv.invoice_number}`);
    setSelectedInvoice(null);
  };

  // Render Login Screen if session is logged out
  if (!isAuthenticated) {
    return (
      <>
        <LoginView
          company={company}
          availableUsers={users}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onVerifyEmail={handleVerifyEmail}
          onResendCode={handleResendCode}
        />
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {toastMessage}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        openCreateModal={handleOpenCreateModal}
        onLogout={handleLogout}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Sticky Top Header */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          currentUser={currentUser}
          allUsers={users}
          onSwitchUser={(u) => {
            setCurrentUser(u);
            if (!canUserAccessTab(activeTab, u)) {
              setActiveTab(getDefaultTabForUser(u));
            }
            showToast(`Active profile switched to ${u.full_name} (${u.role})`);
          }}
          onLogout={handleLogout}
          notifications={notifications}
          onOpenGlobalSearch={() => setShowGlobalSearch(true)}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenScanModal={() => {
            setScanModalDocType('auto');
            setShowScanModal(true);
          }}
          onResetDemoData={() => {
            resetToDemoData();
            showToast('Reset back to pristine enterprise demo dataset.');
          }}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Toast Notification Alert */}
          {toastMessage && (
            <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {toastMessage}
            </div>
          )}

          {!canUserAccessTab(activeTab, currentUser) && (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto my-12 animate-in fade-in duration-150">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-2xs">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Module Access Restricted</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Your staff account (<strong className="text-slate-800">{currentUser.full_name}</strong> - <span className="font-semibold text-blue-600">{currentUser.role}</span>) does not have access permissions enabled for <strong className="text-slate-800">{activeTab}</strong> in the permissions checklist.
              </p>
              <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs w-full">
                <span className="font-bold text-slate-800 block mb-1">Active Role Visibility Rule:</span>
                {currentUser.role === 'Sales Staff' && (
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    🔵 <strong>Sales Holder:</strong> Only sales invoice related categories (Tax Invoices, Delivery Challans, Credit Notes, and Customers) are enabled. All other sections are disabled.
                  </p>
                )}
                {currentUser.role === 'Inventory Staff' && (
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    🟢 <strong>Inventory Staff:</strong> Only stock items and warehouses (Items & Catalog, Warehouses, Stock Movements) are enabled. All other sections are disabled.
                  </p>
                )}
                {currentUser.role !== 'Sales Staff' && currentUser.role !== 'Inventory Staff' && (
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    <strong>Custom Checklist:</strong> {currentUser.permissions.length} granular permissions currently assigned. Contact an administrator to modify checklist permissions.
                  </p>
                )}
              </div>
              <button
                onClick={() => setActiveTab(getDefaultTabForUser(currentUser))}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              >
                <span>Go to Permitted Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 1. Main Dashboard */}
          {canUserAccessTab('dashboard', currentUser) && activeTab === 'dashboard' && (
            <DashboardView
              invoices={invoices}
              purchases={purchases}
              payments={payments}
              expenses={expenses}
              products={products}
              customers={customers}
              suppliers={suppliers}
              challans={challans}
              warehouses={warehouses}
              transactions={transactions}
              currentUser={currentUser}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenCreateModal={handleOpenCreateModal}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onOpenScanModal={(type) => {
                setScanModalDocType(type);
                setShowScanModal(true);
              }}
            />
          )}

          {/* 2. Sales Invoices */}
          {activeTab === 'invoices' && (
            <InvoiceListView
              invoices={invoices}
              onOpenCreateModal={() => setShowCreateInvoice(true)}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onRecordPayment={handleRecordPaymentForInvoice}
              onOpenUPIQR={(inv) => {
                setSelectedInvoiceForUPI(inv);
                setShowUPIModal(true);
              }}
            />
          )}

          {/* 3. Delivery Challans */}
          {activeTab === 'challans' && (
            <ChallanListView
              challans={challans}
              onOpenCreateModal={() => setShowCreateChallan(true)}
              onSelectChallan={(ch) => setSelectedChallan(ch)}
              onConvertToInvoice={handleConvertToInvoice}
            />
          )}

          {/* 4. Sales Returns (Credit Notes) */}
          {activeTab === 'sales-returns' && (
            <SalesReturnView
              salesReturns={salesReturns}
              invoices={invoices}
              onCreateReturn={(data) => {
                const res = createSalesReturn(data);
                showToast(`Credit note ${data.credit_note_number} generated.`);
                return res;
              }}
            />
          )}

          {/* 5. Purchase Invoices */}
          {activeTab === 'purchases' && (
            <PurchaseListView
              purchases={purchases}
              onOpenCreateModal={() => setShowCreatePurchase(true)}
              onOpenScanModal={() => {
                setScanModalDocType('purchase');
                setShowScanModal(true);
              }}
            />
          )}

          {/* 6. Purchase Returns (Debit Notes) */}
          {activeTab === 'purchase-returns' && (
            <PurchaseReturnView
              purchaseReturns={purchaseReturns}
              purchases={purchases}
              onCreateReturn={(data) => {
                const res = createPurchaseReturn(data);
                showToast(`Debit note ${data.debit_note_number} generated.`);
                return res;
              }}
            />
          )}

          {/* 7. Products & Items */}
          {activeTab === 'products' && (
            <ProductListView
              products={products}
              warehouses={warehouses}
              onOpenCreateModal={() => {
                setSelectedProductForEdit(null);
                setShowCreateProduct(true);
              }}
              onEditProduct={(p) => {
                setSelectedProductForEdit(p);
                setShowCreateProduct(true);
              }}
              onOpenAdjustmentModal={(p) => setSelectedProductForAdjustment(p)}
              onOpenTransferModal={(p) => setSelectedProductForTransfer(p)}
              onDeleteProduct={(id) => {
                deleteProduct(id);
                showToast('Product removed from catalog.');
              }}
              onOpenScanStockModal={() => {
                setScanModalDocType('stock');
                setShowScanModal(true);
              }}
            />
          )}

          {/* 8. Stock Movement Ledger */}
          {activeTab === 'inventory-transactions' && (
            <InventoryTransactionsView transactions={transactions} />
          )}

          {/* 9. Warehouses */}
          {activeTab === 'warehouses' && (
            <WarehouseListView
              warehouses={warehouses}
              products={products}
              onSaveWarehouse={(wh) => {
                saveWarehouse(wh);
                showToast(`Warehouse depot "${wh.name}" registered.`);
              }}
            />
          )}

          {/* 10. Customers */}
          {activeTab === 'customers' && (
            <CustomerListView
              customers={customers}
              onSaveCustomer={(c) => {
                saveCustomer(c);
                showToast(`Customer account "${c.name}" saved.`);
              }}
            />
          )}

          {/* 11. Suppliers */}
          {activeTab === 'suppliers' && (
            <SupplierListView
              suppliers={suppliers}
              onSaveSupplier={(s) => {
                saveSupplier(s);
                showToast(`Supplier account "${s.company_name}" saved.`);
              }}
            />
          )}

          {/* 12. Payments & Receipts */}
          {activeTab === 'payments' && (
            <PaymentListView
              payments={payments}
              customers={customers}
              suppliers={suppliers}
              invoices={invoices}
              company={company}
              onCreatePayment={(p) => {
                const res = createPayment(p);
                showToast(`Payment voucher ${p.payment_number} recorded.`);
                return res;
              }}
            />
          )}

          {/* 13. Operational Expenses */}
          {activeTab === 'expenses' && (
            <ExpenseListView
              expenses={expenses}
              onCreateExpense={(e) => {
                const res = createExpense(e);
                showToast(`Expense ${e.expense_number} recorded.`);
                return res;
              }}
            />
          )}

          {/* 14. Financial Ledgers */}
          {activeTab === 'accounting' && (
            <LedgerView
              customers={customers}
              suppliers={suppliers}
              invoices={invoices}
              purchases={purchases}
              payments={payments}
              expenses={expenses}
            />
          )}

          {/* 15. Reports & Analytics */}
          {activeTab === 'reports' && (
            <ReportsDashboardView
              invoices={invoices}
              purchases={purchases}
              salesReturns={salesReturns}
              purchaseReturns={purchaseReturns}
              products={products}
              customers={customers}
              suppliers={suppliers}
              expenses={expenses}
              payments={payments}
              warehouses={warehouses}
            />
          )}

          {/* 16. User Management & RBAC */}
          {activeTab === 'users' && (
            <UserManagementView
              users={users}
              currentUser={currentUser}
              onSaveUser={(u) => {
                saveUser(u);
                showToast(`User profile "${u.full_name}" updated.`);
              }}
              onToggleUserStatus={(id) => {
                toggleUserStatus(id);
                showToast('User account status updated.');
              }}
              onToggleEmailVerification={(id) => {
                toggleUserEmailVerification(id);
                showToast('User email verification status updated.');
              }}
              onResendVerification={(id) => {
                resendVerificationCode(id);
                showToast('Verification code dispatched to user email.');
              }}
            />
          )}

          {/* 17. Company Settings */}
          {activeTab === 'company-settings' && (
            <CompanySettingsView
              company={company}
              onUpdateCompany={(c) => {
                updateCompany(c);
                showToast('Company profile & GST settings updated.');
              }}
            />
          )}

          {/* 18. Supabase & Database Migration */}
          {activeTab === 'database' && <DatabaseMigrationView />}

          {/* 19. Security Audit Logs */}
          {activeTab === 'audit-logs' && <AuditLogsView auditLogs={auditLogs} />}
        </main>
      </div>

      {/* Global Modals & Dialogs */}
      {/* 1. Global Fast Finder */}
      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        products={products}
        customers={customers}
        suppliers={suppliers}
        invoices={invoices}
        challans={challans}
        purchases={purchases}
        onSelectResult={(cat, id) => {
          setActiveTab(cat);
          if (cat === 'invoices') {
            const inv = invoices.find((i) => i.id === id);
            if (inv) setSelectedInvoice(inv);
          } else if (cat === 'challans') {
            const ch = challans.find((c) => c.id === id);
            if (ch) setSelectedChallan(ch);
          }
        }}
      />

      {/* 2. Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={showCreateInvoice}
        onClose={() => setShowCreateInvoice(false)}
        company={company}
        customers={customers}
        products={products}
        warehouses={warehouses}
        onSaveInvoice={(data) => {
          const res = createSalesInvoice(data);
          if (res.success) {
            showToast(`Invoice ${data.invoice_number} created!`);
          }
          return res;
        }}
        onQuickAddCustomer={handleQuickAddCustomer}
      />

      {/* 3. Invoice View / Print / WhatsApp Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        company={company}
        onClose={() => setSelectedInvoice(null)}
        onRecordPayment={handleRecordPaymentForInvoice}
        onCancelInvoice={(id, reason) => {
          cancelSalesInvoice(id, reason);
          showToast('Invoice cancelled and stock restored to inventory.');
          setSelectedInvoice(null);
        }}
      />

      {/* 4. Create Delivery Challan Modal */}
      <CreateChallanModal
        isOpen={showCreateChallan}
        onClose={() => setShowCreateChallan(false)}
        customers={customers}
        products={products}
        warehouses={warehouses}
        challanPrefix={company.challan_prefix}
        onSaveChallan={(data) => {
          const res = createDeliveryChallan(data);
          showToast(`Delivery challan ${data.challan_number} issued.`);
          return res;
        }}
      />

      {/* 5. Challan Detail & Convert to Invoice Modal */}
      <ChallanDetailModal
        challan={selectedChallan}
        company={company}
        onClose={() => setSelectedChallan(null)}
        onConvertToInvoice={(id) => {
          handleConvertToInvoice(id);
          setSelectedChallan(null);
        }}
      />

      {/* 6. Create Purchase Modal */}
      <CreatePurchaseModal
        isOpen={showCreatePurchase}
        onClose={() => setShowCreatePurchase(false)}
        suppliers={suppliers}
        products={products}
        warehouses={warehouses}
        purchasePrefix={company.purchase_prefix}
        onSavePurchase={(data) => {
          const res = createPurchaseInvoice(data);
          showToast(`Purchase bill ${data.purchase_number} recorded & stock updated.`);
          return res;
        }}
      />

      {/* 7. Create/Edit Product Modal */}
      <CreateProductModal
        isOpen={showCreateProduct}
        productToEdit={selectedProductForEdit}
        onClose={() => {
          setShowCreateProduct(false);
          setSelectedProductForEdit(null);
        }}
        warehouses={warehouses}
        onSaveProduct={(p) => {
          saveProduct(p);
          showToast(
            selectedProductForEdit
              ? `Product "${p.name}" updated with photo.`
              : `Product "${p.name}" added to catalog.`
          );
          setSelectedProductForEdit(null);
        }}
      />

      {/* 8. Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={Boolean(selectedProductForAdjustment)}
        onClose={() => setSelectedProductForAdjustment(null)}
        product={selectedProductForAdjustment}
        warehouses={warehouses}
        onConfirmAdjustment={(params) => {
          const res = recordStockMovement(params);
          if (res.success) {
            showToast('Stock count adjusted successfully.');
          }
          return res;
        }}
      />

      {/* 9. Stock Transfer Modal */}
      <StockTransferModal
        isOpen={Boolean(selectedProductForTransfer)}
        onClose={() => setSelectedProductForTransfer(null)}
        product={selectedProductForTransfer}
        warehouses={warehouses}
        onConfirmTransfer={(params) => {
          const res = transferStock(params);
          if (res.success) {
            showToast('Inter-warehouse stock transfer logged.');
          }
          return res;
        }}
      />

      {/* 10. Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(em, nm) => {
          const found = users.find((u) => u.email.toLowerCase() === em.toLowerCase());
          if (found) {
            setCurrentUser(found);
            showToast(`Welcome back, ${found.full_name}!`);
          } else {
            showToast(`Authenticated as ${em}`);
          }
        }}
      />

      {/* 11. Dynamic UPI Payment Modal */}
      {showUPIModal && (
        <DynamicUPIPaymentModal
          isOpen={showUPIModal}
          onClose={() => setShowUPIModal(false)}
          initialInvoice={selectedInvoiceForUPI}
          invoices={invoices}
          customers={customers}
          company={company}
          onRecordPaymentSuccess={(pData) => {
            createPayment(pData);
            showToast(`Collected UPI payment for ${pData.party_name}!`);
          }}
        />
      )}

      {/* 12. AI Document Scanner (PDF & JPG Upload for Purchases & Stock) */}
      {showScanModal && (
        <DocUploadModal
          isOpen={showScanModal}
          onClose={() => setShowScanModal(false)}
          defaultDocType={scanModalDocType}
          warehouses={warehouses}
          suppliers={suppliers}
          onSaveExtractedPurchase={(pData) => {
            const res = createPurchaseInvoice(pData);
            if (res && res.success) {
              showToast(`Purchase bill ${pData.purchase_number} created & stock added!`);
            } else {
              showToast('Failed to record purchase bill.');
            }
          }}
          onSaveExtractedStock={(stockItems, targetWarehouseId) => {
            let count = 0;
            stockItems.forEach((st) => {
              if (st.name) {
                saveProduct({
                  ...st,
                  primary_warehouse_id: targetWarehouseId,
                } as any);
                count++;
              }
            });
            showToast(`Successfully digitized & imported ${count} items into inventory!`);
          }}
        />
      )}
    </div>
  );
}
