import React, { useState, useEffect, useMemo } from 'react';
import { X, Upload, Search, Users, Check, AlertCircle, FileText, Download } from 'lucide-react';
import api from '../../services/api';

export default function AddCandidateModal({ assessmentId, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState('UPLOAD'); // UPLOAD | MANUAL
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Upload State ---
    const [parsedCandidates, setParsedCandidates] = useState([]); // { enrollment, user_id, status: 'FOUND'|'NOT_FOUND'|'DUPLICATE' }

    // --- Manual State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ year: 'ALL', branch: 'ALL' });
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // Load Users on Mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users');
                // Only students
                const students = res.data.filter(u => u.role === 'student');
                setUsers(students);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load users", error);
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // --- Upload Logic ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            processCSV(text);
        };
        reader.readAsText(file);
    };

    const processCSV = (text) => {
        // Extract all alphanumeric strings that look like enrollment numbers
        const lines = text.split(/[\n,]/).map(s => s.trim()).filter(s => s.length > 0);

        const results = [];
        const seen = new Set();

        lines.forEach(enrollment => {
            if (seen.has(enrollment)) return; // Skip dupes in file
            seen.add(enrollment);

            const match = users.find(u => u.enrollment_no === enrollment);
            if (match) {
                results.push({ ...match, status: 'FOUND' });
            } else {
                results.push({ enrollment_no: enrollment, status: 'NOT_FOUND', name: 'Unknown' });
            }
        });

        setParsedCandidates(results);
    };

    const handleUploadSubmit = async () => {
        const validIds = parsedCandidates
            .filter(c => c.status === 'FOUND')
            .map(c => c.id);

        if (validIds.length === 0) {
            alert("No valid students found to add.");
            return;
        }

        try {
            await api.post(`/assessments/${assessmentId}/candidates`, { userIds: validIds });
            onSuccess();
        } catch {
            alert('Failed to upload candidates');
        }
    };


    // --- Manual Logic ---
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.enrollment_no || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesYear = filters.year === 'ALL' || String(u.academic_year) === filters.year;
            const matchesBranch = filters.branch === 'ALL' || u.branch === filters.branch;
            return matchesSearch && matchesYear && matchesBranch;
        });
    }, [users, searchQuery, filters]);

    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredUsers, page]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAllPage = () => {
        const pageIds = paginatedUsers.map(u => u.id);
        const allSelected = pageIds.every(id => selectedIds.has(id));

        const newSet = new Set(selectedIds);
        if (allSelected) {
            pageIds.forEach(id => newSet.delete(id));
        } else {
            pageIds.forEach(id => newSet.add(id));
        }
        setSelectedIds(newSet);
    };

    const handleManualSubmit = async () => {
        if (selectedIds.size === 0) return;
        try {
            await api.post(`/assessments/${assessmentId}/candidates`, { userIds: Array.from(selectedIds) });
            onSuccess();
        } catch {
            alert('Failed to add candidates');
        }
    };


    if (loading) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100,
            padding: '2rem'
        }}>
            <div style={{
                width: '100%', maxWidth: '900px', height: '85vh',
                background: 'white', borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>

                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Add Candidates</h2>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Select method to add students to this assessment.</p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f1f5f9', border: 'none', borderRadius: '12px', width: '40px', height: '40px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', padding: '0 2rem', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                    <button
                        onClick={() => setActiveTab('UPLOAD')}
                        style={{
                            padding: '1rem', background: 'none', border: 'none',
                            borderBottom: activeTab === 'UPLOAD' ? '3px solid #18181b' : '3px solid transparent',
                            fontWeight: activeTab === 'UPLOAD' ? '700' : '500',
                            color: activeTab === 'UPLOAD' ? '#18181b' : '#64748b',
                            cursor: 'pointer', marginRight: '1rem',
                            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem'
                        }}
                    >
                        <Upload size={18} /> Bulk Upload (CSV)
                    </button>
                    <button
                        onClick={() => setActiveTab('MANUAL')}
                        style={{
                            padding: '1rem', background: 'none', border: 'none',
                            borderBottom: activeTab === 'MANUAL' ? '3px solid #18181b' : '3px solid transparent',
                            fontWeight: activeTab === 'MANUAL' ? '700' : '500',
                            color: activeTab === 'MANUAL' ? '#18181b' : '#64748b',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem'
                        }}
                    >
                        <Users size={18} /> Manual Selection
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

                    {/* --- UPLOAD TAB --- */}
                    {activeTab === 'UPLOAD' && (
                        <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
                            <div style={{
                                border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center',
                                background: 'white', marginBottom: '2rem', transition: 'all 0.2s',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'
                            }}>
                                <div style={{ width: '64px', height: '64px', background: '#f0f9ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                                    <FileText size={32} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: '700', color: '#1e293b' }}>Upload CSV or Text File</h3>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', maxWidth: '400px' }}>
                                        File should contain a list of Enrollment Numbers (one per line or comma separated).
                                    </p>
                                </div>
                                <label style={{
                                    background: '#18181b', color: 'white', padding: '0.75rem 1.5rem',
                                    borderRadius: '10px', fontWeight: '600', cursor: 'pointer', marginTop: '1rem',
                                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem'
                                }}>
                                    <Upload size={18} /> Choose File
                                    <input
                                        type="file"
                                        accept=".csv,.txt"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>

                            {parsedCandidates.length > 0 && (
                                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#334155' }}>Preview</h4>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>{parsedCandidates.filter(c => c.status === 'FOUND').length} Valid Students</span>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                            <thead style={{ background: 'white', position: 'sticky', top: 0 }}>
                                                <tr>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase' }}>Enrollment</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase' }}>Name</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedCandidates.map((c, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#334155' }}>{c.enrollment_no}</td>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            {c.status === 'FOUND' ?
                                                                <span style={{ color: '#15803d', fontWeight: '600', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Verified</span> :
                                                                <span style={{ color: '#b91c1c', fontWeight: '600', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Not Found</span>
                                                            }
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{c.name}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- MANUAL TAB --- */}
                    {activeTab === 'MANUAL' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* Toolbar */}
                            <div style={{ padding: '1rem 2rem', background: '#white', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input
                                        placeholder="Search name or enrollment..."
                                        style={{
                                            width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
                                            borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none'
                                        }}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    style={{ padding: '0.6rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'white' }}
                                    value={filters.year}
                                    onChange={e => setFilters({ ...filters, year: e.target.value })}
                                >
                                    <option value="ALL">All Years</option>
                                    <option value="4">Final Year (4th)</option>
                                    <option value="3">Third Year (3rd)</option>
                                </select>
                                <select
                                    style={{ padding: '0.6rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'white' }}
                                    value={filters.branch}
                                    onChange={e => setFilters({ ...filters, branch: e.target.value })}
                                >
                                    <option value="ALL">All Branches</option>
                                    <option value="CSE">CSE</option>
                                    <option value="IT">IT</option>
                                    <option value="ENTC">ENTC</option>
                                </select>
                            </div>

                            {/* Table */}
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                                    <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                                        <tr>
                                            <th style={{ padding: '1rem 2rem', width: '40px', borderBottom: '1px solid #e2e8f0' }}>
                                                <input
                                                    type="checkbox"
                                                    onChange={toggleSelectAllPage}
                                                    checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedIds.has(u.id))}
                                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                />
                                            </th>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase' }}>Enrollment</th>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase' }}>Name</th>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase' }}>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedUsers.length === 0 ? (
                                            <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No students found matching filters.</td></tr>
                                        ) : (
                                            paginatedUsers.map(u => <tr key={u.id}
                                                onClick={() => toggleSelection(u.id)}
                                                style={{
                                                    borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                                                    background: selectedIds.has(u.id) ? '#f4f4f5' : 'white',
                                                    transition: 'background 0.1s'
                                                }}
                                            >
                                                <td style={{ padding: '1rem 2rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(u.id)}
                                                        onChange={() => toggleSelection(u.id)}
                                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#334155', fontWeight: '500' }}>{u.enrollment_no || '-'}</td>
                                                <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{u.name}</td>
                                                <td style={{ padding: '1rem', color: '#64748b' }}>{u.branch} <span style={{ fontSize: '0.85rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>Year {u.academic_year}</span></td>
                                            </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div style={{ padding: '0.75rem 2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Showing {paginatedUsers.length} of {filteredUsers.length} students</span>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        style={{
                                            padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'white',
                                            border: '1px solid #e2e8f0', borderRadius: '8px', cursor: page === 1 ? 'not-allowed' : 'pointer',
                                            color: page === 1 ? '#cbd5e1' : '#334155'
                                        }}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: '500' }}>Page {page} of {totalPages || 1}</span>
                                    <button
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        style={{
                                            padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'white',
                                            border: '1px solid #e2e8f0', borderRadius: '8px', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                                            color: page >= totalPages ? '#cbd5e1' : '#334155'
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'white' }}>
                    <button onClick={onClose} style={{
                        background: 'white', color: '#475569', border: '1px solid #cbd5e1',
                        padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer'
                    }}>
                        Cancel
                    </button>
                    {activeTab === 'UPLOAD' ? (
                        <button onClick={handleUploadSubmit} disabled={parsedCandidates.filter(c => c.status === 'FOUND').length === 0}
                            style={{
                                background: '#18181b', color: 'white', border: 'none',
                                padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer',
                                opacity: parsedCandidates.filter(c => c.status === 'FOUND').length === 0 ? 0.5 : 1
                            }}
                        >
                            Import {parsedCandidates.filter(c => c.status === 'FOUND').length} Candidates
                        </button>
                    ) : (
                        <button onClick={handleManualSubmit} disabled={selectedIds.size === 0}
                            style={{
                                background: '#18181b', color: 'white', border: 'none',
                                padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer',
                                opacity: selectedIds.size === 0 ? 0.5 : 1
                            }}
                        >
                            Add {selectedIds.size} Selected Students
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
