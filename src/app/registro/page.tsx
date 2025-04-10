"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

// Schema de validação
const registerSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);

      // Aqui seria a integração com Supabase para registro
      // const { error } = await supabase.auth.signUp({
      //   email: data.email,
      //   password: data.password,
      //   options: {
      //     data: {
      //       username: data.username
      //     }
      //   }
      // });

      // if (error) throw error;

      // Simulando um registro bem-sucedido
      console.log("Dados de registro:", data);
      
      // Redirecionamento após cadastro
      router.push("/login?registered=true");
      
    } catch (error: any) {
      setApiError(error.message || "Ocorreu um erro ao criar sua conta");
      console.error("Erro no registro:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Crie sua conta</h1>
        <p className="text-gray-300">
          Junte-se à comunidade Phanter Ops para acessar nossos servidores e benefícios VIP
        </p>
      </div>

      {apiError && (
        <div className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium">
            Nome de Usuário
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <FaUser />
            </div>
            <input
              type="text"
              id="username"
              className={`bg-dark-green-black border ${errors.username ? 'border-red-500' : 'border-olive-green'} text-white py-3 pl-10 pr-4 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-intense-orange`}
              placeholder="Seu nome de usuário"
              {...register("username")}
            />
          </div>
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <FaEnvelope />
            </div>
            <input
              type="email"
              id="email"
              className={`bg-dark-green-black border ${errors.email ? 'border-red-500' : 'border-olive-green'} text-white py-3 pl-10 pr-4 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-intense-orange`}
              placeholder="seu.email@exemplo.com"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <FaLock />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className={`bg-dark-green-black border ${errors.password ? 'border-red-500' : 'border-olive-green'} text-white py-3 pl-10 pr-10 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-intense-orange`}
              placeholder="********"
              {...register("password")}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            Confirmar Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <FaLock />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              className={`bg-dark-green-black border ${errors.confirmPassword ? 'border-red-500' : 'border-olive-green'} text-white py-3 pl-10 pr-10 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-intense-orange`}
              placeholder="********"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded-md bg-intense-orange text-white font-medium transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-intense-orange/90'}`}
        >
          {isSubmitting ? "Criando conta..." : "Criar Conta"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-300">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-intense-orange hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
} 