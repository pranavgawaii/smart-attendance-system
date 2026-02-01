import { useState } from 'react';
import { Calendar, Clock, Users, MapPin, CheckCircle, Loader } from 'lucide-react';
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

    const getEffectiveCapacity = (labCapacity) => {
        switch (formData.seating_mode) {
            case 'alternate': return Math.floor(labCapacity / 2);
            case 'distanced': return Math.floor(labCapacity / 3);
            default: return labCapacity;
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
    const totalCapacity = formData.selected_labs.reduce((sum, lab) => sum + getEffectiveCapacity(lab.capacity), 0);

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Review & Allocate</h3>
            <p className="text-sm text-slate-500 mb-6">Review all details before creating the allocation</p>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800 font-semibold text-sm">{error}</p>
                </div>
            )}

            {/* Assessment Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4">
                <h4 className="font-bold text-slate-900 mb-4">Assessment Details</h4>
                <div className="space-y-3">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Company & Position</p>
                        <p className="font-semibold text-slate-900">
                            {formData.company_name}
                            {formData.position && ` - ${formData.position}`}
                        </p>
                    </div>
                    {(formData.assessment_date || formData.start_time || formData.end_time) && (
                        <div className="grid grid-cols-2 gap-4">
                            {formData.assessment_date && (
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">
                                        <Calendar size={12} strokeWidth={1.5} className="inline mr-1" />
                                        Date
                                    </p>
                                    <p className="font-semibold text-slate-900">{formatDate(formData.assessment_date)}</p>
                                </div>
                            )}
                            {(formData.start_time && formData.end_time) && (
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">
                                        <Clock size={12} strokeWidth={1.5} className="inline mr-1" />
                                        Time
                                    </p>
                                    <p className="font-semibold text-slate-900">
                                        {formatTime(formData.start_time)} - {formatTime(formData.end_time)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    {formData.description && (
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Description</p>
                            <p className="text-sm text-slate-700">{formData.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Students */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4">
                <h4 className="font-bold text-slate-900 mb-2">
                    <Users size={16} strokeWidth={1.5} className="inline mr-1" />
                    Students
                </h4>
                <p className="text-2xl font-bold text-zinc-900">{totalStudents} students confirmed</p>
            </div>

            {/* Seating Mode */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4">
                <h4 className="font-bold text-slate-900 mb-3">Seating Mode</h4>
                <div className="flex items-center gap-4">
                    <div className="text-3xl">{modeDisplay.icon}</div>
                    <div>
                        <p className="font-semibold text-slate-900">{modeDisplay.name} Seating</p>
                        <p className="text-sm text-slate-600">{modeDisplay.capacity} capacity utilization</p>
                    </div>
                </div>
            </div>

            {/* Selected Labs */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4">
                <h4 className="font-bold text-slate-900 mb-3">
                    <MapPin size={16} strokeWidth={1.5} className="inline mr-1" />
                    Selected Labs
                </h4>
                <div className="space-y-2 mb-4">
                    {formData.selected_labs.map(lab => {
                        const effectiveCapacity = getEffectiveCapacity(lab.capacity);
                        return (
                            <div key={lab.id} className="flex justify-between items-center bg-white rounded-lg p-3 border border-slate-200">
                                <span className="font-semibold text-slate-900">{lab.lab_name}</span>
                                <span className="text-sm text-slate-600">
                                    {effectiveCapacity} seats
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-zinc-900">Total Capacity</span>
                        <span className="text-lg font-bold text-zinc-700">{totalCapacity} seats</span>
                    </div>
                </div>
            </div>

            {/* Distribution Preview */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
                <h4 className="font-bold text-emerald-900 mb-3">Distribution Preview</h4>
                <p className="text-sm text-emerald-700 mb-2">
                    Students will be distributed evenly across {formData.selected_labs.length} lab(s)
                </p>
                <p className="text-sm text-emerald-700">
                    Average: ~{Math.ceil(totalStudents / formData.selected_labs.length)} students per lab
                </p>
            </div>

            {/* What Happens Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                <h4 className="font-bold text-blue-900 mb-3">What Happens Next</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" />
                        <span>Students will be allocated to labs automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" />
                        <span>Seat numbers will be assigned based on seating mode</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle size={16} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" />
                        <span>Students can view their allocation details in their dashboard</span>
                    </li>
                </ul>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                    onClick={prevStep}
                    disabled={creating}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    ← Back
                </button>
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                    {creating ? (
                        <>
                            <Loader size={16} strokeWidth={1.5} className="animate-spin" />
                            Creating Allocation...
                        </>
                    ) : (
                        'Create & Allocate'
                    )}
                </button>
            </div>
        </div>
    );
}
