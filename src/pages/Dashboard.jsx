import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getUserRole, getUserBaseId } from '../utils/auth';

function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const [metricsLoading, setMetricsLoading] = useState(true);
    const [metricsError, setMetricsError] = useState('');
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [selectedBase, setSelectedBase] = useState('');
    const [selectedEquipment, setSelectedEquipment] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
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
            setMetricsLoading(true);
            setMetricsError('');
            try {
                let url = '/dashboard/metrics?';
                if (selectedBase) url += `baseId=${selectedBase}&`;
                if (selectedEquipment) url += `equipmentTypeId=${selectedEquipment}&`;
                if (startDate) url += `startDate=${startDate}&`;
                if (endDate) url += `endDate=${endDate}&`;
                const res = await api.get(url);
                setMetrics(res.data);
            } catch (err) {
                console.error(err);
                setMetricsError('Unable to load dashboard data.');
            } finally {
                setMetricsLoading(false);
            }
        };
        fetchMetrics();
    }, [selectedBase, selectedEquipment, startDate, endDate, role]);

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
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    pData = pData.filter(p => new Date(p.date) >= start);
                    tData = tData.filter(t => new Date(t.date) >= start);
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    pData = pData.filter(p => new Date(p.date) <= end);
                    tData = tData.filter(t => new Date(t.date) <= end);
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
    }, [selectedBase, selectedEquipment, startDate, endDate, role]);

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
                    <div className="form-group">
                        <label>Start Date</label>
                        <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
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

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                pData = pData.filter(p => new Date(p.date) >= start);
                tData = tData.filter(t => new Date(t.date) >= start);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                pData = pData.filter(p => new Date(p.date) <= end);
                tData = tData.filter(t => new Date(t.date) <= end);
            }

            const transferIn = selectedBase ? tData.filter(t => t.toBase.id.toString() === selectedBase) : tData;
            const transferOut = selectedBase ? tData.filter(t => t.fromBase.id.toString() === selectedBase) : tData;

            const purchasesSum = pData.reduce((sum, p) => sum + p.quantity, 0);
            const transfersInSum = transferIn.reduce((sum, t) => sum + t.quantity, 0);
            const transfersOutSum = transferOut.reduce((sum, t) => sum + t.quantity, 0);
            const netMovement = purchasesSum + transfersInSum - transfersOutSum;

            setModalData({ purchasesSum, transfersInSum, transfersOutSum, netMovement });
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
                <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>End Date</label>
                    <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </div>

            {metricsLoading ? (
                <p>Loading...</p>
            ) : metricsError ? (
                <p className="error-text">{metricsError}</p>
            ) : metrics ? (
                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-title">Opening Balance</div>
                        <div className="metric-value">{metrics.openingBalance || 0}</div>
                    </div>
                    <div className="metric-card metric-card-interactive" onClick={openNetMovementModal}>
                        <div className="metric-title">Purchases/Transfers (Net)</div>
                        <div className="metric-value">{metrics.netMovement || 0}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-title">Assigned</div>
                        <div className="metric-value">{metrics.assigned || 0}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-title">Expended</div>
                        <div className="metric-value">{metrics.expended || 0}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-title">Closing Balance</div>
                        <div className="metric-value">{metrics.closingBalance || 0}</div>
                    </div>
                </div>
            ) : null}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>Net Movement Details</h3>
                        <button onClick={() => setShowModal(false)} className="modal-close">×</button>
                        
                        {modalLoading ? <p>Loading details...</p> : (
                            <div style={{ padding: '10px 0', fontSize: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Purchases</span>
                                    <span>+{modalData.purchasesSum}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Transfer In</span>
                                    <span>+{modalData.transfersInSum}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <span>Transfer Out</span>
                                    <span>-{modalData.transfersOutSum}</span>
                                </div>
                                <hr />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontWeight: 'bold' }}>
                                    <span>Net Movement</span>
                                    <span>{modalData.netMovement}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

export default Dashboard;
