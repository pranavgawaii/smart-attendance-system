import { useState } from 'react';
import { Calendar, Clock, Users, MapPin, CheckCircle, Loader, Building2, Ticket, Check } from 'lucide-react';
import api from '../../../services/api';

export default function Step5Review({ formData, prevStep, navigate }) {
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (time) => {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getModeDisplay = (mode) => {
        switch (mode) {
            case 'normal': return { name: 'Normal', icon: '👤👤👤👤👤', capacity: '100%' };
            case 'alternate': return { name: 'Alternate', icon: '👤_👤_👤_', capacity: '50%' };
            case 'distanced': return { name: 'Distanced', icon: '👤__👤__👤', capacity: '33%' };
            default: return { name: 'Normal', icon: '👤👤👤👤👤', capacity: '100%' };
        }
    };

    const handleCreate = async () => {
        setCreating(true);
        setError('');

        try {
            // Create placement assessment
            const assessmentPayload = {
                company_name: formData.company_name,
                position: formData.position || null,
                assessment_date: formData.assessment_date || null,
                start_time: formData.start_time || null,
                end_time: formData.end_time || null,
                description: formData.description || null,
                seating_mode: formData.seating_mode,
                status: 'active'
            };

            const assessmentResponse = await api.post('/placement-assessments', assessmentPayload);
            const assessmentId = assessmentResponse.data.id;

            // Create allocations
            const allocationPayload = {
                assessment_id: assessmentId,
                students: formData.validStudents,
                labs: formData.selected_labs,
                seating_mode: formData.seating_mode
            };

            await api.post('/allocations/create', allocationPayload);

            // Success - navigate to allocations list
            navigate('/admin/allocations');
        } catch (err) {
            console.error('Failed to create allocation:', err);
            setError(err.response?.data?.error || 'Failed to create allocation. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const modeDisplay = getModeDisplay(formData.seating_mode);
    const totalStudents = formData.validStudents?.length || 0;
    const avgStudentsPerLab = formData.selected_labs.length > 0 ? Math.ceil(totalStudents / formData.selected_labs.length) : 0;

    return (
        <div className="p-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white shadow-sm">
                    <Check size={20} strokeWidth={3} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-zinc-900">Review & Allocate</h3>
                    <p className="text-sm text-zinc-500">Review all details before creating the allocation.</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <div className="text-red-500 bg-red-100 p-2 rounded-lg">
                        <Ticket size={20} />
                    </div>
                    <div>
                        <p className="text-red-900 font-bold text-sm">Action Failed</p>
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Assessment Details */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100">
                        <div className="p-2 bg-zinc-50 rounded-lg text-zinc-500">
                            <Building2 size={18} />
                        </div>
                        <h4 className="font-bold text-zinc-900">Assessment Details</h4>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Company</p>
                            <p className="text-lg font-bold text-zinc-900">{formData.company_name}</p>
                            {formData.position && <p className="text-zinc-500 text-sm">{formData.position}</p>}
                        </div>

                        {(formData.assessment_date || formData.start_time) && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Date</p>
                                    <div className="flex items-center gap-2 text-zinc-700 font-medium">
                                        <Calendar size={14} className="text-zinc-400" />
                                        {formatDate(formData.assessment_date)}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Time</p>
                                    <div className="flex items-center gap-2 text-zinc-700 font-medium">
                                        <Clock size={14} className="text-zinc-400" />
                                        {formatTime(formData.start_time)} - {formatTime(formData.end_time)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.description && (
                            <div className="pt-2">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Notes</p>
                                <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-100 italic">
                                    "{formData.description}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Logistics */}
                <div className="space-y-6">
                    {/* Seating & Students */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100">
                            <div className="p-2 bg-zinc-50 rounded-lg text-zinc-500">
                                <Users size={18} />
                            </div>
                            <h4 className="font-bold text-zinc-900">Logistics</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Seating Mode</p>
                                <p className="font-bold text-zinc-900">{modeDisplay.name}</p>
                                <p className="text-xs text-zinc-500 mt-1">{modeDisplay.capacity} Capacity</p>
                            </div>
                            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Students</p>
                                <p className="font-bold text-zinc-900">{totalStudents}</p>
                                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                    <CheckCircle size={10} /> Verified
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-100">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Lab Allocation</p>
                                <span className="text-xs font-medium text-zinc-500">{formData.selected_labs.length} labs selected</span>
                            </div>
                            <div className="space-y-2">
                                {formData.selected_labs.map(lab => (
                                    <div key={lab.id} className="flex justify-between items-center text-sm p-3 bg-zinc-900 text-white rounded-lg shadow-sm">
                                        <span className="font-medium flex items-center gap-2">
                                            <MapPin size={14} className="text-zinc-500" /> {lab.lab_name}
                                        </span>
                                        <span className="text-zinc-400 font-mono text-xs">
                                            ~{avgStudentsPerLab} students
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Area */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-4">
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-emerald-900 text-lg mb-2">Ready to Allocate?</h4>
                        <p className="text-emerald-800/80 text-sm mb-4">
                            By proceeding, the system will automatically assign seats for <span className="font-bold">{totalStudents} students</span> across <span className="font-bold">{formData.selected_labs.length} labs</span> using <span className="font-bold">{modeDisplay.name}</span> seating logic.
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-medium text-emerald-700">
                            {[
                                "Automatic Seat Assignment",
                                "Student Dashboard Updated",
                                "Faculty Notifications Sent"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-lg border border-emerald-100/50">
                                    <Check size={12} strokeWidth={3} /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-zinc-100">
                <button
                    onClick={prevStep}
                    disabled={creating}
                    className="px-6 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-colors disabled:opacity-50"
                >
                    ← Back
                </button>
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex items-center gap-2 px-8 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    {creating ? (
                        <>
                            <Loader size={16} strokeWidth={1.5} className="animate-spin" />
                            Allocating...
                        </>
                    ) : (
                        'Confirm Allocation'
                    )}
                </button>
            </div>
        </div>
    );
}
