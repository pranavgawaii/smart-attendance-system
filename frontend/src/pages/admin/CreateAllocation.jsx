import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Step1BasicDetails from './wizard/Step1BasicDetails';
import Step2AddStudents from './wizard/Step2AddStudents';
import Step3SeatingMode from './wizard/Step3SeatingMode';
import Step4SelectLabs from './wizard/Step4SelectLabs';
import Step5Review from './wizard/Step5Review';
import { ArrowLeft, Check } from 'lucide-react';

export default function CreateAllocation() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1
        company_name: '',
        position: '',
        assessment_date: '',
        start_time: '',
        end_time: '',
        description: '',
        // Step 2
        students: [],
        validStudents: [],
        csvErrors: [],
        // Step 3
        seating_mode: 'normal',
        // Step 4
        selected_labs: [],
        // Step 5
        allocation_summary: null
    });

    const updateFormData = (data) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1BasicDetails formData={formData} updateFormData={updateFormData} nextStep={nextStep} />;
            case 2:
                return <Step2AddStudents formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 3:
                return <Step3SeatingMode formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 4:
                return <Step4SelectLabs formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 5:
                return <Step5Review formData={formData} prevStep={prevStep} navigate={navigate} />;
            default:
                return null;
        }
    };

    const steps = [
        { id: 1, label: 'Basic Details' },
        { id: 2, label: 'Add Students' },
        { id: 3, label: 'Seating Mode' },
        { id: 4, label: 'Select Labs' },
        { id: 5, label: 'Review' }
    ];

    return (
        <AdminLayout title="Create Allocation">
            <div className="max-w-5xl mx-auto pb-20">
                {/* Header Navigation */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/allocations')}
                        className="group flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Allocations
                    </button>
                    <h1 className="mt-4 text-3xl font-bold text-zinc-900 tracking-tight">Create New Allocation</h1>
                    <p className="text-zinc-500 mt-1">Configure assessment details, students, and seating arrangements.</p>
                </div>

                {/* Premium Stepper */}
                <div className="mb-8 overflow-x-auto px-8 pb-8">
                    <div className="flex items-center justify-between min-w-[600px]">
                        {steps.map((step, index) => {
                            const isCompleted = currentStep > step.id;
                            const isActive = currentStep === step.id;

                            return (
                                <div key={step.id} className="flex-1 flex items-center">
                                    <div className="flex flex-col items-center relative z-10">
                                        <div
                                            className={`
                                                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                                ${isActive
                                                    ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg scale-110'
                                                    : isCompleted
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : 'bg-white border-zinc-200 text-zinc-400'
                                                }
                                            `}
                                        >
                                            {isCompleted ? <Check size={20} strokeWidth={2.5} /> : <span className="font-bold text-sm">{step.id}</span>}
                                        </div>
                                        <span
                                            className={`
                                                absolute top-12 whitespace-nowrap text-xs font-semibold tracking-wide transition-colors duration-300
                                                ${isActive ? 'text-zinc-900' : isCompleted ? 'text-zinc-700' : 'text-zinc-400'}
                                            `}
                                        >
                                            {step.label}
                                        </span>
                                    </div>

                                    {/* Connector Line */}
                                    {index < steps.length - 1 && (
                                        <div className="flex-1 h-[2px] mx-4 bg-zinc-100 relative -top-3">
                                            <div
                                                className="h-full bg-zinc-900 transition-all duration-500 ease-out"
                                                style={{ width: isCompleted ? '100%' : '0%' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content Container */}
                <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm min-h-[400px]">
                    {renderStep()}
                </div>
            </div>
        </AdminLayout>
    );
}
