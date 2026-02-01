import { useState } from 'react';
import { Calendar, Clock, FileText } from 'lucide-react';

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

        // Only validate time relationship if both are provided
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
        <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Assessment Details</h3>

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        placeholder="e.g., Google, Microsoft, Amazon"
                        className={`w-full px-4 py-2.5 rounded-lg border ${errors.company_name ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-zinc-200 focus:border-zinc-500 focus:ring-zinc-100'
                            } focus:ring-2 outline-none transition-all`}
                    />
                    {errors.company_name && <p className="text-red-600 text-sm mt-1">{errors.company_name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Position <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        name="position"
                        value={formData.position || ''}
                        onChange={handleChange}
                        placeholder="e.g., Software Engineer, Data Analyst"
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave blank if not applicable</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <Calendar size={14} strokeWidth={1.5} className="inline mr-1" />
                            Date <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <input
                            type="date"
                            name="assessment_date"
                            value={formData.assessment_date || ''}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className={`w-full px-4 py-2.5 rounded-lg border ${errors.assessment_date ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-zinc-200 focus:border-zinc-500 focus:ring-zinc-100'
                                } focus:ring-2 outline-none transition-all`}
                        />
                        {errors.assessment_date && <p className="text-red-600 text-sm mt-1">{errors.assessment_date}</p>}
                        <p className="text-xs text-slate-500 mt-1">Leave blank if not scheduled yet</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <Clock size={14} strokeWidth={1.5} className="inline mr-1" />
                            Start Time <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <input
                            type="time"
                            name="start_time"
                            value={formData.start_time || ''}
                            onChange={handleChange}
                            className={`w-full px-4 py-2.5 rounded-lg border ${errors.start_time ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                                } focus:ring-2 outline-none transition-all`}
                        />
                        {errors.start_time && <p className="text-red-600 text-sm mt-1">{errors.start_time}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <Clock size={14} strokeWidth={1.5} className="inline mr-1" />
                            End Time <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <input
                            type="time"
                            name="end_time"
                            value={formData.end_time || ''}
                            onChange={handleChange}
                            className={`w-full px-4 py-2.5 rounded-lg border ${errors.end_time ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                                } focus:ring-2 outline-none transition-all`}
                        />
                        {errors.end_time && <p className="text-red-600 text-sm mt-1">{errors.end_time}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <FileText size={14} strokeWidth={1.5} className="inline mr-1" />
                        Description <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        placeholder="Additional details about the assessment..."
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">Add any additional information about the placement drive</p>
                </div>
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t border-slate-100">
                <button
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
                >
                    Next: Add Students →
                </button>
            </div>
        </div>
    );
}
