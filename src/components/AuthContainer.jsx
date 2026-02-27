import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, User, ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react';

const AuthContainer = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');

    const toggleAuth = () => setIsLogin(!isLogin);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would normally handle the API call
        if (!isLogin) {
            // If we are on the sign-up page, switch to login after "creation"
            setIsLogin(true);
        } else {
            // If we are on the login page, call the onLogin handler with the email
            onLogin(email);
        }
    };

    const containerVariants = {
        initial: { opacity: 0, scale: 0.9, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
        exit: { opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.3 } }
    };

    const formVariants = {
        hidden: { opacity: 0, x: isLogin ? -50 : 50 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4, delay: 0.2 } },
        exit: { opacity: 0, x: isLogin ? 50 : -50, transition: { duration: 0.3 } }
    };

    return (
        <div className="auth-wrapper">
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>

            <motion.div
                className="auth-container glass-morphism"
                variants={containerVariants}
                initial="initial"
                animate="animate"
            >
                <div className="logo-container">
                    <motion.div
                        className="dental-logo"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                    >
                        <Stethoscope size={32} />
                    </motion.div>
                </div>

                <div className="auth-header">
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={isLogin ? "login-title" : "signup-title"}
                    >
                        VINAYAGA AUTOMATION
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={isLogin ? "login-subtitle" : "signup-subtitle"}
                    >
                        {isLogin ? "Dental DICOM Scan Center Login" : "Create your dental professional account"}
                    </motion.p>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={isLogin ? "login" : "signup"}
                        variants={formVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <form onSubmit={handleSubmit}>
                            {!isLogin && (
                                <div className="input-group">
                                    <label>Full Name</label>
                                    <div className="input-wrapper">
                                        <User className="icon" size={18} />
                                        <input type="text" placeholder="Dr. John Doe" required />
                                    </div>
                                </div>
                            )}

                            <div className="input-group">
                                <label>Email Address</label>
                                <div className="input-wrapper">
                                    <Mail className="icon" size={18} />
                                    <input
                                        type="email"
                                        placeholder="doctor@vinayaga.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Password</label>
                                <div className="input-wrapper">
                                    <Lock className="icon" size={18} />
                                    <input type="password" placeholder="••••••••" required />
                                </div>
                            </div>

                            {isLogin && (
                                <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                                    <button type="button" className="text-btn" style={{ fontSize: '0.85rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        Forgot Password?
                                    </button>
                                </div>
                            )}

                            <button type="submit" className="btn-primary">
                                {isLogin ? (
                                    <>
                                        Sign In <LogIn size={18} />
                                    </>
                                ) : (
                                    <>
                                        Create Account <UserPlus size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                {isLogin ? "Don't have an account?" : "Already have an account?"}
                                <button onClick={toggleAuth}>
                                    {isLogin ? "Join Now" : "Sign In"}
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default AuthContainer;
