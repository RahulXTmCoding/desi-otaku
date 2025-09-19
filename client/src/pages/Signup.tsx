import React, { useState } from "react";
import { Link } from "react-router-dom";
import { signup } from "../auth/helper";

export default function Signup() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    error: "",
    success: false,
  });

  const { name, email, password, error, success } = values;

  const handleChange = (name) => (event) => {
    setValues({ ...values, error: false, [name]: event.target.value });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setValues({ ...values, error: false });
    signup({ name, email, password })
      .then((data) => {
        if (data.error) {
          setValues({ ...values, error: data.error, success: false });
        } else {
          setValues({
            ...values,
            name: "",
            email: "",
            password: "",
            error: "",
            success: true,
          });
        }
      })
  };

  const signUpForm = () => {
    return (
      <div className="max-w-md mx-auto bg-gray-900 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center text-yellow-400 mb-8">Sign Up</h2>
        <form>
          <div className="mb-4">
            <label className="block text-gray-300 font-semibold mb-2">Name</label>
            <input
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              onChange={handleChange("name")}
              type="text"
              value={name}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 font-semibold mb-2">Email</label>
            <input
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              onChange={handleChange("email")}
              type="email"
              value={email}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 font-semibold mb-2">Password</label>
            <input
              onChange={handleChange("password")}
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              type="password"
              value={password}
            />
          </div>
          <button
            onClick={onSubmit}
            className="w-full bg-yellow-400 text-black font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-300 transition"
          >
            Submit
          </button>
        </form>
      </div>
    );
  };

  const successMessage = () => {
    return (
      <div className="max-w-md mx-auto mt-4">
        <div
          className="bg-green-500 text-white text-center p-4 rounded-lg"
          style={{ display: success ? "" : "none" }}
        >
          New account was created successfully. Please{" "}
          <Link to="/signin" className="underline">Login Here</Link>
        </div>
      </div>
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

  return (
    <div className="min-h-screen bg-black text-white font-sans py-20">
      {successMessage()}
      {errorMessage()}
      {signUpForm()}
    </div>
  );
};
