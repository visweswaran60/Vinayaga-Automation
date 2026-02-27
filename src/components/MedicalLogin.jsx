import React, { useState } from 'react';
import { Stethoscope, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import './MedicalLogin.css';

const MedicalLogin = ({ onLogin, onNavigateRegister, loginError, loginLoading }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email && password && !loginLoading) {
            onLogin(email, password);
        }
    };

    return (
        <div className="medical-login-wrapper">
            <div className="medical-login-card">
                <div className="medical-login-icon-wrapper">
                    <Stethoscope size={32} />
                </div>

                <h1 className="medical-login-brand">Vinayaga Automation</h1>
                <p className="medical-login-subtitle">Secure Access Portal</p>

                {loginError && (
                    <div style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        boxSizing: 'border-box',
                        border: '1px solid #fecaca'
                    }}>
                        ❌ {loginError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="medical-login-form">
                    <div className="medical-login-input-group">
                        <Mail className="medical-login-input-icon" size={20} />
                        <input
                            type="email"
                            className="medical-login-input"
                            placeholder="Branch Email ID"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loginLoading}
                        />
                    </div>

                    <div className="medical-login-input-group">
                        <Lock className="medical-login-input-icon" size={20} />
                        <input
                            type="password"
                            className="medical-login-input"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loginLoading}
                        />
                    </div>

                    <div className="medical-login-forgot">
                        <a href="#forgot">Forgot Password?</a>
                    </div>

                    <button type="submit" className="medical-login-button" disabled={loginLoading} style={{ opacity: loginLoading ? 0.7 : 1, cursor: loginLoading ? 'not-allowed' : 'pointer' }}>
                        {loginLoading ? (
                            <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</>
                        ) : (
                            <>Login <ArrowRight size={18} /></>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onNavigateRegister}
                        className="medical-login-button"
                        disabled={loginLoading}
                        style={{ marginTop: '0.75rem', background: 'transparent', color: 'var(--primary)', border: '1.5px solid var(--primary)', boxShadow: 'none' }}
                    >
                        Create Account
                    </button>
                </form>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default MedicalLogin;
