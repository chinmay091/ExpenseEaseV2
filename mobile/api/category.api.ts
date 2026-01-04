import { api } from "./axios";

export type Category = {
    id: string,
    name: string,
};

export const getCategories = async () => {
    const response = await api.get("/categories");
    return response.data.data;
}