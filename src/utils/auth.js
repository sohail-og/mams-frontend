export const setAuthData = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('baseId', data.baseId);
    localStorage.setItem('name', data.name);
};

export const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('baseId');
    localStorage.removeItem('name');
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

export const getUserRole = () => {
    return localStorage.getItem('role');
};

export const getUserName = () => {
    return localStorage.getItem('name');
};

export const getUserBaseId = () => {
    return localStorage.getItem('baseId');
};
