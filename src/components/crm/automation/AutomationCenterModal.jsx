import React, { useState, useEffect } from 'react';
import { crmApi } from '../../../services/crmApi';

export default function AutomationCenterModal({ isOpen, onClose, token, userRole }) {
    const [activeTab, setActiveTab] = useState('LOGS'); // 'OVERVIEW', 'TEMPLATES', 'PREVIEW', 'LOGS'
    const [settings, setSettings] = useState({ automationEnabled: true, providerName: 'ConsoleProvider', whatsappConfigured: false, emailConfigured: false });
    const [templates, setTemplates] = useState([]);
    const [logs, setLogs] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState('');

    // Template Editing State
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [editBody, setEditBody] = useState('');
    const [editSubject, setEditSubject] = useState('');

    // Live Preview State
    const [previewTemplateId, setPreviewTemplateId] = useState('NEW_ENQUIRY_CONFIRMATION');
    const [sampleData, setSampleData] = useState({
        customerName: 'Rahul Sharma',
        mobile: '+919876543210',
        packageName: 'Kashi Vishwanath Special',
        tripDate: '2026-09-15',
        bookingId: 'VY-B-2026-0042',
        paidAmount: '15,000',
        amountDue: '25,000',
        paymentLink: 'https://pay.varanasiyatra.com/b/VY-B-2026-0042'
    });
    const [renderedPreview, setRenderedPreview] = useState({ subject: '', body: '' });

    const loadAutomationData = React.useCallback(async () => {
        setLoading(true);
        try {
            const setRes = await crmApi.fetchAutomationSettings(token);
            if (setRes.success) setSettings(setRes);

            const tmplRes = await crmApi.fetchAutomationTemplates(token);
            if (tmplRes.success) setTemplates(tmplRes.templates || []);

            const logRes = await crmApi.fetchAutomationLogs(token, { status: statusFilter });
            if (logRes.success) setLogs(logRes.logs || []);
        } catch (e) {
            console.error("Failed to load automation data:", e);
        } finally {
            setLoading(false);
        }
    }, [token, statusFilter]);

    useEffect(() => {
        if (isOpen && token) {
            loadAutomationData();
        }
    }, [isOpen, token, loadAutomationData]);

    const handleToggleMaster = async () => {
        if (userRole !== 'CEO') return;
        try {
            const nextState = !settings.automationEnabled;
            const res = await crmApi.updateAutomationSettings(token, nextState);
            if (res.success) {
                setSettings(prev => ({ ...prev, automationEnabled: nextState }));
                setActionMsg(`Automation switch set to ${nextState ? 'ON 🟢' : 'OFF 🔴'}`);
                setTimeout(() => setActionMsg(''), 3000);
            }
        } catch {
            alert("Failed to update master switch");
        }
    };

    const handleRetry = async (logId) => {
        try {
            setActionMsg(`Retrying log entry ${logId}...`);
            const res = await crmApi.retryAutomationLog(token, logId);
            if (res.success) {
                setActionMsg("Retry executed successfully!");
                loadAutomationData();
                setTimeout(() => setActionMsg(''), 3000);
            }
        } catch (e) {
            alert(e.message || "Retry failed");
        }
    };

    const handleSaveTemplate = async () => {
        if (userRole !== 'CEO' || !selectedTemplate) return;
        try {
            const res = await crmApi.saveAutomationTemplate(token, {
                ...selectedTemplate,
                subject: editSubject,
                body: editBody
            });
            if (res.success) {
                setActionMsg("Template updated successfully!");
                loadAutomationData();
                setSelectedTemplate(null);
                setTimeout(() => setActionMsg(''), 3000);
            }
        } catch (e) {
            alert(e.message || "Failed to save template");
        }
    };

    const generatePreview = React.useCallback(async () => {
        const targetTmpl = templates.find(t => t.templateId === previewTemplateId) || templates[0];
        if (!targetTmpl) return;

        try {
            const res = await crmApi.previewAutomationMessage(token, {
                subject: targetTmpl.subject,
                body: targetTmpl.body,
                data: sampleData
            });
            if (res.success) {
                setRenderedPreview({ subject: res.renderedSubject, body: res.renderedBody });
            }
        } catch (e) {
            console.error("Preview error:", e);
        }
    }, [token, templates, previewTemplateId, sampleData]);

    useEffect(() => {
        if (activeTab === 'PREVIEW' && templates.length > 0) {
            generatePreview();
        }
    }, [activeTab, templates, generatePreview]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header Bar */}
                <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xl">
                            ⚡
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                Automation Center
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                    {settings.providerName || 'ConsoleProvider'}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400">Event-Driven Followup & Messaging Engine</p>
                        </div>
                    </div>

                    {/* Master Switch */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl">
                            <span className="text-xs text-slate-400">Engine Status:</span>
                            <button
                                onClick={handleToggleMaster}
                                disabled={userRole !== 'CEO'}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    settings.automationEnabled
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                } ${userRole !== 'CEO' ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
                            >
                                {settings.automationEnabled ? '● ACTIVE (ON)' : '○ PAUSED (OFF)'}
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Banner Status Alert */}
                {actionMsg && (
                    <div className="bg-orange-500/10 border-b border-orange-500/30 px-6 py-2 text-xs font-medium text-orange-300 text-center">
                        {actionMsg}
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2">
                    {[
                        { id: 'LOGS', label: '📜 Audit Logs', count: logs.length },
                        { id: 'TEMPLATES', label: '📝 Templates', count: templates.length },
                        { id: 'PREVIEW', label: '👁️ Live Previewer' },
                        { id: 'OVERVIEW', label: '⚙️ Providers & Settings' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 text-xs font-medium rounded-t-xl transition-colors border-t border-x border-transparent ${
                                activeTab === tab.id
                                    ? 'bg-slate-900 border-slate-700 text-orange-400 font-semibold'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                        >
                            {tab.label} {tab.count !== undefined && <span className="ml-1 opacity-70">({tab.count})</span>}
                        </button>
                    ))}
                </div>

                {/* Tab Body */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-900/90">
                    
                    {/* TAB 1: AUDIT LOGS */}
                    {activeTab === 'LOGS' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">Status Filter:</span>
                                    {['ALL', 'SENT', 'FAILED', 'RETRYING', 'PERMANENT_FAILURE'].map(st => (
                                        <button
                                            key={st}
                                            onClick={() => setStatusFilter(st)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                                statusFilter === st
                                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 font-semibold'
                                                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                                            }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={loadAutomationData}
                                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
                                >
                                    🔄 Refresh
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-12 text-slate-500 text-sm">Loading automation logs...</div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 text-sm">No automation logs match current filter.</div>
                            ) : (
                                <div className="border border-slate-800 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                                                <th className="p-3">Event / Key</th>
                                                <th className="p-3">Recipient</th>
                                                <th className="p-3">Channel</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3">Retries</th>
                                                <th className="p-3">Timestamp</th>
                                                <th className="p-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {logs.map((log) => (
                                                <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="p-3 font-mono font-medium text-slate-200">
                                                        <div>{log.eventType}</div>
                                                        <div className="text-[10px] text-slate-500">{log.eventKey}</div>
                                                    </td>
                                                    <td className="p-3 text-slate-300">{log.recipient}</td>
                                                    <td className="p-3">
                                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                                                            {log.channel}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                            log.status === 'SENT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                            log.status === 'RETRYING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                            log.status === 'PERMANENT_FAILURE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                                            'bg-slate-800 text-slate-400'
                                                        }`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 font-mono text-slate-400">{log.retryCount || 0} / {log.maxRetries || 3}</td>
                                                    <td className="p-3 text-slate-400 text-[11px]">
                                                        {new Date(log.createdAt).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        {log.status !== 'SENT' && (
                                                            <button
                                                                onClick={() => handleRetry(log._id)}
                                                                className="px-2.5 py-1 rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-colors text-[11px]"
                                                            >
                                                                🔄 Retry
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: TEMPLATE MANAGER */}
                    {activeTab === 'TEMPLATES' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Message Templates</h3>
                                {templates.map(tmpl => (
                                    <div
                                        key={tmpl.templateId}
                                        onClick={() => {
                                            setSelectedTemplate(tmpl);
                                            setEditSubject(tmpl.subject || '');
                                            setEditBody(tmpl.body || '');
                                        }}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                            selectedTemplate?.templateId === tmpl.templateId
                                                ? 'bg-orange-500/10 border-orange-500/50 text-orange-300'
                                                : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="font-semibold text-xs text-slate-200">{tmpl.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-mono text-slate-500">{tmpl.templateId}</span>
                                            {tmpl.isSystemDefault && (
                                                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 rounded">System Default</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Template Editor */}
                            <div className="md:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                                {selectedTemplate ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-100">{selectedTemplate.name}</h4>
                                                <span className="text-xs font-mono text-slate-500">{selectedTemplate.templateId}</span>
                                            </div>
                                            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                                                {selectedTemplate.channel}
                                            </span>
                                        </div>

                                        {(selectedTemplate.channel === 'EMAIL' || selectedTemplate.channel === 'BOTH') && (
                                            <div>
                                                <label className="text-xs text-slate-400 block mb-1">Email Subject Line:</label>
                                                <input
                                                    type="text"
                                                    value={editSubject}
                                                    onChange={e => setEditSubject(e.target.value)}
                                                    disabled={userRole !== 'CEO'}
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Message Body Template:</label>
                                            <textarea
                                                rows={8}
                                                value={editBody}
                                                onChange={e => setEditBody(e.target.value)}
                                                disabled={userRole !== 'CEO'}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500/50"
                                            />
                                        </div>

                                        <div>
                                            <span className="text-xs text-slate-500 block mb-1">Available Interpolation Variables:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {(selectedTemplate.variables || ['customerName', 'bookingId', 'tripDate', 'packageName', 'amountDue']).map(v => (
                                                    <span key={v} className="text-[10px] bg-slate-900 border border-slate-800 text-orange-400/90 font-mono px-2 py-0.5 rounded">
                                                        {`{{${v}}}`}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {userRole === 'CEO' && (
                                            <button
                                                onClick={handleSaveTemplate}
                                                className="px-4 py-2 bg-orange-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-orange-400 transition-colors"
                                            >
                                                💾 Save Template Changes
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-slate-500 text-xs">
                                        Select a template from the left list to view or edit placeholders.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: LIVE PREVIEWER */}
                    {activeTab === 'PREVIEW' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configure Test Parameters</h3>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Select Template:</label>
                                    <select
                                        value={previewTemplateId}
                                        onChange={e => setPreviewTemplateId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                                    >
                                        {templates.map(t => (
                                            <option key={t.templateId} value={t.templateId}>{t.name} ({t.templateId})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 block">Sample Variables Payload:</label>
                                    {Object.keys(sampleData).map(k => (
                                        <div key={k} className="flex items-center gap-2">
                                            <span className="text-[11px] font-mono text-orange-400 w-32">{`{{${k}}}`}:</span>
                                            <input
                                                type="text"
                                                value={sampleData[k]}
                                                onChange={e => setSampleData({ ...sampleData, [k]: e.target.value })}
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Rendered Preview Mockup */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Instant Message Preview</h3>
                                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-3 flex-1">
                                    <div className="text-[11px] text-emerald-400 font-bold border-b border-emerald-500/20 pb-2">
                                        📱 WhatsApp / Email Render Output
                                    </div>
                                    {renderedPreview.subject && (
                                        <div className="text-xs font-bold text-slate-200">
                                            Subject: {renderedPreview.subject}
                                        </div>
                                    )}
                                    <div className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                                        {renderedPreview.body || 'Rendering message preview...'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: PROVIDERS & OVERVIEW */}
                    {activeTab === 'OVERVIEW' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                                    <div className="text-xs text-slate-400 mb-1">Active Provider</div>
                                    <div className="text-sm font-bold text-orange-400 font-mono">{settings.providerName}</div>
                                    <div className="text-[11px] text-slate-500 mt-2">Default test environment provider capturing messages cleanly without external APIs.</div>
                                </div>

                                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                                    <div className="text-xs text-slate-400 mb-1">Meta WhatsApp API</div>
                                    <div className="text-sm font-bold text-slate-200">
                                        {settings.whatsappConfigured ? '🟢 Configured' : '⚪ Unconfigured (Dev Mode)'}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-2">Switchable via WHATSAPP_API_KEY environment variable.</div>
                                </div>

                                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                                    <div className="text-xs text-slate-400 mb-1">Email / SMTP Engine</div>
                                    <div className="text-sm font-bold text-slate-200">
                                        {settings.emailConfigured ? '🟢 Configured' : '⚪ Unconfigured (Dev Mode)'}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-2">Switchable via EMAIL_USER & SMTP credentials.</div>
                                </div>
                            </div>

                            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-slate-200 mb-2">Automated Event Rules Checklist</h4>
                                <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                                    <li><strong className="text-slate-300">LEAD_CREATED:</strong> Triggers enquiry confirmation to customer & new lead alert to team.</li>
                                    <li><strong className="text-slate-300">QUOTE_SENT:</strong> Sends ready quote details & itinerary link to customer.</li>
                                    <li><strong className="text-slate-300">BOOKING_CONFIRMED:</strong> Sends formal booking confirmation & advance receipt.</li>
                                    <li><strong className="text-slate-300">PAYMENT_RECEIVED:</strong> Dispatches instant payment receipt with remaining balance.</li>
                                    <li><strong className="text-slate-300">TRIP_UPCOMING:</strong> Dispatches pre-arrival reminder with assigned driver contact details.</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
