import { useState } from 'react';
import { Calendar, Clock, FileText, Building2, Briefcase } from 'lucide-react';

export default function Step1BasicDetails({ formData, updateFormData, nextStep }) {
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateFormData({ [name]: value });
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.company_name?.trim()) newErrors.company_name = 'Company name is required';

        if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
            newErrors.end_time = 'End time must be after start time';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validate()) {
            nextStep();
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white shadow-sm">
                    <Building2 size={20} strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-zinc-900">Assessment Details</h3>
                    <p className="text-sm text-zinc-500">Enter the core information for this placement drive.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Company & Position */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-900 mb-2">
                            Company Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-3 text-zinc-400" size={18} />
                            <input
                                type="text"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                placeholder="e.g., Google, Microsoft"
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.company_name ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-zinc-200 focus:border-zinc-900 focus:ring-zinc-100'
                                    } focus:ring-4 outline-none transition-all shadow-sm font-medium`}
                            />
                        </div>
                        {errors.company_name && <p className="text-red-600 text-xs mt-1 font-medium">{errors.company_name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-zinc-900 mb-2">
                            Position Role
                        </label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3 text-zinc-400" size={18} />
                            <input
                                type="text"
                                name="position"
                                value={formData.position || ''}
                                onChange={handleChange}
                                placeholder="e.g., Software Engineer"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-100 outline-none transition-all shadow-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 mb-2">
                        Description / Notes
                    </label>
                    <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        placeholder="Additional details about the assessment, rounds, or requirements..."
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-100 outline-none transition-all resize-none shadow-sm text-sm leading-relaxed"
                    />
                </div>
            </div>

            {/* Schedule Section */}
            <div className="bg-zinc-50/50 rounded-2xl p-6 border border-zinc-200/50">
                <h4 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} /> Schedule & Timing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                            Date
                        </label>
                        <input
                            type="date"
                            name="assessment_date"
                            value={formData.assessment_date || ''}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                            Start Time
                        </label>
                        <input
                            type="time"
                            name="start_time"
                            value={formData.start_time || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                            End Time
                        </label>
                        <input
                            type="time"
                            name="end_time"
                            value={formData.end_time || ''}
                            onChange={handleChange}
                            className={`w-full px-4 py-2.5 rounded-lg border ${errors.end_time ? 'border-red-300' : 'border-zinc-200'}
                             focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all bg-white`}
                        />
                        {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time}</p>}
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-10">
                <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                    Continue to Students
                    <span className="text-zinc-400">→</span>
                </button>
            </div>
        </div>
    );
}
