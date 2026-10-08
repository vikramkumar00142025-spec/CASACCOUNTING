'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserRole } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string, name?: string) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Sales Staff');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (mode === 'login') {
      if (!email.trim() || !password.trim()) {
        setFeedback({ type: 'error', message: 'Please enter both email and password.' });
        return;
      }
      onLoginSuccess(email);
      onClose();
    } else if (mode === 'register') {
      if (!fullName.trim() || !email.trim() || !password.trim()) {
        setFeedback({ type: 'error', message: 'Please fill in all registration fields.' });
        return;
      }
      onLoginSuccess(email, fullName);
      onClose();
    } else if (mode === 'forgot_password') {
      if (!email.trim()) {
        setFeedback({ type: 'error', message: 'Please provide your registered email address.' });
        return;
      }
      setFeedback({
        type: 'success',
        message: 'Password reset link sent to your email. Check your inbox to proceed.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              {mode === 'login'
                ? 'Sign In to Cloud Accounting System'
                : mode === 'register'
                ? 'Create New Enterprise Account'
                : 'Reset Account Password'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Vikram Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-slate-900"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Corporate Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="email"
                placeholder="name@company.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-slate-900"
                required
              />
            </div>
          </div>

          {mode !== 'forgot_password' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Password *</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback(null);
                      setMode('forgot_password');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-[11px]"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-slate-900"
                  required
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Role Designation</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Accountant">Accountant</option>
                <option value="Sales Staff">Sales Staff</option>
                <option value="Purchase Staff">Purchase Staff</option>
                <option value="Inventory Staff">Inventory Staff</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs mt-2"
          >
            {mode === 'login' ? 'Sign In to Workspace' : mode === 'register' ? 'Register Account' : 'Send Reset Link'}
          </button>

          <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-100">
            {mode === 'login' ? (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setFeedback(null);
                    setMode('register');
                  }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have credentials?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setFeedback(null);
                    setMode('login');
                  }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Return to sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
