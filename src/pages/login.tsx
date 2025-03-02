import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import { signInWithEmail, signInWithDiscord } from '@/utils/authHelpers';
import { FaDiscord } from 'react-icons/fa';
import { useAuth } from '@/components/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  // Redirecionar se já estiver autenticado
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signInWithEmail(email, password);
      
      if (error) {
        throw new Error(error.message);
      }
      
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Email ou senha incorretos. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDiscordLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithDiscord();
    } catch (err) {
      console.error('Discord login error:', err);
      setError('Erro ao fazer login com Discord. Por favor, tente novamente.');
      setIsLoading(false);
    }
  };
  
  return (
    <Layout title="Login | Phanteon Games">
      <div className="max-w-md mx-auto p-4 my-10">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-white">Entrar na sua conta</h1>
            <p className="text-gray-400 mt-1">
              Entre com sua conta para acessar os servidores e recursos VIP.
            </p>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert type="error" className="mb-4">
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleEmailLogin}>
              <Input
                type="email"
                label="Email"
                placeholder="seu-email@exemplo.com"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              
              <Input
                type="password"
                label="Senha"
                placeholder="Sua senha"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              
              <Button
                type="submit"
                fullWidth
                disabled={isLoading}
                className="mt-2"
              >
                {isLoading ? <Loading className="mr-2" /> : null}
                Entrar
              </Button>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-phanteon-light"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-phanteon-gray text-gray-400">
                    Ou continue com
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                  variant="secondary"
                  onClick={handleDiscordLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center"
                >
                  <FaDiscord className="w-5 h-5 mr-2" />
                  Discord
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-400">
              Não tem uma conta?{' '}
              <Link href="/register" className="text-phanteon-orange hover:underline">
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}