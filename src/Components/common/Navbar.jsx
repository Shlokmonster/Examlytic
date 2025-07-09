import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../SupabaseClient';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div>
      <div className="nav">
        <div className="name">
          Examlytic
        </div>
        <div className="avatar-container" ref={dropdownRef}>
          <div className="avtar1" onClick={toggleDropdown}>
            <img 
              src="https://cdn-icons-png.flaticon.com/128/1999/1999625.png" 
              alt="User Avatar"  
              className="avtar"
            />
          </div>
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={handleLogout}>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
      <style>
        {`
          .avatar-container {
            position: relative;
            display: inline-block;
            cursor: pointer;
          }
          .dropdown-menu {
            position: absolute;
            right: 0;
            top: 100%;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            min-width: 120px;
            z-index: 1000;
            margin-top: 8px;
            animation: fadeIn 0.2s ease-in-out;
          }
          .dropdown-item {
            padding: 10px 16px;
            color: #333;
            text-decoration: none;
            display: block;
            transition: background-color 0.2s;
            cursor: pointer;
          }
          .dropdown-item:hover {
            background-color: #f5f5f5;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default Navbar;
