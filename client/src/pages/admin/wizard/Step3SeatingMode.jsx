import { useState } from 'react';
import { Users, AlertTriangle, UserMinus, ShieldAlert } from 'lucide-react';

export default function Step3SeatingMode({ formData, updateFormData, nextStep, prevStep }) {
    const [selectedMode, setSelectedMode] = useState(formData.seating_mode || 'normal');

    const modes = [
        {
            id: 'normal',
            name: 'Normal Seating',
            icon: Users,
            capacity: '100%',
            description: 'Standard density. Students occupy every seat.',
            reduction: 0,
            color: 'emerald'
        },
        {
            id: 'alternate',
            name: 'Alternate Seating',
            icon: UserMinus,
            capacity: '50%',
            description: 'Medium density. One empty seat between students.',
            reduction: 50,
            color: 'amber'
        },
        {
            id: 'distanced',
            name: 'Distanced Seating',
            icon: ShieldAlert,
            capacity: '33%',
            description: 'Low density. Two empty seats for maximum safety.',
            reduction: 67,
            color: 'red'
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
        <div className="p-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white shadow-sm">
                    <Users size={20} strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-zinc-900">Seating Arrangement</h3>
                    <p className="text-sm text-zinc-500">Configure how students should be distributed across labs.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {modes.map(mode => {
                    const isSelected = selectedMode === mode.id;
                    return (
                        <button
                            key={mode.id}
                            onClick={() => handleSelect(mode.id)}
                            className={`
                                relative p-6 rounded-2xl border-2 text-left transition-all duration-300 group
                                ${isSelected
                                    ? 'border-zinc-900 bg-zinc-50 shadow-md scale-[1.02]'
                                    : 'border-zinc-100 hover:border-zinc-300 hover:bg-white bg-white hover:shadow-sm'
                                }
                            `}
                        >
                            <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
                                ${isSelected ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200'}
                            `}>
                                <mode.icon size={24} strokeWidth={1.5} />
                            </div>

                            <h4 className="font-bold text-zinc-900 mb-2 text-lg">{mode.name}</h4>

                            <div className="flex items-center gap-2 mb-3">
                                <span className={`
                                    px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase
                                    ${mode.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                                        mode.color === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}
                                `}>
                                    {mode.capacity} Capacity
                                </span>
                            </div>

                            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                                {mode.description}
                            </p>

                            {/* Selection Ring */}
                            <div className={`
                                absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                ${isSelected ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-200'}
                            `}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Capacity Warning */}
            {(selectedMode === 'alternate' || selectedMode === 'distanced') && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 mb-8 flex items-start gap-4">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-900 mb-1">Reduced Lab Capacity</h4>
                        <p className="text-sm text-amber-700 leading-relaxed">
                            You have selected <strong>{modes.find(m => m.id === selectedMode)?.name}</strong>.
                            This will reduce the effective capacity of each lab by <strong>{modes.find(m => m.id === selectedMode)?.reduction}%</strong>.
                            Ensure you select enough labs in the next step to accommodate all {formData.students?.length || 0} students.
                        </p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-between mt-auto pt-6 border-t border-zinc-100">
                <button
                    onClick={prevStep}
                    className="px-6 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-colors"
                >
                    ← Back
                </button>
                <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                    Continue to Labs
                    <span className="text-zinc-400">→</span>
                </button>
            </div>
        </div>
    );
}
