import { api } from "./axios";

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    };
}

export interface RefreshResponse {
    success: boolean;
    message: string;
    data: {
        accessToken: string;
        refreshToken: string;
    };
}

export const signupApi = async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/signup", {
        name,
        email,
        password,
    });
    return response.data;
};

export const loginApi = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
    });
    return response.data;
};

export const refreshTokenApi = async (refreshToken: string): Promise<RefreshResponse> => {
    const response = await api.post<RefreshResponse>("/auth/refresh", {
        refreshToken,
    });
    return response.data;
};

export const logoutApi = async (accessToken: string, refreshToken?: string, logoutAll?: boolean): Promise<void> => {
    await api.post(
        "/auth/logout",
        { refreshToken, logoutAll },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
};
