import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { signin, authenticate, isAutheticated, mockSignin } from "../auth/helper";
import { useDevMode } from "../context/DevModeContext";
import { useCart } from "../context/CartContext";
import { useAnalytics } from "../context/AnalyticsContext";
import { API } from "../backend";
import { validateEmail, validatePassword } from "../utils/validation";
import GoogleLogo from "../components/GoogleLogo";

const Signin = () => {
  const { isTestMode } = useDevMode();
  const { syncCart } = useCart();
  const { trackLogin } = useAnalytics();
  const [values, setValues] = useState({
    email: "",
    password: "",
    error: "",
    loading: false,
    didRedirect: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { email, password, error, loading, didRedirect } = values;
  const auth = isAutheticated();

  const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValues({ ...values, error: "", [name]: value });
    
    // Validate on change if field was touched
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, values[name as keyof typeof values] as string);
  };

  const validateField = (field: string, value: string) => {
    let error = '';
    
    if (field === 'email') {
      const validation = validateEmail(value);
      error = validation.isValid ? '' : validation.error!;
    } else if (field === 'password') {
      const validation = validatePassword(value);
      error = validation.isValid ? '' : validation.error!;
    }
    
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    const errors: Record<string, string> = {};
    if (!emailValidation.isValid) errors.email = emailValidation.error!;
    if (!passwordValidation.isValid) errors.password = passwordValidation.error!;
    
    setFieldErrors(errors);
    setTouched({ email: true, password: true });
    
    return Object.keys(errors).length === 0;
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setValues({ ...values, error: "", loading: true });

    if (isTestMode) {
      // Use mock authentication
      const mockData = mockSignin(email, password);
      if (mockData.error) {
        setValues({ ...values, error: mockData.error, loading: false });
      } else {
        authenticate(mockData, async () => {
          // Track login for analytics
          trackLogin('email');
          
          // Sync cart after successful authentication
          await syncCart();
          setValues({
            ...values,
            didRedirect: true,
          });
        });
      }
    } else {
      // Use real backend authentication
      signin({ email, password })
        .then((data) => {
          if (data.error) {
            setValues({ ...values, error: data.error, loading: false });
          } else {
            authenticate(data, async () => {
              // Track login for analytics
              trackLogin('email');
              
              // Sync cart after successful authentication
              await syncCart();
              setValues({
                ...values,
                didRedirect: true,
              });
            });
          }
        })
        .catch(() => {
          setValues({ ...values, error: "Sign in request failed", loading: false });
        });
    }
  };

  const performRedirect = () => {
    if (didRedirect) {
      if (auth && auth.user && auth.user.role === 1) {
        return <Navigate to="/admin/dashboard" />;
      } else {
        return <Navigate to="/" />; // Redirect regular users to home page
      }
    }
    if (isAutheticated()) {
      return <Navigate to="/" />;
    }
  };

  return (
    <div className="md:min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {performRedirect()}
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-yellow-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Sign in to your Attars Clothing account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 md:p-4 mb-4 md:mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Sign In Form */}
        <div className="bg-gray-800 rounded-2xl p-4 md:p-8 shadow-xl border border-gray-700">
          <form onSubmit={onSubmit} className="space-y-4 md:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={handleChange("email")}
                  onBlur={() => handleBlur("email")}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 text-white placeholder-gray-400 transition-all ${
                    fieldErrors.email && touched.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400/20'
                  }`}
                  placeholder="your@email.com"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="off"
                />
              </div>
              {fieldErrors.email && touched.email && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={handleChange("password")}
                  onBlur={() => handleBlur("password")}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 text-white placeholder-gray-400 transition-all ${
                    fieldErrors.password && touched.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400/20'
                  }`}
                  placeholder="Enter your password"
                />
              </div>
              {fieldErrors.password && touched.password && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.password}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Min 6 characters with at least one letter and number
              </p>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-yellow-400 focus:ring-yellow-400"
                />
                <span className="ml-2 text-sm text-gray-300">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-yellow-400 hover:text-yellow-300">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 text-gray-900 py-3 rounded-lg font-bold transition-all transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="w-full">
            <button
              onClick={() => window.location.href = `${API}/auth/google`}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 border border-gray-300 shadow-sm"
            >
              <GoogleLogo size={20} />
              Continue with Google
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-yellow-400 hover:text-yellow-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signin;
