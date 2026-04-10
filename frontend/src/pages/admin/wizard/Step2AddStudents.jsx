import { useState, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, Download, UserPlus, Trash2, Database, Search, Users, X } from 'lucide-react';
import api from '../../../services/api';

// CSV Template with 100 dummy students
const CSV_TEMPLATE = `roll_number,name,email,phone
MIT001,Aarav Sharma,aarav.sharma@example.com,9876543210
MIT002,Aditi Patel,aditi.patel@example.com,9876543211
MIT003,Arjun Singh,arjun.singh@example.com,9876543212
MIT004,Avni Gupta,avni.gupta@example.com,9876543213
MIT005,Rohan Kumar,rohan.kumar@example.com,9876543214
MIT006,Sanya verified,sanya.verified@example.com,9876543215
MIT007,Ishaan Verma,ishaan.verma@example.com,9876543216
MIT008,Ananya Reddy,ananya.reddy@example.com,9876543217
MIT009,Vihaan Malhotra,vihaan.malhotra@example.com,9876543218
MIT010,Zara Khan,zara.khan@example.com,9876543219`; // Truncated for brevity in code, but user will get a usable file.

export default function Step2AddStudents({ formData, updateFormData, nextStep, prevStep }) {
    const [csvFile, setCsvFile] = useState(null);
    const [parseResult, setParseResult] = useState(null);
    const [inputMode, setInputMode] = useState('csv'); // 'csv', 'manual', 'db'
    const [manualStudents, setManualStudents] = useState(formData.students || []);

    // DB Selection State
    const [dbStudents, setDbStudents] = useState([]);
    const [loadingDb, setLoadingDb] = useState(false);
    const [dbSearch, setDbSearch] = useState('');
    const [selectedDbIds, setSelectedDbIds] = useState(new Set());

    const [newStudent, setNewStudent] = useState({
        roll_number: '',
        name: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        // If switching to DB mode, fetch students if empty
        if (inputMode === 'db' && dbStudents.length === 0) {
            fetchDbStudents();
        }
    }, [inputMode, dbStudents.length]);

    const fetchDbStudents = async () => {
        setLoadingDb(true);
        try {
            const res = await api.get('/users');
            // Filter only active students
            const validStudents = res.data.filter(u => u.role !== 'admin' && u.user_status === 'active');
            setDbStudents(validStudents);
        } catch (error) {
            console.error("Failed to fetch students", error);
        } finally {
            setLoadingDb(false);
        }
    };

    const downloadCSVTemplate = () => {
        const bigTemplate = `roll_number,name,email,phone\n` + Array.from({ length: 100 }, (_, i) => {
            const num = String(i + 1).padStart(3, '0');
            return `MIT${num},Student ${num},student${num}@example.com,9876543${num}`;
        }).join('\n');

        const blob = new Blob([bigTemplate], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_upload_template_100.csv';
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
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

                const requiredCols = ['roll_number', 'name', 'email'];
                const missingCols = requiredCols.filter(col => !headers.includes(col));

                if (missingCols.length > 0) {
                    setParseResult({
                        success: false,
                        error: `Missing required columns: ${missingCols.join(', ')}`
                    });
                    return;
                }

                const students = [];
                const warnings = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const student = {};
                    headers.forEach((header, index) => {
                        const key = header === 'roll_number' ? 'enrollment_no' : header;
                        student[key] = values[index] || '';
                    });

                    if (student.enrollment_no && student.name && student.email) {
                        students.push(student);
                        if (!student.phone) warnings.push(`Row ${i + 1}: Missing phone`);
                    }
                }

                setParseResult({
                    success: true,
                    total: students.length,
                    valid: students.length,
                    warnings: warnings,
                    students: students
                });

                updateFormData({ students: students, validStudents: students });

            } catch {
                setParseResult({
                    success: false,
                    error: 'Failed to parse CSV file.'
                });
            }
        };
        reader.readAsText(file);
    };

    // DB Selection Logic
    const toggleDbSelection = (student) => {
        const newSet = new Set(selectedDbIds);
        if (newSet.has(student.id)) {
            newSet.delete(student.id);
        } else {
            newSet.add(student.id);
        }
        setSelectedDbIds(newSet);
        syncDbSelection(newSet);
    };

    const toggleSelectAllDb = () => {
        if (selectedDbIds.size === filteredDbStudents.length) {
            setSelectedDbIds(new Set());
            syncDbSelection(new Set());
        } else {
            const newSet = new Set(filteredDbStudents.map(s => s.id));
            setSelectedDbIds(newSet);
            syncDbSelection(newSet);
        }
    };

    const syncDbSelection = (ids) => {
        const selected = dbStudents.filter(s => ids.has(s.id)).map(s => ({
            enrollment_no: s.enrollment_no,
            name: s.name,
            email: s.email,
            phone: s.phone || ''
        }));
        updateFormData({ students: selected, validStudents: selected });
    };

    const filteredDbStudents = dbStudents.filter(s =>
        s.name.toLowerCase().includes(dbSearch.toLowerCase()) ||
        s.enrollment_no?.toLowerCase().includes(dbSearch.toLowerCase())
    );

    // Manual Entry Logic
    const handleAddManual = () => {
        if (!newStudent.roll_number || !newStudent.name || !newStudent.email) return;
        if (manualStudents.some(s => s.enrollment_no === newStudent.roll_number)) {
            alert('Duplicate roll number');
            return;
        }
        const studentToSave = {
            enrollment_no: newStudent.roll_number,
            name: newStudent.name,
            email: newStudent.email,
            phone: newStudent.phone || ''
        };
        const updated = [...manualStudents, studentToSave];
        setManualStudents(updated);
        updateFormData({ students: updated, validStudents: updated });
        setNewStudent({ roll_number: '', name: '', email: '', phone: '' });
    };

    const handleNext = () => {
        if (formData.students && formData.students.length > 0) {
            nextStep();
        } else {
            alert('Please add at least one student.');
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white shadow-sm">
                    <Users size={20} strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-zinc-900">Add Students</h3>
                    <p className="text-sm text-zinc-500">Choose how you want to add students to this assessment.</p>
                </div>
            </div>

            {/* Input Mode Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                    { id: 'csv', icon: Upload, label: 'Upload CSV', desc: 'Bulk upload via file' },
                    { id: 'db', icon: Database, label: 'Select from DB', desc: 'Pick from existing students' },
                    { id: 'manual', icon: UserPlus, label: 'Manual Entry', desc: 'Add one by one' }
                ].map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => setInputMode(mode.id)}
                        className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 ${inputMode === mode.id
                            ? 'border-zinc-900 bg-zinc-50 text-zinc-900 shadow-sm'
                            : 'border-zinc-100 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'
                            }`}
                    >
                        <mode.icon size={24} strokeWidth={1.5} className="mb-3" />
                        <span className="font-bold text-sm">{mode.label}</span>
                        <span className="text-xs opacity-70 mt-1">{mode.desc}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-zinc-50/50 rounded-2xl border border-zinc-200/50 p-6 min-h-[300px]">

                {/* CSV MODE */}
                {inputMode === 'csv' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Download size={18} /></div>
                                <div>
                                    <h4 className="font-bold text-blue-900 text-sm">Need a template?</h4>
                                    <p className="text-xs text-blue-700">Download our pre-formatted CSV with 100 students.</p>
                                </div>
                            </div>
                            <button onClick={downloadCSVTemplate} className="text-xs font-bold bg-white text-blue-600 px-4 py-2 rounded-lg border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors">
                                Download Template
                            </button>
                        </div>

                        <label className="block border-2 border-dashed border-zinc-300 rounded-xl p-10 text-center cursor-pointer hover:border-zinc-900/50 hover:bg-white transition-all group">
                            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Upload size={28} className="text-zinc-400 group-hover:text-zinc-900" />
                            </div>
                            <p className="font-bold text-zinc-900 mb-1">{csvFile ? csvFile.name : 'Click to Upload CSV'}</p>
                            <p className="text-xs text-zinc-500">Supports .csv files with header row</p>
                        </label>

                        {parseResult?.success && (
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                                <CheckCircle className="text-emerald-600" size={20} />
                                <div>
                                    <p className="font-bold text-emerald-900 text-sm">Successfully Loaded {parseResult.valid} Students</p>
                                    <p className="text-xs text-emerald-700">Ready to proceed.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* DB MODE */}
                {inputMode === 'db' && (
                    <div className="h-[500px] flex flex-col">
                        <div className="flex gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 text-zinc-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by Name or Enrollment..."
                                    value={dbSearch}
                                    onChange={e => setDbSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-600 font-medium px-4 bg-white rounded-xl border border-zinc-200">
                                <span className="text-zinc-900">{selectedDbIds.size}</span> selected
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white border border-zinc-200 rounded-xl">
                            {loadingDb ? (
                                <div className="p-8 text-center text-zinc-500 text-sm">Loading students...</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-zinc-50 sticky top-0 z-10">
                                        <tr className="text-xs font-semibold text-zinc-500 uppercase">
                                            <th className="px-4 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    className="accent-zinc-900 w-4 h-4 rounded"
                                                    checked={filteredDbStudents.length > 0 && selectedDbIds.size === filteredDbStudents.length}
                                                    onChange={toggleSelectAllDb}
                                                />
                                            </th>
                                            <th className="px-4 py-3">Enrollment</th>
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {filteredDbStudents.map(student => (
                                            <tr key={student.id} className="hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => toggleDbSelection(student)}>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDbIds.has(student.id)}
                                                        onChange={() => toggleDbSelection(student)}
                                                        className="accent-zinc-900 w-4 h-4 rounded"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">{student.enrollment_no}</td>
                                                <td className="px-4 py-3 font-medium text-zinc-900">{student.name}</td>
                                                <td className="px-4 py-3 text-zinc-500">{student.email}</td>
                                            </tr>
                                        ))}
                                        {filteredDbStudents.length === 0 && (
                                            <tr><td colSpan="4" className="p-8 text-center text-zinc-400">No students found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* MANUAL MODE */}
                {inputMode === 'manual' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <input value={newStudent.roll_number} onChange={e => setNewStudent({ ...newStudent, roll_number: e.target.value })} placeholder="Roll No *" className="px-4 py-2 border rounded-lg focus:border-zinc-900 outline-none" />
                            <input value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} placeholder="Name *" className="px-4 py-2 border rounded-lg focus:border-zinc-900 outline-none" />
                            <input value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} placeholder="Email *" className="px-4 py-2 border rounded-lg focus:border-zinc-900 outline-none" />
                            <button onClick={handleAddManual} className="bg-zinc-900 text-white rounded-lg font-bold hover:bg-black transition-colors flex items-center justify-center gap-2">
                                <Plus size={16} /> Add
                            </button>
                        </div>

                        {/* List */}
                        {manualStudents.length > 0 && (
                            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden mt-4">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Roll No</th>
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Email</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {manualStudents.map((s, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-50">
                                                <td className="px-4 py-3 font-mono text-xs">{s.enrollment_no}</td>
                                                <td className="px-4 py-3 text-zinc-900 font-medium">{s.name}</td>
                                                <td className="px-4 py-3 text-zinc-500">{s.email}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => {
                                                        const updated = manualStudents.filter((_, i) => i !== idx);
                                                        setManualStudents(updated);
                                                        updateFormData({ students: updated, validStudents: updated });
                                                    }} className="text-red-500 hover:text-red-700">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
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
                <div className="flex items-center gap-4">
                    <p className="text-sm font-semibold text-zinc-900">
                        Total Selected: <span className="text-blue-600 text-base">{formData.students?.length || 0}</span>
                    </p>
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-8 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Continue to Seating
                        <span className="text-zinc-400">→</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function Plus({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )
}
