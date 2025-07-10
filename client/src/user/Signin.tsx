import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { signin, authenticate, isAutheticated, mockSignin } from "../auth/helper";
import { useDevMode } from "../context/DevModeContext";
import { useCart } from "../context/CartContext";
import { API } from "../backend";

const Signin = () => {
  const { isTestMode } = useDevMode();
  const { syncCart } = useCart();
  const [values, setValues] = useState({
    email: "",
    password: "",
    error: "",
    loading: false,
    didRedirect: false,
  });

  const { email, password, error, loading, didRedirect } = values;
  const auth = isAutheticated();

  const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, error: "", [name]: event.target.value });
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setValues({ ...values, error: "", loading: true });

    if (isTestMode) {
      // Use mock authentication
      const mockData = mockSignin(email, password);
      if (mockData.error) {
        setValues({ ...values, error: mockData.error, loading: false });
      } else {
        authenticate(mockData, async () => {
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
        return <Navigate to="/user/dashboard" />;
      }
    }
    if (isAutheticated()) {
      return <Navigate to="/" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      {performRedirect()}
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-400">Sign in to your anime t-shirt account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Sign In Form */}
        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-700">
          <form onSubmit={onSubmit} className="space-y-6">
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
                  placeholder="Enter your password"
                  required
                />
              </div>
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
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => window.location.href = `${API}/auth/google`}
              className="bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <div className="text-xl">🔷</div>
              Google
            </button>
            <button
              onClick={() => window.location.href = `${API}/auth/facebook`}
              className="bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <div className="text-xl">📘</div>
              Facebook
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

        {/* Test Credentials */}
        <div className="mt-4 text-center text-xs text-gray-500">
          {isTestMode ? (
            <div>
              <p className="mb-1">Test Mode Credentials:</p>
              <p>Admin: admin@example.com / admin123</p>
              <p>User: any@email.com / password123</p>
            </div>
          ) : (
            <p>Backend Mode: Use real credentials</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signin;
