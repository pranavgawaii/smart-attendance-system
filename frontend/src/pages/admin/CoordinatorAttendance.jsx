import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { ArrowLeft, Calendar, Download, Loader2, CheckSquare, Square, Eye, X, FileText, Clock, Users, ChevronRight } from 'lucide-react';

export default function CoordinatorAttendance() {
    const navigate = useNavigate();
    const [coordinators, setCoordinators] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');

    // Form state
    const [eventDetails, setEventDetails] = useState({
        event_title: '',
        event_date: '',
        time_from: '',
        time_to: ''
    });

    useEffect(() => {
        fetchCoordinators();
    }, []);

    const fetchCoordinators = async () => {
        try {
            setLoading(true);
            const res = await api.get('/coordinators');
            setCoordinators(res.data);
        } catch (err) {
            console.error('Failed to fetch coordinators:', err);
            setError('Failed to load coordinators');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const selectAll = () => {
        setSelectedIds(coordinators.map(c => c.id));
    };

    const deselectAll = () => {
        setSelectedIds([]);
    };

    const isFormValid = () => {
        return (
            eventDetails.event_title &&
            eventDetails.event_date &&
            eventDetails.time_from &&
            eventDetails.time_to &&
            selectedIds.length > 0
        );
    };

    const handleGeneratePDF = async (download = false) => {
        if (!isFormValid()) return;

        setGenerating(true);
        setError('');

        try {
            const response = await api.post('/coordinators/attendance-pdf', {
                ...eventDetails,
                coordinator_ids: selectedIds
            }, {
                responseType: 'blob'
            });

            // Create blob URL
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            if (download) {
                // Direct download
                const link = document.createElement('a');
                link.href = url;
                link.download = `Attendance_Letter_${eventDetails.event_date}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                setSuccess('PDF downloaded successfully!');
                setTimeout(() => setSuccess(''), 5000);
            } else {
                // Show preview
                setPdfUrl(url);
                setShowPreview(true);
            }
        } catch (err) {
            console.error('PDF generation failed:', err);
            setError('Failed to generate PDF. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadFromPreview = () => {
        if (pdfUrl) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `Attendance_Letter_${eventDetails.event_date}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setSuccess('PDF downloaded successfully!');
            closePreview();
        }
    };

    const closePreview = () => {
        if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
        }
        setPdfUrl('');
        setShowPreview(false);
    };

    return (
        <AdminLayout title="Mark Coordinator Attendance">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header with Breadcrumb feel */}
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                    <span onClick={() => navigate('/admin/coordinators')} className="hover:text-zinc-900 cursor-pointer transition-colors">Coordinators</span>
                    <ChevronRight size={14} />
                    <span className="text-zinc-900 font-medium">Generate Letter</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-zinc-900">Attendance Letter Generation</h1>
                        <p className="text-sm text-zinc-500 mt-1">Create official attendance requests for faculty submission</p>
                    </div>
                    {/* Action Buttons - Top aligned for easy access */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleGeneratePDF(false)}
                            disabled={!isFormValid() || generating}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generating ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                            Preview
                        </button>
                        <button
                            onClick={() => handleGeneratePDF(true)}
                            disabled={!isFormValid() || generating}
                            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download size={16} />
                            Download PDF
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Event Details */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-zinc-50">
                                <Calendar size={18} className="text-zinc-400" />
                                <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">Event Details</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Event Title</label>
                                    <input
                                        type="text"
                                        value={eventDetails.event_title}
                                        onChange={(e) => setEventDetails({ ...eventDetails, event_title: e.target.value })}
                                        placeholder="e.g. Mu Sigma Drive"
                                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        value={eventDetails.event_date}
                                        onChange={(e) => setEventDetails({ ...eventDetails, event_date: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">Start Time</label>
                                        <div className="relative">
                                            <select
                                                value={eventDetails.time_from}
                                                onChange={(e) => setEventDetails({ ...eventDetails, time_from: e.target.value })}
                                                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="">Select</option>
                                                <option value="08:00">08:00 AM</option>
                                                <option value="08:30">08:30 AM</option>
                                                <option value="09:00">09:00 AM</option>
                                                <option value="09:30">09:30 AM</option>
                                                <option value="10:00">10:00 AM</option>
                                                <option value="10:30">10:30 AM</option>
                                                <option value="11:00">11:00 AM</option>
                                                <option value="11:30">11:30 AM</option>
                                                <option value="12:00">12:00 PM</option>
                                                <option value="12:30">12:30 PM</option>
                                                <option value="13:00">01:00 PM</option>
                                                <option value="13:30">01:30 PM</option>
                                                <option value="14:00">02:00 PM</option>
                                                <option value="14:30">02:30 PM</option>
                                                <option value="15:00">03:00 PM</option>
                                                <option value="15:30">03:30 PM</option>
                                                <option value="16:00">04:00 PM</option>
                                                <option value="16:30">04:30 PM</option>
                                                <option value="17:00">05:00 PM</option>
                                                <option value="17:30">05:30 PM</option>
                                                <option value="18:00">06:00 PM</option>
                                            </select>
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">End Time</label>
                                        <div className="relative">
                                            <select
                                                value={eventDetails.time_to}
                                                onChange={(e) => setEventDetails({ ...eventDetails, time_to: e.target.value })}
                                                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="">Select</option>
                                                <option value="08:00">08:00 AM</option>
                                                <option value="08:30">08:30 AM</option>
                                                <option value="09:00">09:00 AM</option>
                                                <option value="09:30">09:30 AM</option>
                                                <option value="10:00">10:00 AM</option>
                                                <option value="10:30">10:30 AM</option>
                                                <option value="11:00">11:00 AM</option>
                                                <option value="11:30">11:30 AM</option>
                                                <option value="12:00">12:00 PM</option>
                                                <option value="12:30">12:30 PM</option>
                                                <option value="13:00">01:00 PM</option>
                                                <option value="13:30">01:30 PM</option>
                                                <option value="14:00">02:00 PM</option>
                                                <option value="14:30">02:30 PM</option>
                                                <option value="15:00">03:00 PM</option>
                                                <option value="15:30">03:30 PM</option>
                                                <option value="16:00">04:00 PM</option>
                                                <option value="16:30">04:30 PM</option>
                                                <option value="17:00">05:00 PM</option>
                                                <option value="17:30">05:30 PM</option>
                                                <option value="18:00">06:00 PM</option>
                                            </select>
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Summary</h3>
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-zinc-600">Selected Coordinators</span>
                                <span className="font-semibold text-zinc-900">{selectedIds.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-600">Status</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${isFormValid() ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {isFormValid() ? 'Ready' : 'Incomplete'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Coordinator Selection */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col h-full max-h-[600px]">
                            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-zinc-400" />
                                    <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">Select Students</h2>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={selectAll}
                                        className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-zinc-300">|</span>
                                    <button
                                        onClick={deselectAll}
                                        className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-y-auto flex-1 p-2">
                                {loading ? (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                                        <Loader2 className="w-6 h-6 animate-spin mb-2 text-zinc-300" />
                                        <span className="text-xs">Loading list...</span>
                                    </div>
                                ) : coordinators.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                                        <Users className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-sm">No coordinators found</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {coordinators.map((coord) => {
                                            const isSelected = selectedIds.includes(coord.id);
                                            return (
                                                <div
                                                    key={coord.id}
                                                    onClick={() => toggleSelection(coord.id)}
                                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                                        ? 'bg-zinc-50 border-zinc-900 shadow-sm'
                                                        : 'bg-white border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50'
                                                        }`}
                                                >
                                                    <div className="pt-0.5 shrink-0">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-zinc-300'
                                                            }`}>
                                                            {isSelected && <CheckSquare size={10} className="text-white" />}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium ${isSelected ? 'text-zinc-900' : 'text-zinc-700'}`}>{coord.name}</p>
                                                        <p className="text-xs font-mono mt-0.5 text-zinc-500">{coord.enrollment_no}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-zinc-50 border-zinc-200 text-zinc-600">
                                                                {coord.year}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-400">
                                                                {coord.department}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Preview Modal - Professional Dark Overlay */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                                    <FileText size={18} className="text-zinc-700" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900 text-sm">Attendance Letter Preview</h3>
                                    <p className="text-xs text-zinc-500">{eventDetails.event_date} • {selectedIds.length} names</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleDownloadFromPreview}
                                    className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-sm"
                                >
                                    <Download size={14} />
                                    Download
                                </button>
                                <button
                                    onClick={closePreview}
                                    className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* PDF Viewer - Enhanced Background */}
                        <div className="flex-1 p-6 bg-zinc-100/50 flex items-center justify-center">
                            <iframe
                                src={pdfUrl}
                                className="w-full h-full rounded-lg border border-zinc-200 bg-white shadow-sm"
                                title="PDF Preview"
                            />
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
