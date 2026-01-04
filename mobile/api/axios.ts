import axios from "axios";

export const api = axios.create({
    baseURL: "http://192.168.29.252:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});