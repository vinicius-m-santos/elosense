import toast from "react-hot-toast";
import { useApi } from "./Api";

export function useRequest() {
    const api = useApi();

    const request = async ({
        method = "get",
        url,
        data = null as object | null,
        params = null,
        onAccept = null,
        onReject = null,
        showSuccess = false,
        successMessage = "Operação realizada com sucesso",
        showError = true,
    }: {
        method?: string;
        url: string;
        data?: object | null;
        params?: unknown;
        onAccept?: ((payload: unknown, response: unknown) => void) | null;
        onReject?: ((err: { message?: string }) => void) | null;
        showSuccess?: boolean;
        successMessage?: string;
        showError?: boolean;
    }) => {
        try {
            const response = await api.request({ method, url, data, params });
            const payload = response.data?.data ?? response.data;

            if (onAccept) onAccept(payload, response);

            if (showSuccess) {
                toast.success(successMessage);
            }

            return payload;
        } catch (error) {
            const err = normalizeError(error);

            if (showError) {
                toast.error(err.message || "Erro inesperado");
            }

            if (onReject) onReject(err);

            throw err;
        }
    };

    return request;
}

function normalizeError(error) {
    if (error.response) {
        const { status, data } = error.response;
        return {
            status,
            message: data?.error?.message || data?.message || data?.detail || data?.error || (typeof data?.error === "string" ? data.error : null) || `Requisição falhou (${status})`,
            code: data?.error?.code || null,
        };
    }

    if (error.request) {
        return { message: "Sem resposta do servidor", code: "NO_RESPONSE" };
    }

    return { message: error.message, code: "UNKNOWN" };
}
