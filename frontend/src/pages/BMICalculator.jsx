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
            color = 'var(--accent-blue)';
            advice = 'You are below the recommended clinical range. Consider increasing caloric intake with protein & complex carbs.';
        } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
            category = 'Optimal Health Weight';
            color = 'var(--accent-green)';
            advice = 'Your weight is within the ideal medical category. Maintain your physical activity and nutrient balance.';
        } else if (bmiValue >= 25 && bmiValue <= 29.9) {
            category = 'Overweight';
            color = 'var(--accent-yellow)';
            advice = 'Slightly above optimal weight. Regular cardiovascular exercise and metabolic diet monitoring recommended.';
        } else {
            category = 'Obese (High Risk)';
            color = 'var(--accent-red)';
            advice = 'Consult our hospital metabolic team for a clinical weight management and cardiovascular wellness plan.';
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
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>⚖️ Hospital BMI & Body Composition Meter</h1>
                <p>Calculate your Body Mass Index (BMI) and evaluate your body weight classification.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
                <div className="card">
                    <div className="card-title">📐 Patient Measurements</div>
                    <form onSubmit={calculateBMI} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div className="input-group">
                            <label className="input-label">Body Weight (kg)</label>
                            <input
                                type="number"
                                className="input-field"
                                placeholder="e.g. 70"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Height (cm)</label>
                            <input
                                type="number"
                                className="input-field"
                                placeholder="e.g. 175"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                                Calculate BMI Index
                            </button>
                            <button type="button" onClick={reset} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                                Reset
                            </button>
                        </div>
                    </form>

                    <div style={{ marginTop: '24px', padding: '14px', background: 'var(--bg-input)', borderRadius: '12px', fontSize: '12.5px', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        ℹ️ Standard WHO Formula: <code style={{ color: 'var(--accent-cyan)' }}>Weight (kg) / Height (m)²</code>
                    </div>
                </div>

                <div>
                    {result ? (
                        <div className="card animate-fade-in" style={{ border: `1px solid ${result.color}`, textAlign: 'center' }}>
                            <div className="card-title" style={{ justifyContent: 'center', color: 'var(--text-secondary)' }}>Calculated BMI Score</div>
                            <div style={{ fontSize: '56px', fontWeight: '800', color: result.color, margin: '10px 0' }}>
                                {result.value}
                            </div>
                            <div style={{
                                display: 'inline-block',
                                padding: '6px 20px',
                                borderRadius: '20px',
                                background: `${result.color}20`,
                                color: result.color,
                                fontWeight: '800',
                                fontSize: '14px',
                                marginBottom: '20px',
                                border: `1px solid ${result.color}40`
                            }}>
                                {result.category}
                            </div>

                            <div style={{
                                background: 'var(--bg-input)',
                                padding: '18px',
                                borderRadius: '12px',
                                fontSize: '13.5px',
                                lineHeight: '1.6',
                                color: 'var(--text-primary)',
                                textAlign: 'left',
                                border: '1px solid var(--border)'
                            }}>
                                <strong style={{ color: result.color }}>💡 Clinical Advice:</strong><br />
                                {result.advice}
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                            <div style={{ fontSize: '50px', marginBottom: '14px' }}>📊</div>
                            <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>Enter Height & Weight</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                Your BMI score and personalized clinical health category will be calculated instantly.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
