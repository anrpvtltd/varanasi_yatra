import React, { useState } from 'react';
import { crmApi, tokenStorage } from '../../../services/crmApi';
import logo from '../../../assets/logo.png';
import assiMorningImg from '../../../assets/ExperienceVaranasi/AssiMorning.png';
import gangaAartiImg from '../../../assets/ExperienceVaranasi/GangaAarti.png';

/**
 * Split-Screen CRM Login Experience
 * - CEO selected: Form animates to the LEFT
 * - MANAGER selected: Form animates to the RIGHT
 * - Responsive stacked mobile layout
 * - Integrated Forgot Password flow
 */
export default function CRMLoginScreen({ onLoginSuccess }) {
    const [role, setRole] = useState('MANAGER'); // 'CEO' | 'MANAGER'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Forgot Password Flow State
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetStep, setResetStep] = useState(1); // 1 = request token, 2 = enter new password
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');

    const handleRoleChange = (newRole) => {
        setRole(newRole);
        setErrorMsg('');
        setSuccessMsg('');
    };

    const handleFillDemo = (targetRole) => {
        setRole(targetRole);
        if (targetRole === 'CEO') {
            setEmail('ceo@banarasyatra.com');
            setPassword('CeoSecurePass123!');
        } else {
            setEmail('manager@banarasyatra.com');
            setPassword('ManagerSecurePass123!');
        }
        setErrorMsg('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!email.trim() || !password) {
            setErrorMsg('Please enter both email and password.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await crmApi.login({
                email: email.trim(),
                password,
                loginMode: role
            });

            if (res.success && res.token) {
                tokenStorage.setSession(res.token, res.refreshToken, res.user);
                setSuccessMsg('Authentication successful. Loading CRM...');
                if (onLoginSuccess) {
                    onLoginSuccess({ user: res.user, token: res.token, refreshToken: res.refreshToken });
                }
            } else {
                setErrorMsg(res.message || 'Authentication failed. Please check your credentials.');
            }
        } catch (err) {
            setErrorMsg(err.message || 'Connection failed. Please verify the backend server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestResetToken = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetMessage('');
        if (!resetEmail.trim()) {
            setResetError('Please enter your account email.');
            return;
        }

        setResetLoading(true);
        try {
            const res = await crmApi.forgotPassword({ email: resetEmail.trim() });
            if (res.success) {
                setResetMessage('Reset instructions generated! You can now set a new password.');
                if (res.resetToken) {
                    setResetToken(res.resetToken);
                }
                setResetStep(2);
            } else {
                setResetError(res.message || 'Failed to process password reset.');
            }
        } catch (err) {
            setResetError(err.message || 'Failed to request reset instructions.');
        } finally {
            setResetLoading(false);
        }
    };

    const handleConfirmReset = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetMessage('');
        if (!resetToken.trim() || !newPassword) {
            setResetError('Reset token and new password are required.');
            return;
        }
        if (newPassword.length < 8) {
            setResetError('New password must be at least 8 characters long.');
            return;
        }

        setResetLoading(true);
        try {
            const res = await crmApi.resetPassword({
                token: resetToken.trim(),
                newPassword
            });
            if (res.success) {
                setSuccessMsg('Password updated successfully! Please log in with your new password.');
                setIsForgotPasswordOpen(false);
                setResetStep(1);
                setResetEmail('');
                setResetToken('');
                setNewPassword('');
            } else {
                setResetError(res.message || 'Password reset failed.');
            }
        } catch (err) {
            setResetError(err.message || 'Password reset failed.');
        } finally {
            setResetLoading(false);
        }
    };

    const isCEO = role === 'CEO';
    const bgImage = isCEO ? gangaAartiImg : assiMorningImg;

    return (
        <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-0 md:p-6 select-none overflow-x-hidden">
            {/* Split Screen Master Container */}
            <div className="w-full max-w-6xl min-h-screen md:min-h-[640px] md:h-[680px] bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
                
                {/* 1. BRAND & TRAVEL VISUAL PANEL */}
                <div
                    className={`w-full md:w-1/2 relative flex flex-col justify-between p-8 md:p-12 text-white overflow-hidden transition-all duration-500 ease-in-out ${
                        isCEO ? 'md:order-2' : 'md:order-1'
                    }`}
                >
                    {/* Background Ghat Image with Vignette */}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform hover:scale-105"
                        style={{ backgroundImage: `url(${bgImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40 backdrop-blur-[1px]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-950/20 via-transparent to-black/50" />

                    {/* Top Branding */}
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center space-x-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2 shadow-lg shrink-0">
                                <img src={logo} alt="Varanasi Yatra Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="font-serif text-xl md:text-2xl font-black tracking-wider text-amber-100 uppercase leading-none">
                                    Varanasi Yatra
                                </h1>
                                <p className="text-[11px] text-amber-400 font-bold tracking-widest uppercase mt-1">
                                    Operations & Command Suite
                                </p>
                            </div>
                        </div>

                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                            <span>✨</span>
                            <span>Authentic Kashi Pilgrimage Management</span>
                        </div>
                    </div>

                    {/* Center Contextual Quote */}
                    <div className="relative z-10 py-6 hidden md:block">
                        <blockquote className="space-y-2 border-l-2 border-amber-500/60 pl-4">
                            <p className="text-sm md:text-base font-serif italic text-slate-200 leading-relaxed">
                                {isCEO
                                    ? '"Executive leadership is knowing every boat, every ghat, and every rupee of margin in Kashi."'
                                    : '"Crafting seamless spiritual journeys from Assi Ghat to Sarnath with uncompromising precision."'}
                            </p>
                            <footer className="text-[10px] text-amber-400/80 font-semibold uppercase tracking-wider">
                                {isCEO ? 'Executive Command Pulse' : 'Daily Operations Workflow'}
                            </footer>
                        </blockquote>
                    </div>

                    {/* Bottom Security Credentials Footnote */}
                    <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-medium">256-bit TLS Encrypted Session</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">v5.0 Core</span>
                    </div>
                </div>

                {/* 2. LOGIN FORM PANEL */}
                <div
                    className={`w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-10 md:p-12 bg-white transition-all duration-500 ease-in-out ${
                        isCEO ? 'md:order-1' : 'md:order-2'
                    }`}
                >
                    <div className="space-y-6">
                        {/* ROLE SELECTOR TABS: [ CEO ] [ MANAGER ] */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    Select Authorized Role
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                    isCEO
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}>
                                    {isCEO ? '👑 Executive Mode' : '👥 Operations Mode'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange('CEO')}
                                    className={`py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
                                        isCEO
                                            ? 'bg-white text-amber-900 shadow-md border border-amber-200/80'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <span>👑</span>
                                    <span>CEO</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange('MANAGER')}
                                    className={`py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
                                        !isCEO
                                            ? 'bg-white text-blue-900 shadow-md border border-blue-200/80'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <span>👥</span>
                                    <span>Manager</span>
                                </button>
                            </div>
                        </div>

                        {/* Title & Subtitle */}
                        <div className="text-left space-y-1">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-serif">
                                {isCEO ? 'CEO Command Center' : 'Manager Workspace'}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {isCEO
                                    ? 'Log in with your executive email to access financials and resource controls.'
                                    : 'Log in to manage leads, quotes, customer bookings, and trip execution.'}
                            </p>
                        </div>

                        {/* Alert Messages */}
                        {errorMsg && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center space-x-2 animate-fadeIn">
                                <span>⚠️</span>
                                <span className="flex-1 text-left">{errorMsg}</span>
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center space-x-2 animate-fadeIn">
                                <span>✅</span>
                                <span className="flex-1 text-left">{successMsg}</span>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={isCEO ? 'ceo@banarasyatra.com' : 'manager@banarasyatra.com'}
                                        required
                                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50/50 hover:bg-white"
                                    />
                                    <span className="absolute right-3.5 top-3.5 text-slate-400 text-sm">✉️</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsForgotPasswordOpen(true);
                                            setResetEmail(email || (isCEO ? 'ceo@banarasyatra.com' : 'manager@banarasyatra.com'));
                                        }}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        required
                                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50/50 hover:bg-white"
                                    />
                                    <span className="absolute right-3.5 top-3.5 text-slate-400 text-sm">🔒</span>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center space-x-2 pt-1">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                                    Remember session on this computer
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm tracking-wider uppercase transition-all duration-200 shadow-md flex items-center justify-center space-x-2 cursor-pointer ${
                                    isCEO
                                        ? 'bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 shadow-amber-900/20'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 shadow-blue-900/20'
                                } ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In as {isCEO ? 'CEO' : 'Manager'}</span>
                                        <span>→</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Quick Demo Pre-Fill Chips for QA (Development & Testing Only) */}
                    {import.meta.env.DEV && (
                        <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-left">
                            <span className="text-[11px] text-slate-400 font-medium">
                                Dev Credentials:
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => handleFillDemo('CEO')}
                                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200/80 transition cursor-pointer"
                                >
                                    👑 Fill CEO
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleFillDemo('MANAGER')}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200/80 transition cursor-pointer"
                                >
                                    👥 Fill Manager
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FORGOT PASSWORD MODAL */}
            {isForgotPasswordOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 text-left border border-slate-100 animate-slideDown">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center space-x-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0">
                                    🔑
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base font-serif">
                                        Password Recovery
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        {resetStep === 1 ? 'Step 1: Request Reset Token' : 'Step 2: Set New Password'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsForgotPasswordOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                ✕
                            </button>
                        </div>

                        {resetError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                                ⚠️ {resetError}
                            </div>
                        )}
                        {resetMessage && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
                                ℹ️ {resetMessage}
                            </div>
                        )}

                        {resetStep === 1 ? (
                            <form onSubmit={handleRequestResetToken} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 uppercase">
                                        Registered Account Email
                                    </label>
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="your-email@banarasyatra.com"
                                        required
                                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsForgotPasswordOpen(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-sm cursor-pointer disabled:opacity-50"
                                    >
                                        {resetLoading ? 'Generating...' : 'Get Reset Token →'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleConfirmReset} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 uppercase">
                                        Reset Security Token
                                    </label>
                                    <input
                                        type="text"
                                        value={resetToken}
                                        onChange={(e) => setResetToken(e.target.value)}
                                        placeholder="Paste 64-char reset token"
                                        required
                                        className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 uppercase">
                                        New Password (min. 8 characters)
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        required
                                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setResetStep(1)}
                                        className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm cursor-pointer disabled:opacity-50"
                                    >
                                        {resetLoading ? 'Updating Password...' : 'Save New Password & Login'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
