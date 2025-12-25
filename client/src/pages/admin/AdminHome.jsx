import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { Calendar, Users, ArrowRight, Award, User, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminHome() {
    const { user } = useAuth();

    return (
        <AdminLayout title="Dashboard">
            <div style={{ padding: '1rem' }}>

                {/* Profile Welcome Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)',
                    borderRadius: '20px',
                    padding: '2.5rem',
                    color: 'white',
                    marginBottom: '3rem',
                    boxShadow: '0 10px 25px -5px rgba(76, 29, 149, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', opacity: 0.9 }}>
                            <Shield size={18} />
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Portal</span>
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
                            Hello, {user?.name || 'Administrator'}
                        </h1>
                        <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '1.1rem' }}>
                            Welcome to the Placement & Assessment Control Center.
                        </p>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: '700', color: '#334155' }}>Quick Actions</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                    {/* Sessions Card */}
                    <Link to="/admin/events" style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: '#f8fafc', padding: '2rem', borderRadius: '20px',
                            border: '1px solid #e2e8f0', transition: 'all 0.3s ease',
                            display: 'flex', flexDirection: 'column', gap: '1.5rem',
                            height: '100%',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                        }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#dbeafe'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '14px',
                                background: '#eff6ff', color: '#2563eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem'
                            }}>
                                <Calendar size={28} />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: '700' }}>Manage Sessions</h3>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', lineHeight: 1.5 }}>
                                    Create new placement drives, monitor active attendance, and generate reports.
                                </p>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', fontWeight: '600', fontSize: '0.9rem' }}>
                                View Events <ArrowRight size={16} />
                            </div>
                        </div>
                    </Link>

                    {/* Assessments Card */}
                    <Link to="/admin/assessments" style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: '#f8fafc', padding: '2rem', borderRadius: '20px',
                            border: '1px solid #e2e8f0', transition: 'all 0.3s ease',
                            display: 'flex', flexDirection: 'column', gap: '1.5rem',
                            height: '100%',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                        }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#fce7f3'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '14px',
                                background: '#fdf2f8', color: '#db2777',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem'
                            }}>
                                <Award size={28} />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: '700' }}>Manage Assessments</h3>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', lineHeight: 1.5 }}>
                                    Organize lab exams, coding tests, and seat allocations for students.
                                </p>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#db2777', fontWeight: '600', fontSize: '0.9rem' }}>
                                View Assessments <ArrowRight size={16} />
                            </div>
                        </div>
                    </Link>

                    {/* Users Card */}
                    <Link to="/admin/users" style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: '#f8fafc', padding: '2rem', borderRadius: '20px',
                            border: '1px solid #e2e8f0', transition: 'all 0.3s ease',
                            display: 'flex', flexDirection: 'column', gap: '1.5rem',
                            height: '100%',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                        }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#dcfce7'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '14px',
                                background: '#f0fdf4', color: '#16a34a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem'
                            }}>
                                <Users size={28} />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: '700' }}>Manage Students</h3>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', lineHeight: 1.5 }}>
                                    Manage student database, enrollments, and view individual history.
                                </p>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: '600', fontSize: '0.9rem' }}>
                                View Users <ArrowRight size={16} />
                            </div>
                        </div>
                    </Link>

                </div>
            </div>
        </AdminLayout>
    );
}
