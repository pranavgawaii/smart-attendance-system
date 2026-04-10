import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import StatsCard from '../../components/StatsCard';
import { ClipboardList, UserCheck, Clock, CheckCircle2 } from 'lucide-react';

export default function PlacementApplications() {
    return (
        <AdminLayout title="Placement Applications">
            <PageHeader
                title="Placement Applications"
                description="Track and process student responses to active campus recruitment drives."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard title="Total Applied" value="--" icon={ClipboardList} />
                <StatsCard title="Pending Review" value="--" icon={Clock} />
                <StatsCard title="Shortlisted" value="--" icon={CheckCircle2} />
            </div>

            <div className="bg-white border border-zinc-200 rounded-[2rem] p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                    <UserCheck size={40} className="text-zinc-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Application Tracking Offline</h3>
                <p className="text-zinc-500 max-w-sm mx-auto">
                    The student application portal is currently being synchronized with live placement drives. Live tracking will resume shortly.
                </p>
            </div>
        </AdminLayout>
    );
}
