import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Key, ArrowRight, RefreshCw, X } from 'lucide-react';
import Papa from 'papaparse';
import api from '../../services/api';

export default function BulkStudentUpload() {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [validationResults, setValidationResults] = useState({ valid: [], invalid: [], duplicates: [] });
    const [processing, setProcessing] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);

    const steps = [
        { num: 1, label: 'Template' },
        { num: 2, label: 'Upload' },
        { num: 3, label: 'Validate' },
        { num: 4, label: 'Generate' },
        { num: 5, label: 'Finish' }
    ];

    // Step 1: Download Template
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

    // Step 2: Handle File Upload
    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            parseCSV(uploadedFile);
        }
    };

    const parseCSV = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setParsedData(results.data);
                validateData(results.data);
                setStep(3);
            },
            error: (error) => {
                console.error("CSV Parse Error:", error);
                alert("Failed to parse CSV file.");
            }
        });
    };

    // Step 3: Validate Data (Mock implementation for now)
    const validateData = (data) => {
        const valid = [];
        const invalid = [];
        const duplicates = [];
        const seenEmails = new Set();
        const seenEnrollments = new Set();

        data.forEach((row, index) => {
            const rowNum = index + 2; // 1-based + header
            let reasons = [];

            // Basic checks
            if (!row.enrollment_no || !row.name || !row.email || !row.mobile || !row.department) {
                reasons.push("Missing required fields");
            }

            // Email format
            if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
                reasons.push("Invalid email format");
            }

            // Mobile format (simple 10 digit check)
            if (row.mobile && !/^\d{10}$/.test(row.mobile.toString().replace(/\D/g, ''))) {
                reasons.push("Mobile must be 10 digits");
            }

            // Duplicates within file
            if (seenEmails.has(row.email)) {
                reasons.push("Duplicate email in file");
            }
            if (seenEnrollments.has(row.enrollment_no)) {
                reasons.push("Duplicate enrollment in file");
            }

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

    // Step 4: Generate Credentials & Upload
    const handleGenerateAndUpload = async () => {
        setProcessing(true);
        setStep(4);

        try {
            // Simulate API logic for now with the structure we plan to implement
            // In reality, this will call api.post('/users/create-bulk', { users: validationResults.valid })

            // Temporary Fake API Call
            const res = await api.post('/users/create-bulk', { users: validationResults.valid });
            setUploadResults(res.data);

            // Mock Success
            // setTimeout(() => {
            //    setUploadResults({
            //        success: validationResults.valid.length,
            //        failed: 0,
            //        errors: [],
            //        credentials: validationResults.valid.map(u => ({ ...u, password: 'generated-pass' })) // Backend should return this
            //    });
            //    setStep(5);
            //    setProcessing(false);
            // }, 2000);

            setStep(5);
        } catch (error) {
            console.error("Bulk Upload Error:", error);
            alert("Failed to upload students. See console for details.");
            // Proceed to step 5 even on partial failure to show results if backend handles it?
            // For now stay on step 4 or show error
        } finally {
            setProcessing(false);
        }
    };

    // Step 5: Export Credentials
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
        const template = `Dear Student,

Your MIT ADT Placement Portal credentials have been generated.

Login URL: https://portal.mitadt.edu.in/login

Please refer to the attached sheet for your specific credentials.
Keep your password secure and do not share it.

Regards,
Training & Placement Cell`;

        navigator.clipboard.writeText(template);
        alert("Email template copied to clipboard!");
    };


    return (
        <AdminLayout title="Bulk Upload">
            <PageHeader
                title="Bulk Student Upload"
                description="Upload multiple student records at once and auto-generate credentials."
            />

            {/* Wizard Progress */}
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
                                ${step >= s.num
                                    ? 'bg-zinc-900 border-zinc-900 text-white'
                                    : 'bg-white border-zinc-300 text-zinc-400'}
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

            {/* Step Content */}
            <div className="max-w-3xl mx-auto bg-white border border-zinc-200/60 rounded-xl shadow-card overflow-hidden min-h-[400px]">

                {/* Step 1: Template */}
                {step === 1 && (
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
                {step === 2 && (
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
                {step === 3 && (
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
                                onClick={handleGenerateAndUpload}
                                disabled={validationResults.valid.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Key size={14} /> Generate Credentials & Upload
                            </button>
                        </div>
                    </div>
                )}

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
                            Successfully processed the uploaded file. You can now download the credentials list.
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

                            <Link to="/admin/users" className="text-sm text-zinc-500 hover:text-zinc-900 mt-4">
                                Return to Student List
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
