import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signin, authenticate, isAutheticated } from "../auth/helper";
import { AlertCircle } from "lucide-react";

export default function Signin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;
  const message = location.state?.message || null;

  const [values, setValues] = useState({
    email: "",
    password: "",
    error: "",
    loading: false,
    didRedirect: false,
  });

  const { email, password, error, loading, didRedirect } = values;
  const auth = isAutheticated();
  const user = auth && auth.user;

  const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, error: "", [name]: event.target.value });
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setValues({ ...values, error: "", loading: true });
    signin({ email, password })
      .then((data) => {
        if (data.error) {
          setValues({ ...values, error: data.error, loading: false });
        } else {
          authenticate(data, () => {
            setValues({
              ...values,
              didRedirect: true,
            });
          });
        }
      })
      .catch(err => console.log("signin request failed", err));
  };

  const performRedirect = () => {
    if (didRedirect) {
      // If we have a return URL from checkout, go there
      if (from) {
        navigate(from);
      } else if (user && user.role === 1) {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    }
  };

  // Check if already authenticated and redirect
  useEffect(() => {
    if (isAutheticated()) {
      if (from) {
        navigate(from);
      } else {
        navigate("/");
      }
    }
  }, []);

  // Call performRedirect when didRedirect changes
  useEffect(() => {
    performRedirect();
  }, [didRedirect]);

  const loadingMessage = () => {
    return (
      loading && (
        <div className="max-w-md mx-auto mt-4">
          <div className="bg-blue-500 text-white text-center p-4 rounded-lg">
            <h2>Loading...</h2>
          </div>
        </div>
      )
    );
  };

  const errorMessage = () => {
    return (
      <div className="max-w-md mx-auto mt-4">
        <div
          className="bg-red-500 text-white text-center p-4 rounded-lg"
          style={{ display: error ? "" : "none" }}
        >
          {error}
        </div>
      </div>
    );
  };

  const signInForm = () => {
    return (
      <div className="max-w-md mx-auto bg-gray-900 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center text-yellow-400 mb-8">Sign In</h2>
        <form>
          <div className="mb-4">
            <label className="block text-gray-300 font-semibold mb-2">Email</label>
            <input
              onChange={handleChange("email")}
              value={email}
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              type="email"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 font-semibold mb-2">Password</label>
            <input
              onChange={handleChange("password")}
              value={password}
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              type="password"
            />
          </div>
          
          <div className="mb-6 text-right">
            <Link to="/forgot-password" className="text-sm text-yellow-400 hover:underline">
              Forgot your password?
            </Link>
          </div>
          
          <button
            onClick={onSubmit}
            className="w-full bg-yellow-400 text-black font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-300 transition"
          >
            Submit
          </button>
        </form>
        <p className="text-center mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-yellow-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans py-20">
      {message && (
        <div className="max-w-md mx-auto mb-4">
          <div className="bg-yellow-400/10 border border-yellow-400/50 text-yellow-400 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{message}</p>
          </div>
        </div>
      )}
      {loadingMessage()}
      {errorMessage()}
      {signInForm()}
    </div>
  );
};
