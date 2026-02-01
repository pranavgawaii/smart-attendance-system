import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Step1BasicDetails from './wizard/Step1BasicDetails';
import Step2AddStudents from './wizard/Step2AddStudents';
import Step3SeatingMode from './wizard/Step3SeatingMode';
import Step4SelectLabs from './wizard/Step4SelectLabs';
import Step5Review from './wizard/Step5Review';
import { ArrowLeft } from 'lucide-react';

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

    const getStepTitle = () => {
        switch (currentStep) {
            case 1: return 'Basic Details';
            case 2: return 'Add Students';
            case 3: return 'Seating Mode';
            case 4: return 'Select Labs';
            case 5: return 'Review & Allocate';
            default: return '';
        }
    };

    return (
        <AdminLayout title="Create Allocation">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => navigate('/admin/allocations')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={18} strokeWidth={1.5} /> Back to Allocations
                </button>

                {/* Progress Indicator */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-900">Create New Allocation</h2>
                        <span className="text-sm text-slate-500">Step {currentStep} of 5</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(step => (
                            <div key={step} className="flex-1 flex items-center gap-2">
                                <div className={`flex-1 h-2 rounded-full transition-all ${step <= currentStep ? 'bg-zinc-900' : 'bg-slate-200'
                                    }`} />
                            </div>
                        ))}
                    </div>

                    <p className="text-sm text-slate-600 mt-3">{getStepTitle()}</p>
                </div>

                {/* Step Content */}
                {renderStep()}
            </div>
        </AdminLayout>
    );
}
