// src/pages/auth/forgot-password.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaEnvelope, FaCheck } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { sendPasswordResetEmail, error } = useAuth();

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
      const success = await sendPasswordResetEmail(email);
      
      if (success) {
        setIsSuccess(true);
        toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (err) {
      console.error('Error sending password reset email:', err);
      toast.error('Erro ao enviar email de recuperação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout
      title="Recuperar Senha - Phanteon Games"
      description="Recupere o acesso à sua conta na Phanteon Games."
    >
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="max-w-md w-full shadow-xl">
          {isSuccess ? (
            <div className="text-center py-8 px-6">
              <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6">
                <FaCheck className="text-white text-3xl" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Email Enviado!</h1>
              <p className="text-zinc-300 mb-6">
                Enviamos um email com instruções para recuperar sua senha. Verifique sua caixa de entrada (e também o spam).
              </p>
              <div className="mt-2 text-sm text-zinc-400 mb-6">
                Não recebeu o email?{' '}
                <button
                  onClick={() => setIsSuccess(false)}
                  className="text-amber-500 hover:text-amber-400"
                >
                  Tentar novamente
                </button>
              </div>
              <Link href="/auth/login">
                <Button>
                  Voltar para Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
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
                  Esqueceu sua senha?
                </h1>
                <p className="text-zinc-400 text-sm">
                  Digite seu email e enviaremos instruções para recuperá-la
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <Button type="submit" fullWidth isLoading={isSubmitting}>
                  Enviar Instruções
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

export default ForgotPasswordPage;