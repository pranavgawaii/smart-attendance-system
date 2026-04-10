import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { Settings, Calendar, Clock, Armchair } from 'lucide-react';

export default function AdminAllocations() {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const res = await api.get('/assessments');
                setAssessments(res.data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch assessments', error);
                setLoading(false);
            }
        };
        fetchAssessments();
    }, []);

    return (
        <AdminLayout title="Allocations">
            <PageHeader
                title="Seat Allocations"
                description="Manage seating arrangements for upcoming assessments across available labs."
            />

            {loading ? (
                <div className="p-12 text-center text-zinc-400">Loading allocation data...</div>
            ) : assessments.length === 0 ? (
                <EmptyState
                    title="No Allocations Available"
                    description="There are no assessments to allocate seats for at the moment."
                    icon={Armchair}
                />
            ) : (
                <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Assessment</th>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {assessments.map(a => (
                                    <tr key={a.id} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-zinc-900">{a.title}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-zinc-600 text-sm">
                                                    <Calendar size={14} className="text-zinc-400" strokeWidth={1.5} />
                                                    {new Date(a.date).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-mono ml-0.5">
                                                    <Clock size={12} className="text-zinc-400" strokeWidth={1.5} />
                                                    {a.start_time.slice(0, 5)} - {a.end_time.slice(0, 5)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={a.status || 'PENDING'} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to={`/admin/allocations/${a.id}`}>
                                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-semibold hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm">
                                                    <Settings size={14} strokeWidth={1.5} /> Manage Seats
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
