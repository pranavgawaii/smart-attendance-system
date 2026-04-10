import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Copy, Edit, Eye, ToggleLeft, ToggleRight, Loader2, FileText, Check, ExternalLink, ArrowLeft } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import api from '../../../services/api';

export default function CoordinatorFormsHome() {
    const navigate = useNavigate();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/forms');
            setForms(res.data || []);
        } catch (err) {
            console.error('Error fetching forms:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (form) => {
        const newStatus = form.status === 'active' ? 'closed' : 'active';
        try {
            await api.patch(`/forms/${form.id}/status`, { status: newStatus });
            fetchForms();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const copyPublicLink = (slug) => {
        const url = `${window.location.origin}/forms/${slug}`;
        navigator.clipboard.writeText(url);
        setCopiedId(slug);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-zinc-100 text-zinc-600 border-zinc-200',
            active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            closed: 'bg-red-50 text-red-600 border-red-200'
        };
        return (
            <span className={`px-2.5 py-0.5 text-xs rounded font-medium border ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <AdminLayout title="PlacePro Forms">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/coordinators')}
                            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-zinc-900">PlacePro Forms</h1>
                            <p className="text-sm text-zinc-500 mt-1">Create and manage application forms</p>
                        </div>
                    </div>
                    <Link
                        to="/admin/coordinators/forms/new"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm"
                    >
                        <Plus size={16} />
                        Create New Form
                    </Link>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-2">
                            <Loader2 className="animate-spin text-zinc-400" size={24} />
                            <span className="text-xs text-zinc-500">Loading forms...</span>
                        </div>
                    ) : forms.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4">
                                <FileText className="text-zinc-300" size={24} />
                            </div>
                            <p className="text-sm font-medium text-zinc-600">No forms created yet</p>
                            <p className="text-xs text-zinc-400 mt-1">Create your first form to get started</p>
                            <Link
                                to="/admin/coordinators/forms/new"
                                className="inline-flex items-center gap-1 mt-4 text-sm text-zinc-900 hover:underline font-medium"
                            >
                                Create form <ExternalLink size={12} />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Form Title</th>
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Responses</th>
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Created</th>
                                            <th className="text-right py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {forms.map((form) => (
                                            <tr key={form.id} className="group hover:bg-zinc-50/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-zinc-900">{form.title}</span>
                                                        <span className="text-xs text-zinc-500 truncate max-w-xs">{form.description || 'No description'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">{getStatusBadge(form.status)}</td>
                                                <td className="py-4 px-6">
                                                    <span className="text-sm font-medium text-zinc-700">
                                                        {form.form_responses?.[0]?.count || 0}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-zinc-500">
                                                    {new Date(form.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => copyPublicLink(form.slug)}
                                                            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                                            title="Copy public link"
                                                        >
                                                            {copiedId === form.slug ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/admin/coordinators/forms/${form.id}/edit`)}
                                                            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                                            title="Edit form"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/admin/coordinators/forms/${form.id}/responses`)}
                                                            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                                            title="View responses"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => toggleStatus(form)}
                                                            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                                            title={form.status === 'active' ? 'Close form' : 'Activate form'}
                                                        >
                                                            {form.status === 'active' ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-zinc-50 border-t border-zinc-100 px-6 py-3 flex items-center justify-between text-xs text-zinc-500">
                                <span>Showing {forms.length} form{forms.length !== 1 ? 's' : ''}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
