import React, { useState } from 'react';
import { X, Upload, UserPlus, FileText, Check, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function AddStudentModal({ onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState('MANUAL'); // MANUAL | UPLOAD
    const [submitting, setSubmitting] = useState(false);

    // --- Manual Entry State ---
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        enrollment_no: '',
        branch: 'CSE',
        academic_year: '1'
    });

    // --- Upload State ---
    const [parsedUsers, setParsedUsers] = useState([]);
    const [uploadError, setUploadError] = useState(null);

    // --- Manual Logic ---
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/users/create', { ...formData, academic_year: parseInt(formData.academic_year) });
            alert('Student added successfully!');
            onSuccess();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create student');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Upload Logic ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                processCSV(event.target.result);
            } catch {
                setUploadError("Invalid CSV format");
            }
        };
        reader.readAsText(file);
    };

    const processCSV = (text) => {
        // Expected Header: Name, Email, Enrollment, Branch, Year
        // Or just assume order if no header? Best to verify header.
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
            setUploadError("File is empty or missing data rows");
            return;
        }

        // Simple CSV parser (no quoting support for simplicity, or use library)
        // Assume first row is header, but we'll try to detect or just parse.
        // Let's assume User provides data from row 2.

        const users = [];
        // Skip header
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            if (cols.length < 3) continue; // Skip invalid lines

            // Assume Standard Order: Name, Email, Enrollment, Branch, Year
            // If they differ, we might need a template download.
            const [name, email, enrollment, branch, year] = cols;

            if (name && email && enrollment) {
                users.push({
                    name,
                    email,
                    enrollment_no: enrollment,
                    branch: branch || 'CSE',
                    academic_year: parseInt(year) || 1
                });
            }
        }

        if (users.length === 0) {
            setUploadError("No valid rows found. Format: Name, Email, Enrollment, Branch, Year");
        }
        setParsedUsers(users);
    };

    const handleBulkSubmit = async () => {
        if (parsedUsers.length === 0) return;
        setSubmitting(true);
        try {
            const res = await api.post('/users/create-bulk', { users: parsedUsers });
            alert(`Bulk Import Complete!\nSuccess: ${res.data.success}\nFailed: ${res.data.failed}`);
            if (res.data.errors.length > 0) {
                console.error("Bulk Errors:", res.data.errors);
            }
            onSuccess();
        } catch {
            alert('Bulk upload failed');
        } finally {
            setSubmitting(false);
        }
    };

    const downloadTemplate = () => {
        const header = "Name,Email,Enrollment Number,Branch,Academic Year\n";
        const row = "John Doe,john@example.com,EN123456,CSE,3";
        const blob = new Blob([header + row], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "student_import_template.csv";
        a.click();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100,
            padding: '2rem'
        }}>
            <div style={{
                width: '100%', maxWidth: '700px', maxHeight: '90vh',
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
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Add New Student</h2>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Create student accounts manually or bulk upload.</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', padding: '0 2rem', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                    <button onClick={() => setActiveTab('MANUAL')} style={{ padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'MANUAL' ? '3px solid #4c1d95' : '3px solid transparent', fontWeight: activeTab === 'MANUAL' ? '700' : '500', color: activeTab === 'MANUAL' ? '#4c1d95' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                        <UserPlus size={18} /> Manual Entry
                    </button>
                    <button onClick={() => setActiveTab('UPLOAD')} style={{ padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'UPLOAD' ? '3px solid #4c1d95' : '3px solid transparent', fontWeight: activeTab === 'UPLOAD' ? '700' : '500', color: activeTab === 'UPLOAD' ? '#4c1d95' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                        <Upload size={18} /> Bulk Upload (CSV)
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem', overflowY: 'auto', background: '#f8fafc', flex: 1 }}>

                    {activeTab === 'MANUAL' ? (
                        <form onSubmit={handleManualSubmit}>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>Full Name</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>Email Address</label>
                                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>Enrollment No.</label>
                                        <input required type="text" value={formData.enrollment_no} onChange={e => setFormData({ ...formData, enrollment_no: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>Branch</label>
                                        <select value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}>
                                            <option value="CSE">CSE</option>
                                            <option value="IT">IT</option>
                                            <option value="ENTC">ENTC</option>
                                            <option value="MECH">MECH</option>
                                            <option value="CIVIL">CIVIL</option>
                                            <option value="AI">AI</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>Year</label>
                                        <select value={formData.academic_year} onChange={e => setFormData({ ...formData, academic_year: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">Final Year</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={submitting} style={{ marginTop: '1rem', width: '100%', padding: '1rem', background: '#4c1d95', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                                    {submitting ? 'Creating...' : 'Create Student Account'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div>
                            <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed #cbd5e1', borderRadius: '16px', background: 'white', marginBottom: '1.5rem' }}>
                                <FileText size={40} color="#64748b" style={{ marginBottom: '1rem' }} />
                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Upload CSV File</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Format: Name, Email, Enrollment, Branch, Year</p>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <label style={{ background: '#4c1d95', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Upload size={18} /> Select File
                                        <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                                    </label>
                                    <button onClick={downloadTemplate} style={{ background: 'white', color: '#4c1d95', border: '1px solid #4c1d95', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileText size={18} /> Template
                                    </button>
                                </div>
                            </div>

                            {uploadError && (
                                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <AlertCircle size={20} /> {uploadError}
                                </div>
                            )}

                            {parsedUsers.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: '600', color: '#334155' }}>Preview: {parsedUsers.length} Students</span>
                                    </div>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                            <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                                                <tr>
                                                    <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                                                    <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
                                                    <th style={{ padding: '8px', textAlign: 'left' }}>Enrollment</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedUsers.map((u, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '8px', color: '#334155' }}>{u.name}</td>
                                                        <td style={{ padding: '8px', color: '#64748b' }}>{u.email}</td>
                                                        <td style={{ padding: '8px', fontFamily: 'monospace' }}>{u.enrollment_no}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button onClick={handleBulkSubmit} disabled={submitting} style={{ marginTop: '1rem', width: '100%', padding: '1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                                        {submitting ? 'Importing...' : 'Confirm Upload'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
