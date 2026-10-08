'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Building2,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Send,
  ArrowLeft,
  Inbox,
  ExternalLink,
} from 'lucide-react';
import { CompanyProfile, UserProfile, UserRole } from '@/types';

interface LoginViewProps {
  company: CompanyProfile;
  availableUsers: UserProfile[];
  onLogin: (email: string, password?: string) => {
    success: boolean;
    user?: UserProfile;
    requiresVerification?: boolean;
    verificationCode?: string;
    error?: string;
  };
  onRegister: (params: {
    email: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    password?: string;
  }) => {
    success: boolean;
    user?: UserProfile;
    requiresVerification?: boolean;
    verificationCode?: string;
    error?: string;
  };
  onVerifyEmail: (
    emailOrId: string,
    code: string
  ) => { success: boolean; user?: UserProfile; error?: string };
  onResendCode: (
    emailOrId: string
  ) => { success: boolean; code?: string; error?: string };
}

export default function LoginView({
  company,
  availableUsers,
  onLogin,
  onRegister,
  onVerifyEmail,
  onResendCode,
}: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'demologin' | 'verify'>('signin');
  
  // Mandatory Password Sign In State (Starts strictly empty so logged-out users MUST enter password)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Sales Staff');

  // Verification state
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationName, setVerificationName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Dispatch real email via server API route
  const triggerEmailDispatch = async (targetEmail: string, targetName: string, code: string) => {
    try {
      setIsSendingEmail(true);
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetName,
          code,
          companyName: company.name,
        }),
      });
      const data = await res.json();
      if (data.previewUrl) {
        setEmailPreviewUrl(data.previewUrl);
      }
      return data;
    } catch (err) {
      console.warn('Email dispatch warning (simulated OTP will still be available):', err);
      return { success: false };
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!email.trim()) {
      setFeedback({ type: 'error', message: 'Please provide your registered work email address.' });
      return;
    }

    // STRICT PASSWORD CHECK: Logged out users MUST enter password to log in!
    if (!password || !password.trim()) {
      setFeedback({
        type: 'error',
        message: 'Password is required to sign in. Please enter your account password.',
      });
      passwordInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      const res = onLogin(email.trim(), password.trim());
      setIsLoading(false);

      if (res.requiresVerification) {
        const otp = res.verificationCode || '123456';
        setVerificationEmail(email.trim());
        setVerificationName(res.user?.full_name || email.trim());
        setActiveOtpCode(otp);
        setActiveTab('verify');
        setResendCooldown(30);

        // Send verification code to email ID
        await triggerEmailDispatch(email.trim(), res.user?.full_name || email.trim(), otp);

        setFeedback({
          type: 'success',
          message: `Verification code sent to your email (${email.trim()}). Enter the 6-digit code to complete sign in.`,
        });
        return;
      }

      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.error || 'Authentication failed. Please verify your email and password.',
        });
        passwordInputRef.current?.focus();
      }
    }, 250);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!regName.trim() || !regEmail.trim()) {
      setFeedback({ type: 'error', message: 'Full name and email are mandatory.' });
      return;
    }

    if (!regPassword.trim()) {
      setFeedback({ type: 'error', message: 'Please set a password for your account.' });
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      const res = onRegister({
        full_name: regName.trim(),
        email: regEmail.trim(),
        role: regRole,
        phone: regPhone.trim(),
        password: regPassword.trim(),
      });
      setIsLoading(false);

      if (res.requiresVerification) {
        const otp = res.verificationCode || '123456';
        setVerificationEmail(regEmail.trim());
        setVerificationName(regName.trim());
        setActiveOtpCode(otp);
        setActiveTab('verify');
        setResendCooldown(30);

        // Send verification code to email ID
        await triggerEmailDispatch(regEmail.trim(), regName.trim(), otp);

        setFeedback({
          type: 'success',
          message: `Account created! Verification code sent to ${regEmail.trim()}. Enter it below to activate your account.`,
        });
        return;
      }

      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Registration failed.' });
      }
    }, 250);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!verificationCode.trim()) {
      setFeedback({ type: 'error', message: 'Please enter the 6-digit verification code.' });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = onVerifyEmail(verificationEmail, verificationCode.trim());
      setIsLoading(false);

      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.error || 'Invalid verification code. Please check and try again.',
        });
      }
    }, 250);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setFeedback(null);
    setIsLoading(true);

    const res = onResendCode(verificationEmail);
    setIsLoading(false);

    if (res.success && res.code) {
      setActiveOtpCode(res.code);
      setResendCooldown(30);

      // Send verification code to email ID
      await triggerEmailDispatch(verificationEmail, verificationName, res.code);

      setFeedback({
        type: 'success',
        message: `A fresh 6-digit verification code has been dispatched to ${verificationEmail}.`,
      });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to resend verification code.' });
    }
  };

  // Quick Role selection: populates the email field, clears password, and instructs user to enter password
  const handleSelectRoleAccount = (targetUser: UserProfile) => {
    setEmail(targetUser.email);
    setPassword(''); // MUST be entered by user!
    setActiveTab('signin');
    setFeedback({
      type: 'success',
      message: `Selected account for ${targetUser.full_name}. Please enter password to log in. (Demo password: password123)`,
    });
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 150);
  };

  const copyDemoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setVerificationCode(code);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-radial from-slate-850 to-slate-950 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Company & ERP Logo Header */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-4 ring-4 ring-blue-500/20">
          <Building2 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {company.name}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Enterprise ERP, GST E-Invoicing & Supply Chain Portal
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>GSTIN: {company.gstin}</span>
          <span className="text-slate-600">•</span>
          <span>Secure Password & Email Verification</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-200/80 overflow-hidden">
          {/* Navigation Tabs (Only if not in verification mode) */}
          {activeTab !== 'verify' ? (
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setFeedback(null);
                }}
                className={`py-3.5 text-center transition-colors border-b-2 ${
                  activeTab === 'signin'
                    ? 'border-blue-600 text-blue-600 bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('demologin');
                  setFeedback(null);
                }}
                className={`py-3.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === 'demologin'
                    ? 'border-blue-600 text-blue-600 bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Team Roles</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setFeedback(null);
                }}
                className={`py-3.5 text-center transition-colors border-b-2 ${
                  activeTab === 'register'
                    ? 'border-blue-600 text-blue-600 bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                Register
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Confirm Email Verification Code</h3>
                  <p className="text-[11px] text-slate-400">Sent to your registered email address</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setFeedback(null);
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Feedback alert */}
            {feedback && (
              <div
                className={`mb-5 p-3 rounded-lg text-xs flex items-center gap-2.5 transition-all ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-medium leading-relaxed">{feedback.message}</span>
              </div>
            )}

            {/* TAB 1: MANDATORY PASSWORD SIGN IN */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Work Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. vikram.kumar@zenithapex.in"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Account Password <span className="text-rose-500">* (Mandatory)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPassword('password123')}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                      title="Fill demo password password123"
                    >
                      Fill Demo Password
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your account password"
                      className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Logged out users must enter their password to enable login. (Default password: <code className="bg-slate-100 px-1 rounded text-slate-700 font-mono">password123</code>)
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Remember email for this session</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Password required on sign in</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !password.trim() || !email.trim()}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Enter Password to Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Quick Hint */}
                <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-500">
                    Switching employee accounts?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('demologin')}
                      className="font-semibold text-blue-600 hover:text-blue-800 underline ml-1"
                    >
                      Select from Team Directory
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* TAB 2: EMAIL VERIFICATION STEP */}
            {activeTab === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-600">
                    A 6-digit verification code has been dispatched to:
                  </p>
                  <p className="font-bold text-sm text-slate-900 font-mono bg-slate-100 px-3 py-1 rounded-md inline-block border border-slate-200">
                    {verificationEmail}
                  </p>
                  {isSendingEmail && (
                    <p className="text-[11px] text-blue-600 animate-pulse flex items-center justify-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Sending email to {verificationEmail}...</span>
                    </p>
                  )}
                </div>

                {/* Real Email / Simulated Inbox Card */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between text-[11px] text-blue-900 font-medium border-b border-blue-200/60 pb-1.5">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Inbox className="w-3.5 h-3.5 text-blue-600" />
                      <span>Email Delivery Notification</span>
                    </span>
                    <span className="text-[10px] text-blue-600">Sent to Inbox</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-slate-600">Verification Code (OTP):</p>
                      <p className="text-2xl font-bold font-mono tracking-widest text-slate-900">
                        {activeOtpCode || '123456'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyDemoCode(activeOtpCode || '123456')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
                      title="Quick fill this code into input"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Filled!' : 'Quick Fill'}</span>
                    </button>
                  </div>

                  {/* If online Ethereal test mail link is generated */}
                  {emailPreviewUrl && (
                    <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Live Delivered Mailbox:</span>
                      <a
                        href={emailPreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-bold underline"
                      >
                        <span>View Delivered Email</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* 6-Digit OTP Code Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.5em] text-xl font-bold font-mono py-2.5 bg-slate-50 border-2 border-blue-400 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-hidden transition-all shadow-inner"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-center mt-1">
                    Check your email inbox or use the 6-digit code provided above.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all text-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Access Workspace</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin');
                      setFeedback(null);
                    }}
                    className="hover:text-slate-800 underline"
                  >
                    Change email address
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading || isSendingEmail}
                    className="text-blue-600 hover:text-blue-800 font-semibold disabled:text-slate-400 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code to email'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: REGISTER NEW USER WITH PASSWORD */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Vikram Kumar"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Work Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. employee@zenithapex.in"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-blue-600">Verification code will be sent to this email ID.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Phone (Optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 98450..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Assigned Role</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 outline-hidden font-medium"
                    >
                      <option value="Sales Staff">Sales Staff</option>
                      <option value="Inventory Staff">Inventory Staff</option>
                      <option value="Purchase Staff">Purchase Staff</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Choose Account Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Enter login password (min 6 characters)"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">You must use this password to sign in after logout.</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !regPassword.trim() || !regEmail.trim()}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Register & Send Verification Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 4: QUICK TEAM ROLES SELECTOR */}
            {activeTab === 'demologin' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700">Select Team Member Account:</span>
                  <span className="text-[10px] text-slate-400">Password Required on Sign In</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {availableUsers.map((user) => {
                    const isSuper = user.role === 'Super Admin' || user.role === 'Admin';
                    const isSales = user.role === 'Sales Staff';
                    const isInventory = user.role === 'Inventory Staff';
                    const isAccountant = user.role === 'Accountant';

                    let roleBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                    let roleDot = 'bg-slate-400';
                    if (isSuper) {
                      roleBadgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
                      roleDot = 'bg-purple-500';
                    } else if (isSales) {
                      roleBadgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                      roleDot = 'bg-blue-500';
                    } else if (isInventory) {
                      roleBadgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                      roleDot = 'bg-amber-500';
                    } else if (isAccountant) {
                      roleBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      roleDot = 'bg-emerald-500';
                    }

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectRoleAccount(user)}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all text-left group shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600 transition-colors">
                            {user.full_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-900 truncate">{user.full_name}</p>
                              {user.email_verified && (
                                <span title="Email Verified" className="text-emerald-500 text-[11px] font-bold">
                                  ✓
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadgeColor}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${roleDot}`} />
                            <span>{user.role}</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-900">Security Rule:</span> Selecting an account fills their email address; you must provide their password to sign in.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>GSTIN & E-Way Bill Compliant Enterprise System</span>
        </div>
      </div>
    </div>
  );
}
