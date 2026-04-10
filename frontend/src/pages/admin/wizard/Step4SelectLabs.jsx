import { useState, useEffect } from 'react';
import { MapPin, Users, CheckCircle, XCircle, AlertCircle, Laptop, Server, Check } from 'lucide-react';
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
    const needed = Math.max(0, totalStudents - totalCapacity);

    // Filter out labs with 0 capacity if any (sanity check)
    const availableLabs = labs.filter(l => l.capacity > 0);

    const handleNext = () => {
        if (isSufficient && selectedLabs.length > 0) {
            nextStep();
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white shadow-sm">
                    <Laptop size={20} strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-zinc-900">Select Labs</h3>
                    <p className="text-sm text-zinc-500">Choose the laboratories where the assessment will take place.</p>
                </div>
            </div>

            {/* dashboard stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200/60">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white rounded-lg border border-zinc-200 text-zinc-500"><Users size={18} /></div>
                        <span className="text-sm font-semibold text-zinc-500">Total Candidates</span>
                    </div>
                    <p className="text-3xl font-bold text-zinc-900">{totalStudents}</p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200/60">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white rounded-lg border border-zinc-200 text-zinc-500"><Server size={18} /></div>
                        <span className="text-sm font-semibold text-zinc-500">Labs Selected</span>
                    </div>
                    <p className="text-3xl font-bold text-zinc-900">{selectedLabs.length}</p>
                </div>

                <div className={`rounded-2xl p-6 border transition-colors ${isSufficient ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 bg-white rounded-lg border ${isSufficient ? 'text-emerald-600 border-emerald-200' : 'text-amber-600 border-amber-200'
                            }`}>
                            {isSufficient ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        </div>
                        <span className={`text-sm font-semibold ${isSufficient ? 'text-emerald-700' : 'text-amber-700'
                            }`}>Capacity Status</span>
                    </div>
                    <p className={`text-3xl font-bold ${isSufficient ? 'text-emerald-900' : 'text-amber-900'
                        }`}>
                        {totalCapacity} <span className="text-base font-medium opacity-60">seats</span>
                    </p>
                    {!isSufficient && (
                        <p className="text-xs font-bold text-amber-700 mt-2">Need {needed} more seats</p>
                    )}
                </div>
            </div>

            {/* Labs Grid */}
            <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                    <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Available Laboratories</h4>
                    {selectedLabs.length > 0 && (
                        <span className="text-xs font-medium text-zinc-500">
                            {selectedLabs.length} labs selected
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="py-12 text-center text-zinc-400 bg-zinc-50 rounded-2xl border border-zinc-100 border-dashed">
                        Loading available labs...
                    </div>
                ) : availableLabs.length === 0 ? (
                    <div className="py-12 text-center bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
                        <AlertCircle className="mx-auto text-zinc-400 mb-2" size={32} strokeWidth={1} />
                        <p className="text-zinc-900 font-bold">No Available Labs</p>
                        <p className="text-sm text-zinc-500">Please enable labs in the Lab Management section.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableLabs.map(lab => {
                            const isSelected = selectedLabs.some(l => l.id === lab.id);
                            const effectiveCap = getEffectiveCapacity(lab.capacity);

                            return (
                                <button
                                    key={lab.id}
                                    onClick={() => toggleLab(lab)}
                                    className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 group ${isSelected
                                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg transform -translate-y-1'
                                        : 'border-zinc-100 bg-white hover:border-zinc-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'
                                            }`}>
                                            <Laptop size={20} strokeWidth={1.5} />
                                        </div>
                                        {isSelected && (
                                            <div className="bg-white text-zinc-900 rounded-full p-1">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>

                                    <h5 className={`font-bold text-lg mb-1 ${isSelected ? 'text-white' : 'text-zinc-900'
                                        }`}>{lab.lab_name}</h5>

                                    <div className={`flex items-center gap-2 text-sm ${isSelected ? 'text-zinc-400' : 'text-zinc-500'
                                        }`}>
                                        <MapPin size={14} />
                                        <span>{lab.location || 'Main Block'}</span>
                                    </div>

                                    <div className={`mt-4 pt-4 border-t flex justify-between items-center ${isSelected ? 'border-zinc-800' : 'border-zinc-100'
                                        }`}>
                                        <div>
                                            <span className={`text-xs uppercase tracking-wider font-bold block ${isSelected ? 'text-zinc-500' : 'text-zinc-400'
                                                }`}>Capacity</span>
                                            <span className={`font-mono text-lg font-bold ${isSelected ? 'text-white' : 'text-zinc-900'
                                                }`}>{effectiveCap}</span>
                                        </div>
                                        {formData.seating_mode !== 'normal' && (
                                            <div className="text-right">
                                                <span className={`text-xs block ${isSelected ? 'text-zinc-500' : 'text-zinc-400'
                                                    }`}>Raw Seats</span>
                                                <span className={`font-mono text-sm ${isSelected ? 'text-zinc-400' : 'text-zinc-500'
                                                    }`}>{lab.capacity}</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-between mt-8 pt-6 border-t border-zinc-100">
                <button
                    onClick={prevStep}
                    className="px-6 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-colors"
                >
                    ← Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={!isSufficient || selectedLabs.length === 0}
                    className="flex items-center gap-2 px-8 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    Review & Create
                    <span className="text-zinc-400">→</span>
                </button>
            </div>
        </div>
    );
}
