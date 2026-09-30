import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Equipment() {
    const [equipmentList, setEquipmentList] = useState([]);
    const [baseEquipmentList, setBaseEquipmentList] = useState([]);
    const [bases, setBases] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [loadingBaseWise, setLoadingBaseWise] = useState(true);
    
    const [searchQuery, setSearchQuery] = useState('');
    
    // Filters for base-wise
    const [filterBase, setFilterBase] = useState('');
    const [filterEquipment, setFilterEquipment] = useState('');

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const res = await api.get('/equipment');
                setEquipmentList(res.data);
            } catch (err) {
                console.error("Failed to fetch equipment", err);
            } finally {
                setLoading(false);
            }
        };
        const fetchBases = async () => {
            try {
                const res = await api.get('/bases');
                setBases(res.data);
            } catch (err) {
                console.error("Failed to fetch bases", err);
            }
        };
        fetchEquipment();
        fetchBases();
    }, []);

    useEffect(() => {
        const fetchBaseWise = async () => {
            setLoadingBaseWise(true);
            try {
                let url = '/equipment/base-wise';
                const params = new URLSearchParams();
                if (filterBase) params.append('baseId', filterBase);
                if (filterEquipment) params.append('equipmentTypeId', filterEquipment);
                
                if (params.toString()) {
                    url += '?' + params.toString();
                }

                const res = await api.get(url);
                setBaseEquipmentList(res.data);
            } catch (err) {
                console.error("Failed to fetch base-wise equipment", err);
            } finally {
                setLoadingBaseWise(false);
            }
        };
        fetchBaseWise();
    }, [filterBase, filterEquipment]);

    const filteredEquipment = equipmentList.filter(eq => 
        eq.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        eq.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <h2>Equipment</h2>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
                <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search by name or category..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '300px' }}
                />
            </div>
            
            <div className="card">
                {loading ? (
                    <p>Loading equipment data...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Equipment Name</th>
                                <th>Category</th>
                                <th>Total Quantity</th>
                                <th>Available Quantity</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEquipment.length > 0 ? (
                                filteredEquipment.map(eq => (
                                    <tr key={eq.id}>
                                        <td>{eq.id}</td>
                                        <td>{eq.name}</td>
                                        <td>{eq.category}</td>
                                        <td>{eq.totalQuantity}</td>
                                        <td>{eq.availableQuantity}</td>
                                        <td>{eq.status}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center' }}>No equipment found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <h2 style={{ marginTop: '40px' }}>Base-wise Inventory</h2>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <select 
                    className="form-control" 
                    value={filterBase} 
                    onChange={(e) => setFilterBase(e.target.value)}
                    style={{ width: '200px' }}
                >
                    <option value="">All Bases</option>
                    {bases.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
                <select 
                    className="form-control" 
                    value={filterEquipment} 
                    onChange={(e) => setFilterEquipment(e.target.value)}
                    style={{ width: '200px' }}
                >
                    <option value="">All Equipment</option>
                    {equipmentList.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                </select>
            </div>

            <div className="card">
                {loadingBaseWise ? (
                    <p>Loading base-wise inventory...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Base</th>
                                <th>Equipment</th>
                                <th>Total Quantity</th>
                                <th>Available Quantity</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {baseEquipmentList.length > 0 ? (
                                baseEquipmentList.map((eq, index) => (
                                    <tr key={index}>
                                        <td>{eq.baseName}</td>
                                        <td>{eq.equipmentName}</td>
                                        <td>{eq.totalQuantity}</td>
                                        <td>{eq.availableQuantity}</td>
                                        <td>{eq.status}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center' }}>No inventory found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Equipment;
