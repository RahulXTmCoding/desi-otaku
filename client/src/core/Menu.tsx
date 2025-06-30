import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signout, isAutheticated } from "../auth/helper";

const Menu = () => {
  const navigate = useNavigate();
  const auth = isAutheticated();
  
  return (
    <div>
      <ul className="nav nav-tabs bg-dark">
        <li className="nav-item">
          <Link className="nav-link" to="/">
            Home
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/cart">
            Cart
          </Link>
        </li>
        {auth && auth.user && auth.user.role === 0 && (
          <li className="nav-item">
            <Link className="nav-link" to="/user/dashboard">
              U. Dashboard
            </Link>
          </li>
        )}
        {auth && auth.user && auth.user.role === 1 && (
          <li className="nav-item">
            <Link className="nav-link" to="/admin/dashboard">
              A. Dashboard
            </Link>
          </li>
        )}
        {!auth && (
          <>
            <li className="nav-item">
              <Link className="nav-link" to="/signup">
                Signup
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/signin">
                Sign In
              </Link>
            </li>
          </>
        )}
        {auth && (
          <li className="nav-item">
            <span
              className="nav-link text-warning cursor-pointer"
              onClick={() => {
                signout(() => {
                  navigate("/");
                });
              }}
            >
              Signout
            </span>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Menu;
