import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Card } from '../components/ui';
import { toast } from 'react-toastify';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuthStore();

  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await signup({
        full_name: formData.full_name,
        email: signupMethod === 'email' ? formData.email : undefined,
        phone_number: signupMethod === 'phone' ? formData.phone_number : undefined,
        password: formData.password,
      });

      toast.success('Account created! Welcome to Sum Decor AI 🎉');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-navy via-primary-navy-dark to-secondary-luxury-purple flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-montserrat font-bold text-gradient mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">Get 5 free credits to start designing!</p>
        </div>

        {/* Signup Method Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              signupMethod === 'email'
                ? 'bg-primary-navy text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setSignupMethod('email')}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Email
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              signupMethod === 'phone'
                ? 'bg-primary-navy text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setSignupMethod('phone')}
          >
            <Phone className="w-4 h-4 inline mr-2" />
            Phone
          </button>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            label="Full Name"
            placeholder="John Doe"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />

          {signupMethod === 'email' ? (
            <Input
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          ) : (
            <Input
              type="tel"
              label="Phone Number"
              placeholder="+234 XXX XXX XXXX"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />
          )}

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-10 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 border-t border-gray-300" />
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        {/* Login Link */}
        <p className="text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-navy font-semibold hover:underline">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Signup;
