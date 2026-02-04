import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import StatsCard from '../../components/StatsCard';
import { Target, ShieldCheck, Percent, GraduationCap } from 'lucide-react';

export default function PlacementEligibility() {
    return (
        <AdminLayout title="Eligibility Rules">
            <PageHeader
                title="Eligibility Rules"
                description="Configure automated criteria for placement drive participation based on academic and attendance history."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard title="Min. Attendance" value="--%" icon={ShieldCheck} />
                <StatsCard title="CGPA Cutoff" value="0.0" icon={GraduationCap} />
                <StatsCard title="Active Rules" value="--" icon={Target} />
            </div>

            <div className="bg-white border border-zinc-200 rounded-[2rem] p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                    <Percent size={40} className="text-zinc-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Rule Engine Standby</h3>
                <p className="text-zinc-500 max-w-sm mx-auto">
                    The criteria builder for automated student shortlisting is being optimized for current semester regulations.
                </p>
            </div>
        </AdminLayout>
    );
}
