import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/common/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/common/Alert';
import { Mail, Lock, LogIn, Plane, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getPendingTripSession } from '../../utils/pendingTripStorage';
import { BrandMark } from '../../components/common/BrandLogo';

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        showToast(`Welcome back, ${result.user.firstName}.`, 'success');
        
        const pending = getPendingTripSession();
        if (pending) {
          if (pending.chatLog?.length > 0 || pending.lastPrompt) {
            showToast('Returning to your trip planner.', 'success');
            navigate('/plan-trip', { replace: true });
          } else {
            navigate(from, { replace: true });
          }
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setErrorMessage(result.message || 'Invalid email or password.');
      }
    } catch (err) {
      setErrorMessage('An error occurred while logging in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <BrandMark size={48} />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Sign in</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Access saved trips, wishlist, and the planner workspace</p>
        </div>

        {errorMessage && (
          <Alert variant="danger" title="Authentication Error">
            {errorMessage}
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            placeholder="user@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={LogIn}
            isLoading={isSubmitting}
            className="w-full mt-2"
          >
            Sign In
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          Don't have an account?{' '}
          <Link to="/register" className="text-secondary-600 font-bold hover:underline">
            Create an account
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
