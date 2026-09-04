import React, { useState } from 'react';
import { crmApi } from '../../../services/crmApi';
import { calculateVendorPerformance } from '../../../utils/vendorPerformanceCalculator';
import { COMMERCIAL_MODEL_LABELS, RESOURCE_CATEGORY_LABELS } from '../../../constants/phase4Constants';
import Drawer from '../ui/Drawer';
import { Badge } from '../ui/StatusBadge';
import Button from '../ui/Button';

export default function VendorProfileDrawer({
    isOpen,
    onClose,
    vendor,
    token,
    user,
    onVendorUpdated,
    onEditVendor
}) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW', 'RATES', 'PERFORMANCE', 'NOTES'

    if (!isOpen || !vendor) return null;

    const isCEO = user?.role === 'CEO';
    const perf = calculateVendorPerformance(vendor.performance);
    const rules = vendor.rateRules || [];
    const commModel = vendor.commercialModel || 'SELLING_PRICE';
    const isActive = vendor.status === 'ACTIVE' || vendor.availabilityStatus === 'Active';

    const handleStatusToggle = async (newStatus) => {
        if (!isCEO) return;
        setIsUpdating(true);
        try {
            const res = await crmApi.updateVendorStatus(token, vendor._id, newStatus);
            if (res.success && onVendorUpdated) {
                onVendorUpdated(res.vendor);
            }
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!isCEO) return;
        if (!window.confirm(`Are you sure you want to archive ${vendor.businessName || vendor.name}?`)) return;
        setIsUpdating(true);
        try {
            const res = await crmApi.deleteVendor(token, vendor._id);
            if (res.success) {
                alert(res.message);
                if (onVendorUpdated) onVendorUpdated(null);
                onClose();
            }
        } catch (err) {
            alert('Archive failed: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-bold">{vendor.businessName || vendor.name}</span>
                    <Badge variant={isActive ? 'success' : 'default'}>
                        {vendor.status || vendor.availabilityStatus}
                    </Badge>
                </div>
            }
            subtitle={`${RESOURCE_CATEGORY_LABELS[vendor.category] || vendor.category} · Code: #${vendor.vendorCode || 'VY-V-0000'}`}
            width="600px"
            footer={
                <div className="flex items-center justify-between w-full">
                    {isCEO ? (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onEditVendor(vendor)}
                            >
                                ✏️ Edit
                            </Button>
                            <Button
                                variant={isActive ? 'danger' : 'primary'}
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => handleStatusToggle(isActive ? 'INACTIVE' : 'ACTIVE')}
                            >
                                {isActive ? 'Deactivate' : 'Reactivate'}
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                disabled={isUpdating}
                                onClick={handleDelete}
                            >
                                Archive
                            </Button>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-500 italic">Read-only resource profile</div>
                    )}
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
            }
        >
            <div className="space-y-5">
                {/* SNAPSHOT NOTICE */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                    <span className="text-base">🛡️</span>
                    <div>
                        <strong className="block font-bold">Snapshot Isolation Verified:</strong>
                        Rate updates to this resource will never mutate historic quotes or confirmed trips. Past bookings remain permanently tied to their original rate snapshot.
                    </div>
                </div>

                {/* SUB-TABS */}
                <div className="flex border-b border-gray-200 text-xs font-semibold">
                    {[
                        { id: 'OVERVIEW', label: 'Overview & Contact' },
                        { id: 'RATES', label: `Rates & Rules (${rules.length})` },
                        { id: 'PERFORMANCE', label: 'Reliability & Usage' },
                        { id: 'NOTES', label: 'Internal Notes' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3.5 py-2 border-b-2 transition-all cursor-pointer ${
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 font-bold'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB 1: OVERVIEW & CONTACT */}
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-4 text-xs">
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                            <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Contact Information</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Contact Person</span>
                                    <span className="font-semibold text-gray-900">{vendor.contactPerson || 'Not Specified'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Primary Phone</span>
                                    <span className="font-mono text-gray-900 font-semibold">{vendor.phone || vendor.mobile || 'No contact'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Alternate Phone</span>
                                    <span className="font-mono text-gray-900">{vendor.alternatePhone || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Email</span>
                                    <span className="text-gray-900">{vendor.email || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">City / Location</span>
                                    <span className="text-gray-900">{vendor.city || vendor.location || 'Varanasi'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Commercial Model</span>
                                    <span className="font-bold text-blue-800">{COMMERCIAL_MODEL_LABELS[commModel] || commModel}</span>
                                </div>
                            </div>
                            {vendor.address && (
                                <div className="pt-2 border-t border-gray-200">
                                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Physical Address</span>
                                    <span className="text-gray-800">{vendor.address}</span>
                                </div>
                            )}
                        </div>

                        {/* Category Specific Highlights */}
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                            <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Category Specifications</h4>
                            {vendor.category === 'HOTEL' && (
                                <div className="space-y-1">
                                    <div>Star Rating: <strong>{vendor.metadata?.starCategory || 'Standard'}</strong></div>
                                    <div>Base Reference Rate: <strong>₹{(vendor.baseRate || 0).toLocaleString('en-IN')}/night</strong></div>
                                </div>
                            )}
                            {vendor.category === 'TRANSPORT' && (
                                <div className="space-y-1">
                                    <div>Fleet Operator: <strong>{vendor.businessName}</strong></div>
                                    <div>Route Model: <strong>{commModel}</strong></div>
                                </div>
                            )}
                            {vendor.category === 'PANDIT' && (
                                <div className="space-y-1">
                                    <div>Commercial Model: <strong className="text-orange-800">CUSTOMER_DIRECT</strong></div>
                                    <div>Package Cost: <strong>₹0 (Client pays priest directly)</strong></div>
                                </div>
                            )}
                            {vendor.category === 'DARSHAN' && (
                                <div className="space-y-1">
                                    <div>Commercial Model: <strong className="text-purple-800">PASS_THROUGH</strong></div>
                                    <div>Company Margin: <strong>0% (Pass-through ticket expense)</strong></div>
                                </div>
                            )}
                            {vendor.category === 'SHOPPING' && (
                                <div className="space-y-1">
                                    <div>Commercial Model: <strong className="text-emerald-800">COMMISSION</strong></div>
                                    <div>Terms: <strong>{vendor.metadata?.commissionRate || 15}% Partner Referral</strong></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: RATES & RULES */}
                {activeTab === 'RATES' && (
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Configured Rate Rules</h4>
                            <span className="text-gray-400 text-[11px]">{rules.length} Active Rules</span>
                        </div>

                        {rules.length === 0 ? (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-500">
                                Standard Base Rate: <strong className="text-gray-900">₹{(vendor.baseRate || 0).toLocaleString('en-IN')}</strong>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {rules.map((rule, idx) => (
                                    <div key={idx} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-xs">
                                        <div>
                                            <span className="font-bold text-gray-900 block">
                                                {rule.ruleName || rule.roomType || rule.vehicleName || `Rule #${idx + 1}`}
                                            </span>
                                            <div className="text-[11px] text-gray-500 space-x-2">
                                                {rule.acType && <span>{rule.acType}</span>}
                                                {rule.route && <span>· {rule.route}</span>}
                                                {rule.slot && <span>· {rule.slot}</span>}
                                                {rule.commercialModel && <span className="text-blue-700 font-semibold">· {rule.commercialModel}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {rule.commercialModel === 'VENDOR_QUOTE_REQUIRED' ? (
                                                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                                                    Quote Required
                                                </span>
                                            ) : (
                                                <span className="font-bold text-gray-900 text-sm">
                                                    ₹{(rule.referenceRate || 0).toLocaleString('en-IN')}
                                                    <span className="text-[10px] text-gray-400 font-normal"> / {rule.unit || 'Unit'}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: RELIABILITY & PERFORMANCE */}
                {activeTab === 'PERFORMANCE' && (
                    <div className="space-y-4 text-xs">
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Operational Reliability</span>
                            {perf.isNewVendor ? (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center text-blue-900 font-semibold">
                                    🆕 New Resource · Building booking assignment history
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                                        <span className="text-[10px] text-gray-400 uppercase block font-semibold">Score</span>
                                        <span className="text-lg font-bold text-emerald-700">{perf.reliabilityScore}/100</span>
                                    </div>
                                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                                        <span className="text-[10px] text-gray-400 uppercase block font-semibold">Trips</span>
                                        <span className="text-lg font-bold text-gray-900">{perf.totalAssignments}</span>
                                    </div>
                                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                                        <span className="text-[10px] text-gray-400 uppercase block font-semibold">Success</span>
                                        <span className="text-lg font-bold text-blue-700">{perf.successRate}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 4: INTERNAL NOTES */}
                {activeTab === 'NOTES' && (
                    <div className="space-y-4 text-xs">
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Operational Notes</span>
                            <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                                {vendor.notes || 'No operational remarks recorded for this resource.'}
                            </p>
                        </div>

                        {isCEO && vendor.metadata?.ceoOnlyNotes && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
                                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">🔒 Confidential CEO Notes</span>
                                <p className="bg-white/80 p-3 rounded-lg border border-amber-200 font-medium">
                                    {vendor.metadata.ceoOnlyNotes}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Drawer>
    );
}
