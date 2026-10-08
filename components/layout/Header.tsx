'use client';

import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Receipt,
  Truck,
  Package,
  RotateCcw,
  Check,
  ExternalLink,
  Shield,
  Database,
  UserCheck,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { UserProfile, NotificationItem } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/storage';
import { canUserAccessTab } from '@/lib/permissions';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  onLogout: () => void;
  notifications: NotificationItem[];
  onOpenGlobalSearch: () => void;
  onOpenCreateModal: (type: 'invoice' | 'challan' | 'purchase' | 'product') => void;
  onOpenScanModal?: () => void;
  onResetDemoData: () => void;
}

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  currentUser,
  allUsers,
  onSwitchUser,
  onLogout,
  notifications,
  onOpenGlobalSearch,
  onOpenCreateModal,
  onOpenScanModal,
  onResetDemoData,
}: HeaderProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isSupabaseLive = isSupabaseConfigured();

  const getBreadcrumbTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Cloud Accounting System';
      case 'invoices':
        return 'Sales & GST Invoicing';
      case 'challans':
        return 'Delivery Challans';
      case 'sales-returns':
        return 'Sales Returns & Credit Notes';
      case 'purchases':
        return 'Purchase Orders & Inward Bills';
      case 'purchase-returns':
        return 'Purchase Returns & Debit Notes';
      case 'products':
        return 'Items & Stock Catalog';
      case 'inventory-transactions':
        return 'Stock Movement Ledger';
      case 'warehouses':
        return 'Multi-Warehouse Depots';
      case 'customers':
        return 'Customer Directory & Accounts';
      case 'suppliers':
        return 'Supplier Directory & Payables';
      case 'payments':
        return 'Payments & Receipts';
      case 'expenses':
        return 'Operational Expenses';
      case 'accounting':
        return 'Financial Account Ledgers';
      case 'reports':
        return 'Business Reports & Analytics';
      case 'users':
        return 'User Management & Permissions';
      case 'company-settings':
        return 'Company Profile & GST Configuration';
      case 'database':
        return 'Supabase & SQL Migration';
      case 'audit-logs':
        return 'Security Audit Trail';
      default:
        return 'Management Console';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 lg:px-6">
      {/* Left Zone: Sidebar Toggle & Domain Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 -ml-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500 hidden sm:inline">Workspace</span>
          <span className="text-slate-400 hidden sm:inline">/</span>
          <span className="font-semibold text-slate-900">{getBreadcrumbTitle(activeTab)}</span>
        </div>
      </div>

      {/* Right Zone: Search, Quick Add, Notifications, Role Switcher */}
      <div className="flex items-center gap-2.5">
        {/* Supabase Status Pill / Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 border border-slate-200 text-slate-700">
          <span
            className={`w-2 h-2 rounded-full ${
              isSupabaseLive ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
            }`}
          />
          <span>{isSupabaseLive ? 'Supabase Live' : 'Enterprise Engine (Active)'}</span>
        </div>

        {/* Global Search Button */}
        <button
          onClick={onOpenGlobalSearch}
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Search anything...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded-xs">
            ⌘K
          </kbd>
        </button>

        {/* Quick Create Dropdown */}
        {((currentUser.role === 'Super Admin' || currentUser.role === 'Admin') ||
          currentUser.permissions.includes('create_sales') ||
          currentUser.permissions.includes('manage_challans') ||
          currentUser.permissions.includes('create_purchases') ||
          currentUser.permissions.includes('create_products')) && (
          <div className="relative">
            <button
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>

            {showCreateDropdown && (
              <div
                className="absolute right-0 z-50 w-48 mt-1 py-1 bg-white rounded-lg shadow-lg border border-slate-200 animate-in fade-in-50 zoom-in-95 duration-100"
                onMouseLeave={() => setShowCreateDropdown(false)}
              >
                {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.permissions.includes('create_sales') || currentUser.permissions.includes('view_sales')) && (
                  <button
                    onClick={() => {
                      onOpenCreateModal('invoice');
                      setShowCreateDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Receipt className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sales Tax Invoice</span>
                  </button>
                )}
                {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.permissions.includes('manage_challans') || currentUser.permissions.includes('view_sales')) && (
                  <button
                    onClick={() => {
                      onOpenCreateModal('challan');
                      setShowCreateDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Delivery Challan</span>
                  </button>
                )}
                {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.permissions.includes('create_purchases') || currentUser.permissions.includes('view_purchases')) && (
                  <button
                    onClick={() => {
                      onOpenCreateModal('purchase');
                      setShowCreateDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Purchase Bill</span>
                  </button>
                )}
                {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.permissions.includes('create_products') || currentUser.permissions.includes('view_products')) && (
                  <button
                    onClick={() => {
                      onOpenCreateModal('product');
                      setShowCreateDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-600" />
                    <span>New Item / Product</span>
                  </button>
                )}
                {onOpenScanModal && (
                  <div className="border-t border-slate-100 my-1 pt-1">
                    <button
                      onClick={() => {
                        onOpenScanModal();
                        setShowCreateDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Scan Bill / Stock (PDF/JPG)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
            )}
          </button>

          {showNotifDropdown && (
            <div
              className="absolute right-0 z-50 w-80 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 animate-in fade-in-50 zoom-in-95 duration-100"
              onMouseLeave={() => setShowNotifDropdown(false)}
            >
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications ({unreadCount} new)</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead()}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No notifications at this time.</div>
                ) : (
                  notifications.slice(0, 6).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                        !notif.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold text-slate-900">{notif.title}</span>
                        {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1" />}
                      </div>
                      <p className="mt-0.5 text-slate-600 line-clamp-2 leading-relaxed">{notif.message}</p>
                      <span className="block mt-1 text-[10px] text-slate-400">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role & User Switcher (For instantaneous RBAC testing across all 8 roles!) */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">
              {currentUser.full_name.charAt(0)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-semibold text-slate-900 leading-tight">{currentUser.full_name.split(' ')[0]}</span>
              <span className="text-[10px] text-blue-600 font-medium leading-tight">{currentUser.role}</span>
            </div>
            <Shield className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {showUserDropdown && (
            <div
              className="absolute right-0 z-50 w-72 mt-1 py-1 bg-white rounded-lg shadow-xl border border-slate-200 animate-in fade-in-50 zoom-in-95 duration-100"
              onMouseLeave={() => setShowUserDropdown(false)}
            >
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Online
                  </span>
                </div>
              </div>

              <div className="px-3.5 pt-2 pb-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Switch Active Profile</p>
              </div>

              <div className="py-1 max-h-52 overflow-y-auto">
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-left hover:bg-slate-50 transition-colors ${
                      u.id === currentUser.id ? 'bg-blue-50/70 font-semibold text-blue-900' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{u.full_name}</span>
                        {u.id === currentUser.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <span className="text-[11px] text-slate-500">{u.role}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50 space-y-1.5">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Log Out of Session</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm('Reset application back to pristine demo data? All local changes will be refreshed.')) {
                      onResetDemoData();
                      setShowUserDropdown(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Reset Demo Dataset</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
