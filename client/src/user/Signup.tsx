import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { signup, mockSignup } from "../auth/helper";
import { useDevMode } from "../context/DevModeContext";

const Signup = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    error: "",
    success: false,
    loading: false,
  });

  const { name, email, password, error, success, loading } = values;

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, error: "", [field]: event.target.value });
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setValues({ ...values, error: "", loading: true });

    if (isTestMode) {
      // Use mock signup
      const mockData = mockSignup(name, email, password);
      if (mockData.error) {
        setValues({ ...values, error: mockData.error, success: false, loading: false });
      } else {
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Join Our Community!
          </h1>
          <p className="text-gray-400">Create your anime t-shirt account</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-400">Account created successfully!</p>
              <p className="text-green-400 text-sm">Redirecting to sign in...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Sign Up Form */}
        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-700">
          <form onSubmit={onSubmit} className="space-y-6">
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                  placeholder="Create a strong password"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Password must be at least 6 characters long
              </p>
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
              <span className="px-2 bg-gray-800 text-gray-400">Or sign up with</span>
            </div>
          </div>

          {/* Social Sign Up */}
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              <div className="text-xl">🔷</div>
              Google
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              <div className="text-xl">📘</div>
              Facebook
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

        {/* Mode Info */}
        <div className="mt-4 text-center text-xs text-gray-500">
          {isTestMode ? (
            <p>Test Mode: Sign up will work without backend</p>
          ) : (
            <p>Backend Mode: Requires server running</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
