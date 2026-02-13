import { useAuth } from "@/providers/AuthProvider";

export const useApi = () => {
    const { api } = useAuth();
    return api;
};
