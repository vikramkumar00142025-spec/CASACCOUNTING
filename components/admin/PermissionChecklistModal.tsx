'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Shield,
  Save,
  X,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Info,
  CheckCircle2,
  Lock,
  Layers,
  Receipt,
  Boxes,
  ShoppingCart,
  Wallet,
  BarChart3,
  Sliders,
} from 'lucide-react';
import { Permission, UserProfile, UserRole } from '@/types';
import { PERMISSION_GROUPS, getDefaultPermissionsForRole } from '@/lib/permissions';

interface PermissionChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSavePermissions: (userId: string, newPermissions: Permission[], newRole?: UserRole) => void;
}

export default function PermissionChecklistModal({
  isOpen,
  onClose,
  user,
  onSavePermissions,
}: PermissionChecklistModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(user.permissions || []);
  const [role, setRole] = useState<UserRole>(user.role);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    sales: true,
    customers: true,
    inventory: true,
    purchases: true,
    finance: true,
    reports: true,
    admin: true,
  });

  if (!isOpen) return null;

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleTogglePermission = (perm: Permission) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleToggleGroup = (groupId: string) => {
    const group = PERMISSION_GROUPS.find((g) => g.id === groupId);
    if (!group) return;

    const groupKeys = group.items.map((i) => i.key);
    const allGroupSelected = groupKeys.every((k) => selectedPermissions.includes(k));

    if (allGroupSelected) {
      // Deselect all in group
      setSelectedPermissions(selectedPermissions.filter((p) => !groupKeys.includes(p)));
    } else {
      // Select all in group
      const newKeys = Array.from(new Set([...selectedPermissions, ...groupKeys]));
      setSelectedPermissions(newKeys);
    }
  };

  // Presets
  const applyPreset = (presetRole: UserRole) => {
    setRole(presetRole);
    setSelectedPermissions(getDefaultPermissionsForRole(presetRole));
  };

  const handleSelectAll = () => {
    const allKeys = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key));
    setSelectedPermissions(Array.from(new Set(allKeys)));
  };

  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  const handleSave = () => {
    onSavePermissions(user.id, selectedPermissions, role);
    onClose();
  };

  const getGroupIcon = (groupId: string) => {
    switch (groupId) {
      case 'sales':
      case 'customers':
        return <Receipt className="w-4 h-4 text-blue-600" />;
      case 'inventory':
        return <Boxes className="w-4 h-4 text-amber-600" />;
      case 'purchases':
        return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
      case 'finance':
        return <Wallet className="w-4 h-4 text-purple-600" />;
      case 'reports':
        return <BarChart3 className="w-4 h-4 text-indigo-600" />;
      default:
        return <Sliders className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Staff Role & Permissions Checklist</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Configuring access for <strong className="text-white">{user.full_name}</strong> ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Rule Notice Banner */}
        <div className="px-6 py-3 bg-blue-50/70 border-b border-blue-100 flex items-start gap-2.5 text-xs text-blue-900 shrink-0">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Role Enforcement Rule:</span> Only selected categories in this checklist will be visible and enabled for this user on the website. All unselected items will be disabled/hidden in the sidebar and navigation.
          </div>
        </div>

        {/* Role Presets Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Apply Quick Role Preset:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset('Sales Staff')}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 transition-colors shadow-2xs"
                title="Only sales invoice related categories (invoices, challans, customers)"
              >
                🔵 Sales Holder (Sales Invoices Only)
              </button>

              <button
                type="button"
                onClick={() => applyPreset('Inventory Staff')}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 transition-colors shadow-2xs"
                title="Only stock items & inventory (products, warehouses, stock adjustments)"
              >
                🟢 Inventory Staff (Stock Items Only)
              </button>

              <button
                type="button"
                onClick={() => applyPreset('Accountant')}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200 transition-colors shadow-2xs"
                title="Account holder visible all data (sales, purchases, inventory, ledgers, reports)"
              >
                🟣 Account Holder (All Data Visible)
              </button>

              <button
                type="button"
                onClick={() => applyPreset('Super Admin')}
                className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
              >
                👑 Full Admin
              </button>

              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block"></div>

              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 underline px-1"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-medium text-rose-600 hover:text-rose-800 underline px-1"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Checklist Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {PERMISSION_GROUPS.map((group) => {
            const groupKeys = group.items.map((i) => i.key);
            const selectedInGroup = groupKeys.filter((k) => selectedPermissions.includes(k));
            const isAllSelected = groupKeys.length > 0 && selectedInGroup.length === groupKeys.length;
            const isPartiallySelected = selectedInGroup.length > 0 && selectedInGroup.length < groupKeys.length;
            const isExpanded = expandedGroups[group.id] !== false;

            return (
              <div
                key={group.id}
                className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white transition-all"
              >
                {/* Group Header */}
                <div
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors ${
                    selectedInGroup.length > 0 ? 'bg-slate-50/90' : 'bg-slate-50/40 text-slate-400'
                  }`}
                  onClick={() => toggleGroupExpand(group.id)}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleGroup(group.id);
                      }}
                      className="text-slate-500 hover:text-blue-600 transition-colors p-0.5"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600 fill-blue-50" />
                      ) : isPartiallySelected ? (
                        <div className="w-5 h-5 rounded-sm border-2 border-blue-600 bg-blue-100 flex items-center justify-center">
                          <div className="w-2.5 h-0.5 bg-blue-700"></div>
                        </div>
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      {getGroupIcon(group.id)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{group.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                            {selectedInGroup.length} of {groupKeys.length} enabled
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{group.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedInGroup.length > 0 ? (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Visible on Website</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Disabled / Hidden</span>
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Sub-items Checklist */}
                {isExpanded && (
                  <div className="p-3 bg-white grid grid-cols-1 md:grid-cols-2 gap-2.5 border-t border-slate-100">
                    {group.items.map((item) => {
                      const isChecked = selectedPermissions.includes(item.key);

                      return (
                        <label
                          key={item.key}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-blue-50/40 border-blue-200 shadow-2xs'
                              : 'bg-slate-50/40 border-slate-200/70 hover:bg-slate-100/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(item.key)}
                            className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-xs font-bold leading-tight ${
                                  isChecked ? 'text-slate-900' : 'text-slate-600'
                                }`}
                              >
                                {item.label}
                              </span>
                              {item.tabs && item.tabs.length > 0 && (
                                <span className="text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                  tab: {item.tabs.join(', ')}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer with Summary */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{selectedPermissions.length} permissions</span> actively granted.
            Unchecked items will remain disabled/hidden for this staff member.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Enforce Checklist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
