import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import StatsCard from '../../components/StatsCard';
import { PieChart, TrendingUp, Award, Briefcase } from 'lucide-react';

export default function PlacementStats() {
    return (
        <AdminLayout title="Placement Stats">
            <PageHeader
                title="Placement Stats"
                description="Historical overview and real-time visualization of placement successes and institution-wide hiring trends."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Total Offers" value="--" icon={Award} />
                <StatsCard title="Placement %" value="--%" icon={TrendingUp} />
                <StatsCard title="Highest CTC" value="-- LPA" icon={Briefcase} />
                <StatsCard title="Unique Hires" value="--" icon={PieChart} />
            </div>

            <div className="bg-white border border-zinc-200 rounded-[2rem] p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                    <PieChart size={40} className="text-zinc-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Stats Aggregator Syncing</h3>
                <p className="text-zinc-500 max-w-sm mx-auto">
                    We are aggregating placement data from previous academic cycles to provide your institution with accurate success metrics.
                </p>
            </div>
        </AdminLayout>
    );
}
