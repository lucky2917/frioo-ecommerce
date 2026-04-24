import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function BioScanForm({ formData, updateForm, toggleAllergy, runAnalysis, loading }) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: 'Basic Profile',
            fields: ['age', 'weight', 'height', 'gender']
        },
        {
            title: 'Activity & Goals',
            fields: ['activityLevel', 'goal']
        },
        {
            title: 'Dietary Preferences',
            fields: ['dietType', 'allergies']
        }
    ];

    const canProceed = () => {
        const currentFields = steps[currentStep].fields;
        return currentFields.every(field => {
            if (field === 'allergies') return true; // Optional
            return formData[field] && formData[field] !== '';
        });
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            runAnalysis();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    return (
        <div className="bioscan-form">
            <div className="form-progress">
                <div className="progress-steps">
                    {steps.map((step, idx) => (
                        <div
                            key={idx}
                            className={`progress-step ${idx <= currentStep ? 'active' : ''}`}
                        >
                            <div className="step-circle">{idx + 1}</div>
                            <div className="step-label">{step.title}</div>
                        </div>
                    ))}
                </div>
                <div className="progress-bar">
                    <motion.div
                        className="progress-fill"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    className="form-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <h3 className="step-title">{steps[currentStep].title}</h3>

                    {currentStep === 0 && (
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Age</label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => updateForm('age', e.target.value)}
                                    placeholder="25"
                                />
                            </div>
                            <div className="form-field">
                                <label>Weight (kg)</label>
                                <input
                                    type="number"
                                    value={formData.weight}
                                    onChange={(e) => updateForm('weight', e.target.value)}
                                    placeholder="70"
                                />
                            </div>
                            <div className="form-field">
                                <label>Height (cm)</label>
                                <input
                                    type="number"
                                    value={formData.height}
                                    onChange={(e) => updateForm('height', e.target.value)}
                                    placeholder="175"
                                />
                            </div>
                            <div className="form-field">
                                <label>Gender</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => updateForm('gender', e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="form-grid">
                            <div className="form-field full-width">
                                <label>Activity Level</label>
                                <select
                                    value={formData.activityLevel}
                                    onChange={(e) => updateForm('activityLevel', e.target.value)}
                                >
                                    <option value="">Select activity level</option>
                                    <option value="sedentary">Sedentary (little to no exercise)</option>
                                    <option value="light">Light (1-3 days/week)</option>
                                    <option value="moderate">Moderate (3-5 days/week)</option>
                                    <option value="active">Active (6-7 days/week)</option>
                                    <option value="very-active">Very Active (athlete)</option>
                                </select>
                            </div>
                            <div className="form-field full-width">
                                <label>Primary Goal</label>
                                <select
                                    value={formData.goal}
                                    onChange={(e) => updateForm('goal', e.target.value)}
                                >
                                    <option value="">Select your goal</option>
                                    <option value="weight-loss">Weight Loss</option>
                                    <option value="muscle-gain">Muscle Gain</option>
                                    <option value="maintenance">Maintain Weight</option>
                                    <option value="energy">Increase Energy</option>
                                    <option value="health">General Health</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="form-grid">
                            <div className="form-field full-width">
                                <label>Diet Type</label>
                                <select
                                    value={formData.dietType}
                                    onChange={(e) => updateForm('dietType', e.target.value)}
                                >
                                    <option value="">Select diet type</option>
                                    <option value="omnivore">Omnivore</option>
                                    <option value="vegetarian">Vegetarian</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="keto">Keto</option>
                                    <option value="paleo">Paleo</option>
                                </select>
                            </div>
                            <div className="form-field full-width">
                                <label>Allergies (Optional)</label>
                                <div className="allergy-chips">
                                    {['nuts', 'dairy', 'gluten', 'soy', 'shellfish'].map((allergen) => (
                                        <button
                                            key={allergen}
                                            type="button"
                                            className={`allergy-chip ${formData.allergies?.includes(allergen) ? 'active' : ''}`}
                                            onClick={() => toggleAllergy(allergen)}
                                        >
                                            {allergen}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <div className="form-actions">
                {currentStep > 0 && (
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handlePrev}
                    >
                        ← Previous
                    </button>
                )}
                <button
                    type="button"
                    className="btn-primary"
                    onClick={handleNext}
                    disabled={!canProceed() || loading}
                >
                    {loading ? 'Processing...' : currentStep === steps.length - 1 ? 'Analyze' : 'Next →'}
                </button>
            </div>
        </div>
    );
}

export default BioScanForm;
