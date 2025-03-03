import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';
import { AuthLayout } from '@/components/layout/MainLayout';
import { Button, Input, Alert, FormControl } from '@/components/ui/Button';
import { signIn } from '@/lib/supabase';
import { initiateDiscordAuth } from '@/lib/discord';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const router = useRouter();
  const { redirect } = router.query;

  // Verificar se há um erro de autenticação na URL (vindo de OAuth)
  useEffect(() => {
    const { error } = router.query;
    if (error) {
      setServerError(decodeURIComponent(error as string));
    }
  }, [router.query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpar erro ao editar o campo
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setServerError(null);
    
    try {
      const { data, error } = await signIn(
        formData.email,
        formData.password
      );
      
      if (error) {
        throw error;
      }
      
      // Redirecionar para a página solicitada ou home
      router.push(
        typeof redirect === 'string' ? redirect : '/home'
      );
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message.includes('Invalid login credentials')) {
        setServerError('E-mail ou senha incorretos.');
      } else {
        setServerError(error.message || 'Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordLogin = () => {
    initiateDiscordAuth();
  };

  return (
    <AuthLayout 
      title="Entrar" 
      description="Faça login na sua conta da Phanteon Games para acessar recursos exclusivos."
    >
      <div className="w-full max-w-md">
        <div className="bg-phanteon-gray rounded-lg border border-phanteon-light overflow-hidden shadow-lg">
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">Entrar</h1>
              <p className="text-gray-400 mt-2">
                Bem-vindo(a) de volta!
              </p>
            </div>
            
            {serverError && (
              <Alert variant="error" className="mb-4" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <FormControl 
                label="E-mail" 
                htmlFor="email" 
                error={errors.email}
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  icon={<FiMail />}
                  autoComplete="email"
                  fullWidth
                  required
                />
              </FormControl>
              
              <FormControl 
                label="Senha" 
                htmlFor="password" 
                error={errors.password}
              >
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={handleChange}
                    icon={<FiLock />}
                    autoComplete="current-password"
                    fullWidth
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </FormControl>
              
              <div className="flex justify-end mb-6">
                <Link href="/auth/forgot-password" legacyBehavior>
                  <a className="text-sm text-phanteon-orange hover:underline">
                    Esqueceu a senha?
                  </a>
                </Link>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                fullWidth
                className="mb-4"
              >
                Entrar
              </Button>
              
              <div className="relative flex items-center justify-center my-4">
                <div className="border-b border-phanteon-light w-full"></div>
                <div className="text-sm text-gray-400 px-4 bg-phanteon-gray absolute">ou</div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                fullWidth
                className="bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border-[#5865F2]/30"
                onClick={handleDiscordLogin}
              >
                <FaDiscord className="mr-2" /> Continuar com Discord
              </Button>
            </form>
            
            <div className="text-center mt-6">
              <p className="text-gray-400">
                Não tem uma conta?{' '}
                <Link href="/auth/register" legacyBehavior>
                  <a className="text-phanteon-orange hover:underline">Criar Conta</a>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}