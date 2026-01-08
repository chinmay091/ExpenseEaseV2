import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Get API URL from environment or use fallback for development
const getBaseUrl = (): string => {
    // Production: Use environment variable from app.config.js/app.json extra
    const envUrl = Constants.expoConfig?.extra?.apiUrl;
    if (envUrl) return envUrl;

    // Development fallback
    if (__DEV__) {
        // For Android emulator, use 10.0.2.2 to reach host machine's localhost
        // For iOS simulator, use localhost
        // For physical device, use your machine's local IP
        return "http://192.168.29.252:5000/api";
    }

    // Production fallback - should be configured via environment
    return "https://api.expenseease.app/api";
};

export const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 15000, // Increased for production reliability
});

// Request interceptor - Attach access token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await AsyncStorage.getItem("accessToken");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 (Unauthorized) - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue this request until token is refreshed
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await AsyncStorage.getItem("refreshToken");
                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                const response = await axios.post(`${getBaseUrl()}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                await AsyncStorage.setItem("accessToken", accessToken);
                if (newRefreshToken) {
                    await AsyncStorage.setItem("refreshToken", newRefreshToken);
                }

                processQueue(null, accessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as AxiosError, null);

                // Clear tokens and redirect to login
                await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
                
                // You can emit an event here to trigger logout in your app
                // EventEmitter.emit('logout');

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);