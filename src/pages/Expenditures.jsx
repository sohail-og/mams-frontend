import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getUserRole, getUserBaseId } from '../utils/auth';

function Expenditures() {
    const [expenditures, setExpenditures] = useState([]);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const role = getUserRole();
    const userBaseId = getUserBaseId();

    const [baseId, setBaseId] = useState(role === 'BASE_COMMANDER' ? userBaseId : '');
    const [equipmentTypeId, setEquipmentTypeId] = useState('');
    const [reason, setReason] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, [role, userBaseId]);

    const fetchData = async () => {
        try {
            const [eRes, bRes, eqRes] = await Promise.all([
                api.get('/expenditures'),
                api.get('/bases'),
                api.get('/equipment-types')
            ]);
            let eData = eRes.data;
            if (role === 'BASE_COMMANDER') {
                eData = eData.filter(ex => ex.base.id.toString() === userBaseId);
            }
            setExpenditures(eData);
            setBases(role === 'BASE_COMMANDER' ? bRes.data.filter(b => b.id.toString() === userBaseId) : bRes.data);
            setEquipmentTypes(eqRes.data);
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
        setIsSubmitting(true);
        try {
            await api.post('/expenditures', { baseId, equipmentTypeId, reason, quantity });
            setEquipmentTypeId('');
            setReason('');
            setQuantity(1);
            setSuccess('Expenditure recorded successfully.');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Failed to record expenditure.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h2>Expenditures</h2>
            
            <div className="card">
                {error && <div className="error-text">{error}</div>}
                {success && <div className="success-text">{success}</div>}
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
                    </div>
                    <div className="form-group">
                        <label>Reason</label>
                        <select className="form-control" value={reason} onChange={e => setReason(e.target.value)} required>
                            <option value="">Select Reason</option>
                            <option value="Damaged">Damaged</option>
                            <option value="Consumed">Consumed</option>
                            <option value="Destroyed">Destroyed</option>
                            <option value="Expired">Expired</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Quantity</label>
                        <input type="number" min="1" className="form-control" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn" disabled={isSubmitting}>Record</button>
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
                                <th>Reason</th>
                                <th>Qty</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenditures.map(ex => (
                                <tr key={ex.id}>
                                    <td>{ex.id}</td>
                                    <td>{ex.base.name}</td>
                                    <td>{ex.equipmentType.name}</td>
                                    <td>{ex.reason}</td>
                                    <td>{ex.quantity}</td>
                                    <td>{new Date(ex.date).toLocaleString()}</td>
                                </tr>
                            ))}
                            {expenditures.length === 0 && <tr><td colSpan="6">No expenditures found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Expenditures;
