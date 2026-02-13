import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import ButtonLoader from "@/components/ui/buttonLoader";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import { useRequest } from "@/api/request";
import { useApi } from "@/api/Api";

const EmailVerification = () => {
    const { token } = useParams<{ token: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const request = useRequest();
    const api = useApi();
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [email, setEmail] = useState("");
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [alreadyVerified, setAlreadyVerified] = useState(false);
    const hasVerifiedRef = useRef(false);

    const isNotVerifiedPage = location.pathname === "/email-not-verified";

    const verifyEmail = useCallback(async (verificationToken: string) => {
        setLoading(true);
        setError(null);
        setAlreadyVerified(false);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (request as any)({
            method: "GET",
            url: `/verify-email/${verificationToken}`,
            successMessage: "Email verificado com sucesso!",
            showSuccess: true,
            onAccept: (payload: { message?: string }) => {
                if (payload?.message === "Conta já verificada") {
                    setAlreadyVerified(true);
                } else {
                    setVerified(true);
                }
                setLoading(false);
            },
            onReject: (err: { message?: string }) => {
                setLoading(false);
                if (err.message === "Token de verificação inválido") {
                    setAlreadyVerified(true);
                } else {
                    setError(err.message || "Erro ao verificar email");
                }
            },
        });
    }, [request]);

    useEffect(() => {
        if (token && !isNotVerifiedPage && !hasVerifiedRef.current) {
            hasVerifiedRef.current = true;
            verifyEmail(token);
        }
    }, [token, isNotVerifiedPage, verifyEmail]);

    const resendVerification = async () => {
        if (!email) {
            toast.error("Por favor, informe seu email");
            return;
        }

        setResending(true);
        try {
            const res = await api.post("/resend-verification", { email });
            if (res.data.success) {
                toast.success(res.data.message);
            } else {
                toast.error(res.data.message);
            }
            return;
        } catch (e: unknown) {
            const errorData = (e as { response?: { data?: { message?: string; error?: { message?: string } } } })?.response?.data;
            if (errorData?.message) {
                setError(errorData.message);
                toast.error(errorData.message);
                return;
            } else if (errorData?.error?.message) {
                const errorMessage = errorData.error.message;
                setError(errorMessage);
                toast.error(errorMessage);
                return;
            } else {
                setError("Erro ao reenviar email");
                toast.error("Erro ao reenviar email");
                return;
            }
        } finally {
            setResending(false);
        }
    };

    if (isNotVerifiedPage) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
                <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md animate-fade-in text-center">
                    <div className="mb-6 flex justify-center">
                        <Mail className="h-16 w-16 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        Verifique seu Email
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Sua conta ainda não foi verificada. Por favor, verifique sua caixa de entrada
                        e clique no link de verificação que enviamos para você.
                    </p>
                    <p className="text-gray-600 mb-8">
                        Não recebeu o email? Informe seu endereço de email abaixo e reenviaremos o link.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-2 text-left"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <Button
                            onClick={resendVerification}
                            disabled={resending || !email}
                            className="w-full bg-blue-600 cursor-pointer text-white font-semibold rounded-lg py-2 hover:bg-blue-700 transition-colors disabled:opacity-80"
                        >
                            {!resending && "Reenviar Email de Verificação"}
                            {resending && <ButtonLoader />}
                        </Button>

                        <Button
                            onClick={() => navigate("/login")}
                            variant="outline"
                            className="w-full text-black cursor-pointer"
                        >
                            Voltar para Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
            <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md animate-fade-in text-center">
                {loading && (
                    <>
                        <div className="mb-6 flex justify-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Verificando...
                        </h2>
                        <p className="text-gray-600">
                            Aguarde enquanto verificamos sua conta.
                        </p>
                    </>
                )}

                {verified && !loading && (
                    <>
                        <div className="mb-6 flex justify-center">
                            <CheckCircle className="h-16 w-16 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">
                            Email Verificado!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Sua conta foi verificada com sucesso. Você será redirecionado para a página de login.
                        </p>
                        <Button
                            onClick={() => navigate("/login")}
                            className="bg-blue-600 cursor-pointer text-white font-semibold rounded-lg py-2 px-6 hover:bg-blue-700 transition-colors"
                        >
                            Ir para Login
                        </Button>
                    </>
                )}

                {alreadyVerified && !loading && !verified && (
                    <>
                        <div className="mb-6 flex justify-center">
                            <CheckCircle className="h-16 w-16 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">
                            Conta Já Verificada
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Sua conta já foi verificada anteriormente. Você pode fazer login normalmente.
                        </p>
                        <Button
                            onClick={() => navigate("/login")}
                            className="w-full bg-blue-600 cursor-pointer text-white font-semibold rounded-lg py-2 hover:bg-blue-700 transition-colors"
                        >
                            Voltar para Login
                        </Button>
                    </>
                )}

                {error && !loading && !verified && !alreadyVerified && (
                    <>
                        <div className="mb-6 flex justify-center">
                            <XCircle className="h-16 w-16 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">
                            Erro na Verificação
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {error}
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => navigate("/email-not-verified")}
                                className="w-full bg-blue-600 cursor-pointer text-white font-semibold rounded-lg py-2 hover:bg-blue-700 transition-colors"
                            >
                                Reenviar Email de Verificação
                            </Button>
                            <Button
                                onClick={() => navigate("/login")}
                                variant="outline"
                                className="w-full text-black cursor-pointer"
                            >
                                Voltar para Login
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EmailVerification;
