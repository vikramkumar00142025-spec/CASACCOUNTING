'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  CheckSquare,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Lock,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { UserProfile, UserRole, Permission } from '@/types';
import { getDefaultPermissionsForRole } from '@/lib/storage';
import { PERMISSION_GROUPS } from '@/lib/permissions';
import PermissionChecklistModal from './PermissionChecklistModal';

interface UserManagementViewProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onSaveUser: (userData: Partial<UserProfile> & { email: string; full_name: string; role: UserRole; email_verified?: boolean }) => void;
  onToggleUserStatus: (userId: string) => void;
  onToggleEmailVerification?: (userId: string) => void;
  onResendVerification?: (emailOrId: string) => void;
}

export default function UserManagementView({
  users,
  currentUser,
  onSaveUser,
  onToggleUserStatus,
  onToggleEmailVerification,
  onResendVerification,
}: UserManagementViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [checklistUser, setChecklistUser] = useState<UserProfile | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Sales Staff');
  const [phone, setPhone] = useState('');
  const [userPassword, setUserPassword] = useState('password123');
  const [emailVerified, setEmailVerified] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>(getDefaultPermissionsForRole('Sales Staff'));

  const handleOpenAdd = () => {
    setEditingUser(null);
    setEmail('');
    setFullName('');
    setRole('Sales Staff');
    setPhone('');
    setUserPassword('password123');
    setEmailVerified(true);
    setPermissions(getDefaultPermissionsForRole('Sales Staff'));
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEmail(user.email);
    setFullName(user.full_name);
    setRole(user.role);
    setPhone(user.phone || '');
    setUserPassword(user.password || 'password123');
    setEmailVerified(user.email_verified !== undefined ? user.email_verified : true);
    setPermissions(user.permissions);
    setShowModal(true);
  };

  const handleOpenChecklist = (user: UserProfile) => {
    setChecklistUser(user);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setPermissions(getDefaultPermissionsForRole(newRole));
  };

  const applyPresetToForm = (presetRole: UserRole) => {
    setRole(presetRole);
    setPermissions(getDefaultPermissionsForRole(presetRole));
  };

  const togglePermission = (perm: Permission) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    onSaveUser({
      id: editingUser ? editingUser.id : undefined,
      email: email.trim(),
      full_name: fullName.trim(),
      role,
      phone: phone.trim(),
      password: userPassword.trim() || 'password123',
      email_verified: emailVerified,
      permissions,
    });

    setShowModal(false);
  };

  const handleSaveFromChecklist = (userId: string, newPermissions: Permission[], newRole?: UserRole) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    onSaveUser({
      id: target.id,
      email: target.email,
      full_name: target.full_name,
      role: newRole || target.role,
      phone: target.phone,
      permissions: newPermissions,
    });
  };

  const getUserAccessSummary = (user: UserProfile) => {
    const p = user.permissions || [];
    const hasSales = p.includes('view_sales');
    const hasInventory = p.includes('view_products');
    const hasPurchases = p.includes('view_purchases');
    const hasAccounting = p.includes('view_accounting') || p.includes('manage_payments');

    if (user.role === 'Super Admin' || user.role === 'Admin') {
      return {
        badge: 'Full Root Access',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        detail: 'All data, settings & users accessible',
      };
    }

    if (user.role === 'Accountant' || (hasSales && hasInventory && hasPurchases && hasAccounting)) {
      return {
        badge: 'All Data Visible',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        detail: 'Sales, purchases, stock items, ledgers & reports',
      };
    }

    if (hasSales && !hasInventory && !hasPurchases && !hasAccounting) {
      return {
        badge: 'Sales Invoices Only',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        detail: 'Only sales invoice related categories visible (others disabled)',
      };
    }

    if (hasInventory && !hasSales && !hasPurchases && !hasAccounting) {
      return {
        badge: 'Stock Items Only',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        detail: 'Only stock items & inventory visible (others disabled)',
      };
    }

    return {
      badge: 'Custom Checklist',
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      detail: `${p.length} permitted actions enabled`,
    };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            User Management & Role Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure employee roles and checklist permissions. Only selected items are visible to users; others are disabled.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Employee User</span>
        </button>
      </div>

      {/* Role Access Rules Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Account Holder (All Data Visible)</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 leading-snug">
            Can see all financial data: Sales invoices, purchases, stock items, customer/supplier ledgers, expenses, and GST reports.
          </p>
        </div>

        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Sales Holder (Sales Invoices Only)</span>
          </div>
          <p className="text-[11px] text-blue-700 mt-1 leading-snug">
            Can see only sales invoice related categories: Tax Invoices, Delivery Challans, Credit Notes, and Customers. All other categories disabled.
          </p>
        </div>

        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Inventory Staff (Stock Items Only)</span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1 leading-snug">
            Can view only stock items, warehouses, and inventory movement logs. Sales invoices, purchases, and finance are completely disabled.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                <th className="py-3 px-3.5">User / Full Name</th>
                <th className="py-3 px-3.5">Email Address</th>
                <th className="py-3 px-3.5">Assigned Role</th>
                <th className="py-3 px-3.5">Website Visibility & Scope</th>
                <th className="py-3 px-3.5 text-center">Email Verification</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const summary = getUserAccessSummary(u);

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {u.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.full_name}</p>
                          {u.phone && <p className="text-[10px] text-slate-400">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 font-mono">{u.email}</td>
                    <td className="py-3 px-3.5">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[11px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <div>
                        <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-full border ${summary.color}`}>
                          {summary.badge}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{summary.detail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {u.email_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300">
                            <span>Pending OTP</span>
                          </span>
                          {u.verification_code && (
                            <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                              OTP: {u.verification_code}
                            </span>
                          )}
                          {onToggleEmailVerification && (
                            <button
                              type="button"
                              onClick={() => onToggleEmailVerification(u.id)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 underline font-semibold"
                            >
                              Verify Now
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {u.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenChecklist(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md text-xs font-bold transition-colors border border-blue-200 shadow-2xs"
                        title="Open interactive permission checklist to decide visible categories"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Permission Checklist</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="px-2 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>

                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => onToggleUserStatus(u.id)}
                          className="px-2 py-1 text-slate-400 hover:text-slate-700 text-xs"
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Permission Checklist Modal */}
      {checklistUser && (
        <PermissionChecklistModal
          isOpen={Boolean(checklistUser)}
          user={checklistUser}
          onClose={() => setChecklistUser(null)}
          onSavePermissions={handleSaveFromChecklist}
        />
      )}

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-xs max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingUser ? `Edit Staff Member: ${editingUser.full_name}` : 'Create New Employee User'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Full Employee Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Official Work Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Assign Staff Role *</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 font-bold"
                  >
                    <option value="Super Admin">Super Admin (Full Root Access)</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Accountant">Accountant (All Data Visible)</option>
                    <option value="Sales Staff">Sales Staff (Sales Invoices Only)</option>
                    <option value="Purchase Staff">Purchase Staff</option>
                    <option value="Inventory Staff">Inventory Staff (Stock Items Only)</option>
                    <option value="Viewer">Viewer (Read Only)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>
              </div>

              {/* Password Setting */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Account Password *</label>
                  <span className="text-[10px] text-slate-400">Default: password123</span>
                </div>
                <input
                  type="text"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Enter login password"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 font-mono text-xs"
                  required
                />
                <p className="text-[10px] text-slate-500">
                  Users must enter this password on login after logging out.
                </p>
              </div>

              {/* Role Presets */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quick Presets:</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetToForm('Sales Staff')}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 hover:bg-blue-200 text-blue-800 rounded border border-blue-200"
                  >
                    Sales Holder
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetToForm('Inventory Staff')}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 rounded border border-amber-200"
                  >
                    Inventory Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetToForm('Accountant')}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded border border-emerald-200"
                  >
                    Account Holder
                  </button>
                </div>
              </div>

              {/* Email Verification Status Toggle */}
              <label className="flex items-start gap-2.5 p-3 bg-blue-50/60 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={emailVerified}
                  onChange={(e) => setEmailVerified(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Email Verified (Active)</span>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    When checked, the account can sign in immediately without OTP confirmation. Uncheck to require 6-digit email OTP verification.
                  </span>
                </div>
              </label>

              {/* Granular Permissions Checkboxes Grouped by Category */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">
                    Permissions Checklist ({permissions.length} items granted)
                  </label>
                  <span className="text-[11px] text-slate-500">Unchecked items are disabled on website</span>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.id} className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200">
                      <p className="text-[11px] font-bold text-slate-800 mb-1.5">{group.name}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {group.items.map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-100/60"
                          >
                            <input
                              type="checkbox"
                              checked={permissions.includes(item.key)}
                              onChange={() => togglePermission(item.key)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[11px] text-slate-700 font-medium">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800"
                >
                  Save User Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
