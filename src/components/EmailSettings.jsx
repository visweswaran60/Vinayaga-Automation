import React, { useState } from 'react';
import { Monitor, BookOpen, Save } from 'lucide-react';

const EmailSettings = () => {
    const [smtp, setSmtp] = useState({
        host: '',
        port: '587',
        security: 'TLS (Port 587)',
        email: '',
        password: '',
    });
    const [saved, setSaved] = useState(false);

    const handle = (e) => {
        setSmtp(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setSaved(false);
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="es-wrapper">
            {/* Section header */}
            <div className="es-card">
                <div className="es-card-title">
                    <Monitor size={20} />
                    <h2>SMTP Configuration</h2>
                </div>
                <p className="es-subtitle">Configure your email server settings for sending notifications</p>
                <hr className="es-divider" />

                {/* Row 1: Host + Port */}
                <div className="es-grid">
                    <div className="es-field">
                        <label className="es-label">SMTP Host</label>
                        <input
                            className="es-input"
                            name="host"
                            value={smtp.host}
                            onChange={handle}
                            placeholder="smtp.gmail.com"
                        />
                        <span className="es-hint">Your email provider's SMTP server</span>
                    </div>
                    <div className="es-field">
                        <label className="es-label">SMTP Port</label>
                        <input
                            className="es-input"
                            name="port"
                            value={smtp.port}
                            onChange={handle}
                            placeholder="587"
                            type="number"
                        />
                        <span className="es-hint">Usually 587 for TLS or 465 for SSL</span>
                    </div>
                </div>

                {/* Row 2: Security + Email */}
                <div className="es-grid">
                    <div className="es-field">
                        <label className="es-label">Security</label>
                        <select className="es-input es-select" name="security" value={smtp.security} onChange={handle}>
                            <option>TLS (Port 587)</option>
                            <option>SSL (Port 465)</option>
                            <option>None</option>
                        </select>
                    </div>
                    <div className="es-field">
                        <label className="es-label">Email Address</label>
                        <input
                            className="es-input"
                            name="email"
                            value={smtp.email}
                            onChange={handle}
                            placeholder="your-email@gmail.com"
                            type="email"
                        />
                        <span className="es-hint">The email address to send from</span>
                    </div>
                </div>

                {/* Row 3: Password (half width) */}
                <div className="es-grid">
                    <div className="es-field">
                        <label className="es-label">Password / App Password</label>
                        <input
                            className="es-input"
                            name="password"
                            value={smtp.password}
                            onChange={handle}
                            placeholder="your-app-password"
                            type="password"
                        />
                        <span className="es-hint">
                            For Gmail, use App Password (not regular password).
                        </span>
                    </div>
                    <div /> {/* empty column */}
                </div>

                {/* Setup Instructions */}
                <div className="es-instructions">
                    <div className="es-instructions-title">
                        <BookOpen size={17} color="#16a34a" />
                        <span>Setup Instructions</span>
                    </div>
                    <p className="es-instructions-sub"><strong>Gmail Setup:</strong></p>
                    <ol className="es-instructions-list">
                        <li>Enable 2-Factor Authentication on your Google account</li>
                        <li>Go to Google Account Settings → Security → App Passwords</li>
                        <li>Generate an App Password for "Mail"</li>
                        <li>Use the generated password (not your regular password)</li>
                    </ol>
                </div>

                {/* Save button */}
                <button className={`es-save-btn ${saved ? 'es-save-btn--saved' : ''}`} onClick={handleSave}>
                    <Save size={15} />
                    {saved ? 'Settings Saved!' : 'Save SMTP Settings'}
                </button>
            </div>
        </div>
    );
};

export default EmailSettings;
