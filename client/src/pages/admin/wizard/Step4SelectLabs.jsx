import { useState, useEffect } from 'react';
import { MapPin, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

export default function Step4SelectLabs({ formData, updateFormData, nextStep, prevStep }) {
    const [labs, setLabs] = useState([]);
    const [selectedLabs, setSelectedLabs] = useState(formData.selected_labs || []);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLabs();
    }, []);

    const fetchLabs = async () => {
        try {
            const response = await api.get('/labs/enabled');
            setLabs(response.data || []);
        } catch (error) {
            console.error('Failed to fetch labs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEffectiveCapacity = (labCapacity) => {
        switch (formData.seating_mode) {
            case 'alternate': return Math.floor(labCapacity / 2);
            case 'distanced': return Math.floor(labCapacity / 3);
            default: return labCapacity;
        }
    };

    const toggleLab = (lab) => {
        const isSelected = selectedLabs.some(l => l.id === lab.id);
        let newSelected;

        if (isSelected) {
            newSelected = selectedLabs.filter(l => l.id !== lab.id);
        } else {
            newSelected = [...selectedLabs, lab];
        }

        setSelectedLabs(newSelected);
        updateFormData({ selected_labs: newSelected });
    };

    const totalStudents = formData.validStudents?.length || 0;
    const totalCapacity = selectedLabs.reduce((sum, lab) => sum + getEffectiveCapacity(lab.capacity), 0);
    const isSufficient = totalCapacity >= totalStudents;
    const fillPercentage = totalStudents > 0 ? Math.min((totalStudents / totalCapacity) * 100, 100) : 0;

    const handleNext = () => {
        if (isSufficient && selectedLabs.length > 0) {
            nextStep();
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Select Labs</h3>
            <p className="text-sm text-slate-500 mb-6">Choose labs for the assessment</p>

            {/* Capacity Dashboard */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <p className="text-sm text-slate-600 mb-1">Students to Allocate</p>
                        <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-600 mb-1">Selected Labs</p>
                        <p className="text-2xl font-bold text-slate-900">{selectedLabs.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-600 mb-1">Available Capacity</p>
                        <p className="text-2xl font-bold text-slate-900">{totalCapacity}</p>
                    </div>
                </div>

                {/* Status */}
                <div className={`flex items-center gap-2 p-3 rounded-lg ${isSufficient && selectedLabs.length > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {isSufficient && selectedLabs.length > 0 ? (
                        <>
                            <CheckCircle size={18} strokeWidth={1.5} />
                            <span className="text-sm font-semibold">Sufficient capacity for all students</span>
                        </>
                    ) : (
                        <>
                            <XCircle size={18} strokeWidth={1.5} />
                            <span className="text-sm font-semibold">
                                {selectedLabs.length === 0
                                    ? 'Please select at least one lab'
                                    : `Need ${totalStudents - totalCapacity} more seats`
                                }
                            </span>
                        </>
                    )}
                </div>

                {/* Progress Bar */}
                {selectedLabs.length > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Capacity Utilization</span>
                            <span>{fillPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${fillPercentage > 100 ? 'bg-red-500' : fillPercentage > 80 ? 'bg-yellow-500' : 'bg-emerald-500'
                                    }`}
                                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Labs List */}
            {loading ? (
                <div className="p-8 text-center text-slate-400">Loading labs...</div>
            ) : labs.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <AlertCircle size={20} strokeWidth={1.5} className="text-yellow-600 mb-2" />
                    <p className="text-yellow-900 font-semibold">No labs available</p>
                    <p className="text-sm text-yellow-700 mt-1">Please create labs first before creating allocations.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {labs.map(lab => {
                        const isSelected = selectedLabs.some(l => l.id === lab.id);
                        const effectiveCapacity = getEffectiveCapacity(lab.capacity);
                        const expectedStudents = isSelected
                            ? Math.ceil(totalStudents / selectedLabs.length)
                            : 0;
                        const fillPct = expectedStudents > 0 ? (expectedStudents / effectiveCapacity) * 100 : 0;

                        return (
                            <button
                                key={lab.id}
                                onClick={() => toggleLab(lab)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                    ? 'border-zinc-900 bg-zinc-50'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-zinc-900 bg-zinc-900' : 'border-slate-300'
                                            }`}>
                                            {isSelected && <CheckCircle size={14} strokeWidth={2} className="text-white" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{lab.lab_name}</p>
                                            <p className="text-sm text-slate-500">
                                                Physical: {lab.capacity} seats • Effective: {effectiveCapacity} seats
                                            </p>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-zinc-600">
                                                ~{expectedStudents} students
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {isSelected && (
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                                            <span>Expected Fill</span>
                                            <span>{fillPct.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${fillPct > 100 ? 'bg-red-500' : fillPct > 80 ? 'bg-yellow-500' : 'bg-emerald-500'
                                                    }`}
                                                style={{ width: `${Math.min(fillPct, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 mt-6 border-t border-slate-100">
                <button
                    onClick={prevStep}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                    ← Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={!isSufficient || selectedLabs.length === 0}
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next: Review →
                </button>
            </div>
        </div>
    );
}
