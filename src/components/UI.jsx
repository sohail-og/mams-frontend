import React from 'react';

export const PageHeader = ({ title, subtitle, rightElement }) => (
    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
        </div>
        {rightElement && <div>{rightElement}</div>}
    </div>
);

export const MetricCard = ({ label, value, sub, onClick }) => (
    <div className={`metric-card ${onClick ? 'interactive' : ''}`} onClick={onClick}>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        {sub && <div className="metric-sub">{sub}</div>}
    </div>
);

export const StatusBadge = ({ status }) => {
    let type = 'neutral';
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE' || s === 'AVAILABLE' || s === 'COMPLETED') type = 'success';
    else if (s === 'EXPENDED' || s === 'DESTROYED' || s === 'DAMAGED' || s === 'EXPIRED') type = 'danger';
    else if (s === 'PENDING' || s === 'ASSIGNED') type = 'warning';
    
    return <span className={`badge badge-${type}`}>{s}</span>;
};

export const Alert = ({ type, message }) => {
    if (!message) return null;
    return <div className={`alert alert-${type}`}>{message}</div>;
};

export const EmptyState = ({ message }) => (
    <div className="empty-state">{message}</div>
);

export const LoadingState = ({ message = 'Loading data...' }) => (
    <div className="loading-state">{message}</div>
);

export const FormField = ({ label, children }) => (
    <div className="form-group">
        <label>{label}</label>
        {children}
    </div>
);
