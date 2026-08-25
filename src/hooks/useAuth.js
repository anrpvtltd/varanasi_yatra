import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('admin_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [loginMode, setLoginMode] = useState(null); // 'CEO', 'TEAM', or null
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setToken('');
        setUser(null);
        setIsAuthenticated(false);
        setLoginMode(null);
        setEmail('');
        setPassword('');
    }, []);

    useEffect(() => {
        const verifySession = async () => {
            if (token) {
                try {
                    const resData = await crmApi.verifySession(token);
                    if (resData.success) {
                        setIsAuthenticated(true);
                        setUser(resData.user);
                        localStorage.setItem('admin_user', JSON.stringify(resData.user));
                    } else {
                        handleLogout();
                    }
                } catch {
                    // Fallback to offline local state if server fails but token exists
                    setIsAuthenticated(true);
                }
            }
        };
        verifySession();
    }, [token, handleLogout]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password || !loginMode) {
            alert('❌ Please enter email, password and select login type.');
            return;
        }
        try {
            setIsAuthenticating(true);
            const resData = await crmApi.login({ email, password, loginMode });
            if (resData.success) {
                localStorage.setItem('admin_token', resData.token);
                localStorage.setItem('admin_user', JSON.stringify(resData.user));
                setToken(resData.token);
                setUser(resData.user);
                setIsAuthenticated(true);
                // Clear state
                setEmail('');
                setPassword('');
            } else {
                alert('❌ Access Denied: ' + (resData.message || 'Incorrect credentials'));
            }
        } catch (err) {
            alert('❌ Access Denied: ' + (err.message || 'Authentication service connection failed.'));
        } finally {
            setIsAuthenticating(false);
        }
    };

    return {
        isAuthenticated,
        token,
        user,
        loginMode,
        setLoginMode,
        email,
        setEmail,
        password,
        setPassword,
        isAuthenticating,
        handleLogout,
        handleLoginSubmit
    };
}
