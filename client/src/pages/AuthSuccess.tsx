import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        const token = searchParams.get('token');
        const expiryTimeParam = searchParams.get('expiryTime');
        const userParam = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          setTimeout(() => navigate('/signin'), 3000);
          return;
        }

        if (!token || !userParam) {
          setStatus('error');
          setMessage('Missing authentication data');
          setTimeout(() => navigate('/signin'), 3000);
          return;
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store authentication data in the format expected by isAutheticated()
        const authData = {
          token: token,
          user: user,
          ...(expiryTimeParam && { expiryTime: parseInt(expiryTimeParam) }) // Include expiry time if provided
        };
        localStorage.setItem('jwt', JSON.stringify(authData));

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Redirect based on user role
        setTimeout(() => {
          if (user.role === 1) {
            navigate('/admin/dashboard');
          } else {
            navigate('/'); // Redirect regular users to home page
          }
        }, 2000);

      } catch (error) {
        console.error('Auth success handler error:', error);
        setStatus('error');
        setMessage('Failed to process authentication');
        setTimeout(() => navigate('/signin'), 3000);
      }
    };

    handleAuthSuccess();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center">
            {status === 'processing' && (
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            )}
            {status === 'success' && (
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {status === 'processing' && 'Authenticating...'}
            {status === 'success' && 'Welcome!'}
            {status === 'error' && 'Authentication Failed'}
          </h2>
          
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>

          {status === 'processing' && (
            <div className="mt-4">
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4">
              <button
                onClick={() => navigate('/signin')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;
