import { useState, useEffect, useCallback } from 'react';
import { crmApi, tokenStorage } from '../services/crmApi';

export function useAuth() {
    const [isCheckingSession, setIsCheckingSession] = useState(() => {
        const hasStoredToken = !!tokenStorage.getAccessToken() || !!tokenStorage.getRefreshToken();
        return hasStoredToken;
    });

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState(() => tokenStorage.getAccessToken());
    const [user, setUser] = useState(() => tokenStorage.getUser());

    const [loginMode, setLoginMode] = useState(null); // 'CEO', 'TEAM', or null
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleLogout = useCallback(async () => {
        const currentRefresh = tokenStorage.getRefreshToken();
        await crmApi.logout(currentRefresh);
        setToken('');
        setUser(null);
        setIsAuthenticated(false);
        setLoginMode(null);
        setEmail('');
        setPassword('');
    }, []);

    // 🔄 Restore & Validate Session on Mount or Reopening Browser
    useEffect(() => {
        let isMounted = true;

        const restoreSession = async () => {
            const storedToken = tokenStorage.getAccessToken();
            const storedRefresh = tokenStorage.getRefreshToken();

            if (!storedToken && !storedRefresh) {
                if (isMounted) {
                    setIsAuthenticated(false);
                    setIsCheckingSession(false);
                }
                return;
            }

            // 1. Attempt verifying the existing access token
            if (storedToken) {
                try {
                    const verifyRes = await crmApi.verifySession(storedToken);
                    if (verifyRes.success && isMounted) {
                        setIsAuthenticated(true);
                        setUser(verifyRes.user);
                        tokenStorage.setSession(storedToken, storedRefresh, verifyRes.user);
                        setIsCheckingSession(false);
                        return;
                    }
                } catch {
                    // Access token may have expired, proceed to refresh token rotation
                }
            }

            // 2. Access token expired or missing: Attempt silent refresh using refresh token
            if (storedRefresh) {
                try {
                    const refreshRes = await crmApi.refreshToken(storedRefresh);
                    if (refreshRes.success && isMounted) {
                        setIsAuthenticated(true);
                        setToken(refreshRes.token);
                        setUser(refreshRes.user);
                        setIsCheckingSession(false);
                        return;
                    }
                } catch {
                    // Refresh token is revoked or expired
                }
            }

            // 3. Fallback: If both verification and refresh fail, clear session
            if (isMounted) {
                tokenStorage.clearSession();
                setToken('');
                setUser(null);
                setIsAuthenticated(false);
                setIsCheckingSession(false);
            }
        };

        restoreSession();

        // 📡 Global Auth Event Listeners
        const onAuthChanged = (e) => {
            if (!isMounted) return;
            if (e.detail?.token) {
                setToken(e.detail.token);
                if (e.detail.user) setUser(e.detail.user);
                setIsAuthenticated(true);
            }
        };

        const onAuthLogout = () => {
            if (!isMounted) return;
            setToken('');
            setUser(null);
            setIsAuthenticated(false);
        };

        window.addEventListener('crm-auth-changed', onAuthChanged);
        window.addEventListener('crm-auth-logout', onAuthLogout);

        return () => {
            isMounted = false;
            window.removeEventListener('crm-auth-changed', onAuthChanged);
            window.removeEventListener('crm-auth-logout', onAuthLogout);
        };
    }, []);

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
                tokenStorage.setSession(resData.token, resData.refreshToken, resData.user);
                setToken(resData.token);
                setUser(resData.user);
                setIsAuthenticated(true);
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
        isCheckingSession,
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
