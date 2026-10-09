import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/common/Alert';
import { Mail, Lock, User, UserPlus, Phone, CheckCircle2, XCircle, Eye, EyeOff, Plane } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Register = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorList, setErrorList] = useState([]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Password rules checklist calculations
  const password = formData.password;
  const passCheck = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isPasswordValid = Object.values(passCheck).every(Boolean);
  const isConfirmMatch = password && formData.confirmPassword === password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorList([]);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Password does not meet all security requirements.');
      return;
    }

    if (!isConfirmMatch) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      if (result.success) {
        showToast('Account created! Welcome to TripPilot AI ✈️', 'success');
        navigate('/dashboard', { replace: true });
      } else {
        setErrorMessage(result.message || 'Registration failed.');
        if (result.errors) setErrorList(result.errors);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <Card className="p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-900 to-secondary-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Plane className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Create Account</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Join TripPilot AI and start planning smarter journeys</p>
        </div>

        {errorMessage && (
          <Alert variant="danger" title="Registration Error">
            <p>{errorMessage}</p>
            {errorList.length > 0 && (
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-xs">
                {errorList.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              name="firstName"
              placeholder="Dhyey"
              icon={User}
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <Input
              label="Last Name *"
              name="lastName"
              placeholder="Ghoniya"
              icon={User}
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Email Address *"
            type="email"
            name="email"
            placeholder="user@example.com"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Phone Number (Optional)"
            name="phone"
            placeholder="+91 9876543210"
            icon={Phone}
            value={formData.phone}
            onChange={handleChange}
          />

          <div className="relative">
            <Input
              label="Password *"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="••••••••"
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title={showPassword ? 'Hide Password' : 'Show Password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Requirements Checklist */}
          {formData.password && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Password Requirements:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${passCheck.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {passCheck.length ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Min 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passCheck.upper ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {passCheck.upper ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passCheck.lower ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {passCheck.lower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passCheck.number ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {passCheck.number ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passCheck.special ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {passCheck.special ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Special char (@!#$%^&*)</span>
                </div>
              </div>
            </div>
          )}

          <Input
            label="Confirm Password *"
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={
              formData.confirmPassword && !isConfirmMatch
                ? 'Passwords do not match'
                : undefined
            }
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={UserPlus}
            isLoading={isSubmitting}
            disabled={!isPasswordValid || !isConfirmMatch}
            className="w-full mt-2"
          >
            Create Account
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          Already have an account?{' '}
          <Link to="/login" className="text-secondary-600 font-bold hover:underline">
            Log In
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
