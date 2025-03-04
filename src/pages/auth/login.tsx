import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { FormControl } from '@/components/ui/FormControl';
import { useAuth } from '@/contexts/AuthContext';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const router = useRouter();
  const { redirect, error: routerError } = router.query;
  const { user, isLoading } = useAuth();

  // Se já estiver autenticado, redirecionar
  useEffect(() => {
    if (user) {
      router.push(typeof redirect === 'string' ? redirect : '/home');
    }
    
    if (routerError) {
      setError(decodeURIComponent(routerError as string));
    }
  }, [user, router, redirect, routerError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    setError(null);
    setIsLoggingIn(true);
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        if (result.error.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos.');
        } else {
          setError(result.error);
        }
      } else if (result?.ok) {
        router.push(typeof redirect === 'string' ? redirect : '/home');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDiscordLogin = async () => {
    await signIn('discord', { 
      callbackUrl: typeof redirect === 'string' ? redirect : '/home' 
    });
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
            
            {error && (
              <div className="mb-4">
                <Alert variant="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <FormControl 
                label="E-mail" 
                htmlFor="email"
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<FiMail />}
                  autoComplete="email"
                  fullWidth
                  required
                />
              </FormControl>
              
              <FormControl 
                label="Senha" 
                htmlFor="password"
              >
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                isLoading={isLoggingIn || isLoading}
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
                isLoading={isLoading}
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