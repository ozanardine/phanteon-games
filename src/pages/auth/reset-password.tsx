// src/pages/auth/reset-password.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaLock, FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword, error } = useAuth();
  const router = useRouter();

  // Pegar o token da URL quando disponível
  useEffect(() => {
    if (router.isReady) {
      const { token } = router.query;
      if (typeof token === 'string') {
        setToken(token);
      }
    }
  }, [router.isReady, router.query]);

  // Exibir erros como toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar senhas
    if (password !== confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }
    
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Chamar a função de redefinição de senha
      const success = await resetPassword(token, password);
      
      if (success) {
        setIsSuccess(true);
        toast.success('Senha alterada com sucesso!');
        
        // Redirecionar para a página de login após alguns segundos
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        toast.error('Não foi possível redefinir sua senha. Tente novamente.');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      toast.error('Erro ao redefinir senha. Tente novamente ou solicite um novo link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Layout
      title="Redefinir Senha - Phanteon Games"
      description="Redefina sua senha para acessar sua conta na Phanteon Games."
    >
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="max-w-md w-full shadow-xl">
          {isSuccess ? (
            <div className="text-center py-8 px-6">
              <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6">
                <FaCheck className="text-white text-3xl" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Senha Alterada!</h1>
              <p className="text-zinc-300 mb-6">
                Sua senha foi alterada com sucesso. Você será redirecionado para a página de login em instantes.
              </p>
              <Button
                onClick={() => router.push('/auth/login')}
              >
                Ir para Login
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-1">
                  Redefinir Senha
                </h1>
                <p className="text-zinc-400 text-sm">
                  Escolha uma nova senha para sua conta
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-1">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-zinc-500" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="bg-zinc-900 border border-zinc-700 text-white rounded-md pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Digite sua nova senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-400 mb-1">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-zinc-500" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      className="bg-zinc-900 border border-zinc-700 text-white rounded-md pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Confirme sua nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                    />
                  </div>
                </div>

                <Button type="submit" fullWidth isLoading={isSubmitting}>
                  Redefinir Senha
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-zinc-400">
                Lembrou sua senha?{' '}
                <Link
                  href="/auth/login"
                  className="text-amber-500 hover:text-amber-400"
                >
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;