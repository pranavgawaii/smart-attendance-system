import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, Download, UserPlus, Trash2 } from 'lucide-react';

export default function Step2AddStudents({ formData, updateFormData, nextStep, prevStep }) {
    const [csvFile, setCsvFile] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [parseResult, setParseResult] = useState(null);
    const [inputMode, setInputMode] = useState('csv'); // 'csv' or 'manual'
    const [manualStudents, setManualStudents] = useState(formData.students || []);
    const [newStudent, setNewStudent] = useState({
        roll_number: '',
        name: '',
        email: '',
        phone: ''
    });

    const downloadCSVTemplate = () => {
        const template = `roll_number,name,email,phone
2021001,John Doe,john@example.com,9876543210
2021002,Jane Smith,jane@example.com,9876543211`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
            parseCSV(file);
        } else {
            alert('Please upload a valid CSV file');
        }
    };

    const parseCSV = async (file) => {
        setParsing(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

                // Validate required columns
                const requiredCols = ['roll_number', 'name', 'email'];
                const missingCols = requiredCols.filter(col => !headers.includes(col));

                if (missingCols.length > 0) {
                    setParseResult({
                        success: false,
                        error: `Missing required columns: ${missingCols.join(', ')}`
                    });
                    setParsing(false);
                    return;
                }

                // Parse students
                const students = [];
                const warnings = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const student = {};

                    headers.forEach((header, index) => {
                        student[header] = values[index] || '';
                    });

                    if (student.roll_number && student.name && student.email) {
                        students.push(student);
                        if (!student.phone) {
                            warnings.push(`Row ${i + 1}: Missing phone number for ${student.name}`);
                        }
                    }
                }

                setParseResult({
                    success: true,
                    total: students.length,
                    valid: students.length,
                    warnings: warnings,
                    students: students
                });

                updateFormData({
                    students: students,
                    validStudents: students
                });

            } catch (error) {
                setParseResult({
                    success: false,
                    error: 'Failed to parse CSV file. Please check the format.'
                });
            }
            setParsing(false);
        };

        reader.readAsText(file);
    };

    const handleAddStudent = () => {
        if (!newStudent.roll_number || !newStudent.name || !newStudent.email) {
            alert('Please fill in all required fields (Roll Number, Name, Email)');
            return;
        }

        // Check for duplicate roll number
        if (manualStudents.some(s => s.roll_number === newStudent.roll_number)) {
            alert('A student with this roll number already exists');
            return;
        }

        const updatedStudents = [...manualStudents, { ...newStudent }];
        setManualStudents(updatedStudents);
        updateFormData({
            students: updatedStudents,
            validStudents: updatedStudents
        });

        // Reset form
        setNewStudent({
            roll_number: '',
            name: '',
            email: '',
            phone: ''
        });
    };

    const handleRemoveStudent = (index) => {
        const updatedStudents = manualStudents.filter((_, i) => i !== index);
        setManualStudents(updatedStudents);
        updateFormData({
            students: updatedStudents,
            validStudents: updatedStudents
        });
    };

    const handleNext = () => {
        const students = inputMode === 'csv' ? parseResult?.students : manualStudents;
        if (students && students.length > 0) {
            nextStep();
        } else {
            alert('Please add at least one student before proceeding');
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Add Students</h3>
            <p className="text-sm text-slate-500 mb-6">Upload a CSV file or add students manually</p>

            {/* Mode Toggle */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setInputMode('csv')}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${inputMode === 'csv'
                        ? 'bg-zinc-900 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    <Upload size={16} strokeWidth={1.5} className="inline mr-2" />
                    Upload CSV
                </button>
                <button
                    onClick={() => setInputMode('manual')}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${inputMode === 'manual'
                        ? 'bg-zinc-900 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    <UserPlus size={16} strokeWidth={1.5} className="inline mr-2" />
                    Add Manually
                </button>
            </div>

            {/* CSV Upload Mode */}
            {inputMode === 'csv' && (
                <>
                    {/* Download Template Button */}
                    <div className="mb-4">
                        <button
                            onClick={downloadCSVTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-semibold text-sm hover:bg-emerald-100 transition-colors"
                        >
                            <Download size={16} strokeWidth={1.5} />
                            Download CSV Template
                        </button>
                    </div>

                    {/* CSV Upload */}
                    <div className="mb-6">
                        <label className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50/30 transition-all">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Upload size={40} strokeWidth={1.5} className="mx-auto text-slate-400 mb-3" />
                            <p className="text-sm font-semibold text-slate-700 mb-1">
                                {csvFile ? csvFile.name : 'Click to upload CSV file'}
                            </p>
                            <p className="text-xs text-slate-500">
                                Required columns: roll_number, name, email
                            </p>
                        </label>
                    </div>
                </>
            )}

            {/* Manual Entry Mode */}
            {inputMode === 'manual' && (
                <>
                    {/* Manual Entry Form */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">Add New Student</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Roll Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newStudent.roll_number}
                                    onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                                    placeholder="e.g., 2021001"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newStudent.name}
                                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                    placeholder="e.g., John Doe"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={newStudent.email}
                                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                    placeholder="e.g., john@example.com"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={newStudent.phone}
                                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                                    placeholder="e.g., 9876543210"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 outline-none text-sm"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleAddStudent}
                            className="w-full px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <UserPlus size={16} strokeWidth={1.5} />
                            Add Student
                        </button>
                    </div>

                    {/* Manual Students List */}
                    {manualStudents.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-emerald-900">
                                    Added Students ({manualStudents.length})
                                </h4>
                            </div>
                            <div className="bg-white rounded-lg border border-emerald-200 overflow-hidden max-h-64 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-emerald-50 border-b border-emerald-200 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-900">Roll No.</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-900">Name</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-900">Email</th>
                                            <th className="px-3 py-2 text-center text-xs font-semibold text-emerald-900">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-emerald-100">
                                        {manualStudents.map((student, idx) => (
                                            <tr key={idx} className="hover:bg-emerald-50">
                                                <td className="px-3 py-2 text-slate-700">{student.roll_number}</td>
                                                <td className="px-3 py-2 text-slate-700">{student.name}</td>
                                                <td className="px-3 py-2 text-slate-500 text-xs">{student.email}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        onClick={() => handleRemoveStudent(idx)}
                                                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                    >
                                                        <Trash2 size={14} strokeWidth={1.5} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Parsing Status */}
            {parsing && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                    <p className="text-indigo-700 text-sm">Parsing CSV file...</p>
                </div>
            )}

            {/* Parse Results */}
            {parseResult && (
                <div className={`border rounded-xl p-6 mb-6 ${parseResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                    }`}>
                    {parseResult.success ? (
                        <>
                            <div className="flex items-start gap-3 mb-4">
                                <CheckCircle size={20} strokeWidth={1.5} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-emerald-900 mb-1">CSV Parsed Successfully</p>
                                    <p className="text-sm text-emerald-700">
                                        {parseResult.valid} students ready for allocation
                                    </p>
                                </div>
                            </div>

                            {parseResult.warnings.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={16} strokeWidth={1.5} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-yellow-900 mb-1">Warnings</p>
                                            <ul className="text-xs text-yellow-700 space-y-1">
                                                {parseResult.warnings.slice(0, 5).map((warning, idx) => (
                                                    <li key={idx}>• {warning}</li>
                                                ))}
                                                {parseResult.warnings.length > 5 && (
                                                    <li>• ... and {parseResult.warnings.length - 5} more</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preview */}
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-slate-700 mb-2">Preview (First 5 students)</p>
                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Roll No.</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Name</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Email</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {parseResult.students.slice(0, 5).map((student, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-3 py-2 text-slate-700">{student.roll_number}</td>
                                                    <td className="px-3 py-2 text-slate-700">{student.name}</td>
                                                    <td className="px-3 py-2 text-slate-500 text-xs">{student.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-start gap-3">
                            <XCircle size={20} strokeWidth={1.5} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-900 mb-1">Failed to Parse CSV</p>
                                <p className="text-sm text-red-700">{parseResult.error}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CSV Format Help */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-slate-700 mb-2">
                    <FileText size={14} strokeWidth={1.5} className="inline mr-1" />
                    CSV Format Example
                </p>
                <pre className="text-xs text-slate-600 bg-white p-3 rounded border border-slate-200 overflow-x-auto">
                    {`roll_number,name,email,phone
2021001,John Doe,john@example.com,9876543210
2021002,Jane Smith,jane@example.com,9876543211`}
                </pre>
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
                    disabled={
                        inputMode === 'csv'
                            ? (!parseResult?.success || parseResult.valid === 0)
                            : manualStudents.length === 0
                    }
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next: Seating Mode →
                </button>
            </div>
        </div>
    );
}
