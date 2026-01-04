import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginApi, signupApi, refreshTokenApi, logoutApi, AuthResponse } from "@/api/auth.api";
import { api } from "@/api/axios";

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: (logoutAll?: boolean) => Promise<void>;
    refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
    ACCESS_TOKEN: "@auth_access_token",
    REFRESH_TOKEN: "@auth_refresh_token",
    USER: "@auth_user",
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load stored auth data on mount
    useEffect(() => {
        const loadStoredAuth = async () => {
            try {
                const [storedAccessToken, storedRefreshToken, storedUser] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
                    AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
                    AsyncStorage.getItem(STORAGE_KEYS.USER),
                ]);

                if (storedAccessToken && storedRefreshToken && storedUser) {
                    setAccessToken(storedAccessToken);
                    setRefreshToken(storedRefreshToken);
                    setUser(JSON.parse(storedUser));
                    
                    // Set default auth header
                    api.defaults.headers.common["Authorization"] = `Bearer ${storedAccessToken}`;
                }
            } catch (error) {
                console.error("Error loading stored auth:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadStoredAuth();
    }, []);

    // Save auth data to storage
    const saveAuthData = async (authResponse: AuthResponse["data"]) => {
        await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authResponse.accessToken),
            AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authResponse.refreshToken),
            AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authResponse.user)),
        ]);

        setAccessToken(authResponse.accessToken);
        setRefreshToken(authResponse.refreshToken);
        setUser(authResponse.user);

        // Set default auth header
        api.defaults.headers.common["Authorization"] = `Bearer ${authResponse.accessToken}`;
    };

    // Clear auth data from storage
    const clearAuthData = async () => {
        await Promise.all([
            AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
            AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
            AsyncStorage.removeItem(STORAGE_KEYS.USER),
        ]);

        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);

        // Remove default auth header
        delete api.defaults.headers.common["Authorization"];
    };

    // Login
    const login = async (email: string, password: string) => {
        const response = await loginApi(email, password);
        if (response.success) {
            await saveAuthData(response.data);
        } else {
            throw new Error(response.message);
        }
    };

    // Signup
    const signup = async (name: string, email: string, password: string) => {
        const response = await signupApi(name, email, password);
        if (response.success) {
            await saveAuthData(response.data);
        } else {
            throw new Error(response.message);
        }
    };

    // Logout
    const logout = async (logoutAll = false) => {
        try {
            if (accessToken) {
                await logoutApi(accessToken, refreshToken ?? undefined, logoutAll);
            }
        } catch (error) {
            console.error("Logout API error:", error);
        } finally {
            await clearAuthData();
        }
    };

    // Refresh authentication tokens
    const refreshAuth = useCallback(async (): Promise<boolean> => {
        if (!refreshToken) return false;

        try {
            const response = await refreshTokenApi(refreshToken);
            if (response.success) {
                await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
                await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
                
                setAccessToken(response.data.accessToken);
                setRefreshToken(response.data.refreshToken);
                
                api.defaults.headers.common["Authorization"] = `Bearer ${response.data.accessToken}`;
                return true;
            }
        } catch (error) {
            console.error("Token refresh failed:", error);
            await clearAuthData();
        }
        return false;
    }, [refreshToken]);

    // Setup axios interceptor for automatic token refresh
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // If token expired and we haven't retried yet
                if (
                    error.response?.data?.code === "TOKEN_EXPIRED" &&
                    !originalRequest._retry &&
                    refreshToken
                ) {
                    originalRequest._retry = true;

                    const success = await refreshAuth();
                    if (success) {
                        // Retry with new token
                        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
                        return api(originalRequest);
                    }
                }

                // If refresh token is invalid, logout
                if (error.response?.data?.code === "REFRESH_TOKEN_INVALID") {
                    await clearAuthData();
                }

                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, [refreshToken, refreshAuth, accessToken]);

    const value: AuthContextType = {
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        login,
        signup,
        logout,
        refreshAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
