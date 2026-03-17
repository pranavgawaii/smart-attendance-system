import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import {
    ArrowLeft, Edit2, FileText, Armchair, X, Download, Table,
    AlertCircle, Search, Filter, Loader2, Sparkles, MapPin,
    ChevronRight, GraduationCap, Calendar, Clock, Building2,
    LayoutGrid, List, CheckCircle2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { MIT_LOGO_BASE64 } from '../../assets/mitlogo';

export default function SeatAllocation() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [assessment, setAssessment] = useState(null);
    const [view, setView] = useState('LOADING'); // LOADING, EMPTY, ALLOCATED, ERROR
    const [allocations, setAllocations] = useState([]);
    const [labs, setLabs] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeLabFilter, setActiveLabFilter] = useState('all');

    // Modal for Edit
    const [editingAllocation, setEditingAllocation] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!id) {
                setErrorMsg('Missing Assessment Reference');
                setView('ERROR');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const [assessRes, labsRes, allocRes] = await Promise.all([
                    api.get(`/placement-assessments/${id}`),
                    api.get('/labs'),
                    api.get(`/allocations/assessment/${id}`)
                ]);

                setAssessment(assessRes.data);
                setLabs(labsRes.data);

                if (allocRes.data && Array.isArray(allocRes.data) && allocRes.data.length > 0) {
                    const mappedAllocations = allocRes.data.map(at => ({
                        ...at,
                        lab_name: at.lab?.lab_name || 'Not Defined',
                        user_name: at.student_name || at.student?.name || 'Unknown Student',
                        enrollment_no: at.enrollment_no || at.student?.enrollment_no || 'N/A'
                    }));
                    setAllocations(mappedAllocations);
                    setView('ALLOCATED');
                } else {
                    setView('EMPTY');
                }
            } catch (error) {
                console.error('Core Load Failure:', error);
                setErrorMsg(error.response?.data?.error || 'System synchronization error. Please re-verify the allocation.');
                setView('ERROR');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleUpdateSeat = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/allocations/${editingAllocation.id}`, {
                lab_id: editingAllocation.lab_id,
                seat_number: editingAllocation.seat_number
            });
            setShowEditModal(false);

            // Instant local update for snap experience
            const updated = allocations.map(a =>
                a.id === editingAllocation.id
                    ? { ...a, lab_id: editingAllocation.lab_id, seat_number: editingAllocation.seat_number, lab_name: labs.find(l => l.id === editingAllocation.lab_id)?.lab_name || a.lab_name }
                    : a
            );
            setAllocations(updated);
        } catch {
            setErrorMsg('Real-time sync failed. Please refresh.');
        }
    };

    const generatePDF = (specificLabName = null) => {
        if (!allocations.length) return;

        try {
            const doc = new jsPDF();

            const grouped = allocations.reduce((acc, curr) => {
                const lab = curr.lab_name;
                if (!acc[lab]) acc[lab] = [];
                acc[lab].push(curr);
                return acc;
            }, {});

            const labsToExport = specificLabName ? [specificLabName] : Object.keys(grouped).sort();

            labsToExport.forEach((labName, index) => {
                try {
                    if (index > 0) doc.addPage();

                    // ============================================
                    // PREMIUM CLEAN LAYOUT (MATCHING BACKEND)
                    // ============================================

                    // 1. HEADER (Title Left, Logo Right, Line Below)

                    const pageWidth = doc.internal.pageSize.width;
                    const headerY = 15;
                    const logoWidth = 35; // Adjusted proportional width

                    // Title on LEFT side
                    doc.setTextColor(51, 51, 51);
                    doc.setFontSize(13);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Central Corporate Relations, Training', 14, headerY);
                    doc.text('and Placement Cell (CN-CRTP)', 14, headerY + 6);

                    // Logo on RIGHT side - Load from public folder
                    try {
                        const img = new Image();
                        img.src = '/logo_header.png';
                        // Synchronous hack not possible here, we assume it loads or we use the base64 fallback if needed.
                        // Ideally we should pre-load. For now, we will try to use the pre-loaded image if available, 
                        // or rely on doc.addImage taking a URL (might require CORS/security flags).
                        // BETTER APPROACH: Use the MIT_LOGO_BASE64 if it matches, OR fetch and await before generating.
                        // Given constraints and existing code structure, let's use addImage with URL but wrapped in try/catch.
                        // NOTE: For client-side jsPDF with URL images to work, the image must be served Same-Origin or have CORS headers.
                        // Since we moved it to public/, it is same origin.
                        doc.addImage('/logo_header.png', 'PNG', pageWidth - 14 - logoWidth, headerY - 5, logoWidth, 12);
                    } catch (e) {
                        // Fallback to text if image fails
                        console.warn('Logo render failed:', e);
                        doc.setFontSize(10);
                        doc.text('[CN-CRTP LOGO]', pageWidth - 14 - 20, headerY);
                    }

                    // Vertical Separator Line "|"
                    // Positioned to the left of the logo
                    const separatorX = pageWidth - 14 - logoWidth - 5;
                    doc.setDrawColor(51, 51, 51);
                    doc.setLineWidth(0.5);
                    doc.line(separatorX, headerY - 5, separatorX, headerY + 10);

                    // Divider Line (Very subtle) below everything
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.2);
                    doc.line(14, headerY + 15, pageWidth - 14, headerY + 15);

                    // 2. INFO SECTION (Clean, no boxes, just text)
                    const InfoTop = 48;
                    doc.setFontSize(10);
                    doc.setTextColor(80, 80, 80);

                    // Left Side: Assessment Name
                    doc.setFont('helvetica', 'bold');
                    doc.text('Event / Drive:', 14, InfoTop);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(40, 40, 40);
                    doc.text(assessment?.company_name || 'N/A', 45, InfoTop);

                    // Right Side: Lab No
                    doc.setTextColor(80, 80, 80);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Lab No:', 140, InfoTop); // Renamed from Laboratory Hall
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(40, 40, 40);
                    doc.text(labName, 160, InfoTop);

                    // Date below Lab No
                    doc.setTextColor(80, 80, 80);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Date:', 140, InfoTop + 6);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(40, 40, 40);
                    doc.text(assessment?.assessment_date ? new Date(assessment.assessment_date).toLocaleDateString() : 'N/A', 160, InfoTop + 6);


                    // 3. TABLE SECTION
                    const rawData = grouped[labName] || [];

                    if (rawData.length === 0) {
                        doc.setFontSize(11);
                        doc.setTextColor(200, 100, 100);
                        doc.text('No students allocated.', 105, 80, { align: 'center' });
                    } else {
                        // Order: Seat No | Enrollment No | Name | Signature
                        const tableBody = rawData.sort((a, b) => (a.seat_number || 0) - (b.seat_number || 0)).map(a => [
                            a.seat_number ? a.seat_number.toString().padStart(2, '0') : '-',
                            a.enrollment_no || 'Pending',
                            (a.user_name || 'Unknown').toUpperCase(),
                            '' // Empty for Signature
                        ]);

                        const tableConfig = {
                            startY: 65,
                            head: [['SEAT NO', 'ENROLLMENT NO', 'CANDIDATE NAME', 'SIGNATURE']],
                            body: tableBody,
                            theme: 'grid',
                            headStyles: {
                                fillColor: [245, 245, 245], // Very light gray Header (Clean look)
                                textColor: [40, 40, 40], // Dark gray text
                                fontSize: 9,
                                fontStyle: 'bold',
                                halign: 'center',
                                lineColor: [220, 220, 220],
                                lineWidth: 0.1,
                                cellPadding: 4
                            },
                            bodyStyles: {
                                fontSize: 9,
                                textColor: [60, 60, 60], // Soft black
                                cellPadding: 4,
                                valign: 'middle',
                                lineColor: [230, 230, 230],
                                lineWidth: 0.1
                            },
                            columnStyles: {
                                0: { halign: 'center', cellWidth: 20 },      // Seat
                                1: { halign: 'center', cellWidth: 40 },      // Enroll
                                2: { halign: 'left' },                       // Name (Auto width)
                                3: { halign: 'center', cellWidth: 35 }       // Signature
                            },
                            alternateRowStyles: {
                                fillColor: [255, 255, 255] // White (Clean) - or maybe very very light gray if needed, but white is cleaner
                            },
                            margin: { left: 14, right: 14 }
                        };

                        if (doc.autoTable) {
                            doc.autoTable(tableConfig);
                        } else {
                            autoTable(doc, tableConfig);
                        }
                    }

                    // 4. FOOTER
                    const pageHeight = doc.internal.pageSize.height;
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);

                    doc.text('Controller of Examinations', 196, pageHeight - 20, { align: 'right' });
                    doc.text('MIT University, Pune', 14, pageHeight - 15);

                } catch (pageErr) {
                    console.error(`Error generating page for ${labName}:`, pageErr);
                }
            });

            const fileName = (assessment?.company_name || 'Seating_Plan').replace(/[^a-z0-9]/gi, '_');
            doc.save(`${fileName}_Allocations.pdf`);

        } catch (err) {
            console.error("PDF Generation Fatal Error:", err);
            alert("Unable to generate PDF report.");
        }
    };

    const generateCSV = (specificLabName = null) => {
        const dataForExport = specificLabName ? allocations.filter(a => a.lab_name === specificLabName) : allocations;
        const csvData = dataForExport.map(a => ({
            'Lab Name': a.lab_name,
            'Seat Number': a.seat_number,
            'Student Name': a.user_name,
            'Enrollment Number': a.enrollment_no
        }));

        const csv = Papa.unparse(csvData);
        const fileName = (assessment?.company_name || 'Allocation').replace(/[^a-z0-9]/gi, '_');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName}_Students.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const grouped = allocations.reduce((acc, curr) => {
        const lab = curr.lab_name;
        if (!acc[lab]) acc[lab] = [];
        acc[lab].push(curr);
        return acc;
    }, {});

    const filteredLabs = Object.keys(grouped).filter(lab =>
        activeLabFilter === 'all' || lab === activeLabFilter
    );

    if (loading) return (
        <AdminLayout title="System Processing">
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={24} className="text-zinc-400" />
                    </div>
                </div>
                <p className="mt-8 text-zinc-500 font-medium tracking-wide animate-pulse">Syncing Cloud Database...</p>
            </div>
        </AdminLayout>
    );

    if (view === 'ERROR') return (
        <AdminLayout title="Access Error">
            <div className="max-w-xl mx-auto mt-20 p-12 bg-white rounded-[2rem] border border-zinc-100 shadow-2xl text-center">
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 transition-transform hover:rotate-0">
                    <AlertCircle size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">Sync Failure</h3>
                <p className="text-zinc-500 mb-10 leading-relaxed font-medium">{errorMsg}</p>
                <div className="flex gap-4">
                    <Link to="/admin/allocations" className="flex-1">
                        <button className="w-full h-14 bg-zinc-50 text-zinc-900 rounded-2xl font-bold hover:bg-zinc-100 transition-all border border-zinc-200">
                            Return to Safe
                        </button>
                    </Link>
                    <button onClick={() => window.location.reload()} className="flex-1 h-14 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-black shadow-lg shadow-zinc-200 transition-all">
                        Retry Fetch
                    </button>
                </div>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout title="Seating Master">
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <Link to="/admin/allocations" className="group p-4 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-900 transition-all shadow-sm">
                        <ArrowLeft size={20} className="text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-zinc-900 tracking-tighter">
                                {assessment?.company_name || 'Seating Master'}
                            </h1>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100 flex items-center gap-1.5">
                                <CheckCircle2 size={12} /> Live Active
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-zinc-400 font-bold">
                            <div className="flex items-center gap-1.5"><Calendar size={14} /> {assessment?.assessment_date ? new Date(assessment.assessment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending Schedule'}</div>
                            <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
                            <div className="flex items-center gap-1.5"><GraduationCap size={14} /> {allocations.length} Candidates</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => generateCSV()}
                        className="group flex items-center gap-2.5 px-6 h-14 bg-white border border-zinc-200 rounded-2xl text-zinc-600 font-bold hover:border-zinc-900 hover:text-zinc-900 transition-all shadow-sm"
                    >
                        <Table size={18} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                        <span className="hidden sm:inline">Export Master CSV</span>
                    </button>
                    <button
                        onClick={() => generatePDF()}
                        className="flex items-center gap-2.5 px-8 h-14 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] hover:-translate-y-1 active:translate-y-0"
                    >
                        <Download size={18} />
                        <span>Master PDF Report</span>
                    </button>
                </div>
            </div>

            {/* Content Filters & Summary */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12">
                <div className="xl:col-span-3">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveLabFilter('all')}
                            className={`px-6 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${activeLabFilter === 'all' ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl shadow-zinc-200' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
                        >
                            All Laboratories
                        </button>
                        {Object.keys(grouped).map(lab => (
                            <button
                                key={lab}
                                onClick={() => setActiveLabFilter(lab)}
                                className={`px-6 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${activeLabFilter === lab ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl shadow-zinc-200' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
                            >
                                {lab}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-zinc-50 to-white border border-zinc-100 rounded-3xl p-6 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Quick Search</p>
                        <input
                            type="text"
                            placeholder="Find student identity..."
                            className="bg-transparent text-sm font-bold text-zinc-900 outline-none w-full placeholder:text-zinc-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Search size={20} className="text-zinc-200" />
                </div>
            </div>

            {view === 'EMPTY' && (
                <div className="bg-white rounded-[3rem] border-2 border-dashed border-zinc-100 p-24 text-center">
                    <div className="w-32 h-32 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                        <Armchair size={54} strokeWidth={1} className="text-zinc-200" />
                    </div>
                    <h3 className="text-3xl font-black text-zinc-900 mb-4 tracking-tighter">Zero Allocations</h3>
                    <p className="text-zinc-500 max-w-sm mx-auto mb-10 text-lg font-medium leading-relaxed">
                        No seat data detected for this assessment drive. Please initialize the wizard logic.
                    </p>
                    <Link to="/admin/allocations/create">
                        <button className="px-12 h-16 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-2xl shadow-zinc-100">
                            Launch Wizard Engine
                        </button>
                    </Link>
                </div>
            )}

            {view === 'ALLOCATED' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10">
                    {filteredLabs.map(labName => {
                        const studentsInLab = grouped[labName].filter(a =>
                            a.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            a.enrollment_no.toLowerCase().includes(searchTerm.toLowerCase())
                        );

                        if (studentsInLab.length === 0 && searchTerm) return null;

                        return (
                            <div key={labName} className="group flex flex-col h-[650px] bg-white rounded-[2.5rem] border border-zinc-100 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.05)] transition-all hover:border-zinc-900/10 hover:shadow-2xl hoverShadow-zinc-200 overflow-hidden">
                                {/* Lab Header */}
                                <div className="p-8 pb-6 bg-gradient-to-b from-zinc-50/50 to-white flex justify-between items-start shrink-0">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-zinc-200">
                                                <Building2 size={20} />
                                            </div>
                                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">{labName}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-zinc-100 text-[10px] font-black uppercase text-zinc-500 rounded-md border border-zinc-200">{studentsInLab.length} Seats Filled</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <button
                                            onClick={() => generateCSV(labName)}
                                            className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-all shadow-sm"
                                        >
                                            <Table size={18} />
                                        </button>
                                        <button
                                            onClick={() => generatePDF(labName)}
                                            className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-900 rounded-xl text-white hover:bg-black transition-all shadow-lg shadow-zinc-100"
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Student List */}
                                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                                    <div className="space-y-3">
                                        {studentsInLab.map((a) => (
                                            <div
                                                key={a.id}
                                                className="group/row flex items-center justify-between p-4 bg-white border border-zinc-50 rounded-2xl hover:border-zinc-200 hover:bg-zinc-50/50 transition-all cursor-default"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 bg-zinc-50 rounded-xl flex items-center justify-center border border-zinc-100 text-zinc-900 font-black text-sm group-hover/row:bg-white group-hover/row:scale-110 transition-all shadow-sm">
                                                        {a.seat_number.toString().padStart(2, '0')}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-zinc-900 tracking-tight truncate max-w-[150px]">{a.user_name}</p>
                                                        <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mt-0.5">{a.enrollment_no}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => { setEditingAllocation(a); setShowEditModal(true); }}
                                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-200 hover:text-zinc-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-100 transition-all opacity-0 group-hover/row:opacity-100"
                                                >
                                                    <Edit2 size={14} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Lab Footer */}
                                <div className="p-6 pt-0 shrink-0">
                                    <div className="h-1 bg-zinc-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-zinc-900"
                                            style={{ width: `${Math.min(100, (studentsInLab.length / (labs.find(l => l.lab_name === labName)?.capacity || 30)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Premium Edit Modal */}
            {showEditModal && editingAllocation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-xl" onClick={() => setShowEditModal(false)}></div>
                    <div className="relative bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden border border-zinc-100 animate-in fade-in zoom-in duration-300">
                        <div className="absolute top-0 right-0 p-8">
                            <button onClick={() => setShowEditModal(false)} className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:rotate-90 transition-all border border-zinc-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-12">
                            <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mb-8 rotate-6">
                                <Edit2 size={32} className="text-zinc-900" />
                            </div>

                            <div className="mb-10">
                                <h2 className="text-3xl font-black text-zinc-900 tracking-tighter mb-2">Edit Assignment</h2>
                                <p className="text-zinc-400 font-bold text-sm tracking-tight">{editingAllocation.user_name} • {editingAllocation.enrollment_no}</p>
                            </div>

                            <form onSubmit={handleUpdateSeat} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Laboratory Target</label>
                                    <div className="relative group">
                                        <select
                                            className="w-full h-16 px-6 bg-zinc-50 border border-zinc-100 rounded-3xl text-zinc-900 font-black outline-none focus:bg-white focus:border-zinc-900 transition-all appearance-none cursor-pointer"
                                            value={editingAllocation.lab_id}
                                            onChange={e => setEditingAllocation({ ...editingAllocation, lab_id: e.target.value })}
                                        >
                                            {labs.map(l => (
                                                <option key={l.id} value={l.id}>{l.lab_name} ({l.capacity} Seats)</option>
                                            ))}
                                        </select>
                                        <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>

                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Manual Seat Selection</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full h-16 px-6 bg-zinc-50 border border-zinc-100 rounded-3xl text-zinc-900 font-black outline-none focus:bg-white focus:border-zinc-900 transition-all"
                                            value={editingAllocation.seat_number}
                                            onChange={e => setEditingAllocation({ ...editingAllocation, seat_number: parseInt(e.target.value) })}
                                            min="1"
                                        />
                                        <Armchair size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-200" />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        className="w-full h-18 bg-zinc-900 text-white rounded-3xl font-black text-lg hover:bg-black shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
                                    >
                                        Update Arrangement
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f4f4f5; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e4e4e7; }
                
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoom-in { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-in { animation: zoom-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}} />
        </AdminLayout>
    );
}
