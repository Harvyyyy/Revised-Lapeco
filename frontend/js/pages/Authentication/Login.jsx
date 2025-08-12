import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'HR_PERSONNEL',
        remember: false,
    });
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const availableRoles = [
        { value: 'HR_PERSONNEL', label: 'HR Personnel / Manager' },
        { value: 'TEAM_LEADER', label: 'Team Leader' },
        { value: 'REGULAR_EMPLOYEE', label: 'Regular Employee' },
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setStatus('');

        try {
            const response = await authAPI.login(formData);
            const { token, user } = response.data;
            
            // Store token and user data
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Redirect to dashboard
            navigate('/dashboard');
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                setStatus(error.response.data.message);
            } else {
                setStatus('An error occurred during login. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="vh-100 d-flex flex-column justify-content-center align-items-center bg-container login-page-wrapper">
            <div className="logo-container text-center mb-4">
                <img src="/logo.png" alt="Lapeco Logo" className="login-page-logo img-fluid" />
            </div>

            <div className="login-card bg-light bg-opacity-75 p-4 shadow-lg rounded">
                <div className="row justify-content-center">
                    <div className="col-md-12">
                        <h2 className="text-center mb-1 login-title">Login</h2>

                        {(status || errors.email || errors.password) && (
                            <div className="login-error-container mb-3">
                                <div
                                    className={`alert ${errors.email || errors.password
                                        ? 'alert-danger'
                                        : 'alert-success'
                                        } py-2 fade show`}
                                    role="alert"
                                >
                                    {errors.email || errors.password || status}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label login-label">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="form-control login-input"
                                    id="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="password" className="form-label login-label">
                                    Password
                                </label>
                                <div className="input-group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control login-input"
                                        id="password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <span
                                        className="input-group-text login-input-group-text"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                                    </span>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="role" className="form-label login-label">
                                    Login as:
                                </label>
                                <select
                                    className="form-select login-select"
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => handleInputChange('role', e.target.value)}
                                    required
                                >
                                    {availableRoles.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3 form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="remember"
                                    checked={formData.remember}
                                    onChange={(e) => handleInputChange('remember', e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="remember">
                                    Remember me
                                </label>
                            </div>

                            <div className="d-grid">
                                <button
                                    type="submit"
                                    className="btn btn-primary login-button"
                                    disabled={processing}
                                >
                                    {processing ? 'Logging in...' : 'Log in'}
                                </button>
                            </div>

                            <div className="text-center mt-3">
                                <Link to="/forgot-password" className="text-decoration-none">
                                    Forgot your password?
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
