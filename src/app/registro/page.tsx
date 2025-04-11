"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaDiscord, FaSteam } from "react-icons/fa";
import supabase from "@/lib/supabase/client";

// Impedir que esta página seja renderizada estaticamente
export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const { signUp } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = "Nome de usuário é obrigatório";
    } else if (formData.username.length < 3) {
      newErrors.username = "Nome de usuário deve ter pelo menos 3 caracteres";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 8) {
      newErrors.password = "Senha deve ter pelo menos 8 caracteres";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setApiError(null);
    
    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.username
    );
    
    if (error) {
      setApiError(error);
      setIsLoading(false);
      return;
    }
    
    // Redirecionar para página de login com parâmetro de sucesso
    router.push("/login?registered=true");
  };

  const handleDiscordSignUp = async () => {
    setIsLoading(true);
    setApiError(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "identify email",
      }
    });
    
    if (error) {
      setApiError(error.message);
      setIsLoading(false);
    }
  };

  const handleSteamSignUp = async () => {
    setIsLoading(true);
    setApiError(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "steam",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    
    if (error) {
      setApiError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Crie sua conta</h1>
        <p className="text-gray-300">
          Junte-se à comunidade Phanter Ops
        </p>
      </div>

      {apiError && (
        <div className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
          {apiError}
        </div>
      )}

      <div className="space-y-6">
        {/* Opções de Registro Social */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleDiscordSignUp}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <FaDiscord className="h-5 w-5" />
            <span>Discord</span>
          </button>
          
          <button
            onClick={handleSteamSignUp}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
          >
            <FaSteam className="h-5 w-5" />
            <span>Steam</span>
          </button>
        </div>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-olive-green"></div>
          <span className="mx-4 text-gray-400 text-sm">ou</span>
          <div className="flex-grow border-t border-olive-green"></div>
        </div>

        {/* Formulário de Registro */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Nome de Usuário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <FaUser />
              </div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`bg-dark-green-black border ${
                  errors.username ? "border-red-500" : "border-olive-green"
                } text-white py-2 pl-10 pr-4 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-intense-orange`}
                placeholder="Seu nome de usuário"
              />
            </div>
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <FaEnvelope />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`bg-dark-green-black border ${
                  errors.email ? "border-red-500" : "border-olive-green"
                } text-white py-2 pl-10 pr-4 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-intense-orange`}
                placeholder="seu.email@exemplo.com"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <FaLock />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`bg-dark-green-black border ${
                  errors.password ? "border-red-500" : "border-olive-green"
                } text-white py-2 pl-10 pr-10 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-intense-orange`}
                placeholder="********"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirmar Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <FaLock />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`bg-dark-green-black border ${
                  errors.confirmPassword ? "border-red-500" : "border-olive-green"
                } text-white py-2 pl-10 pr-10 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-intense-orange`}
                placeholder="********"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-md bg-intense-orange text-white font-medium transition-colors ${
              isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-intense-orange/90"
            }`}
          >
            {isLoading ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-300">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-intense-orange hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 