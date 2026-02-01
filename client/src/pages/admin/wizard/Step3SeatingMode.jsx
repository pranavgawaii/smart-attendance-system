import { useState } from 'react';
import { Users, AlertTriangle } from 'lucide-react';

export default function Step3SeatingMode({ formData, updateFormData, nextStep, prevStep }) {
    const [selectedMode, setSelectedMode] = useState(formData.seating_mode || 'normal');

    const modes = [
        {
            id: 'normal',
            name: 'Normal Seating',
            icon: '👤👤👤👤👤',
            capacity: '100%',
            description: 'Students sit in consecutive seats with no gaps',
            reduction: 0
        },
        {
            id: 'alternate',
            name: 'Alternate Seating',
            icon: '👤_👤_👤_',
            capacity: '50%',
            description: 'One seat gap between students for social distancing',
            reduction: 50
        },
        {
            id: 'distanced',
            name: 'Distanced Seating',
            icon: '👤__👤__👤',
            capacity: '33%',
            description: 'Two seat gaps between students for maximum distancing',
            reduction: 67
        }
    ];

    const handleSelect = (modeId) => {
        setSelectedMode(modeId);
        updateFormData({ seating_mode: modeId });
    };

    const handleNext = () => {
        nextStep();
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Seating Mode</h3>
            <p className="text-sm text-slate-500 mb-6">Choose how students will be seated in the labs</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {modes.map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => handleSelect(mode.id)}
                        className={`p-6 rounded-xl border-2 text-left transition-all ${selectedMode === mode.id
                            ? 'border-zinc-900 bg-zinc-50 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        <div className="text-3xl mb-3">{mode.icon}</div>
                        <h4 className="font-bold text-slate-900 mb-1">{mode.name}</h4>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${mode.reduction === 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : mode.reduction === 50
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                {mode.capacity} Capacity
                            </span>
                        </div>
                        <p className="text-sm text-slate-600">{mode.description}</p>
                    </button>
                ))}
            </div>

            {/* Warning for reduced capacity modes */}
            {(selectedMode === 'alternate' || selectedMode === 'distanced') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={20} strokeWidth={1.5} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-yellow-900 mb-1">Reduced Capacity</p>
                            <p className="text-sm text-yellow-700">
                                This mode reduces lab capacity by {modes.find(m => m.id === selectedMode)?.reduction}%.
                                You'll need more labs to accommodate all students.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Visual Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
                <p className="text-sm font-semibold text-slate-700 mb-4">
                    <Users size={14} strokeWidth={1.5} className="inline mr-1" />
                    Seating Preview
                </p>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-center gap-2 text-2xl">
                        {modes.find(m => m.id === selectedMode)?.icon}
                    </div>
                    <p className="text-center text-sm text-slate-600 mt-3">
                        {modes.find(m => m.id === selectedMode)?.description}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                    onClick={prevStep}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                    ← Back
                </button>
                <button
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
                >
                    Next: Select Labs →
                </button>
            </div>
        </div>
    );
}
