import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getUserRole, getUserBaseId } from '../utils/auth';

function Transfers() {
    const [transfers, setTransfers] = useState([]);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const role = getUserRole();
    const userBaseId = getUserBaseId();

    const [fromBaseId, setFromBaseId] = useState(role === 'BASE_COMMANDER' ? userBaseId : '');
    const [toBaseId, setToBaseId] = useState('');
    const [equipmentTypeId, setEquipmentTypeId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, [role, userBaseId]);

    const fetchData = async () => {
        try {
            const [tRes, bRes, eRes] = await Promise.all([
                api.get('/transfers'),
                api.get('/bases'),
                api.get('/equipment-types')
            ]);
            let tData = tRes.data;
            if (role === 'BASE_COMMANDER') {
                tData = tData.filter(t => t.fromBase.id.toString() === userBaseId || t.toBase.id.toString() === userBaseId);
            }
            setTransfers(tData);
            setBases(bRes.data);
            setEquipmentTypes(eRes.data);
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
        if (fromBaseId === toBaseId) {
            setError('Source and destination bases cannot be the same.');
            return;
        }
        if (quantity <= 0) {
            setError('Quantity must be greater than 0');
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post('/transfers', { fromBaseId, toBaseId, equipmentTypeId, quantity });
            setToBaseId('');
            setEquipmentTypeId('');
            setQuantity(1);
            setSuccess('Transfer completed successfully.');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Failed to create transfer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <p>Loading...</p>;

    const fromBasesList = role === 'BASE_COMMANDER' ? bases.filter(b => b.id.toString() === userBaseId) : bases;

    return (
        <div>
            <h2>Transfers</h2>
            
            <div className="card">
                {error && <div className="error-text">{error}</div>}
                {success && <div className="success-text">{success}</div>}
                <form onSubmit={handleCreate} className="form-row">
                    <div className="form-group">
                        <label>From Base</label>
                        <select className="form-control" value={fromBaseId} onChange={e => setFromBaseId(e.target.value)} required disabled={role === 'BASE_COMMANDER'}>
                            <option value="">Select Origin</option>
                            {fromBasesList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>To Base</label>
                        <select className="form-control" value={toBaseId} onChange={e => setToBaseId(e.target.value)} required>
                            <option value="">Select Destination</option>
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
                        <label>Quantity</label>
                        <input type="number" min="1" className="form-control" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn" disabled={isSubmitting}>Transfer</button>
                </form>
            </div>

            <div className="card">
                <h3>History</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Equipment</th>
                                <th>Qty</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.map(t => (
                                <tr key={t.id}>
                                    <td>{t.id}</td>
                                    <td>{t.fromBase.name}</td>
                                    <td>{t.toBase.name}</td>
                                    <td>{t.equipmentType.name}</td>
                                    <td>{t.quantity}</td>
                                    <td>{new Date(t.date).toLocaleString()}</td>
                                </tr>
                            ))}
                            {transfers.length === 0 && <tr><td colSpan="6">No transfers found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Transfers;
