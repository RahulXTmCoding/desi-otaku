import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { signup, mockSignup } from "../auth/helper";
import { useDevMode } from "../context/DevModeContext";
import { useAnalytics } from "../context/AnalyticsContext";
import { API } from "../backend";
import { validateEmail, validatePassword, validateName, validateConfirmPassword } from "../utils/validation";
import GoogleLogo from "../components/GoogleLogo";

const Signup = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const { trackSubscribe } = useAnalytics();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    error: "",
    success: false,
    loading: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { name, email, password, confirmPassword, error, success, loading } = values;

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValues({ ...values, error: "", [field]: value });
    
    // Validate on change if field was touched
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, values[field as keyof typeof values] as string);
  };

  const validateField = (field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'name':
        const nameValidation = validateName(value);
        error = nameValidation.isValid ? '' : nameValidation.error!;
        break;
      case 'email':
        const emailValidation = validateEmail(value);
        error = emailValidation.isValid ? '' : emailValidation.error!;
        break;
      case 'password':
        const passwordValidation = validatePassword(value);
        error = passwordValidation.isValid ? '' : passwordValidation.error!;
        // If password changes, revalidate confirm password
        if (confirmPassword && touched.confirmPassword) {
          validateField('confirmPassword', confirmPassword);
        }
        break;
      case 'confirmPassword':
        const confirmValidation = validateConfirmPassword(password, value);
        error = confirmValidation.isValid ? '' : confirmValidation.error!;
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const nameValidation = validateName(name);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const confirmValidation = validateConfirmPassword(password, confirmPassword);
    
    const errors: Record<string, string> = {};
    if (!nameValidation.isValid) errors.name = nameValidation.error!;
    if (!emailValidation.isValid) errors.email = emailValidation.error!;
    if (!passwordValidation.isValid) errors.password = passwordValidation.error!;
    if (!confirmValidation.isValid) errors.confirmPassword = confirmValidation.error!;
    
    setFieldErrors(errors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    
    return Object.keys(errors).length === 0;
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setValues({ ...values, error: "", loading: true });

    if (isTestMode) {
      // Use mock signup
      const mockData = mockSignup(name, email, password);
      if (mockData.error) {
        setValues({ ...values, error: mockData.error, success: false, loading: false });
      } else {
        // Track subscription (signup)
        trackSubscribe('Account Registration', 0, 1500);
        
        setValues({
          ...values,
          name: "",
          email: "",
          password: "",
          error: "",
          success: true,
          loading: false,
        });
        // Redirect to signin after 2 seconds
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      }
    } else {
      // Use real backend signup
      signup({ name, email, password })
        .then((data) => {
          if (data.error) {
            setValues({ ...values, error: data.error, success: false, loading: false });
          } else {
            // Track subscription (signup)
            trackSubscribe('Account Registration', 0, 1500);
            
            setValues({
              ...values,
              name: "",
              email: "",
              password: "",
              error: "",
              success: true,
              loading: false,
            });
            // Redirect to signin after 2 seconds
            setTimeout(() => {
              navigate("/signin");
            }, 2000);
          }
        })
        .catch(() => {
          setValues({ ...values, error: "Sign up request failed", loading: false });
        });
    }
  };

  return (
    <div className="md:min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-yellow-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-purple-900/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">
            Join Our Community!
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Create your Attars Clothing account</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 md:p-4 mb-4 md:mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-400">Account created successfully!</p>
              <p className="text-green-400 text-sm">Redirecting to sign in...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 md:p-4 mb-4 md:mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Sign Up Form */}
        <div className="bg-gray-800 rounded-2xl p-4 md:p-8 shadow-xl border border-gray-700">
          <form onSubmit={onSubmit} className="space-y-4 md:space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={handleChange("name")}
                  onBlur={() => handleBlur("name")}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 text-white placeholder-gray-400 transition-all ${
                    fieldErrors.name && touched.name
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400/20'
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {fieldErrors.name && touched.name && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.name}
                </p>
              )}
            </div>

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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handleChange("password")}
                  onBlur={() => handleBlur("password")}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg focus:ring-2 text-white placeholder-gray-400 transition-all ${
                    fieldErrors.password && touched.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400/20'
                  }`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.password && touched.password && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.password}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Min 6 characters with at least one letter and number
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  onBlur={() => handleBlur("confirmPassword")}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg focus:ring-2 text-white placeholder-gray-400 transition-all ${
                    fieldErrors.confirmPassword && touched.confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400/20'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && touched.confirmPassword && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-1 bg-gray-700 border-gray-600 rounded text-yellow-400 focus:ring-yellow-400"
              />
              <label className="ml-2 text-sm text-gray-300">
                I agree to the{' '}
                <Link to="/terms" className="text-yellow-400 hover:text-yellow-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-yellow-400 hover:text-yellow-300">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 text-gray-900 py-3 rounded-lg font-bold transition-all transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Account Created!
                </>
              ) : (
                'Sign Up'
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

          {/* Social Sign Up */}
          <div className="grid gap-4">
            <button
              onClick={() => window.location.href = `${API}/auth/google`}
              className="bg-white hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 border border-gray-300 shadow-sm"
            >
              <GoogleLogo size={20} />
              Sign up with Google
            </button>
          </div>

          {/* Sign In Link */}
          <p className="text-center mt-6 text-gray-400">
            Already have an account?{' '}
            <Link to="/signin" className="text-yellow-400 hover:text-yellow-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
