import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import {
    Users,
    Calendar,
    Building2,
    CheckCircle,
    Monitor,
    ArrowRight,
    Activity,
    PlusCircle,
    Download,
    Clock,
    MoreHorizontal
} from 'lucide-react';

export default function AdminHome() {
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({
        students: 0,
        sessions: { total: 0, active: 0, liveSession: null },
        assessments: { total: 0, published: 0, list: [] },
        placements: { total: 0, open: 0 },
        submissions: [] // Mock or fetched
    });

    const fetchAllData = useCallback(async () => {
        try {
            const [usersRes, eventsRes, assessmentsRes] = await Promise.allSettled([
                api.get('/users').catch(() => ({ data: [] })),
                api.get('/events').catch(() => ({ data: [] })),
                api.get('/assessments').catch(() => ({ data: [] }))
            ]);

            const newCounts = {
                students: 0,
                sessions: { total: 0, active: 0, liveSession: null },
                assessments: { total: 0, published: 0, list: [] },
                placements: { total: 0, open: 0 },
                submissions: []
            };

            if (usersRes.status === 'fulfilled') {
                const users = Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
                newCounts.students = users.length;
            }

            if (eventsRes.status === 'fulfilled') {
                const events = Array.isArray(eventsRes.value.data) ? eventsRes.value.data : [];
                newCounts.sessions.total = events.length;
                newCounts.sessions.active = events.filter(e => e.session_state === 'ACTIVE' || e.session_state === 'LIVE').length;
                newCounts.sessions.liveSession = events.find(e => e.session_state === 'ACTIVE' || e.session_state === 'LIVE');
            }

            if (assessmentsRes.status === 'fulfilled') {
                const assessments = Array.isArray(assessmentsRes.value.data) ? assessmentsRes.value.data : [];
                newCounts.assessments.total = assessments.length;
                newCounts.assessments.published = assessments.filter(a => a.status === 'PUBLISHED').length;
                newCounts.assessments.list = assessments
                    .filter(a => new Date(a.assessment_date) >= new Date()) // Future only
                    .sort((a, b) => new Date(a.assessment_date) - new Date(b.assessment_date)) // Nearest first
                    .slice(0, 3); // Top 3
            }

            setCounts(newCounts);
        } catch (error) {
            console.error("Dashboard data fetch failed", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const liveSession = counts.sessions.liveSession;

    return (
        <AdminLayout title="Overview">

            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-medium tracking-tight text-zinc-900">Overview</h1>
                    <p className="text-zinc-500 mt-1 text-sm font-normal">Welcome back, here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">Last updated: Just now</span>
                    <button className="bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 text-zinc-900 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                        <Download size={14} strokeWidth={1.5} />
                        Export Report
                    </button>
                    <Link to="/admin/events/create">
                        <button className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                            <PlusCircle size={14} strokeWidth={1.5} />
                            New Session
                        </button>
                    </Link>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Metric 1: Students */}
                <div className="bg-white p-5 rounded-xl border border-zinc-200/60 shadow-card hover:shadow-card-hover flex flex-col justify-between h-32 group hover:border-zinc-300 transition-all">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wide">Total Students</span>
                            <span className="text-2xl font-medium tracking-tight text-zinc-900 mt-1">{loading ? '...' : counts.students}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
                            <Users size={16} strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                {/* Metric 2: Sessions */}
                <div className="bg-white p-5 rounded-xl border border-zinc-200/60 shadow-card hover:shadow-card-hover flex flex-col justify-between h-32 group hover:border-zinc-300 transition-all">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wide">Total Sessions</span>
                            <span className="text-2xl font-medium tracking-tight text-zinc-900 mt-1">{loading ? '...' : counts.sessions.total}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
                            <Calendar size={16} strokeWidth={1.5} />
                        </div>
                    </div>
                    {liveSession ? (
                        <div className="flex items-center gap-2 mt-auto">
                            <span className="bg-zinc-100 text-zinc-900 text-[10px] font-medium px-1.5 py-0.5 rounded border border-zinc-200 flex items-center gap-1">
                                <span className="w-1 h-1 bg-zinc-900 rounded-full animate-pulse"></span>
                                Live Now
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mt-auto">
                            <span className="text-zinc-400 text-xs">No active sessions</span>
                        </div>
                    )}
                </div>

                {/* Metric 3: Assessments */}
                <div className="bg-white p-5 rounded-xl border border-zinc-200/60 shadow-card hover:shadow-card-hover flex flex-col justify-between h-32 group hover:border-zinc-300 transition-all">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wide">Published Assessments</span>
                            <span className="text-2xl font-medium tracking-tight text-zinc-900 mt-1">{loading ? '...' : counts.assessments.published}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
                            <CheckCircle size={16} strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                        <span className="text-zinc-400 text-xs">{counts.assessments.total} total drafted</span>
                    </div>
                </div>
            </div>

            {/* Main Section Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Charts & Lists */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Chart Card */}
                    {/* Upcoming Assessments Card */}
                    <div className="bg-white rounded-xl border border-zinc-200/60 shadow-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                            <h3 className="text-base font-medium text-zinc-900">Upcoming Assessments</h3>
                            <Link to="/admin/assessments" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                                View All
                            </Link>
                        </div>

                        <div className="p-0">
                            {counts.assessments.list.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center text-zinc-400">
                                    <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3">
                                        <Calendar size={20} strokeWidth={1.5} />
                                    </div>
                                    <p className="text-sm">No upcoming assessments scheduled.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-50">
                                    {counts.assessments.list.map((assessment, i) => (
                                        <div key={i} className="p-4 hover:bg-zinc-50 transition-colors flex items-center gap-4">
                                            {/* Date Box */}
                                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-zinc-50 rounded-lg border border-zinc-100 shrink-0">
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase">{new Date(assessment.assessment_date).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-xl font-bold text-zinc-900 leading-none">{new Date(assessment.assessment_date).getDate()}</span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-zinc-900 truncate">{assessment.company_name}</h4>
                                                <p className="text-xs text-zinc-500 mt-0.5 truncate">{assessment.position || 'Recruitment Drive'} • {assessment.start_time?.slice(0, 5)} - {assessment.end_time?.slice(0, 5)}</p>
                                            </div>

                                            {/* Status Badge */}
                                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${assessment.status === 'PUBLISHED'
                                                ? 'bg-zinc-900 text-zinc-50 border-zinc-900'
                                                : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                                }`}>
                                                {assessment.status === 'PUBLISHED' ? 'Scheduled' : 'Draft'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Placements Table */}
                    <div className="bg-white rounded-xl border border-zinc-200/60 shadow-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                            <h3 className="text-base font-medium text-zinc-900">Recent Drives</h3>
                            <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
                                <MoreHorizontal size={20} strokeWidth={1.5} />
                            </button>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-zinc-500 font-medium border-b border-zinc-100 bg-zinc-50/50">
                                    <th className="px-6 py-3 font-medium">Company</th>
                                    <th className="px-6 py-3 font-medium">Role</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Deadline</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {/* Mock Data rows matching aesthetic */}
                                <tr className="group hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-zinc-50 text-zinc-900 flex items-center justify-center border border-zinc-100">
                                                <Building2 size={16} />
                                            </div>
                                            <span className="font-medium text-zinc-900">Google</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600">Software Engineer</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-900 border border-zinc-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900"></span>
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-zinc-500 text-xs">2 days left</td>
                                </tr>
                                <tr className="group hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-zinc-50 text-zinc-900 flex items-center justify-center border border-zinc-100">
                                                <Building2 size={16} />
                                            </div>
                                            <span className="font-medium text-zinc-900">Microsoft</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600">Product Manager</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                                            Closed
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-zinc-500 text-xs">Yesterday</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Quick Actions & Schedule */}
                <div className="space-y-6">

                    {/* Live Session / Next Class Card */}
                    {liveSession ? (
                        <div className="bg-zinc-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Clock size={100} strokeWidth={1} />
                            </div>
                            <div className="relative z-10">
                                <span className="inline-block px-2 py-1 rounded-md bg-white/10 text-xs font-medium mb-4 backdrop-blur-sm border border-white/10">Live Session</span>
                                <h3 className="text-xl font-medium tracking-tight mb-1">{liveSession.name}</h3>
                                <p className="text-zinc-400 text-sm mb-6">{liveSession.venue || 'Venue TBD'}</p>

                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-medium tracking-tight">{Math.floor(liveSession.qr_refresh_interval / 60)}</div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Min</div>
                                    </div>
                                    <div className="h-8 w-px bg-zinc-800"></div>
                                    <div className="text-center">
                                        <div className="text-2xl font-medium tracking-tight">Active</div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Status</div>
                                    </div>
                                </div>

                                <Link to={`/admin/events/${liveSession.id}`}>
                                    <button className="w-full mt-6 bg-white text-zinc-900 py-2.5 rounded-lg text-xs font-semibold hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2">
                                        Monitor Session
                                        <ArrowRight size={14} strokeWidth={2} />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-zinc-200/60 rounded-xl p-6 shadow-card hover:border-zinc-300 transition-colors">
                            <div className="flex items-center gap-3 mb-3 text-zinc-400">
                                <Clock size={20} />
                                <span className="text-sm font-medium">No Active Sessions</span>
                            </div>
                            <p className="text-xs text-zinc-500 mb-4">You have no active attendance sessions running at the moment.</p>
                            <Link to="/admin/events/create">
                                <button className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 py-2 rounded-lg text-xs font-medium hover:bg-zinc-100 transition-colors">
                                    Schedule Session
                                </button>
                            </Link>
                        </div>
                    )}

                    {/* Metrics / Storage Style Widget */}
                    <div className="bg-zinc-50 rounded-xl border border-dashed border-zinc-300 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-zinc-600">System Usage</span>
                            <span className="text-xs text-zinc-500">Healthy</span>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div className="bg-zinc-800 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <p className="text-[10px] text-zinc-400">System performing optimally. <span className="text-zinc-600 underline cursor-pointer">View Logs</span></p>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
