import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import { signUpWithEmail, signInWithDiscord, signInWithSteam } from '@/utils/authHelpers';
import { FaDiscord } from 'react-icons/fa';
import { useAuth } from '@/components/contexts/AuthContext';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
  
  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return false;
    }
    
    if (username.length < 3) {
      setError('O nome de usuário deve ter pelo menos 3 caracteres.');
      return false;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return false;
    }
    
    return true;
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signUpWithEmail(email, password, username);
      
      if (error) {
        throw new Error(error.message);
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Register error:', err);
      
      if (err.message.includes('email')) {
        setError('Este email já está sendo usado. Por favor, tente outro email ou faça login.');
      } else {
        setError('Erro ao criar conta. Por favor, tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDiscordRegister = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithDiscord();
    } catch (err) {
      console.error('Discord register error:', err);
      setError('Erro ao criar conta com Discord. Por favor, tente novamente.');
      setIsLoading(false);
    }
  };
  
  const handleSteamRegister = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithSteam();
    } catch (err) {
      console.error('Steam register error:', err);
      setError('Erro ao criar conta com Steam. Por favor, tente novamente.');
      setIsLoading(false);
    }
  };
  
  return (
    <Layout title="Criar Conta | Phanteon Games">
      <div className="max-w-md mx-auto p-4 my-10">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-white">Criar uma conta</h1>
            <p className="text-gray-400 mt-1">
              Crie sua conta para acessar os servidores e recursos VIP.
            </p>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert type="error" className="mb-4">
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleRegister}>
              <Input
                label="Nome de usuário"
                placeholder="Seu nome de usuário"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
              
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
              
              <Input
                type="password"
                label="Confirmar senha"
                placeholder="Confirme sua senha"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              
              <Button
                type="submit"
                fullWidth
                disabled={isLoading}
                className="mt-2"
              >
                {isLoading ? <Loading className="mr-2" /> : null}
                Criar conta
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
                  onClick={handleDiscordRegister}
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
              Já tem uma conta?{' '}
              <Link href="/login" className="text-phanteon-orange hover:underline">
                Entrar
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}