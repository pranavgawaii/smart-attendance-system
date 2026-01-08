import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import {
    User, Shield, Smartphone, AlertTriangle, Briefcase, Activity,
    Clock, LogOut, Lock, Unlock, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertOctagon, Info
} from 'lucide-react';

export default function StudentProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLogExpanded, setIsLogExpanded] = useState(false);

    // Modal States
    const [activeModal, setActiveModal] = useState(null); // 'block', 'logout', 'unbind', null

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get(`/users/${id}`);
                setUser(res.data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch user', error);

                // Fallback for demo/testing if backend not seeded with this specific ID
                if (id === '1') {
                    setUser({
                        name: "Aditya Sharma",
                        email: "aditya.sharma@mituniversity.edu",
                        enrollment_no: "MIT2023CSE045",
                        branch: "Computer Science & Engineering",
                        academic_year: "3rd Year",
                        user_status: "active",
                        role: "student"
                    });
                    setLoading(false);
                } else {
                    setLoading(false);
                }
            }
        };
        fetchUser();
    }, [id]);

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-64 text-slate-500">Loading profile...</div>
        </AdminLayout>
    );

    if (!user) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-64 text-red-500">Student not found.</div>
        </AdminLayout>
    );

    // --- Mock Data ---
    const mockSecurity = {
        deviceBound: true,
        deviceId: "8a7b3c2d...", // Hashed
        bindDate: "2024-08-15 10:30 AM",
        lastLogin: "2024-10-24 09:15 AM",
        lastIp: "192.168.1.104",
        activeSession: true
    };

    const mockStats = {
        sessionsAttended: 42,
        sessionsMissed: 4,
        attendancePercentage: 91.3,
        lastAttended: "Advanced Java Lab - 24 Oct",
        proxyAttempts: 1,
        lastProxy: "2024-09-10 14:00",
        cgpa: 8.4,
        eligibleDrives: 12,
        appliedDrives: 8
    };

    const mockActivityLog = [
        { id: 1, admin: "admin@mit.edu", action: "Unblocked Account", time: "2024-10-20 11:00 AM" },
        { id: 2, admin: "superadmin@mit.edu", action: "Reset Device Binding", time: "2024-09-15 09:30 AM" },
        { id: 3, admin: "system", action: "Flagged Suspicious Login", time: "2024-09-10 02:15 PM" },
    ];

    const mockAttendanceHistory = [
        { id: 1, subject: "Advanced Java Lab", date: "24 Oct", time: "10:00 AM", status: "Present", method: "QR Scan" },
        { id: 2, subject: "Database Management", date: "23 Oct", time: "02:00 PM", status: "Present", method: "QR Scan" },
        { id: 3, subject: "Operating Systems", date: "22 Oct", time: "11:00 AM", status: "Absent", method: "-" },
        { id: 4, subject: "Software Engineering", date: "21 Oct", time: "09:00 AM", status: "Present", method: "Manual" },
        { id: 5, subject: "Computer Networks", date: "20 Oct", time: "01:00 PM", status: "Present", method: "QR Scan" },
    ];

    // --- Actions ---
    const handleAction = (actionType) => {
        console.log(`Executing action: ${actionType} for user ${user.enrollment_no}`);
        setActiveModal(null);
        // Implement actual API call here
    };

    // --- Components ---

    const ActionModal = ({ title, description, confirmText, confirmColor, onConfirm, onCancel }) => (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertOctagon size={24} color={confirmColor} /> {title}
                </h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>{description}</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onConfirm} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: confirmColor, color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>{confirmText}</button>
                </div>
            </div>
        </div>
    );

    const HeaderSection = () => (
        <div style={{
            background: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', gap: '2rem',
            border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden'
        }}>
            {/* Demo Watermark */}
            <div style={{
                position: 'absolute', top: '10px', right: '10px',
                background: '#f1f5f9', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 'bold',
                padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
                Sample / Demo Data
            </div>

            <div style={{
                width: '80px', height: '80px', borderRadius: '50%', background: '#4f46e5', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold'
            }}>
                {user.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{user.name}</h1>
                    <span style={{
                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em',
                        background: user.user_status === 'active' ? '#dcfce7' : '#fee2e2',
                        color: user.user_status === 'active' ? '#15803d' : '#b91c1c'
                    }}>
                        {(user.user_status || 'ACTIVE').toUpperCase()}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '2rem', color: '#64748b', fontSize: '0.95rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={16} /> <span style={{ fontFamily: 'monospace' }}>{user.enrollment_no}</span>
                    </div>
                    <div>{user.email}</div>
                    <div>{user.branch || 'N/A'}  |  Year: {user.academic_year || '-'}</div>
                </div>
            </div>
        </div>
    );

    const AttendanceSection = () => (
        <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h3 style={sectionHeaderStyle}><Clock size={20} /> Attendance</h3>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{mockStats.attendancePercentage}%</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>OVERALL ATTENDANCE</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <StatBox label="Present" value={mockStats.sessionsAttended} color="#15803d" bg="#dcfce7" />
                <StatBox label="Absent" value={mockStats.sessionsMissed} color="#b91c1c" bg="#fee2e2" />
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '1rem', textTransform: 'uppercase' }}>Recent Activity</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {mockAttendanceHistory.map((record) => (
                        <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>{record.subject}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{record.date}, {record.time}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: '700',
                                    color: record.status === 'Present' ? '#15803d' : '#b91c1c'
                                }}>
                                    {record.status.toUpperCase()}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{record.method}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const SecuritySection = () => (
        <div style={cardStyle}>
            <h3 style={sectionHeaderStyle}><Shield size={20} /> Account & Security</h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Active Session</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: mockSecurity.activeSession ? '#15803d' : '#64748b' }}>
                        {mockSecurity.activeSession ? 'Online Now' : 'Offline'}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Last Login</div>
                    <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>{mockSecurity.lastLogin}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <InfoItem label="Device Bound" value={mockSecurity.deviceBound ? "Yes (Secure)" : "No"} highlight={mockSecurity.deviceBound} />
                <InfoItem label="Device ID (Hash)" value={mockSecurity.deviceId} monospace />
                <InfoItem label="First Bind Date" value={mockSecurity.bindDate} />
                <InfoItem label="Last IP Address" value={mockSecurity.lastIp} monospace />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <ActionButton
                    icon={<LogOut size={14} />}
                    label="Force Logout"
                    onClick={() => setActiveModal('logout')}
                    color="#d97706" bg="#fef3c7"
                />
                <ActionButton
                    icon={<Smartphone size={14} />}
                    label="Reset Binding"
                    onClick={() => setActiveModal('unbind')}
                    color="#2563eb" bg="#eff6ff"
                />
                <ActionButton
                    className="col-span-2"
                    style={{ gridColumn: 'span 2' }}
                    icon={user.user_status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                    label={user.user_status === 'active' ? "Block Account" : "Unblock Account"}
                    onClick={() => setActiveModal('block')}
                    color={user.user_status === 'active' ? "#dc2626" : "#16a34a"}
                    bg={user.user_status === 'active' ? "#fee2e2" : "#dcfce7"}
                />
            </div>
        </div>
    );

    const PlacementSection = () => (
        <div style={cardStyle}>
            <h3 style={sectionHeaderStyle}><Briefcase size={20} /> Placement Eligibility</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>CGPA</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#334155' }}>{mockStats.cgpa}</div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Status</div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', background: '#dcfce7', color: '#15803d' }}>ELIGIBLE</span>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>{mockStats.eligibleDrives}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Eligible Drives</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>{mockStats.appliedDrives}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Applied</div>
                </div>
            </div>
        </div>
    );

    const ViolationSection = () => (
        <div style={cardStyle}>
            <h3 style={sectionHeaderStyle}><AlertTriangle size={20} /> Violations & Flags</h3>
            {mockStats.proxyAttempts > 0 ? (
                <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '50%', color: '#d97706' }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#9a3412' }}>{mockStats.proxyAttempts} Proxy Attempt(s)</div>
                            <div style={{ fontSize: '0.85rem', color: '#c2410c', marginTop: '4px' }}>Last detected: {mockStats.lastProxy}</div>
                            <div style={{ fontSize: '0.8rem', color: '#9a3412', marginTop: '8px', lineHeight: 1.4 }}>
                                User attempted to mark attendance from an unauthorized location hash.
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ color: '#64748b', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>No violations detected.</div>
            )}
        </div>
    );

    const ActivityLogSection = () => (
        <div style={{ ...cardStyle }}>
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setIsLogExpanded(!isLogExpanded)}
            >
                <h3 style={{ ...sectionHeaderStyle, marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}><Activity size={20} /> Admin Activity Log</h3>
                {isLogExpanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
            </div>

            {isLogExpanded && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: '#64748b' }}>
                                <th style={{ padding: '0.75rem', fontWeight: '600' }}>Admin</th>
                                <th style={{ padding: '0.75rem', fontWeight: '600' }}>Action</th>
                                <th style={{ padding: '0.75rem', fontWeight: '600' }}>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockActivityLog.map(log => (
                                <tr key={log.id} style={{ borderTop: '1px solid #f8fafc' }}>
                                    <td style={{ padding: '0.75rem', color: '#334155' }}>{log.admin}</td>
                                    <td style={{ padding: '0.75rem', color: '#334155' }}>{log.action}</td>
                                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>{log.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <AdminLayout title="Student Profile" backUrl="/admin/users">
            <HeaderSection />

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: '1.5rem', alignItems: 'start' }}>

                {/* Left Column: Security & Identity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <SecuritySection />
                    <PlacementSection />
                </div>

                {/* Middle Column: Attendance (Main Focus) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <AttendanceSection />
                    <ActivityLogSection />
                </div>

                {/* Right Column: Violations & Issues */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <ViolationSection />
                    {/* Placeholder for future widgets like "Notes" */}
                    <div style={{ ...cardStyle, minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem', flexDirection: 'column', gap: '8px' }}>
                        <Info size={24} />
                        <div>Advisor Notes (Coming Soon)</div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {activeModal === 'logout' && (
                <ActionModal
                    title="Force Logout"
                    description="Are you sure you want to force sign-out this user from all active devices? They will need to log in again immediately."
                    confirmText="Force Logout"
                    confirmColor="#d97706"
                    onConfirm={() => handleAction('FORCE_LOGOUT')}
                    onCancel={() => setActiveModal(null)}
                />
            )}
            {activeModal === 'unbind' && (
                <ActionModal
                    title="Reset Device Binding"
                    description="This will clear the stored device ID for this student. They will be able to bind a new device upon their next login. This action is logged."
                    confirmText="Reset Binding"
                    confirmColor="#2563eb"
                    onConfirm={() => handleAction('RESET_BINDING')}
                    onCancel={() => setActiveModal(null)}
                />
            )}
            {activeModal === 'block' && (
                <ActionModal
                    title={user.user_status === 'active' ? "Block Account" : "Unblock Account"}
                    description={user.user_status === 'active'
                        ? "Blocking this account will prevent the student from logging in, scanning attendance, or accessing placement drives. Are you sure?"
                        : "Unblocking will restore full access to this account."}
                    confirmText={user.user_status === 'active' ? "Block Account" : "Unblock Account"}
                    confirmColor={user.user_status === 'active' ? "#dc2626" : "#16a34a"}
                    onConfirm={() => handleAction('TOGGLE_BLOCK')}
                    onCancel={() => setActiveModal(null)}
                />
            )}
        </AdminLayout>
    );
}

// --- Styles & Reusables ---
const cardStyle = {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
};

const sectionHeaderStyle = {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '1rem', fontWeight: '700', color: '#0f172a',
    margin: 0
};

const InfoItem = ({ label, value, monospace, highlight }) => (
    <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>{label}</div>
        <div style={{
            fontSize: '0.85rem',
            color: highlight ? '#15803d' : '#334155',
            fontFamily: monospace ? 'monospace' : 'inherit',
            fontWeight: highlight ? '700' : '500',
            wordBreak: 'break-all'
        }}>
            {value}
        </div>
    </div>
);

const ActionButton = ({ icon, label, onClick, color, bg, style }) => (
    <button onClick={onClick} style={{
        ...style,
        background: bg, color: color,
        border: 'none', padding: '0.75rem', borderRadius: '8px',
        fontSize: '0.8rem', fontWeight: '600',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        cursor: 'pointer', transition: 'all 0.2s', width: '100%'
    }}>
        {icon} {label}
    </button>
);

const StatBox = ({ label, value, color, bg }) => (
    <div style={{
        background: bg,
        padding: '1rem',
        borderRadius: '10px',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: color, marginTop: '4px', fontWeight: '600', opacity: 0.9 }}>{label}</div>
    </div>
);
