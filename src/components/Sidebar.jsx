import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuthData, getUserRole, getUserName } from '../utils/auth';

const Sidebar = () => {
    const role = getUserRole();
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                MAMS Portal
            </div>
            <div className="nav-links">
                <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
                <NavLink to="/equipment" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Equipment</NavLink>
                <NavLink to="/purchases" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Purchases</NavLink>
                <NavLink to="/transfers" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Transfers</NavLink>
                {role !== 'LOGISTICS_OFFICER' && (
                    <>
                        <NavLink to="/assignments" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Assignments</NavLink>
                        <NavLink to="/expenditures" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Expenditures</NavLink>
                    </>
                )}
            </div>
        </div>
    );
};

export const Navbar = () => {
    const navigate = useNavigate();
    
    const handleLogout = () => {
        clearAuthData();
        navigate('/login');
    };
    const formatRole = (r) => {
        if (r === 'ADMIN') return 'Admin';
        if (r === 'BASE_COMMANDER') return 'Base Commander';
        if (r === 'LOGISTICS_OFFICER') return 'Logistics Officer';
        return r;
    };

    return (
        <div className="navbar">
            <div className="header-right">
                <span>{getUserName()}</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
        </div>
    );
};

export default Sidebar;
