import { api } from "./axios";

export const registerPushToken = async (
  pushToken: string,
  platform: 'ios' | 'android' | 'web'
): Promise<{ success: boolean; deviceId: string }> => {
  const response = await api.post('/notifications/register', { pushToken, platform });
  return response.data;
};

export const unregisterPushToken = async (pushToken: string): Promise<{ success: boolean }> => {
  const response = await api.post('/notifications/unregister', { pushToken });
  return response.data;
};
