import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { Plus, Calendar, Users, MapPin, Edit2, XCircle, Eye, Briefcase } from 'lucide-react';
import api from '../../services/api';

export default function AllocationsHome() {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/placement-assessments');
            setAssessments(response.data || []);
        } catch (error) {
            console.error('Failed to fetch assessments:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (time) => {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
            case 'completed': return 'bg-zinc-100 text-zinc-600 ring-zinc-300/50';
            case 'cancelled': return 'bg-red-50 text-red-700 ring-red-600/20';
            default: return 'bg-zinc-100 text-zinc-600 ring-zinc-300/50';
        }
    };

    return (
        <AdminLayout title="Seat Allocations">
            <PageHeader
                title="Seat Allocations"
                description="Manage placement assessment allocations and assign students to labs."
                actions={
                    <Link
                        to="/admin/allocations/create"
                        className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg font-medium text-xs transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus size={14} strokeWidth={1.5} /> Create Allocation
                    </Link>
                }
            />

            {loading ? (
                <div className="p-12 text-center text-zinc-400">Loading assessments...</div>
            ) : assessments.length === 0 ? (
                <EmptyState
                    title="No Assessments Found"
                    description="Create your first placement assessment allocation to assign students to labs."
                    icon={Briefcase}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map(assessment => (
                        <div
                            key={assessment.id}
                            className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all group hover:border-zinc-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-zinc-900 mb-1">
                                        {assessment.company_name}
                                    </h3>
                                    {assessment.position && (
                                        <p className="text-sm text-zinc-500">{assessment.position}</p>
                                    )}
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ring-1 ${getStatusColor(assessment.status)}`}>
                                    {assessment.status}
                                </span>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-zinc-600">
                                    <Calendar size={16} strokeWidth={1.5} className="text-zinc-400" />
                                    <span>{formatDate(assessment.assessment_date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-600">
                                    <span className="text-zinc-400">🕐</span>
                                    <span>{formatTime(assessment.start_time)} - {formatTime(assessment.end_time)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-600">
                                    <Users size={16} strokeWidth={1.5} className="text-zinc-400" />
                                    <span>{assessment.student_count || 0} students</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-600">
                                    <MapPin size={16} strokeWidth={1.5} className="text-zinc-400" />
                                    <span>{assessment.lab_count || 0} labs</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-zinc-50 mt-4">
                                <Link
                                    to={`/admin/allocations/${assessment.id}`}
                                    className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200/50 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-100 hover:text-zinc-900 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Eye size={14} strokeWidth={1.5} /> View
                                </Link>
                                {assessment.status === 'active' && (
                                    <>
                                        <Link
                                            to={`/admin/allocations/edit/${assessment.id}`}
                                            className="px-2.5 py-1.5 bg-white border border-zinc-200 text-zinc-500 rounded-lg text-xs font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center gap-2 shadow-sm"
                                        >
                                            <Edit2 size={14} strokeWidth={1.5} />
                                        </Link>
                                        <button
                                            className="px-2.5 py-1.5 bg-white border border-zinc-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 hover:border-red-100 transition-colors flex items-center gap-2 shadow-sm"
                                        >
                                            <XCircle size={14} strokeWidth={1.5} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
