import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getUserRole, getUserBaseId } from '../utils/auth';

function Purchases() {
    const [purchases, setPurchases] = useState([]);
    const [filterDate, setFilterDate] = useState('');
    const [filterEquipment, setFilterEquipment] = useState('');
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const role = getUserRole();
    const userBaseId = getUserBaseId();

    const [baseId, setBaseId] = useState(role === 'BASE_COMMANDER' ? userBaseId : '');
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
            const [pRes, bRes, eRes] = await Promise.all([
                api.get('/purchases'),
                api.get('/bases'),
                api.get('/equipment-types')
            ]);
            let pData = pRes.data;
            if (role === 'BASE_COMMANDER') {
                pData = pData.filter(p => p.base.id.toString() === userBaseId);
            }
            setPurchases(pData);
            setBases(role === 'BASE_COMMANDER' ? bRes.data.filter(b => b.id.toString() === userBaseId) : bRes.data);
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
        setIsSubmitting(true);
        if (quantity <= 0) {
            setError('Quantity must be greater than 0');
            setIsSubmitting(false);
            return;
        }
        try {
            await api.post('/purchases', { baseId, equipmentTypeId, quantity });
            setEquipmentTypeId('');
            setQuantity(1);
            setSuccess('Purchase recorded successfully.');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Failed to create purchase');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h2>Purchases</h2>
            
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
                        <label>Quantity</label>
                        <input type="number" min="1" className="form-control" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn" disabled={isSubmitting}>Save</button>
                </form>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>History</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="date" className="form-control" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                        <select className="form-control" value={filterEquipment} onChange={e => setFilterEquipment(e.target.value)}>
                            <option value="">All Equipment</option>
                            {equipmentTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Base</th>
                                <th>Equipment</th>
                                <th>Qty</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const filtered = purchases.filter(p => {
                                    if (filterDate) {
                                        const d = new Date(p.date).toISOString().split('T')[0];
                                        if (d !== filterDate) return false;
                                    }
                                    if (filterEquipment && p.equipmentType.id.toString() !== filterEquipment) return false;
                                    return true;
                                });
                                return (
                                    <>
                                        {filtered.map(p => (
                                            <tr key={p.id}>
                                                <td>{p.id}</td>
                                                <td>{p.base.name}</td>
                                                <td>{p.equipmentType.name}</td>
                                                <td>{p.quantity}</td>
                                                <td>{new Date(p.date).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {filtered.length === 0 && <tr><td colSpan="5">No purchases found.</td></tr>}
                                    </>
                                );
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Purchases;
