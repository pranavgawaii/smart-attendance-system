import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Filter, X, Loader2, Eye, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import api from '../../../services/api';

const STATUS_OPTIONS = [
    { value: 'new', label: 'New', color: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
    { value: 'shortlisted', label: 'Shortlisted', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-50 text-red-600 border-red-200' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-amber-50 text-amber-600 border-amber-200' }
];

export default function FormResponses() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [fields, setFields] = useState([]);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const formRes = await api.get(`/forms/${id}`);
            setForm(formRes.data.form);
            setFields(formRes.data.fields || []);

            const responsesRes = await api.get(`/forms/${id}/responses`);
            setResponses(responsesRes.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateResponseStatus = async (responseId, newStatus, notes) => {
        setSaving(true);
        try {
            await api.patch(`/forms/responses/${responseId}`, { status: newStatus, notes });

            setResponses(responses.map(r =>
                r.id === responseId ? { ...r, status: newStatus, notes } : r
            ));
            setSelectedResponse(prev => prev?.id === responseId ? { ...prev, status: newStatus, notes } : prev);
        } catch (err) {
            console.error('Error updating status:', err);
        } finally {
            setSaving(false);
        }
    };

    const getAnswerValue = (response, fieldLabel) => {
        const field = fields.find(f => f.label.toLowerCase().includes(fieldLabel.toLowerCase()));

        // 1. Direct match by ID (best)
        if (field && response.answers?.[field.id]) {
            return response.answers[field.id];
        }

        // 2. Heuristic: If current ID not found, check for ANY orphaned ID that might contain this data
        // For existing common cases like Name/Email where the ID changed due to a save
        if (response.answers) {
            const orphanedEntries = Object.entries(response.answers).filter(([answerId]) => !fields.find(f => f.id === answerId));

            // If it's the "Name" column
            if (fieldLabel.toLowerCase() === 'name') {
                // Try to find a string value that isn't email-like and isn't too short
                const likelyName = orphanedEntries.find((entry) =>
                    typeof entry[1] === 'string'
                    && entry[1].length > 2
                    && !entry[1].includes('@')
                    && !entry[1].match(/^[0-9]+$/)
                );
                if (likelyName) return likelyName[1];
            }

            // If it's "Email"
            if (fieldLabel.toLowerCase() === 'email') {
                const likelyEmail = orphanedEntries.find((entry) => typeof entry[1] === 'string' && entry[1].includes('@'));
                if (likelyEmail) return likelyEmail[1];
            }

            // Fallback: If we have orphaned data, just show the first one for the "Name" column if nothing else found
            if (fieldLabel.toLowerCase() === 'name' && orphanedEntries.length > 0) {
                return orphanedEntries[0][1];
            }
        }

        return '—';
    };

    const filteredResponses = statusFilter === 'all'
        ? responses
        : responses.filter(r => r.status === statusFilter);

    const exportCSV = () => {
        const headers = ['Submitted At', ...fields.map(f => f.label), 'Status', 'Notes'];
        const rows = responses.map(r => [
            new Date(r.submitted_at).toLocaleString(),
            ...fields.map(f => r.answers?.[f.id] || ''),
            r.status,
            r.notes || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${form?.title || 'responses'}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const getStatusBadge = (status) => {
        const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs rounded font-medium border ${opt.color}`}>
                {opt.label}
            </span>
        );
    };

    if (loading) {
        return (
            <AdminLayout title="Responses">
                <div className="flex flex-col items-center justify-center h-96 gap-2">
                    <Loader2 className="animate-spin text-zinc-400" size={24} />
                    <span className="text-xs text-zinc-500">Loading responses...</span>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={`Responses: ${form?.title}`}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/coordinators/forms')}
                            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-zinc-900">{form?.title}</h1>
                            <p className="text-sm text-zinc-500 mt-0.5">{responses.length} response{responses.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                        </div>
                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                    {filteredResponses.length === 0 ? (
                        <div className="text-center py-20 text-zinc-500">
                            <Clock className="mx-auto mb-2 text-zinc-200" size={32} />
                            <p className="text-sm font-medium text-zinc-600">No responses yet</p>
                            <p className="text-xs text-zinc-400 mt-1">Responses will appear here once submitted</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Submitted</th>
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Name</th>
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</th>
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                                            <th className="text-right py-3 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {filteredResponses.map((response) => (
                                            <tr key={response.id} className="group hover:bg-zinc-50/50 transition-colors">
                                                <td className="py-4 px-6 text-sm text-zinc-500">
                                                    {new Date(response.submitted_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-6 text-sm font-medium text-zinc-900">
                                                    {getAnswerValue(response, 'name')}
                                                </td>
                                                <td className="py-4 px-6 text-sm text-zinc-600">
                                                    {getAnswerValue(response, 'email')}
                                                </td>
                                                <td className="py-4 px-6">{getStatusBadge(response.status)}</td>
                                                <td className="py-4 px-6 text-right">
                                                    <button
                                                        onClick={() => setSelectedResponse(response)}
                                                        className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-zinc-50 border-t border-zinc-100 px-6 py-3 text-xs text-zinc-500">
                                Showing {filteredResponses.length} of {responses.length} responses
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Detail Drawer */}
            {selectedResponse && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedResponse(null)} />
                    <div className="relative ml-auto w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl">
                        <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-zinc-900">Response Details</h2>
                            <button onClick={() => setSelectedResponse(null)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-2">Status</label>
                                <div className="flex gap-2 flex-wrap">
                                    {STATUS_OPTIONS.map(s => (
                                        <button
                                            key={s.value}
                                            onClick={() => updateResponseStatus(selectedResponse.id, s.value, selectedResponse.notes)}
                                            disabled={saving}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedResponse.status === s.value
                                                ? s.color + ' ring-2 ring-offset-1 ring-zinc-400'
                                                : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                                                }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-2">Internal Notes</label>
                                <textarea
                                    value={selectedResponse.notes || ''}
                                    onChange={(e) => setSelectedResponse({ ...selectedResponse, notes: e.target.value })}
                                    onBlur={() => updateResponseStatus(selectedResponse.id, selectedResponse.status, selectedResponse.notes)}
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 resize-none"
                                    rows={3}
                                    placeholder="Add notes..."
                                />
                            </div>

                            {/* Answers */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Submitted Answers</h3>
                                {fields.map((field) => (
                                    <div key={field.id} className="border-b border-zinc-50 pb-3">
                                        <p className="text-xs text-zinc-500 mb-1">{field.label}</p>
                                        <p className="text-sm text-zinc-900 whitespace-pre-wrap">
                                            {selectedResponse.answers?.[field.id] || '—'}
                                        </p>
                                    </div>
                                ))}

                                {/* Orphaned / Legacy Data */}
                                {Object.entries(selectedResponse.answers || {}).map(([id, value]) => {
                                    const fieldExists = fields.find(f => f.id === id);
                                    if (fieldExists) return null;
                                    return (
                                        <div key={id} className="border-b border-zinc-50 pb-3 bg-zinc-50/50 p-2 rounded">
                                            <p className="text-[10px] text-zinc-400 mb-1 italic">Legacy / Deleted Field (ID: {id.slice(0, 8)}...)</p>
                                            <p className="text-sm text-zinc-900 whitespace-pre-wrap">{value}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="text-xs text-zinc-400 pt-4 border-t border-zinc-100">
                                Submitted: {new Date(selectedResponse.submitted_at).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
