import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, Send, Clock } from 'lucide-react';
import api from '../../services/api';

export default function PublicFormPage() {
    const { slug } = useParams();

    const [form, setForm] = useState(null);
    const [fields, setFields] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState({});
    const [notFound, setNotFound] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const [closedDeadline, setClosedDeadline] = useState(null);

    const fetchForm = useCallback(async () => {
        try {
            setNotFound(false);
            setIsClosed(false);
            const res = await api.get(`/forms/public/${slug}`);
            setForm(res.data.form);
            setFields(res.data.fields || []);

            // Check if form is closed by deadline
            if (res.data.form.deadline) {
                const deadline = new Date(res.data.form.deadline);
                if (deadline < new Date()) {
                    setIsClosed(true);
                }
            }

            const initialAnswers = {};
            res.data.fields.forEach(f => {
                initialAnswers[f.id] = '';
            });
            setAnswers(initialAnswers);
        } catch (err) {
            console.error('Error fetching form:', err);
            const status = err.response?.status;
            const code = err.response?.data?.code;

            if (status === 410 && code === 'FORM_DEADLINE_PASSED') {
                setIsClosed(true);
                setClosedDeadline(err.response?.data?.details?.deadline || null);
                return;
            }

            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchForm();
    }, [fetchForm]);

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validate = () => {
        const newErrors = {};
        fields.forEach(field => {
            const value = answers[field.id];
            if (field.required && (!value || String(value).trim() === '')) {
                newErrors[field.id] = 'This field is required';
            }
            if (field.field_type === 'email' && value && !validateEmail(value)) {
                newErrors[field.id] = 'Please enter a valid email';
            }
            if (field.field_type === 'number' && value && isNaN(Number(value))) {
                newErrors[field.id] = 'Please enter a valid number';
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isClosed) return;
        if (!validate()) return;

        setSubmitting(true);
        try {
            await api.post(`/forms/public/${slug}/submit`, { answers });
            setSubmitted(true);
        } catch (err) {
            const status = err.response?.status;
            const code = err.response?.data?.code;
            if (status === 410 && code === 'FORM_DEADLINE_PASSED') {
                setIsClosed(true);
                setClosedDeadline(err.response?.data?.details?.deadline || null);
                return;
            }
            console.error('Error submitting:', err);
            alert(err.response?.data?.error || 'Error submitting form. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const updateAnswer = (fieldId, value) => {
        setAnswers(prev => ({ ...prev, [fieldId]: value }));
        if (errors[fieldId]) {
            setErrors(prev => ({ ...prev, [fieldId]: null }));
        }
    };

    const renderField = (field) => {
        const value = answers[field.id] || '';
        const error = errors[field.id];
        const baseClass = `w-full px-4 py-3 bg-zinc-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all ${error ? 'border-red-400 bg-red-50/50' : 'border-zinc-200'}`;

        switch (field.field_type) {
            case 'short_text':
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                        className={baseClass}
                        placeholder="Your answer"
                    />
                );
            case 'long_text':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                        className={`${baseClass} resize-none`}
                        rows={4}
                        placeholder="Your answer"
                    />
                );
            case 'email':
                return (
                    <input
                        type="email"
                        value={value}
                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                        className={baseClass}
                        placeholder="you@example.com"
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                        className={baseClass}
                        placeholder="Enter a number"
                    />
                );
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                        className={`${baseClass} cursor-pointer`}
                    >
                        <option value="">Select an option</option>
                        {field.options?.choices?.map((choice, i) => (
                            <option key={i} value={choice}>{choice}</option>
                        ))}
                    </select>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-zinc-400" size={32} />
                    <span className="text-sm text-zinc-500">Loading form...</span>
                </div>
            </div>
        );
    }

    if (notFound || isClosed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
                <div className="text-center max-w-md bg-white rounded-xl shadow-sm border border-zinc-200 p-8">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {isClosed ? <Clock className="text-zinc-600" size={32} /> : <AlertCircle className="text-zinc-400" size={32} />}
                    </div>
                    <h1 className="text-xl font-semibold text-zinc-800 mb-2">
                        {isClosed ? 'Submissions Closed' : 'Form Not Available'}
                    </h1>
                    <p className="text-sm text-zinc-500 mb-6">
                        {isClosed
                            ? `This application reached its deadline on ${new Date(form?.deadline || closedDeadline || Date.now()).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}.`
                            : "This form may have been closed or doesn't exist."
                        }
                    </p>
                    <div className="pt-4 border-t border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">MIT ADT PlacePro</p>
                    </div>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center max-w-md bg-white rounded-xl shadow-sm border border-zinc-200 p-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-emerald-500" size={32} />
                    </div>
                    <h1 className="text-xl font-semibold text-zinc-800 mb-2">Response Submitted!</h1>
                    <p className="text-sm text-zinc-500 mb-4">
                        Thank you for submitting your application for <strong>{form.title}</strong>.
                    </p>
                    <p className="text-xs text-zinc-400">You may now close this page.</p>
                </div>
            </div>
        );
    }

    const primaryColor = form.theme_settings?.primaryColor || '#673ab7';

    return (
        <div
            className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-500"
            style={{ backgroundColor: form.theme_settings?.backgroundColor || '#f0f2f5' }}
        >
            <div className="max-w-3xl mx-auto space-y-4">
                {/* Google Forms Style Header Card */}
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden relative">
                    {/* Header Strip */}
                    <div
                        className="h-2.5 w-full"
                        style={{ backgroundColor: primaryColor }}
                    />

                    <div className="p-6 sm:p-8">
                        <h1 className="text-3xl font-normal text-zinc-900 mb-2">
                            {form.title}
                        </h1>
                        {form.description && (
                            <div className="text-base text-zinc-600 whitespace-pre-wrap border-t border-zinc-100 pt-4 mt-4 leading-relaxed">
                                {form.description}
                            </div>
                        )}
                        <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                            <span className="text-xs font-medium text-red-500">* Indicates required question</span>
                        </div>
                    </div>
                </div>

                {/* Form Fields Section */}
                <form onSubmit={handleSubmit} className="space-y-4 pb-12">
                    {fields.map((field) => (
                        <div
                            key={field.id}
                            className={`bg-white rounded-xl p-6 sm:p-8 shadow-sm border transition-all ${errors[field.id] ? 'border-red-300' : 'border-zinc-200 hover:border-zinc-300'}`}
                        >
                            <label className="block text-base font-medium text-zinc-900 mb-6">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            <div className="relative group">
                                {renderField(field)}
                                {/* Decorative underline like Google Forms */}
                                <div className="absolute bottom-0 left-0 h-0.5 bg-zinc-900 w-0 group-focus-within:w-full transition-all duration-300"
                                    style={{ backgroundColor: primaryColor }}
                                />
                            </div>

                            {errors[field.id] && (
                                <div className="mt-3 flex items-center gap-1.5 text-red-500">
                                    <AlertCircle size={14} />
                                    <p className="text-xs font-medium">{errors[field.id]}</p>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Submit Section */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-zinc-900 text-white font-medium rounded-lg hover:shadow-lg disabled:opacity-50 transition-all text-sm active:scale-95"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {submitting ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <Send size={16} />
                                    Submit
                                </>
                            )}
                        </button>

                        <div className="flex items-center gap-2 text-zinc-400">
                            <div className="h-4 w-px bg-zinc-200 hidden sm:block" />
                            <p className="text-[11px] font-medium uppercase tracking-wider">
                                Powered by MIT ADT PlacePro
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
