import { createContext, useContext, useState } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', {
            email,
            password
        });

        const { token, email: userEmail, role } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem(
            'user',
            JSON.stringify({
                email: userEmail,
                role
            })
        );

        setUser({
            email: userEmail,
            role
        });

        return res.data;
    };


    const register = async (email, password, fullName) => {
        const res = await api.post('/auth/register', {
            email,
            password,
            fullName
        });

        const {
            token,
            email: userEmail,
            role: userRole
        } = res.data;

        if (token) {
            localStorage.setItem('token', token);
        }

        localStorage.setItem(
            'user',
            JSON.stringify({
                email: userEmail,
                role: userRole
            })
        );

        setUser({
            email: userEmail,
            role: userRole
        });

        return res.data;
    };


    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}