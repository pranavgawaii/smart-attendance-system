import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, MapPin, Briefcase, Calendar, CheckCircle, XCircle, ArrowLeft, Clock, DollarSign, Globe, Share2 } from 'lucide-react';

export default function StudentJobDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [drive, setDrive] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    const checkApplicationStatus = useCallback(async (driveId) => {
        try {
            const appsRes = await fetch('/api/placement/student/applications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (appsRes.ok) {
                const myApps = await appsRes.json();
                setHasApplied(myApps.some(a => a.drive_id === driveId));
            }
        } catch (e) {
            console.error(e);
        }
    }, [token]);

    const fetchDriveDetails = useCallback(async () => {
        try {
            // Need a specific endpoint or just filter? 
            // We'll filter from the list for now or we can implement GET /:id if strictly needed.
            // But since I updated placement.model.js `getDriveById` I should probably use a proper endpoint if available.
            // Currently using the public `/drives` list might be heavy if list is huge, but fine for now.
            // Wait, for specific details we definitely want fresh data.
            // Let's assume the previous plan's "getDriveById" in model is used.
            // But is there a route? 
            // `router.get('/', ...)` gets all.
            // `router.get('/:id', ...)`? 
            // I should check `placement.routes.js`. 
            // If not there, I will fetch all and find one locally as a fallback to avoid breaking route flow unexpectedly.

            const response = await fetch('/api/placement/drives', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            const found = data.find(d => d.id == id);

            if (found) {
                setDrive(found);
                checkApplicationStatus(found.id);
            } else {
                alert("Job not found");
                navigate('/student/placements');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [checkApplicationStatus, id, navigate, token]);

    useEffect(() => {
        fetchDriveDetails();
    }, [fetchDriveDetails]);

    const handleApply = async () => {
        if (!window.confirm("Confirm application?")) return;
        setApplying(true);
        try {
            const response = await fetch('/api/placement/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ driveId: drive.id })
            });
            if (!response.ok) throw new Error('Failed to apply');

            alert("Applied successfully!");
            setHasApplied(true);
        } catch (err) {
            alert(err.message);
        } finally {
            setApplying(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading details...</div>;
    if (!drive) return null;

    const isExpired = new Date(drive.deadline) < new Date();

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>

            {/* Nav Back */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/student/placements')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <span style={{ fontWeight: '600', color: '#334155' }}>Back to Jobs</span>
                </div>
            </div>

            {/* Content Wrapper with Responsive Grid */}
            <div className="details-grid" style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem', display: 'grid', gap: '2rem' }}>

                {/* Main Content */}
                <div style={{ minWidth: 0 }}> {/* minWidth 0 prevents grid blowout */}
                    {/* Header Card */}
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', marginBottom: '2rem' }}>
                        <div className="header-flex" style={{ display: 'flex', gap: '1.5rem' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0
                            }}>
                                <Building2 size={40} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem', lineHeight: '1.2' }}>{drive.role}</h1>
                                <div style={{ fontSize: '1.1rem', color: '#475569', fontWeight: '500', marginBottom: '1rem' }}>{drive.company_name}</div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <Badge label={drive.job_type} color="blue" />
                                    <Badge label={drive.industry || 'Technology'} color="purple" />
                                    {drive.isEligible ? <Badge label="Eligible" color="green" icon={<CheckCircle size={14} />} /> : <Badge label="Not Eligible" color="red" icon={<XCircle size={14} />} />}
                                </div>
                            </div>
                        </div>

                        <div className="stats-grid" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9', display: 'grid', gap: '1.5rem' }}>
                            <DetailItem icon={<MapPin size={18} />} label="Location" value={drive.location || 'Not specified'} />
                            <DetailItem icon={<DollarSign size={18} />} label="CTC / Stipend" value={drive.stipend_ctc || 'Not Disclosed'} />
                            <DetailItem icon={<Calendar size={18} />} label="Deadline" value={new Date(drive.deadline).toLocaleDateString()} />
                        </div>
                    </div>

                    {/* Description Sections */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <SectionCard title="Job Description">
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#334155' }}>
                                {drive.description}
                            </div>
                        </SectionCard>

                        {drive.selection_process && (
                            <SectionCard title="Selection Process">
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#334155' }}>
                                    {drive.selection_process}
                                </div>
                            </SectionCard>
                        )}

                        {drive.bond_details && (
                            <SectionCard title="Bond & Agreement Details">
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#334155' }}>
                                    {drive.bond_details}
                                </div>
                            </SectionCard>
                        )}

                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Apply Card */}
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', position: 'sticky', top: '2rem' }}>
                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem', fontWeight: '500' }}>
                            Registration Status
                        </div>

                        {isExpired ? (
                            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#ef4444', borderRadius: '8px', textAlign: 'center', fontWeight: '600' }}>
                                Applications Closed
                            </div>
                        ) : hasApplied ? (
                            <div style={{ padding: '0.75rem', background: '#dbeafe', color: '#2563eb', borderRadius: '8px', textAlign: 'center', fontWeight: '600' }}>
                                Already Applied
                            </div>
                        ) : (
                            <button
                                onClick={handleApply}
                                disabled={!drive.isEligible || applying}
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '12px',
                                    background: drive.isEligible ? '#4c1d95' : '#e2e8f0',
                                    color: drive.isEligible ? 'white' : '#94a3b8',
                                    border: 'none', fontWeight: '700', fontSize: '1rem', cursor: drive.isEligible ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s',
                                    boxShadow: drive.isEligible ? '0 4px 6px -1px rgba(76, 29, 149, 0.3)' : 'none'
                                }}
                            >
                                {applying ? 'Submitting...' : 'Apply Now'}
                            </button>
                        )}

                        {drive.isEligible && !hasApplied && !isExpired && (
                            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center', lineHeight: '1.4' }}>
                                Make sure your profile is updated before applying.
                            </p>
                        )}
                    </div>

                    {/* About Company Card */}
                    {drive.about_company && (
                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem' }}>About {drive.company_name}</h3>
                            <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#475569' }}>
                                {drive.about_company}
                            </div>
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                <a href="#" style={{ fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Visit Website</a>
                            </div>
                        </div>
                    )}

                </div>

            </div>

            <style>{`
                .details-grid {
                    grid-template-columns: 1fr 340px;
                }
                .stats-grid {
                    grid-template-columns: repeat(3, 1fr);
                }
                @media (max-width: 900px) {
                    .details-grid {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 600px) {
                    .header-flex {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                }
            `}</style>
        </div >
    );
}

function SectionCard({ title, children }) {
    return (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem' }}>{title}</h2>
            {children}
        </div>
    );
}

function Badge({ label, color, icon }) {
    const colors = {
        blue: { bg: '#eff6ff', text: '#2563eb' },
        purple: { bg: '#f3e8ff', text: '#7c3aed' },
        green: { bg: '#dcfce7', text: '#16a34a' },
        red: { bg: '#fee2e2', text: '#ef4444' },
    };
    const c = colors[color] || colors.blue;
    return (
        <span style={{
            background: c.bg, color: c.text,
            padding: '4px 12px', borderRadius: '20px',
            fontSize: '0.8rem', fontWeight: '600',
            display: 'flex', alignItems: 'center', gap: '6px'
        }}>
            {icon} {label}
        </span>
    );
}

function DetailItem({ icon, label, value }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                {icon}
                <span style={{ fontWeight: '500' }}>{label}</span>
            </div>
            <div style={{ color: '#1e293b', fontWeight: '600' }}>{value}</div>
        </div>
    );
}
