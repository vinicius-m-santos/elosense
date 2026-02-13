import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail } from "lucide-react";

const RegisterSuccess = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
            <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md animate-fade-in text-center">
                <div className="mb-6 flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    Cadastro Realizado com Sucesso!
                </h2>
                <div className="mb-6 flex justify-center">
                    <Mail className="h-12 w-12 text-blue-600" />
                </div>
                <p className="text-gray-600 mb-4">
                    Enviamos um email de verificação para você. Por favor, verifique sua caixa de entrada
                    e clique no link de verificação para ativar sua conta.
                </p>
                <p className="text-gray-500 text-sm mb-8">
                    Não recebeu o email? Verifique sua pasta de spam ou lixo eletrônico.
                </p>
                <Button
                    onClick={() => navigate("/login")}
                    className="w-full bg-blue-600 cursor-pointer text-white font-semibold rounded-lg py-2 hover:bg-blue-700 transition-colors"
                >
                    Ir para Login
                </Button>
            </div>
        </div>
    );
};

export default RegisterSuccess;
