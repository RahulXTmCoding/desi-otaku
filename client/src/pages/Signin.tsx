import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { signin, authenticate, isAutheticated, socialLogin } from "../auth/helper";
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import FacebookLogin, { ReactFacebookLoginInfo } from 'react-facebook-login';
import { useCart } from "../context/CartContext";
import { API } from "../backend";

const Signin = () => {
  const [values, setValues] = useState({
    email: "",
    password: "",
    error: "",
    loading: false,
    didRedirect: false,
  });

  const { email, password, error, loading, didRedirect } = values;
  const auth = isAutheticated();
  const { syncCart } = useCart();

  const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, error: "", [name]: event.target.value });
  };

  const onSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
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
            syncCart();
          });
        }
      })
      .catch(() => console.log("signin request failed"));
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

  const loadingMessage = () => {
    return (
      loading && (
        <div className="alert alert-info">
          <h2>Loading...</h2>
        </div>
      )
    );
  };

  const errorMessage = () => {
    return (
      <div className="row">
        <div className="col-md-6 offset-sm-3 text-left">
          <div
            className="alert alert-danger"
            style={{ display: error ? "" : "none" }}
          >
            {error}
          </div>
        </div>
      </div>
    );
  };

  const handleSocialLogin = (response: any, provider: 'google' | 'facebook') => {
    setValues({ ...values, loading: true });
    socialLogin(provider, response)
      .then(data => {
        if (data.error) {
          setValues({ ...values, error: data.error, loading: false });
        } else {
          authenticate(data, () => {
            setValues({ ...values, didRedirect: true });
            syncCart();
          });
        }
      })
      .catch(() => {
        setValues({ ...values, error: "Social login failed", loading: false });
      });
  };

  const responseGoogle = (response: CredentialResponse) => {
    handleSocialLogin(response, 'google');
  };

  const responseFacebook = (response: ReactFacebookLoginInfo) => {
    handleSocialLogin(response, 'facebook');
  }

  const signInForm = () => {
    return (
      <div className="row">
        <div className="col-md-6 offset-sm-3 text-left">
          <form>
            <div className="form-group">
              <label className="text-light">Email</label>
              <input
                onChange={handleChange("email")}
                value={email}
                className="form-control"
                type="email"
              />
            </div>

            <div className="form-group">
              <label className="text-light">Password</label>
              <input
                onChange={handleChange("password")}
                value={password}
                className="form-control"
                type="password"
              />
            </div>
            <button onClick={onSubmit} className="btn btn-success btn-block">
              Submit
            </button>
          </form>
          <div className="mt-3">
            <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={responseGoogle}
                onError={() => {
                  console.log('Login Failed');
                }}
              />
            </GoogleOAuthProvider>
          </div>
          <div className="mt-3">
            <FacebookLogin
              appId={process.env.REACT_APP_FACEBOOK_APP_ID}
              autoLoad={false}
              fields="name,email,picture"
              callback={responseFacebook}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {loadingMessage()}
      {errorMessage()}
      {signInForm()}
      {performRedirect()}
      <p className="text-white text-center">{JSON.stringify(values)}</p>
    </>
  );
};

export default Signin;
