import React, { useState } from 'react';

export default function BMICalculator({ addToast }) {
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [result, setResult] = useState(null);

    const calculateBMI = (e) => {
        e.preventDefault();
        if (!weight || !height) {
            addToast('Please enter both weight and height.', 'warning');
            return;
        }

        const heightInMeters = height / 100;
        const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(1);

        let category = '';
        let color = '';
        let advice = '';

        if (bmiValue < 18.5) {
            category = 'Underweight';
            color = '#38bdf8'; // Sky blue
            advice = 'You may need to eat more frequently and choose nutrient-rich foods.';
        } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
            category = 'Normal weight';
            color = '#4ade80'; // Green
            advice = 'Maintain your current diet and physical activity levels.';
        } else if (bmiValue >= 25 && bmiValue <= 29.9) {
            category = 'Overweight';
            color = '#facc15'; // Yellow
            advice = 'You might want to consider increasing your physical activity and monitoring your diet.';
        } else {
            category = 'Obese';
            color = '#f87171'; // Red
            advice = 'It is recommended to consult with a healthcare provider for personalized advice.';
        }

        setResult({
            value: bmiValue,
            category,
            color,
            advice
        });

        addToast('BMI calculated successfully!', 'success');
    };

    const reset = () => {
        setWeight('');
        setHeight('');
        setResult(null);
    };

    return (
        <div className="bmi-container">
            <div className="page-header">
                <h1>⚖️ Body Mass Index (BMI)</h1>
                <p>Calculate your BMI to understand if you are at a healthy weight for your height.</p>
            </div>

            <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <form onSubmit={calculateBMI} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Weight (kg)</label>
                        <input
                            type="number"
                            placeholder="e.g. 70"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: '16px'
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Height (cm)</label>
                        <input
                            type="number"
                            placeholder="e.g. 175"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: '16px'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '12px' }}>
                            Calculate BMI
                        </button>
                        <button type="button" onClick={reset} className="btn btn-outline" style={{ flex: 1, padding: '12px' }}>
                            Reset
                        </button>
                    </div>
                </form>

                {result && (
                    <div style={{
                        marginTop: '30px',
                        padding: '24px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '16px',
                        border: `1px solid ${result.color}`,
                        textAlign: 'center',
                        animation: 'fadeIn 0.5s ease-out'
                    }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Your BMI is</div>
                        <div style={{ fontSize: '48px', fontWeight: 'bold', color: result.color, marginBottom: '8px' }}>
                            {result.value}
                        </div>
                        <div style={{
                            display: 'inline-block',
                            padding: '4px 16px',
                            borderRadius: '20px',
                            background: `${result.color}20`,
                            color: result.color,
                            fontWeight: '600',
                            marginBottom: '16px'
                        }}>
                            {result.category}
                        </div>

                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '16px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: 'var(--text-primary)',
                            textAlign: 'left'
                        }}>
                            <strong>💡 Health Advice:</strong><br />
                            {result.advice}
                        </div>
                    </div>
                )}
            </div>

            <div className="card" style={{ maxWidth: '500px', margin: '30px auto', fontSize: '13px', color: 'var(--text-muted)' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>What is BMI?</h4>
                <p>
                    Body Mass Index (BMI) is a simple index of weight-for-height that is commonly used to classify underweight,
                    overweight and obesity in adults. It is defined as a person's weight in kilograms divided by the
                    square of his height in meters (kg/m²).
                </p>
            </div>
        </div>
    );
}
