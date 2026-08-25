import React from 'react';
import { PIPELINE_STEPS } from '../../../constants/crm';

export default function OperationsPipelineChart({ stats }) {
    const data = PIPELINE_STEPS.map(step => {
        let count = 0;
        if (step.statusValue === 'Pending') count = stats.pendingLeads;
        else if (step.statusValue === 'In-Progress') count = stats.inProgressLeads;
        else if (step.statusValue === 'Confirmed') count = stats.confirmedLeads;
        else if (step.statusValue === 'Trip Started') count = stats.tripStartedLeads;
        else if (step.statusValue === 'Completed') count = stats.completedLeads;
        else if (step.statusValue === 'Cancelled') count = stats.cancelledLeads;

        return {
            ...step,
            count
        };
    });

    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs mb-8">
            <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <span>📊</span>
                    <span>Operations Pipeline</span>
                </h3>
            </div>

            <div className="space-y-4 py-2">
                {data.map((item) => {
                    const widthPercent = (item.count / maxCount) * 100;
                    return (
                        <div key={item.label} className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                                <span className="flex items-center space-x-1.5">
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </span>
                                <span className="font-bold text-slate-900">{item.count}</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                                <div
                                    style={{ width: `${widthPercent}%` }}
                                    className={`h-full ${item.color} rounded-full transition-all duration-500 ease-out`}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
