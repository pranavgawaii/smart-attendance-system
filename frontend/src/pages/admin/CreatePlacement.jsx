import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Save, X } from 'lucide-react';

export default function CreatePlacement() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // Check if editing
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        company_name: '',
        role: '',
        job_type: 'INTERNSHIP',
        stipend_ctc: '',
        description: '',
        deadline: '',
        min_cgpa: 0,
        allowed_branches: [],
        industry: '',
        location: '',
        about_company: '',
        selection_process: '',
        bond_details: ''
    });

    const [availableBranches] = useState(['CSE', 'IT', 'AI', 'ENTC', 'MECH', 'CIVIL']);
    const [availableYears] = useState([1, 2, 3, 4]);
    const [selectedYears, setSelectedYears] = useState([]);
    const [selectedBranches, setSelectedBranches] = useState([]);

    const fetchDriveDetails = useCallback(async () => {
        setLoading(true);
        try {
            // Reusing the public API (which includes eligibility in response logic?)
            // Wait, getAllDrives returns simple object. 
            // We need `getDriveById` exposed via API?
            // Currently `getAllDrives` is exposed. `getDriveById` logic exists in Model but Controller doesn't explicity expose a "Get Single" endpoint for Admin?
            // Ah, we might need that.
            // Let's assume we can fetch all and find it, or better: implement GET /:id.
            // Wait, I implemented DELETE /:id and PUT /:id but did I implement GET /:id?
            // Checking routes... NO. Only GET /drives (all).
            // Quick fix: Fetch list and filter client side (easier for now).
            // Or better: Add GET /:id.
            // Given I am modifying this file now, I'll try filtering client side first if list is small.
            // But API `/drives` is public/student filtered? Admin gets raw.
            // Yes, "If Admin, return raw drives".

            const response = await fetch('/api/placement/drives', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            const drive = data.find(d => d.id == id); // Loose equality string/int

            if (drive) {
                // Populate Form
                setFormData({
                    company_name: drive.company_name,
                    role: drive.role,
                    job_type: drive.job_type,
                    stipend_ctc: drive.stipend_ctc || '',
                    description: drive.description || '',
                    deadline: drive.deadline ? new Date(drive.deadline).toISOString().slice(0, 16) : '',
                    min_cgpa: drive.min_cgpa || 0,
                    industry: drive.industry || '',
                    location: drive.location || '',
                    about_company: drive.about_company || '',
                    selection_process: drive.selection_process || '',
                    bond_details: drive.bond_details || '',
                    allowed_branches: [], // Api returns matched? 'min_cgpa', 'allowed_branches' joined?
                    // In getAllDrives model: "SELECT pd.*, er.min_cgpa..."
                    // Yes, they are in the root object.
                });
                // Handle Arrays (Postgres Arrays come as arrays in JSON)
                if (drive.allowed_branches) setSelectedBranches(drive.allowed_branches);
                if (drive.allowed_years) setSelectedYears(drive.allowed_years);
            } else {
                alert("Drive not found!");
                navigate('/admin/placements');
            }

        } catch (err) {
            console.error(err);
            alert("Failed to load drive details");
        } finally {
            setLoading(false);
        }
    }, [id, navigate, token]);

    useEffect(() => {
        if (id) {
            fetchDriveDetails();
        }
    }, [id, fetchDriveDetails]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                ...formData,
                eligibility: {
                    min_cgpa: Number(formData.min_cgpa),
                    allowed_branches: selectedBranches,
                    allowed_years: selectedYears
                }
            };

            const url = id ? `/api/placement/admin/drives/${id}` : '/api/placement/admin/drives';
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Operation failed');
            }

            navigate('/admin/placements');

        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleBranch = (branch) => {
        setSelectedBranches(prev =>
            prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
        );
    };

    const toggleYear = (year) => {
        setSelectedYears(prev =>
            prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
        );
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

    return (
        <AdminLayout title={id ? "Edit Drive" : "Create New Drive"}>
            <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>

                {/* Section 1: Job Details */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    Job Details
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Company Name</label>
                        <input
                            required
                            type="text"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={formData.company_name}
                            onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Job Role</label>
                        <input
                            required
                            type="text"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Industry</label>
                        <input
                            type="text"
                            placeholder="e.g. Fintech, EdTech, SaaS"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={formData.industry}
                            onChange={e => setFormData({ ...formData, industry: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Location</label>
                        <input
                            type="text"
                            placeholder="e.g. Bangalore, Remote"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Job Type</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={formData.job_type}
                            onChange={e => setFormData({ ...formData, job_type: e.target.value })}
                        >
                            <option value="INTERNSHIP">Internship</option>
                            <option value="FULL_TIME">Full Time</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Stipend / CTC</label>
                        <input
                            type="text"
                            placeholder="e.g. 15k/month or 12 LPA"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={formData.stipend_ctc}
                            onChange={e => setFormData({ ...formData, stipend_ctc: e.target.value })}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Job Description</label>
                    <textarea
                        rows={4}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>About Company</label>
                    <textarea
                        rows={3}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                        value={formData.about_company}
                        onChange={e => setFormData({ ...formData, about_company: e.target.value })}
                        placeholder="Brief description about the organization..."
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Selection Process</label>
                        <textarea
                            rows={4}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                            value={formData.selection_process}
                            onChange={e => setFormData({ ...formData, selection_process: e.target.value })}
                            placeholder="e.g. 1. Aptitude Test..."
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Bond / Other Details</label>
                        <textarea
                            rows={4}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                            value={formData.bond_details}
                            onChange={e => setFormData({ ...formData, bond_details: e.target.value })}
                            placeholder="e.g. 2 Years Service Bond..."
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Application Deadline</label>
                    <input
                        required
                        type="datetime-local"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        value={formData.deadline}
                        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                    />
                </div>

                {/* Section 2: Eligibility */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    Eligibility Criteria
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Minimum CGPA</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            style={{ width: '100px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={formData.min_cgpa}
                            onChange={e => setFormData({ ...formData, min_cgpa: e.target.value })}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Allowed Branches</label>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {availableBranches.map(branch => (
                                <button
                                    key={branch}
                                    type="button"
                                    onClick={() => toggleBranch(branch)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '20px',
                                        border: selectedBranches.includes(branch) ? '1px solid #18181b' : '1px solid #e4e4e7',
                                        background: selectedBranches.includes(branch) ? '#f4f4f5' : 'white',
                                        color: selectedBranches.includes(branch) ? '#18181b' : '#71717a',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {branch}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Allowed Years</label>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {availableYears.map(year => (
                                <button
                                    key={year}
                                    type="button"
                                    onClick={() => toggleYear(year)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '20px',
                                        border: selectedYears.includes(year) ? '1px solid #18181b' : '1px solid #e4e4e7',
                                        background: selectedYears.includes(year) ? '#f4f4f5' : 'white',
                                        color: selectedYears.includes(year) ? '#18181b' : '#71717a',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Year {year}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/placements')}
                        style={{
                            padding: '1rem 2rem', borderRadius: '12px', border: '1px solid #cbd5e1',
                            background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            padding: '1rem 2rem', borderRadius: '12px', border: 'none',
                            background: '#18181b', color: 'white', fontWeight: '600', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: submitting ? 0.7 : 1
                        }}
                    >
                        <Save size={20} strokeWidth={1.5} />
                        {submitting ? 'Saving...' : id ? 'Update Drive' : 'Create Drive'}
                    </button>
                </div>

            </form>
        </AdminLayout>
    );
}
