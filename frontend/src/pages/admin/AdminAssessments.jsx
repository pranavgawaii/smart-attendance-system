import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { Plus, Beaker, Edit, Calendar, Clock, CheckCircle } from 'lucide-react';
import StatsCard from '../../components/StatsCard';

export default function AdminAssessments() {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const res = await api.get('/assessments');
                setAssessments(res.data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch', error);
                setLoading(false);
            }
        };
        fetchAssessments();
    }, []);

    const publishedCount = assessments.filter(a => a.status === 'PUBLISHED').length;

    return (
        <AdminLayout title="Assessments">
            <PageHeader
                title="Assessment Management"
                description="Create and schedule technical assessments and track student performance."
                actions={
                    <Link to="/admin/assessments/create">
                        <button className="bg-zinc-900 hover:bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm flex items-center gap-2">
                            <Plus size={16} strokeWidth={1.5} /> Create Assessment
                        </button>
                    </Link>
                }
            />

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    title="Total Assessments"
                    value={assessments.length}
                    icon={Beaker}
                    iconColor="text-zinc-600"
                    iconBg="bg-zinc-100"
                />
                <StatsCard
                    title="Published"
                    value={publishedCount}
                    icon={CheckCircle}
                    iconColor="text-zinc-900"
                    iconBg="bg-zinc-100"
                    trend={publishedCount > 0 ? "Active" : null}
                />
            </div>

            {loading ? (
                <div className="p-12 text-center text-zinc-400">Loading assessments...</div>
            ) : assessments.length === 0 ? (
                <EmptyState
                    title="No Assessments Yet"
                    description="Create your first assessment to start evaluating student performance and allocating labs."
                    actionLabel="Create Assessment"
                    actionLink="/admin/assessments/create"
                    icon={Beaker}
                />
            ) : (
                <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden text-zinc-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {assessments.map(a => (
                                    <tr key={a.id} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-zinc-900">{a.title}</div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-zinc-400" strokeWidth={1.5} />
                                                {new Date(a.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-zinc-400" strokeWidth={1.5} />
                                                {a.start_time.slice(0, 5)} - {a.end_time.slice(0, 5)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={a.status || 'DRAFT'} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to={`/admin/assessments/${a.id}`}>
                                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-semibold hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                                                    <Edit size={14} strokeWidth={1.5} /> Manage
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
