import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import ButtonLoader from "@/components/ui/buttonLoader";
import { Mail, ArrowLeft } from "lucide-react";
import { useApi } from "@/api/Api";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const api = useApi();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post("/forgot-password", { email });
            if (res.data.success) {
                setEmailSent(true);
                toast.success(res.data.message);
            } else {
                toast.error(res.data.message);
            }
        } catch (e: any) {
            const data = e.response?.data;
            if (data?.message) {
                toast.error(data.message);
            } else {
                toast.error("Erro ao enviar email de recuperação");
            }
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
                <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md animate-fade-in text-center">
                    <div className="mb-6 flex justify-center">
                        <Mail className="h-16 w-16 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        Email Enviado!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Enviamos um link de recuperação de senha para <strong>{email}</strong>.
                        Verifique sua caixa de entrada e siga as instruções.
                    </p>
                    <p className="text-gray-600 mb-8 text-sm">
                        O link expira em 24 horas.
                    </p>
                    <div className="space-y-3">
                        <Button
                            onClick={() => navigate("/login")}
                            className="w-full bg-blue-600 cursor-pointer text-white font-semibold rounded-lg py-2 hover:bg-blue-700 transition-colors"
                        >
                            Voltar para Login
                        </Button>
                        <Button
                            onClick={() => {
                                setEmailSent(false);
                                setEmail("");
                            }}
                            variant="outline"
                            className="w-full text-black cursor-pointer"
                        >
                            Enviar para outro email
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
            <div className="bg-white shadow-md rounded-2xl p-6 w-full max-w-sm animate-fade-in">
                <div className="mb-6">
                    <Button
                        onClick={() => navigate("/login")}
                        variant="ghost"
                        size="icon"
                        className="mb-4"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
                        Recuperar Senha
                    </h2>
                    <p className="text-center text-gray-500 mb-8 text-sm">
                        Digite seu email e enviaremos um link para redefinir sua senha
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
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
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 cursor-pointer text-white font-semibold rounded-lg py-2 hover:bg-blue-700 transition-colors disabled:opacity-80"
                        disabled={loading}
                    >
                        {!loading && "Enviar Link de Recuperação"}
                        {loading && <ButtonLoader />}
                    </Button>
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={() => navigate("/login")}
                        className="text-sm text-blue-600 hover:underline cursor-pointer"
                    >
                        Voltar para Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
