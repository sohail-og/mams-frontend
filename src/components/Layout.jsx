import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar, { Navbar } from './Sidebar';
import { isAuthenticated } from '../utils/auth';

const Layout = () => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content">
                <Navbar />
                <div className="page-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;
