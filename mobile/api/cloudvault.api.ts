import axios from "axios";
import Constants from "expo-constants";

const CLOUDVAULT_URL = Constants.expoConfig?.extra?.cloudvaultUrl || "https://cloudvault-api.onrender.com";
const CLOUDVAULT_API_KEY = Constants.expoConfig?.extra?.cloudvaultApiKey || "";

const cloudvaultApi = axios.create({
    baseURL: CLOUDVAULT_URL,
    headers: {
        "Content-Type": "application/json",
        "X-API-Key": CLOUDVAULT_API_KEY,
    },
    timeout: 30000,
});

export type UploadUrlResponse = {
    fileId: string;
    uploadUrl: string;
    key: string;
    expiresAt: string;
};

export type DownloadUrlResponse = {
    downloadUrl: string;
    expiresAt: string;
    filename: string;
};

export const getUploadUrl = async (
    filename: string,
    contentType: string,
    size: number,
    tags?: string[]
): Promise<UploadUrlResponse> => {
    const response = await cloudvaultApi.post("/api/v1/files/upload-url", {
        filename,
        contentType,
        size,
        tags,
    });
    return response.data;
};

export const uploadFileToUrl = async (
    uploadUrl: string,
    fileBlob: Blob,
    contentType: string
): Promise<void> => {
    await axios.put(uploadUrl, fileBlob, {
        headers: {
            "Content-Type": contentType,
        },
    });
};

export const confirmUpload = async (fileId: string): Promise<void> => {
    await cloudvaultApi.post(`/api/v1/files/${fileId}/confirm-upload`);
};

export const getDownloadUrl = async (fileId: string): Promise<DownloadUrlResponse> => {
    const response = await cloudvaultApi.get(`/api/v1/files/${fileId}/download-url`);
    return response.data;
};

export const uploadBase64Image = async (
    base64: string,
    filename: string
): Promise<{ fileId: string; key: string }> => {
    const byteString = atob(base64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([uint8Array], { type: "image/jpeg" });

    const { fileId, uploadUrl, key } = await getUploadUrl(
        filename,
        "image/jpeg",
        blob.size,
        ["receipt", "expense"]
    );

    await uploadFileToUrl(uploadUrl, blob, "image/jpeg");
    await confirmUpload(fileId);

    return { fileId, key };
};
