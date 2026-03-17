import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, MapPin, Briefcase, Calendar, CheckCircle, XCircle, Search, Filter, ChevronRight, Clock, DollarSign, Globe, ArrowLeft, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function StudentPlacements() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('opportunities'); // opportunities, applications, offers
    const [drives, setDrives] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applyingId, setApplyingId] = useState(null);
    const [filterEligible, setFilterEligible] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const drivesRes = await fetch('/api/placement/drives', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const appsRes = await fetch('/api/placement/student/applications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (drivesRes.ok) {
                setDrives(await drivesRes.json());
            }
            if (appsRes.ok) {
                setApplications(await appsRes.json());
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApply = async (driveId) => {
        if (!window.confirm("Confirm application to this drive?")) return;
        setApplyingId(driveId);
        try {
            const response = await fetch('/api/placement/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ driveId })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to apply');
            }

            // Refresh
            fetchData();
            alert("Application Submitted Successfully!");
        } catch (err) {
            alert(err.message);
        } finally {
            setApplyingId(null);
        }
    };

    const hasApplied = (driveId) => applications.some(app => app.drive_id === driveId);

    const filteredDrives = drives.filter(drive => {
        if (activeTab === 'opportunities') {
            // Show only if NOT applied
            if (hasApplied(drive.id)) return false;
            // Filter eligible if checked
            if (filterEligible && !drive.isEligible) return false;
            // Hide expired? Maybe show but mark closed. Reference image shows "Registrations closed".
            return true;
        }
        return true;
    });

    const myApplications = applications.map(app => {
        // Hydrate application with drive details if needed, 
        // essentially we might want to blend the lists or just show the App list from API.
        // The API `getStudentApplications` joins with placement_drives (pd), so it has company_name, etc.
        return app;
    });

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>

            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1.5rem 0' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => navigate('/student')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', marginLeft: '-8px', borderRadius: '50%', color: '#64748b' }}>
                                <ArrowLeft size={24} />
                            </button>
                            <Briefcase size={32} color="#4c1d95" strokeWidth={2.5} />
                            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' }}>Jobs</h1>
                        </div>
                        <button onClick={() => navigate('/student')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%', color: '#64748b' }}>
                            <Home size={24} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid transparent' }}>
                        {['opportunities', 'applications', 'offers'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '0.75rem 0',
                                    fontWeight: activeTab === tab ? '700' : '500',
                                    color: activeTab === tab ? '#4c1d95' : '#64748b',
                                    borderBottom: activeTab === tab ? '3px solid #4c1d95' : '3px solid transparent',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem' }}>

                {activeTab === 'opportunities' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                                <div
                                    onClick={() => setFilterEligible(!filterEligible)}
                                    style={{
                                        width: '20px', height: '20px', borderRadius: '6px',
                                        border: filterEligible ? 'none' : '2px solid #cbd5e1',
                                        background: filterEligible ? '#4c1d95' : 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    {filterEligible && <CheckCircle size={14} color="white" />}
                                </div>
                                <span style={{ color: '#475569', fontWeight: '500', fontSize: '0.9rem' }}>Eligible Only</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading jobs...</div>
                            ) : filteredDrives.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>No opportunities found.</div>
                            ) : (
                                filteredDrives.map(drive => (
                                    <JobCard
                                        key={drive.id}
                                        drive={drive}
                                        onApply={() => handleApply(drive.id)}
                                        applying={applyingId === drive.id}
                                        onViewDetails={() => navigate(`/student/placements/${drive.id}`)}
                                    />
                                ))
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'applications' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {myApplications.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>You haven't applied to any jobs yet.</div>
                        ) : (
                            myApplications.map(app => (
                                <div key={app.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>{app.role}</h3>
                                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{app.company_name}</p>
                                        </div>
                                        <div style={{
                                            padding: '0.5rem 1rem', borderRadius: '20px',
                                            background: '#eff6ff', color: '#2563eb', fontWeight: '600', fontSize: '0.85rem'
                                        }}>
                                            {app.status}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                                        Applied on {new Date(app.applied_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'offers' && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                        <Briefcase size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No offers received yet. Keep applying!</p>
                    </div>
                )}

            </div>
        </div>
    );
}


function JobCard({ drive, onApply, applying, onViewDetails }) {
    const isExpired = new Date(drive.deadline) < new Date();
    const daysLeft = Math.ceil((new Date(drive.deadline) - new Date()) / (1000 * 60 * 60 * 24));

    return (
        <div
            className="job-card"
            style={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s',
                cursor: 'pointer'
            }}
            onClick={onViewDetails}
        >
            <div style={{ padding: '1.5rem' }}>
                <div className="job-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0
                        }}>
                            <Building2 size={28} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{drive.role}</h3>
                            <div style={{ color: '#475569', fontWeight: '500', fontSize: '0.95rem' }}>{drive.company_name}</div>
                        </div>
                    </div>

                    <div className="job-status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                        {!isExpired ? (
                            <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{daysLeft > 0 ? `${daysLeft} days left` : 'Ends today'}</span>
                        ) : null}

                        {drive.isEligible ? (
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '4px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                Eligible
                            </span>
                        ) : (
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                Not Eligible
                            </span>
                        )}
                    </div>
                </div>

                <div className="job-meta-grid" style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                    <JobMeta label="Job Type" value={drive.job_type} />
                    <JobMeta label="Industry" value={drive.industry || '-'} />
                    <JobMeta label="CTC" value={drive.stipend_ctc || '-'} />
                    <JobMeta label="Location" value={drive.location || '-'} />
                </div>

                <div className="job-footer" style={{
                    padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem'
                }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isExpired ? (
                            <span style={{ color: '#ef4444' }}>Closed on {new Date(drive.deadline).toLocaleDateString()}</span>
                        ) : (
                            <span className="apply-by-text">Apply by: {new Date(drive.deadline).toLocaleDateString()}</span>
                        )}
                    </div>

                    {!isExpired && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onApply(drive.id); }}
                            disabled={!drive.isEligible || applying}
                            className="apply-btn"
                            style={{
                                background: 'none', border: 'none', color: drive.isEligible ? '#2563eb' : '#94a3b8',
                                fontWeight: '600', fontSize: '0.9rem', cursor: drive.isEligible ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap'
                            }}
                        >
                            {applying ? 'Applying...' : 'Apply Now'} <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>
            <style>{`
                .job-meta-grid {
                    grid-template-columns: repeat(4, 1fr);
                }
                @media (max-width: 768px) {
                    .job-meta-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .job-header {
                        flex-direction: column;
                        align-items: flex-start !important;
                    }
                    .job-status {
                        flex-direction: row !important;
                        justify-content: space-between;
                        width: 100%;
                        align-items: center !important;
                    }
                    .job-footer {
                        flex-direction: column;
                        align-items: stretch !important;
                        text-align: center;
                    }
                    .apply-btn {
                        justify-content: center;
                        margin-top: 0.5rem;
                        background: ${drive.isEligible ? '#eff6ff' : '#f1f5f9'} !important;
                        padding: 0.75rem !important;
                        border-radius: 8px;
                    }
                }
            `}</style>
        </div>
    );
}

function JobMeta({ label, value }) {
    return (
        <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', fontWeight: '500' }}>{label}</div>
            <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        </div>
    );
}
