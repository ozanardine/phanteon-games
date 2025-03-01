// src/pages/auth/login.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaDiscord, FaSteam, FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInWithEmail, signUpWithEmail, signInWithDiscord, signInWithSteam, error, sendPasswordResetEmail } = useAuth();
  const router = useRouter();
  const { redirect } = router.query;

  // Exibir erros como toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
        toast.success('Login bem-sucedido!');
      } else {
        await signUpWithEmail(email, password, firstName, lastName);
        toast.success('Conta criada com sucesso!');
      }
      
      // Redirecionamento condicional baseado no parâmetro redirect
      if (typeof redirect === 'string') {
        router.push(redirect);
      }
    } catch (err) {
      console.error('Authentication error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      await signInWithDiscord();
    } catch (err) {
      console.error('Error authenticating with Discord:', err);
    }
  };

  const handleSteamLogin = async () => {
    try {
      await signInWithSteam();
    } catch (err) {
      console.error('Error authenticating with Steam:', err);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Por favor, informe seu email');
      return;
    }

    try {
      await sendPasswordResetEmail(email);
      toast.success('Email de redefinição de senha enviado! Verifique sua caixa de entrada.');
    } catch (err) {
      console.error('Error sending password reset email:', err);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Layout
      title={isLogin ? 'Login - Phanteon Games' : 'Criar Conta - Phanteon Games'}
      description="Entre na sua conta ou crie uma nova para acessar os recursos exclusivos do servidor Phanteon Games."
    >
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="max-w-md w-full shadow-xl">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 relative">
                <Image
                  src="/logo.png"
                  alt="Phanteon Games Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              {isLogin ? 'Bem-vindo de volta!' : 'Criar Conta'}
            </h1>
            <p className="text-zinc-400 text-sm">
              {isLogin
                ? 'Entre com sua conta para acessar o painel do jogador'
                : 'Registre-se para acessar recursos exclusivos da comunidade'}
            </p>
          </div>
          
          <div className="space-y-4 mb-6">
            <Button 
              fullWidth
              variant="outline"
              className="border-indigo-600 hover:bg-indigo-600"
              leftIcon={<FaDiscord />}
              onClick={handleDiscordLogin}
            >
              Continuar com Discord
            </Button>
            <Button 
              fullWidth
              variant="outline"
              className="border-blue-600 hover:bg-blue-600"
              leftIcon={<FaSteam />}
              onClick={handleSteamLogin}
            >
              Continuar com Steam
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-zinc-800 text-zinc-400">Ou continue com e-mail</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-zinc-400 mb-1">
                    Nome
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-zinc-500" />
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      required
                      className="bg-zinc-900 border border-zinc-700 text-white rounded-md pl-10 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Nome"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-zinc-400 mb-1">
                    Sobrenome
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Sobrenome"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-zinc-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  className="bg-zinc-900 border border-zinc-700 text-white rounded-md pl-10 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-1">
                Senha
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
                  placeholder={isLogin ? 'Sua senha' : 'Crie uma senha'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-zinc-700 rounded bg-zinc-900"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-400">
                    Lembrar-me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-amber-500 hover:text-amber-400"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isSubmitting}>
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
            <button
              type="button"
              className="text-amber-500 hover:text-amber-400"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Criar conta' : 'Entrar'}
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default LoginPage;