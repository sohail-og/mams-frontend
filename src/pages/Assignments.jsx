import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getUserRole, getUserBaseId } from '../utils/auth';

function Assignments() {
    const [assignments, setAssignments] = useState([]);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [personnelUnits, setPersonnelUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const role = getUserRole();
    const userBaseId = getUserBaseId();

    const [baseId, setBaseId] = useState(role === 'BASE_COMMANDER' ? userBaseId : '');
    const [equipmentTypeId, setEquipmentTypeId] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [availableBalance, setAvailableBalance] = useState(null);

    useEffect(() => {
        fetchData();
    }, [role, userBaseId]);

    useEffect(() => {
        if (baseId && equipmentTypeId) {
            fetchAvailableBalance(baseId, equipmentTypeId);
        } else {
            setAvailableBalance(null);
        }
    }, [baseId, equipmentTypeId]);

    const fetchAvailableBalance = async (bId, eId) => {
        try {
            const res = await api.get(`/inventory/available?baseId=${bId}&equipmentTypeId=${eId}`);
            setAvailableBalance(res.data);
        } catch (err) {
            console.error('Failed to fetch balance', err);
            setAvailableBalance(null);
        }
    };

    const fetchData = async () => {
        try {
            const [aRes, bRes, eRes, pRes] = await Promise.all([
                api.get('/assignments'),
                api.get('/bases'),
                api.get('/equipment-types'),
                api.get('/personnel-units')
            ]);
            let aData = aRes.data;
            if (role === 'BASE_COMMANDER') {
                aData = aData.filter(a => a.base.id.toString() === userBaseId);
            }
            setAssignments(aData);
            setBases(role === 'BASE_COMMANDER' ? bRes.data.filter(b => b.id.toString() === userBaseId) : bRes.data);
            setEquipmentTypes(eRes.data);
            setPersonnelUnits(pRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (quantity <= 0) {
            setError('Quantity must be greater than 0.');
            return;
        }
        if (availableBalance !== null && quantity > availableBalance) {
            setError('Insufficient inventory.');
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post('/assignments', { baseId, equipmentTypeId, personnelName: assignedTo, quantity });
            setEquipmentTypeId('');
            setAssignedTo('');
            setQuantity(1);
            setSuccess('Assignment created successfully.');
            if (baseId && equipmentTypeId) fetchAvailableBalance(baseId, equipmentTypeId);
            fetchData();
        } catch (err) {
            console.error("Assignment failed:", err);
            
            let message = 'Failed to create assignment.';
            if (err.response && err.response.data) {
                if (typeof err.response.data === 'string') {
                    message = err.response.data;
                } else if (err.response.data.message) {
                    message = err.response.data.message;
                } else if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
                    message = err.response.data.errors[0]?.defaultMessage || message;
                }
            }
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h2>Assignments</h2>
            
            <div className="card">
                {error && typeof error === 'string' && <div className="error-text">{error}</div>}
                {success && typeof success === 'string' && <div className="success-text">{success}</div>}
                <form onSubmit={handleCreate} className="form-row">
                    <div className="form-group">
                        <label>Base</label>
                        <select className="form-control" value={baseId} onChange={e => setBaseId(e.target.value)} required disabled={role === 'BASE_COMMANDER'}>
                            <option value="">Select Base</option>
                            {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Equipment</label>
                        <select className="form-control" value={equipmentTypeId} onChange={e => setEquipmentTypeId(e.target.value)} required>
                            <option value="">Select Equipment</option>
                            {equipmentTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        {availableBalance !== null && baseId && equipmentTypeId && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-sec)', marginTop: '5px' }}>
                                Available: {availableBalance}
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Personnel / Unit</label>
                        <select className="form-control" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
                            <option value="">Select Personnel / Unit</option>
                            {personnelUnits.map(pu => <option key={pu.id} value={pu.name}>{pu.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Quantity</label>
                        <input type="number" min="1" className="form-control" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn" disabled={isSubmitting}>Assign</button>
                </form>
            </div>

            <div className="card">
                <h3>History</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Base</th>
                                <th>Equipment</th>
                                <th>Personnel / Unit</th>
                                <th>Qty</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(assignments) ? assignments.map(a => (
                                <tr key={a?.id}>
                                    <td>{a?.id}</td>
                                    <td>{a?.base?.name}</td>
                                    <td>{a?.equipmentType?.name}</td>
                                    <td>{a?.personnelName}</td>
                                    <td>{a?.quantity}</td>
                                    <td>{a?.date ? new Date(a.date).toLocaleString() : ''}</td>
                                </tr>
                            )) : []}
                            {(!assignments || assignments.length === 0) && <tr><td colSpan="6">No assignments found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Assignments;
