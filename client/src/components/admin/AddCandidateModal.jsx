import React, { useState, useEffect, useMemo } from 'react';
import { X, Upload, Search, Filter, Check, AlertCircle, FileText } from 'lucide-react';
import api from '../../services/api';

export default function AddCandidateModal({ assessmentId, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState('UPLOAD'); // UPLOAD | MANUAL
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Upload State ---
    const [uploadInput, setUploadInput] = useState('');
    const [parsedCandidates, setParsedCandidates] = useState([]); // { enrollment, user_id, status: 'FOUND'|'NOT_FOUND'|'DUPLICATE' }
    const [uploadError, setUploadError] = useState(null);

    // --- Manual State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ year: '4', branch: 'ALL' });
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
        // Simple regex: split by newline/comma, trim
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
        } catch (error) {
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
        } catch (error) {
            alert('Failed to add candidates');
        }
    };


    if (loading) return null; // Or loader

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="mit-card" style={{ width: '90%', maxWidth: '800px', height: '85vh', padding: 0, display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Add Candidates</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                    <button
                        onClick={() => setActiveTab('UPLOAD')}
                        style={{
                            flex: 1, padding: '1rem', background: activeTab === 'UPLOAD' ? '#f8f9fa' : 'white',
                            border: 'none', borderBottom: activeTab === 'UPLOAD' ? '2px solid var(--mit-purple)' : 'none',
                            fontWeight: 'bold', color: activeTab === 'UPLOAD' ? 'var(--mit-purple)' : '#666', cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Upload size={18} /> Bulk Upload (CSV)
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('MANUAL')}
                        style={{
                            flex: 1, padding: '1rem', background: activeTab === 'MANUAL' ? '#f8f9fa' : 'white',
                            border: 'none', borderBottom: activeTab === 'MANUAL' ? '2px solid var(--mit-purple)' : 'none',
                            fontWeight: 'bold', color: activeTab === 'MANUAL' ? 'var(--mit-purple)' : '#666', cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Search size={18} /> Manual Selection
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                    {/* --- UPLOAD TAB --- */}
                    {activeTab === 'UPLOAD' && (
                        <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
                            <div style={{
                                border: '2px dashed #ccc', borderRadius: '8px', padding: '2rem', textAlign: 'center',
                                background: '#fafafa', marginBottom: '2rem'
                            }}>
                                <Upload size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                                <p style={{ margin: '0 0 1rem 0', fontWeight: 'bold' }}>Upload CSV / Text File</p>
                                <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
                                    File should contain a list of Enrollment Numbers (one per line or comma separated).
                                </p>
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileUpload}
                                    style={{ display: 'block', margin: '0 auto' }}
                                />
                            </div>

                            {parsedCandidates.length > 0 && (
                                <div>
                                    <h4 style={{ marginBottom: '1rem' }}>Preview ({parsedCandidates.filter(c => c.status === 'FOUND').length} Valid)</h4>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead style={{ background: '#eee' }}>
                                            <tr>
                                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Enrollment</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedCandidates.map((c, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '0.5rem' }}>{c.enrollment_no}</td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        {c.status === 'FOUND' ?
                                                            <span style={{ color: 'green', fontWeight: 'bold' }}>Found</span> :
                                                            <span style={{ color: 'red', fontWeight: 'bold' }}>Not Found</span>
                                                        }
                                                    </td>
                                                    <td style={{ padding: '0.5rem' }}>{c.name}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- MANUAL TAB --- */}
                    {activeTab === 'MANUAL' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* Toolbar */}
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: '#fff', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                                    <input
                                        className="mit-input"
                                        placeholder="Search name or enrollment..."
                                        style={{ margin: 0, paddingLeft: '32px' }}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="mit-input"
                                    style={{ width: '150px', margin: 0 }}
                                    value={filters.year}
                                    onChange={e => setFilters({ ...filters, year: e.target.value })}
                                >
                                    <option value="ALL">All Years</option>
                                    <option value="4">Final Year (4th)</option>
                                    <option value="3">Third Year (3rd)</option>
                                </select>
                                <select
                                    className="mit-input"
                                    style={{ width: '150px', margin: 0 }}
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
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                    <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem', width: '40px' }}>
                                                <input type="checkbox" onChange={toggleSelectAllPage} checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedIds.has(u.id))} />
                                            </th>
                                            <th style={{ padding: '0.75rem' }}>Enrollment</th>
                                            <th style={{ padding: '0.75rem' }}>Name</th>
                                            <th style={{ padding: '0.75rem' }}>Branch / Year</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedUsers.length === 0 ? (
                                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No students found matching filters.</td></tr>
                                        ) : (
                                            paginatedUsers.map(u => (
                                                <tr key={u.id} style={{ borderBottom: '1px solid #eee', background: selectedIds.has(u.id) ? '#f0f9ff' : 'white' }}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelection(u.id)} />
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{u.enrollment_no || '-'}</td>
                                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{u.name}</td>
                                                    <td style={{ padding: '0.75rem' }}>{u.branch} (Yr {u.academic_year})</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                                <span style={{ fontSize: '0.85rem', color: '#666' }}>Showing {paginatedUsers.length} of {filteredUsers.length} students</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="mit-btn"
                                        disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#eee', color: '#333' }}
                                    >
                                        Prev
                                    </button>
                                    <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>Page {page} of {totalPages || 1}</span>
                                    <button
                                        className="mit-btn"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#eee', color: '#333' }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#fff' }}>
                    <button onClick={onClose} className="mit-btn" style={{ background: '#f8f9fa', color: '#333', border: '1px solid #ddd' }}>Cancel</button>
                    {activeTab === 'UPLOAD' ? (
                        <button onClick={handleUploadSubmit} className="mit-btn" disabled={parsedCandidates.filter(c => c.status === 'FOUND').length === 0}>
                            Upload {parsedCandidates.filter(c => c.status === 'FOUND').length} Candidates
                        </button>
                    ) : (
                        <button onClick={handleManualSubmit} className="mit-btn" disabled={selectedIds.size === 0}>
                            Add {selectedIds.size} Selected
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
