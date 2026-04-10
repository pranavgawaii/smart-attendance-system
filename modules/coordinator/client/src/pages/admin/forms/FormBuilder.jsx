import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, ChevronUp, ChevronDown, Loader2, ArrowLeft, Sparkles, GripVertical } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import api from '../../../services/api';

const FIELD_TYPES = [
    { value: 'short_text', label: 'Short Text' },
    { value: 'long_text', label: 'Long Text' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Dropdown Select' }
];

const COORDINATOR_TEMPLATE = [
    { label: 'Full Name', field_type: 'short_text', required: true },
    { label: 'Email Address', field_type: 'email', required: true },
    { label: 'Phone Number', field_type: 'short_text', required: true },
    { label: 'Department', field_type: 'select', required: true, options: { choices: ['SOC', 'SOE', 'SODT', 'SOM'] } },
    { label: 'Year', field_type: 'select', required: true, options: { choices: ['FY', 'SY', 'TY', 'LY'] } },
    { label: 'CGPA', field_type: 'number', required: true },
    { label: 'Why do you want to be a Coordinator?', field_type: 'long_text', required: true },
    { label: 'Any past experience in coordination/events?', field_type: 'long_text', required: false }
];

export default function FormBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [form, setForm] = useState({
        title: '',
        description: '',
        status: 'draft',
        deadline: ''
    });
    const [themeSettings, setThemeSettings] = useState({
        primaryColor: '#6366f1',
        backgroundColor: '#f8fafc'
    });
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const fetchForm = useCallback(async () => {
        try {
            const res = await api.get(`/forms/${id}`);
            setForm({
                ...res.data.form,
                deadline: res.data.form.deadline ? new Date(res.data.form.deadline).toISOString().slice(0, 16) : ''
            });
            setFields(res.data.fields || []);
            if (res.data.form.theme_settings) {
                setThemeSettings(res.data.form.theme_settings);
            }
        } catch (err) {
            console.error('Error fetching form:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (isEditMode) {
            fetchForm();
        }
    }, [isEditMode, fetchForm]);

    const addField = () => {
        setFields([
            ...fields,
            {
                id: `temp-${Date.now()}`,
                label: '',
                field_type: 'short_text',
                required: true,
                options: null,
                sort_order: fields.length
            }
        ]);
    };

    const updateField = (index, key, value) => {
        const updated = [...fields];
        updated[index] = { ...updated[index], [key]: value };
        setFields(updated);
    };

    const removeField = (index) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const moveField = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= fields.length) return;

        const updated = [...fields];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setFields(updated);
    };

    const applyTemplate = () => {
        if (fields.length > 0 && !confirm('This will replace existing fields. Continue?')) return;
        setForm({ ...form, title: 'Coordinator Application', description: 'Apply to become a coordinator for the upcoming academic year.' });
        setFields(COORDINATOR_TEMPLATE.map((f, i) => ({
            ...f,
            id: `temp-${Date.now()}-${i}`,
            sort_order: i
        })));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = 'Title is required';
        if (fields.length === 0) newErrors.fields = 'Add at least one field';
        fields.forEach((field, i) => {
            if (!field.label.trim()) newErrors[`field-${i}`] = 'Label required';
            if (field.field_type === 'select' && (!field.options?.choices?.length)) {
                newErrors[`field-${i}-options`] = 'Add choices for dropdown';
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);

        try {
            if (isEditMode) {
                await api.put(`/forms/${id}`, {
                    title: form.title,
                    description: form.description,
                    status: form.status,
                    deadline: form.deadline || null,
                    theme_settings: themeSettings,
                    fields
                });
            } else {
                await api.post('/forms', {
                    title: form.title,
                    description: form.description,
                    status: form.status,
                    deadline: form.deadline || null,
                    theme_settings: themeSettings,
                    fields
                });
            }

            navigate('/admin/coordinators/forms');
        } catch (err) {
            console.error('Error saving form:', err);
            alert('Error saving form: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Form Builder">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="animate-spin text-zinc-400" size={24} />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={isEditMode ? 'Edit Form' : 'Create New Form'}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/coordinators/forms')}
                            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-zinc-900">
                                {isEditMode ? 'Edit Form' : 'Create New Form'}
                            </h1>
                            <p className="text-sm text-zinc-500 mt-0.5">Configure your form settings and fields</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-sm"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Form
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Form Settings */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
                            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Form Settings</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Title *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className={`w-full px-3 py-2 bg-zinc-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all ${errors.title ? 'border-red-400' : 'border-zinc-200'}`}
                                        placeholder="e.g., Coordinator Application"
                                    />
                                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Description</label>
                                    <textarea
                                        value={form.description || ''}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all resize-none"
                                        rows={3}
                                        placeholder="Brief description..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all cursor-pointer"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="active">Active (Public)</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Application Deadline</label>
                                    <input
                                        type="datetime-local"
                                        value={form.deadline}
                                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all"
                                    />
                                    <p className="text-[10px] text-zinc-400 mt-1">Form will close automatically after this time</p>
                                </div>

                                <div className="pt-4 border-t border-zinc-100">
                                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Design & Theme</h3>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Header Color</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={themeSettings.primaryColor}
                                                    onChange={(e) => setThemeSettings({ ...themeSettings, primaryColor: e.target.value })}
                                                    className="w-8 h-8 rounded border border-zinc-200 cursor-pointer overflow-hidden p-0 bg-transparent"
                                                />
                                                <span className="text-[10px] text-zinc-500 uppercase font-mono">{themeSettings.primaryColor}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Page Background</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={themeSettings.backgroundColor}
                                                    onChange={(e) => setThemeSettings({ ...themeSettings, backgroundColor: e.target.value })}
                                                    className="w-8 h-8 rounded border border-zinc-200 cursor-pointer overflow-hidden p-0 bg-transparent"
                                                />
                                                <span className="text-[10px] text-zinc-500 uppercase font-mono">{themeSettings.backgroundColor}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Template Button */}
                        {!isEditMode && (
                            <button
                                onClick={applyTemplate}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm"
                            >
                                <Sparkles size={16} />
                                Use Coordinator Template
                            </button>
                        )}
                    </div>

                    {/* Right: Fields */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-zinc-900">Form Fields</h2>
                                <button
                                    onClick={addField}
                                    className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 font-medium"
                                >
                                    <Plus size={14} /> Add Field
                                </button>
                            </div>

                            {errors.fields && <p className="text-red-500 text-xs mb-4 bg-red-50 p-2 rounded">{errors.fields}</p>}

                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="p-4 bg-zinc-50 rounded-lg border border-zinc-100"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Reorder buttons */}
                                            <div className="flex flex-col gap-0.5 pt-2">
                                                <button
                                                    onClick={() => moveField(index, -1)}
                                                    disabled={index === 0}
                                                    className="p-1 text-zinc-300 hover:text-zinc-500 disabled:opacity-30"
                                                >
                                                    <ChevronUp size={14} />
                                                </button>
                                                <button
                                                    onClick={() => moveField(index, 1)}
                                                    disabled={index === fields.length - 1}
                                                    className="p-1 text-zinc-300 hover:text-zinc-500 disabled:opacity-30"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                            </div>

                                            {/* Field inputs */}
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-zinc-500 mb-1 block">Label</label>
                                                    <input
                                                        type="text"
                                                        value={field.label}
                                                        onChange={(e) => updateField(index, 'label', e.target.value)}
                                                        className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 ${errors[`field-${index}`] ? 'border-red-400' : 'border-zinc-200'}`}
                                                        placeholder="Field label"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-zinc-500 mb-1 block">Type</label>
                                                    <select
                                                        value={field.field_type}
                                                        onChange={(e) => updateField(index, 'field_type', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 cursor-pointer"
                                                    >
                                                        {FIELD_TYPES.map(t => (
                                                            <option key={t.value} value={t.value}>{t.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {field.field_type === 'select' && (
                                                    <div className="md:col-span-2">
                                                        <label className="text-xs text-zinc-500 mb-1 block">Choices (comma-separated)</label>
                                                        <input
                                                            type="text"
                                                            value={field.options?.choices?.join(', ') || ''}
                                                            onChange={(e) => updateField(index, 'options', {
                                                                choices: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                                            })}
                                                            className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 ${errors[`field-${index}-options`] ? 'border-red-400' : 'border-zinc-200'}`}
                                                            placeholder="Option 1, Option 2, Option 3"
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.required}
                                                        onChange={(e) => updateField(index, 'required', e.target.checked)}
                                                        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                                                    />
                                                    <label className="text-xs text-zinc-600">Required field</label>
                                                </div>
                                            </div>

                                            {/* Delete button */}
                                            <button
                                                onClick={() => removeField(index)}
                                                className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {fields.length === 0 && (
                                    <div className="text-center py-12 text-zinc-400">
                                        <GripVertical className="mx-auto mb-2 text-zinc-200" size={24} />
                                        <p className="text-sm">No fields added yet</p>
                                        <p className="text-xs mt-1">Click "Add Field" or use the template</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout >
    );
}
