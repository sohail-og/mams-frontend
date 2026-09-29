import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getUserRole, getUserBaseId } from '../utils/auth';

function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [selectedBase, setSelectedBase] = useState('');
    const [selectedEquipment, setSelectedEquipment] = useState('');
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ purchases: [], transferIn: [], transferOut: [] });
    const [modalLoading, setModalLoading] = useState(false);
    
    // Logistics Officer state
    const [logisticsData, setLogisticsData] = useState(null);

    const role = getUserRole();

    useEffect(() => {
        const fetchRefs = async () => {
            try {
                const [bRes, eRes] = await Promise.all([
                    api.get('/bases'),
                    api.get('/equipment-types')
                ]);
                setBases(bRes.data);
                setEquipmentTypes(eRes.data);
                
                if (role === 'BASE_COMMANDER') {
                    setSelectedBase(getUserBaseId());
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchRefs();
    }, [role]);

    useEffect(() => {
        const fetchMetrics = async () => {
            if (role === 'LOGISTICS_OFFICER') return;
            try {
                let url = '/dashboard/metrics?';
                if (selectedBase) url += `baseId=${selectedBase}&`;
                if (selectedEquipment) url += `equipmentTypeId=${selectedEquipment}`;
                const res = await api.get(url);
                setMetrics(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMetrics();
    }, [selectedBase, selectedEquipment, role]);

    useEffect(() => {
        const fetchLogisticsData = async () => {
            if (role !== 'LOGISTICS_OFFICER') return;
            try {
                const [pRes, tRes] = await Promise.all([
                    api.get('/purchases'),
                    api.get('/transfers')
                ]);
                let pData = pRes.data;
                let tData = tRes.data;
                
                if (selectedBase) {
                    pData = pData.filter(p => p.base.id.toString() === selectedBase);
                    tData = tData.filter(t => t.fromBase.id.toString() === selectedBase || t.toBase.id.toString() === selectedBase);
                }
                if (selectedEquipment) {
                    pData = pData.filter(p => p.equipmentType.id.toString() === selectedEquipment);
                    tData = tData.filter(t => t.equipmentType.id.toString() === selectedEquipment);
                }

                let purchasesSum = pData.reduce((sum, p) => sum + p.quantity, 0);
                let transfersInSum = 0;
                let transfersOutSum = 0;

                tData.forEach(t => {
                    if (!selectedBase) {
                        transfersInSum += t.quantity;
                        transfersOutSum += t.quantity;
                    } else {
                        if (t.toBase.id.toString() === selectedBase) transfersInSum += t.quantity;
                        if (t.fromBase.id.toString() === selectedBase) transfersOutSum += t.quantity;
                    }
                });

                let netMovement = purchasesSum + transfersInSum - transfersOutSum;

                let availableBalance = '-';
                if (selectedBase && selectedEquipment) {
                    try {
                        const invRes = await api.get(`/inventory/available?baseId=${selectedBase}&equipmentTypeId=${selectedEquipment}`);
                        availableBalance = invRes.data;
                    } catch (e) {
                        console.error('Failed to get inventory', e);
                    }
                }

                setLogisticsData({
                    totalPurchases: purchasesSum,
                    transfersIn: transfersInSum,
                    transfersOut: transfersOutSum,
                    netMovement,
                    availableBalance
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchLogisticsData();
    }, [selectedBase, selectedEquipment, role]);

    if (role === 'LOGISTICS_OFFICER') {
        return (
            <div>
                <h2>Dashboard</h2>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                        <label>Base Filter</label>
                        <select className="form-control" value={selectedBase} onChange={e => setSelectedBase(e.target.value)}>
                            <option value="">All Bases</option>
                            {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Equipment Filter</label>
                        <select className="form-control" value={selectedEquipment} onChange={e => setSelectedEquipment(e.target.value)}>
                            <option value="">All Equipment</option>
                            {equipmentTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                </div>

                {logisticsData ? (
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-title">Total Purchases</div>
                            <div className="metric-value">{logisticsData.totalPurchases}</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-title">Transfers In</div>
                            <div className="metric-value">{logisticsData.transfersIn}</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-title">Transfers Out</div>
                            <div className="metric-value">{logisticsData.transfersOut}</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-title">Net Movement</div>
                            <div className="metric-value">{logisticsData.netMovement}</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-title">Available Inventory</div>
                            <div className="metric-value">{logisticsData.availableBalance}</div>
                        </div>
                    </div>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        );
    }

    const openNetMovementModal = async () => {
        setShowModal(true);
        setModalLoading(true);
        try {
            const [pRes, tRes] = await Promise.all([
                api.get('/purchases'),
                api.get('/transfers')
            ]);
            let pData = pRes.data;
            let tData = tRes.data;

            if (selectedBase) {
                pData = pData.filter(p => p.base.id.toString() === selectedBase);
                tData = tData.filter(t => t.fromBase.id.toString() === selectedBase || t.toBase.id.toString() === selectedBase);
            }
            if (selectedEquipment) {
                pData = pData.filter(p => p.equipmentType.id.toString() === selectedEquipment);
                tData = tData.filter(t => t.equipmentType.id.toString() === selectedEquipment);
            }

            const transferIn = selectedBase ? tData.filter(t => t.toBase.id.toString() === selectedBase) : tData;
            const transferOut = selectedBase ? tData.filter(t => t.fromBase.id.toString() === selectedBase) : tData;

            setModalData({ purchases: pData, transferIn, transferOut });
        } catch (err) {
            console.error(err);
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div>
            <h2>Dashboard</h2>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                    <label>Base Filter</label>
                    <select className="form-control" value={selectedBase} onChange={e => setSelectedBase(e.target.value)} disabled={role === 'BASE_COMMANDER'}>
                        {role !== 'BASE_COMMANDER' && <option value="">All Bases</option>}
                        {bases.map(b => (
                            <option key={b.id} value={b.id} style={{ display: role === 'BASE_COMMANDER' && b.id.toString() !== getUserBaseId() ? 'none' : 'block' }}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Equipment Filter</label>
                    <select className="form-control" value={selectedEquipment} onChange={e => setSelectedEquipment(e.target.value)}>
                        <option value="">All Equipment</option>
                        {equipmentTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
            </div>

            {metrics ? (
                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-title">Opening Balance</div>
                        <div className="metric-value">{metrics.openingBalance}</div>
                    </div>
                    <div className="metric-card metric-card-interactive" onClick={openNetMovementModal}>
                        <div className="metric-title">Purchases/Transfers (Net)</div>
                        <div className="metric-value">{metrics.netMovement}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-title">Assigned</div>
                        <div className="metric-value">{metrics.assigned}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-title">Expended</div>
                        <div className="metric-value">{metrics.expended}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-title">Closing Balance</div>
                        <div className="metric-value">{metrics.closingBalance}</div>
                    </div>
                </div>
            ) : (
                <p>Loading...</p>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>Net Movement Details</h3>
                        <button onClick={() => setShowModal(false)} className="modal-close">×</button>
                        
                        {modalLoading ? <p>Loading details...</p> : (
                            <div>
                                <h4>Purchases</h4>
                                <table style={{ marginBottom: '15px' }}>
                                    <thead><tr><th>ID</th><th>Base</th><th>Equipment</th><th>Qty</th><th>Date</th></tr></thead>
                                    <tbody>
                                        {modalData.purchases.map(p => <tr key={p.id}><td>{p.id}</td><td>{p.base.name}</td><td>{p.equipmentType.name}</td><td>{p.quantity}</td><td>{new Date(p.date).toLocaleString()}</td></tr>)}
                                        {modalData.purchases.length === 0 && <tr><td colSpan="5">No purchases.</td></tr>}
                                    </tbody>
                                </table>

                                <h4>Transfers In</h4>
                                <table style={{ marginBottom: '15px' }}>
                                    <thead><tr><th>ID</th><th>From</th><th>To</th><th>Equipment</th><th>Qty</th><th>Date</th></tr></thead>
                                    <tbody>
                                        {modalData.transferIn.map(t => <tr key={t.id}><td>{t.id}</td><td>{t.fromBase.name}</td><td>{t.toBase.name}</td><td>{t.equipmentType.name}</td><td>{t.quantity}</td><td>{new Date(t.date).toLocaleString()}</td></tr>)}
                                        {modalData.transferIn.length === 0 && <tr><td colSpan="6">No incoming transfers.</td></tr>}
                                    </tbody>
                                </table>

                                <h4>Transfers Out</h4>
                                <table style={{ marginBottom: '15px' }}>
                                    <thead><tr><th>ID</th><th>From</th><th>To</th><th>Equipment</th><th>Qty</th><th>Date</th></tr></thead>
                                    <tbody>
                                        {modalData.transferOut.map(t => <tr key={t.id}><td>{t.id}</td><td>{t.fromBase.name}</td><td>{t.toBase.name}</td><td>{t.equipmentType.name}</td><td>{t.quantity}</td><td>{new Date(t.date).toLocaleString()}</td></tr>)}
                                        {modalData.transferOut.length === 0 && <tr><td colSpan="6">No outgoing transfers.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
