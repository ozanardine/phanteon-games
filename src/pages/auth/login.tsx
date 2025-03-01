// src/pages/auth/login.tsx
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaDiscord, FaSteam, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInWithEmail, signUpWithEmail, signInWithDiscord, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, firstName, lastName);
      }
      // Redirecionamento é feito pelo hook de autenticação
    } catch (err) {
      console.error('Erro de autenticação:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      await signInWithDiscord();
      // Redirecionamento é feito pelo provedor OAuth
    } catch (err) {
      console.error('Erro ao autenticar com Discord:', err);
    }
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
                  width={64}
                  height={64}
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

          {error && (
            <div className="mb-6 p-3 bg-red-900/50 border border-red-800 rounded-md text-sm text-white">
              {error}
            </div>
          )}

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
                  type="password"
                  required
                  className="bg-zinc-900 border border-zinc-700 text-white rounded-md pl-10 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder={isLogin ? 'Sua senha' : 'Crie uma senha'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
                <div className="text-sm">
                  <Link href="/auth/forgot-password" className="text-amber-500 hover:text-amber-400">
                    Esqueceu a senha?
                  </Link>
                </div>
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