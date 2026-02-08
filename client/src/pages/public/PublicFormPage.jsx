import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';
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

    useEffect(() => {
        fetchForm();
    }, [slug]);

    const fetchForm = async () => {
        try {
            const res = await api.get(`/forms/public/${slug}`);
            setForm(res.data.form);
            setFields(res.data.fields || []);

            const initialAnswers = {};
            res.data.fields.forEach(f => {
                initialAnswers[f.id] = '';
            });
            setAnswers(initialAnswers);
        } catch (err) {
            console.error('Error fetching form:', err);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

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
        if (!validate()) return;

        setSubmitting(true);
        try {
            await api.post(`/forms/public/${slug}/submit`, { answers });
            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting:', err);
            alert('Error submitting form. Please try again.');
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

    if (notFound) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center max-w-md p-8">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="text-zinc-400" size={32} />
                    </div>
                    <h1 className="text-xl font-semibold text-zinc-800 mb-2">Form Not Available</h1>
                    <p className="text-sm text-zinc-500">This form may have been closed or doesn't exist.</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center max-w-md p-8">
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

    return (
        <div className="min-h-screen bg-zinc-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
                    <div className="bg-zinc-900 p-6">
                        <h1 className="text-xl font-semibold text-white">{form.title}</h1>
                        {form.description && (
                            <p className="text-zinc-400 mt-2 text-sm">{form.description}</p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {fields.map((field) => (
                            <div key={field.id}>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {renderField(field)}
                                {errors[field.id] && (
                                    <p className="text-red-500 text-xs mt-1.5">{errors[field.id]}</p>
                                )}
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-all text-sm"
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
                    </form>
                </div>

                <p className="text-center text-xs text-zinc-400">
                    Powered by MIT ADT PlacePro
                </p>
            </div>
        </div>
    );
}
