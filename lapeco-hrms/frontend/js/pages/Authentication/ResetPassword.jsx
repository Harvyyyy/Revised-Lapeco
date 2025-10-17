import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './Login.css';
import logo from '../../assets/logo.png';
import { authAPI } from '../../services/api';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    const emailFromLink = searchParams.get('email');

    const [formData, setFormData] = useState({
        email: emailFromLink || '',
        password: '',
        password_confirmation: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        password: false,
        confirm: false
    });
    const [status, setStatus] = useState({ type: null, message: '' });
    const [processing, setProcessing] = useState(false);

    const isLinkInvalid = !token || !emailFromLink;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLinkInvalid) {
            setStatus({ type: 'error', message: 'This password reset link is invalid or has expired.' });
            return;
        }

        if (!formData.password || !formData.password_confirmation) {
            setStatus({ type: 'error', message: 'Please enter and confirm your new password.' });
            return;
        }

        setProcessing(true);
        setStatus({ type: null, message: '' });

        try {
            const response = await authAPI.resetPassword({
                token,
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.password_confirmation
            });

            setStatus({
                type: 'success',
                message: response.data?.message || 'Password reset successfully. You can now log in with your new password.'
            });

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            const message = error.response?.data?.message || 'Unable to reset password. Please try again.';
            setStatus({ type: 'error', message });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="vh-100 d-flex flex-column justify-content-center align-items-center bg-container login-page-wrapper">
            <div className="logo-container text-center mb-4">
                <img src={logo} alt="Lapeco Logo" className="login-page-logo img-fluid" />
            </div>

            <div className="login-card bg-light bg-opacity-75 p-4 shadow-lg rounded">
                <div className="row justify-content-center">
                    <div className="col-md-12">
                        <h2 className="text-center mb-1 login-title">Reset Password</h2>
                        <p className="text-center text-muted mb-4">Enter your new password below to access your account.</p>

                        {status.message && (
                            <div className="login-error-container mb-3">
                                <div className={`alert ${status.type === 'error' ? 'alert-danger' : 'alert-success'} py-2 fade show`} role="alert">
                                    {status.message}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label login-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control login-input"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="username"
                                    readOnly={Boolean(emailFromLink)}
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="password" className="form-label login-label">New Password</label>
                                <div className="input-group">
                                    <input
                                        type={showPasswords.password ? 'text' : 'password'}
                                        className="form-control login-input"
                                        id="password"
                                        name="password"
                                        placeholder="Enter your new password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        disabled={isLinkInvalid || processing}
                                    />
                                    <span
                                        className="input-group-text login-input-group-text"
                                        onClick={() => togglePasswordVisibility('password')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className={showPasswords.password ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="password_confirmation" className="form-label login-label">Confirm New Password</label>
                                <div className="input-group">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        className="form-control login-input"
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        placeholder="Confirm your new password"
                                        value={formData.password_confirmation}
                                        onChange={handleInputChange}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        disabled={isLinkInvalid || processing}
                                    />
                                    <span
                                        className="input-group-text login-input-group-text"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className={showPasswords.confirm ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-success w-100 login-button mb-3"
                                disabled={processing || isLinkInvalid}
                            >
                                {processing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Resetting Password...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>

                            <Link to="/login" className="btn btn-outline-secondary w-100">
                                Back to Login
                            </Link>
                        </form>

                        {isLinkInvalid && (
                            <div className="alert alert-danger mt-3" role="alert">
                                This password reset link is invalid or has expired. Please request a new password reset email.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
