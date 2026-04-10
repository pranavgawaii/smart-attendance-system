import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import StatsCard from '../../components/StatsCard';
import EmptyState from '../../components/EmptyState';
import { Plus, Building2, Calendar, Trash2, Edit2, Briefcase, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminPlacements() {
    const { token } = useAuth();
    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDrives = useCallback(async () => {
        try {
            const response = await fetch('/api/placement/drives', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errText = await response.text();
                // Check if HTML
                if (errText.trim().startsWith('<')) {
                    throw new Error(`API Error: Endpoint returned HTML. (Status: ${response.status})`);
                }
                throw new Error(`Failed: ${response.text}`);
            }
            const data = await response.json();
            setDrives(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchDrives();
    }, [fetchDrives]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this drive? This cannot be undone.')) return;

        try {
            const response = await fetch(`/api/placement/admin/drives/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete drive');

            setDrives(drives.filter(d => d.id !== id));
        } catch (err) {
            alert('Error deleting drive: ' + err.message);
        }
    };

    const activeDrives = drives.filter(d => new Date(d.deadline) >= new Date()).length;
    const internshipCount = drives.filter(d => d.job_type === 'INTERNSHIP').length;

    return (
        <AdminLayout title="Placement Drives">
            <PageHeader
                title="Placement Drives"
                description="Manage campus placement drives, job postings, and student applications."
                actions={
                    <Link to="/admin/placements/create">
                        <button className="bg-zinc-900 hover:bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm flex items-center gap-2">
                            <Plus size={16} strokeWidth={1.5} /> New Drive
                        </button>
                    </Link>
                }
            />

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    title="Total Drives"
                    value={drives.length}
                    icon={Building2}
                    iconColor="text-zinc-600"
                    iconBg="bg-zinc-100"
                />
                <StatsCard
                    title="Active (Open)"
                    value={activeDrives}
                    icon={Briefcase}
                    iconColor="text-zinc-900"
                    iconBg="bg-zinc-100"
                />
                <StatsCard
                    title="Internships"
                    value={internshipCount}
                    icon={FileText}
                    iconColor="text-zinc-600"
                    iconBg="bg-zinc-100"
                />
            </div>

            {loading ? (
                <div className="p-12 text-center text-zinc-400">Loading placement data...</div>
            ) : error ? (
                <div className="p-12 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
                    Error loading data: {error}
                </div>
            ) : drives.length === 0 ? (
                <EmptyState
                    title="No Placement Drives"
                    description="Create a new placement drive to start accepting student applications."
                    actionLabel="Create Drive"
                    actionLink="/admin/placements/create"
                    icon={Building2}
                />
            ) : (
                <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Company</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Stipend/CTC</th>
                                    <th className="px-6 py-4">Deadline</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {drives.map(drive => {
                                    const isExpired = new Date(drive.deadline) < new Date();
                                    return (
                                        <tr key={drive.id} className="hover:bg-zinc-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400">
                                                        <Building2 size={20} strokeWidth={1.5} />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-zinc-900">{drive.company_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 font-medium">{drive.role}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${drive.job_type === 'INTERNSHIP'
                                                    ? 'bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200'
                                                    : 'bg-zinc-900 text-white ring-1 ring-zinc-900'
                                                    }`}>
                                                    {drive.job_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500 text-sm font-mono">{drive.stipend_ctc || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                                    <Calendar size={14} strokeWidth={1.5} />
                                                    {new Date(drive.deadline).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <StatusBadge status={isExpired ? 'CLOSED' : 'OPEN'} />

                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link
                                                            to={`/admin/placements/edit/${drive.id}`}
                                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} strokeWidth={1.5} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(drive.id)}
                                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} strokeWidth={1.5} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
