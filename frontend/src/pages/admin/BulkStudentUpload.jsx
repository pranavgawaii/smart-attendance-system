import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Key, ArrowRight, RefreshCw, X, UserPlus, Trash2, PenTool } from 'lucide-react';
import Papa from 'papaparse';
import api from '../../services/api';

export default function BulkStudentUpload() {
    const [activeTab, setActiveTab] = useState('quick'); // 'quick' or 'csv'

    // CSV Workflow State
    const [step, setStep] = useState(1);
    const [validationResults, setValidationResults] = useState({ valid: [], invalid: [], duplicates: [] });

    // Quick Add Workflow State
    const [quickStudents, setQuickStudents] = useState([
        { id: 1, enrollment_no: '', name: '', email: '', mobile: '', department: 'Computer Science', year: '3', passwordPreview: '' }
    ]);
    const [quickErrors, setQuickErrors] = useState({}); // { 0: { email: 'Invalid' } }

    // Shared State
    const [, setProcessing] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);

    const steps = [
        { num: 1, label: 'Template' },
        { num: 2, label: 'Upload' },
        { num: 3, label: 'Validate' },
        { num: 4, label: 'Generate' },
        { num: 5, label: 'Finish' }
    ];

    // --- QUICK ADD LOGIC ---

    const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Robotics'];
    const YEARS = ['1', '2', '3', '4'];

    const getPasswordPreview = (dept, enroll, mobile) => {
        if (!dept || !enroll || !mobile || mobile.length < 4 || enroll.length < 4) return '---';

        const deptPrefix = {
            'Computer Science': 'CSE',
            'Information Technology': 'IT',
            'Electronics': 'ENTC',
            'Mechanical': 'MECH',
            'Civil': 'CIVIL',
            'Robotics': 'R&A'
        }[dept] || dept.substring(0, 3).toUpperCase();

        const last4Enroll = enroll.slice(-4);
        const last4Mobile = mobile.slice(-4);

        return `${deptPrefix}${last4Enroll}&${last4Mobile}`;
    };

    const handleQuickChange = (id, field, value) => {
        setQuickStudents(prev => prev.map(s => {
            if (s.id !== id) return s;

            const updated = { ...s, [field]: value };

            // Auto-update password preview
            if (['department', 'enrollment_no', 'mobile'].includes(field)) {
                updated.passwordPreview = getPasswordPreview(updated.department, updated.enrollment_no, updated.mobile);
            }
            // Auto uppercase enrollment
            if (field === 'enrollment_no') updated.enrollment_no = value.toUpperCase();

            return updated;
        }));

        // Clear error for this field
        if (quickErrors[id]?.[field]) {
            setQuickErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors[id]) delete newErrors[id][field];
                return newErrors;
            });
        }
    };

    const addQuickRow = () => {
        if (quickStudents.length >= 5) return;
        const newId = Math.max(...quickStudents.map(s => s.id)) + 1;
        setQuickStudents([...quickStudents, { id: newId, enrollment_no: '', name: '', email: '', mobile: '', department: 'Computer Science', year: '3', passwordPreview: '' }]);
    };

    const removeQuickRow = (id) => {
        if (quickStudents.length <= 1) return;
        setQuickStudents(prev => prev.filter(s => s.id !== id));
        setQuickErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[id];
            return newErrors;
        });
    };

    const validateQuickForm = () => {
        const errors = {};
        let isValid = true;
        const seenEnrollments = new Set();
        const seenEmails = new Set();

        quickStudents.forEach(student => {
            const studentErrors = {};

            if (!student.enrollment_no) studentErrors.enrollment_no = "Required";
            else if (seenEnrollments.has(student.enrollment_no)) studentErrors.enrollment_no = "Duplicate";
            else seenEnrollments.add(student.enrollment_no);

            if (!student.name) studentErrors.name = "Required";

            if (!student.email) studentErrors.email = "Required";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) studentErrors.email = "Invalid format";
            else if (seenEmails.has(student.email)) studentErrors.email = "Duplicate";
            else seenEmails.add(student.email);

            if (!student.mobile) studentErrors.mobile = "Required";
            else if (!/^\d{10}$/.test(student.mobile)) studentErrors.mobile = "Must be 10 digits";

            if (Object.keys(studentErrors).length > 0) {
                errors[student.id] = studentErrors;
                isValid = false;
            }
        });

        setQuickErrors(errors);
        return isValid;
    };

    const handleQuickSubmit = () => {
        if (!validateQuickForm()) return;

        // Prepare data for upload (matching validationResults.valid structure)
        const validData = quickStudents.map((student) => ({
            enrollment_no: student.enrollment_no,
            name: student.name,
            email: student.email,
            mobile: student.mobile,
            department: student.department,
            year: student.year
        }));

        setValidationResults({ valid: validData, invalid: [], duplicates: [] });
        handleGenerateAndUpload(validData);
    };


    // --- CSV LOGIC ---

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,enrollment_no,name,email,mobile,department,year\nADT23SOCB0001,John Doe,john.doe@example.com,9876543210,Computer Science,3";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_bulk_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files[0];
        if (uploadedFile) {
            parseCSV(uploadedFile);
        }
    };

    const parseCSV = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                validateData(results.data);
                setStep(3);
            },
            error: (error) => {
                console.error("CSV Parse Error:", error);
                alert("Failed to parse CSV file.");
            }
        });
    };

    const validateData = (data) => {
        const valid = [];
        const invalid = [];
        const duplicates = [];
        const seenEmails = new Set();
        const seenEnrollments = new Set();

        data.forEach((row, index) => {
            const rowNum = index + 2;
            let reasons = [];

            if (!row.enrollment_no || !row.name || !row.email || !row.mobile || !row.department) {
                reasons.push("Missing required fields");
            }
            if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
                reasons.push("Invalid email format");
            }
            if (row.mobile && !/^\d{10}$/.test(row.mobile.toString().replace(/\D/g, ''))) {
                reasons.push("Mobile must be 10 digits");
            }
            if (seenEmails.has(row.email)) reasons.push("Duplicate email in file");
            if (seenEnrollments.has(row.enrollment_no)) reasons.push("Duplicate enrollment in file");

            seenEmails.add(row.email);
            seenEnrollments.add(row.enrollment_no);

            if (reasons.length > 0) {
                invalid.push({ ...row, rowLine: rowNum, reasons });
            } else {
                valid.push(row);
            }
        });

        setValidationResults({ valid, invalid, duplicates });
    };

    // --- SHARED UPLOAD LOGIC ---

    const handleGenerateAndUpload = async (dataOverride = null) => {
        setProcessing(true);
        setStep(4); // Switches UI to processing state

        const dataToUpload = dataOverride || validationResults.valid;

        try {
            const res = await api.post('/users/create-bulk', { users: dataToUpload });
            setUploadResults(res.data);
            setStep(5);
        } catch (error) {
            console.error("Bulk Upload Error:", error);
            alert("Failed to upload students. See console for details.");
            setStep(5); // Show errors in step 5 even if caught content
            setUploadResults({ success: 0, failed: dataToUpload.length, errors: [{ enrollment: 'ALL', error: error.message }] });
        } finally {
            setProcessing(false);
        }
    };

    const downloadCredentials = () => {
        if (!uploadResults || !uploadResults.credentials) return;

        const csvHeader = "enrollment_no,name,email,password,login_url\n";
        const csvRows = uploadResults.credentials.map(user =>
            `${user.enrollment_no},"${user.name}",${user.email},${user.password},https://portal.mitadt.edu.in/login`
        ).join("\n");

        const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `student_credentials_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyEmailTemplate = () => {
        const template = `Dear Student,\n\nYour MIT ADT Placement Portal credentials have been generated.\n\nLogin URL: https://portal.mitadt.edu.in/login\n\nPlease refer to the attached sheet for your specific credentials.\nKeep your password secure and do not share it.\n\nRegards,\nTraining & Placement Cell`;
        navigator.clipboard.writeText(template);
        alert("Email template copied to clipboard!");
    };


    return (
        <AdminLayout title="Bulk Upload">
            <PageHeader
                title="Bulk Student Upload"
                description="Upload multiple student records or use Quick Add."
            />

            {/* TABS HEADER */}
            {step !== 4 && step !== 5 && (
                <div className="flex border-b border-zinc-200 mb-8 w-full max-w-3xl mx-auto">
                    <button
                        onClick={() => setActiveTab('quick')}
                        className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'quick'
                            ? 'border-zinc-900 text-zinc-900'
                            : 'border-transparent text-zinc-500 hover:text-zinc-700'
                            }`}
                    >
                        <PenTool size={16} /> Quick Add
                    </button>
                    <button
                        onClick={() => setActiveTab('csv')}
                        className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'csv'
                            ? 'border-zinc-900 text-zinc-900'
                            : 'border-transparent text-zinc-500 hover:text-zinc-700'
                            }`}
                    >
                        <FileText size={16} /> CSV Upload
                    </button>
                </div>
            )}

            {/* CSV WIZARD PROGRESS (Only visible in CSV mode) */}
            {activeTab === 'csv' && (
                <div className="mb-8">
                    <div className="flex items-center justify-between relative max-w-3xl mx-auto">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-200 -z-10 rounded-full"></div>
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-zinc-900 -z-10 transition-all duration-500 rounded-full"
                            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                        ></div>

                        {steps.map((s) => (
                            <div key={s.num} className="flex flex-col items-center gap-2 bg-zinc-50 px-2">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                                    ${step >= s.num ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-300 text-zinc-400'}
                                `}>
                                    {step > s.num ? <CheckCircle size={16} /> : s.num}
                                </div>
                                <span className={`text-xs font-semibold ${step >= s.num ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="max-w-4xl mx-auto bg-white border border-zinc-200/60 rounded-xl shadow-card overflow-hidden min-h-[400px]">

                {/* ---------------- QUICK ADD TAB CONTENT ---------------- */}
                {activeTab === 'quick' && step !== 4 && step !== 5 && (
                    <div className="p-6">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-zinc-900">Manually Add Students</h2>
                                    <p className="text-sm text-zinc-500">Add up to 5 students at once. Credentials will be auto-generated.</p>
                                </div>
                                <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded text-zinc-600">
                                    {quickStudents.length}/5 Entries
                                </span>
                            </div>

                            <div className="space-y-4">
                                {quickStudents.map((student, index) => (
                                    <div key={student.id} className="p-5 bg-zinc-50/50 border border-zinc-200 rounded-xl relative group transition-colors hover:bg-zinc-50 hover:border-zinc-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Student #{index + 1}</span>
                                            {quickStudents.length > 1 && (
                                                <button
                                                    onClick={() => removeQuickRow(student.id)}
                                                    className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-zinc-500 mb-1 block">Enrollment No <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none uppercase placeholder:normal-case font-mono ${quickErrors[student.id]?.enrollment_no ? 'border-red-500' : 'border-zinc-200'}`}
                                                    placeholder="ADT23SOC0001"
                                                    value={student.enrollment_no}
                                                    onChange={e => handleQuickChange(student.id, 'enrollment_no', e.target.value)}
                                                />
                                                {quickErrors[student.id]?.enrollment_no && <p className="text-[10px] text-red-500 mt-1 font-medium">{quickErrors[student.id].enrollment_no}</p>}
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-zinc-500 mb-1 block">Full Name <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none ${quickErrors[student.id]?.name ? 'border-red-500' : 'border-zinc-200'}`}
                                                    placeholder=""
                                                    value={student.name}
                                                    onChange={e => handleQuickChange(student.id, 'name', e.target.value)}
                                                />
                                                {quickErrors[student.id]?.name && <p className="text-[10px] text-red-500 mt-1 font-medium">{quickErrors[student.id].name}</p>}
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-zinc-500 mb-1 block">Email Address <span className="text-red-500">*</span></label>
                                                <input
                                                    type="email"
                                                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none ${quickErrors[student.id]?.email ? 'border-red-500' : 'border-zinc-200'}`}
                                                    placeholder="Enter your email ID"
                                                    value={student.email}
                                                    onChange={e => handleQuickChange(student.id, 'email', e.target.value)}
                                                />
                                                {quickErrors[student.id]?.email && <p className="text-[10px] text-red-500 mt-1 font-medium">{quickErrors[student.id].email}</p>}
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-zinc-500 mb-1 block">Mobile (10 Digits) <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    maxLength="10"
                                                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none font-mono ${quickErrors[student.id]?.mobile ? 'border-red-500' : 'border-zinc-200'}`}
                                                    placeholder="9876543210"
                                                    value={student.mobile}
                                                    onChange={e => handleQuickChange(student.id, 'mobile', e.target.value.replace(/\D/g, ''))}
                                                />
                                                {quickErrors[student.id]?.mobile && <p className="text-[10px] text-red-500 mt-1 font-medium">{quickErrors[student.id].mobile}</p>}
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-zinc-500 mb-1 block">Department</label>
                                                <select
                                                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none appearance-none"
                                                    value={student.department}
                                                    onChange={e => handleQuickChange(student.id, 'department', e.target.value)}
                                                >
                                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-zinc-500 mb-1 block">Year</label>
                                                <select
                                                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none appearance-none"
                                                    value={student.year}
                                                    onChange={e => handleQuickChange(student.id, 'year', e.target.value)}
                                                >
                                                    {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Password Preview */}
                                        <div className="mt-3 pt-3 border-t border-zinc-200/50 flex items-center justify-between text-xs">
                                            <span className="text-zinc-400">Autogenerated Password:</span>
                                            <div className="flex items-center gap-1 font-mono text-zinc-600 bg-zinc-200/50 px-2 py-0.5 rounded">
                                                <Key size={10} />
                                                {student.passwordPreview || 'Enter details to preview'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                <button
                                    onClick={addQuickRow}
                                    disabled={quickStudents.length >= 5}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserPlus size={16} /> Add Another Student
                                </button>

                                <button
                                    onClick={handleQuickSubmit}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/10"
                                >
                                    <Key size={16} /> Create {quickStudents.length} Account{quickStudents.length > 1 ? 's' : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* ---------------- CSV TAB CONTENT (WIZARD) ---------------- */}

                {/* Step 1: Template */}
                {activeTab === 'csv' && step === 1 && (
                    <div className="p-8 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                        <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6 text-zinc-900">
                            <FileText size={32} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 mb-2">Download CSV Template</h2>
                        <p className="text-zinc-500 max-w-md mb-8">
                            Start by downloading the official CSV template. Fill it with student details following the required format.
                        </p>

                        <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 text-left w-full max-w-md mb-8">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Required Columns</h3>
                            <ul className="space-y-2 text-sm text-zinc-600">
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> enrollment_no (Unique ID)</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> name (Full Name)</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> email (Personal Email)</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> mobile (10 Digits)</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> department (e.g., CSE, IT)</li>
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-50 transition-colors shadow-sm"
                            >
                                <Download size={14} /> Download Template
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm"
                            >
                                Next Step <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Upload */}
                {activeTab === 'csv' && step === 2 && (
                    <div className="p-8 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                        <h2 className="text-xl font-bold text-zinc-900 mb-2">Upload Filled CSV</h2>
                        <p className="text-zinc-500 max-w-md mb-8">
                            Upload the filled CSV file containing student records.
                        </p>

                        <div className="w-full max-w-lg">
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-zinc-300 border-dashed rounded-2xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload size={32} className="text-zinc-400 mb-3" />
                                    <p className="mb-2 text-sm text-zinc-500"><span className="font-semibold text-zinc-900">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-zinc-400">CSV file (MAX. 5MB)</p>
                                </div>
                                <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                            </label>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="text-zinc-500 hover:text-zinc-900 font-medium text-xs px-4"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Validate */}
                {activeTab === 'csv' && step === 3 && (
                    <div className="flex flex-col h-[600px]">
                        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900">Validation Results</h3>
                                <p className="text-sm text-zinc-500">Review the data before generating credentials.</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100 flex items-center gap-1">
                                    <CheckCircle size={12} /> {validationResults.valid.length} Valid
                                </span>
                                {validationResults.invalid.length > 0 && (
                                    <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100 flex items-center gap-1">
                                        <AlertCircle size={12} /> {validationResults.invalid.length} Issues
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-zinc-50 p-6">
                            {/* Issues List */}
                            {validationResults.invalid.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
                                        <AlertCircle size={16} /> Issues Found
                                    </h4>
                                    <div className="bg-white border border-red-100 rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-red-50 text-red-700 text-xs uppercase font-semibold">
                                                <tr>
                                                    <th className="px-4 py-2">Line</th>
                                                    <th className="px-4 py-2">Identifier</th>
                                                    <th className="px-4 py-2">Issue</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-red-50">
                                                {validationResults.invalid.map((row, i) => (
                                                    <tr key={i} className="hover:bg-red-50/50">
                                                        <td className="px-4 py-2 font-mono text-zinc-500">{row.rowLine}</td>
                                                        <td className="px-4 py-2 font-medium text-zinc-900">{row.email || row.enrollment_no || 'Unknown'}</td>
                                                        <td className="px-4 py-2 text-red-600">{row.reasons.join(", ")}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-2 text-center">
                                        Rows with issues will be skipped during upload.
                                    </p>
                                </div>
                            )}

                            {/* Valid Preview */}
                            <div>
                                <h4 className="text-sm font-bold text-zinc-600 mb-3">Valid Records Preview (First 50)</h4>
                                <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase font-semibold">
                                            <tr>
                                                <th className="px-4 py-2">Enrollment</th>
                                                <th className="px-4 py-2">Name</th>
                                                <th className="px-4 py-2">Email</th>
                                                <th className="px-4 py-2">Mobile</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                            {validationResults.valid.slice(0, 50).map((row, i) => (
                                                <tr key={i} className="hover:bg-zinc-50">
                                                    <td className="px-4 py-2 font-mono text-zinc-500 text-xs">{row.enrollment_no}</td>
                                                    <td className="px-4 py-2 font-medium text-zinc-900">{row.name}</td>
                                                    <td className="px-4 py-2 text-zinc-600">{row.email}</td>
                                                    <td className="px-4 py-2 text-zinc-500 font-mono text-xs text-right">{row.mobile}</td>
                                                </tr>
                                            ))}
                                            {validationResults.valid.length === 0 && (
                                                <tr><td colSpan="4" className="p-4 text-center text-zinc-400">No valid records found in file.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {validationResults.valid.length > 50 && (
                                    <p className="text-xs text-zinc-400 mt-2 text-center">...and {validationResults.valid.length - 50} more valid records.</p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-zinc-200 bg-white flex justify-between items-center">
                            <button onClick={() => setStep(2)} className="text-zinc-500 hover:text-zinc-900 font-medium text-xs">Cancel</button>
                            <button
                                onClick={() => handleGenerateAndUpload(null)}
                                disabled={validationResults.valid.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Key size={14} /> Generate Credentials & Upload
                            </button>
                        </div>
                    </div>
                )}

                {/* ---------------- SHARED STEPS (4 & 5) ---------------- */}

                {/* Step 4: Loading/Processing */}
                {step === 4 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <RefreshCw size={32} className="animate-spin text-zinc-900" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 mb-2">Processing Data...</h2>
                        <p className="text-zinc-500">Creating accounts and generating secure credentials.</p>
                        <p className="text-xs text-zinc-400 mt-4">Please do not close this window.</p>
                    </div>
                )}

                {/* Step 5: Finished */}
                {step === 5 && (
                    <div className="p-8 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                            <CheckCircle size={32} strokeWidth={2} />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 mb-2">Upload Complete!</h2>
                        <p className="text-zinc-500 max-w-md mb-8">
                            Successfully processed the records. You can now download the credentials list.
                        </p>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-8">
                            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                                <span className="text-2xl font-bold text-zinc-900 block">{uploadResults?.success || 0}</span>
                                <span className="text-xs font-semibold text-green-600 uppercase">Created</span>
                            </div>
                            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                                <span className="text-2xl font-bold text-zinc-900 block">{uploadResults?.failed || 0}</span>
                                <span className="text-xs font-semibold text-red-600 uppercase">Failed</span>
                            </div>
                        </div>

                        {uploadResults?.errors?.length > 0 && (
                            <div className="w-full max-w-lg mb-8 text-left bg-red-50 p-4 rounded-xl border border-red-100 max-h-32 overflow-y-auto">
                                <h5 className="text-xs font-bold text-red-700 mb-1">Errors:</h5>
                                <ul className="text-xs text-red-600 space-y-1">
                                    {uploadResults.errors.map((e, i) => (
                                        <li key={i}>{e.enrollment}: {e.error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            <button
                                onClick={downloadCredentials}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm"
                            >
                                <Download size={14} /> Download Credentials CSV
                            </button>

                            <button
                                onClick={copyEmailTemplate}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-50 transition-colors shadow-sm"
                            >
                                Copy Email Template
                            </button>

                            <button
                                onClick={() => { setStep(1); setQuickStudents([{ id: 1, enrollment_no: '', name: '', email: '', mobile: '', department: 'Computer Science', year: '3', passwordPreview: '' }]); }}
                                className="text-sm text-zinc-500 hover:text-zinc-900 mt-4"
                            >
                                Add More Students
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
