import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { AuthLayout } from '@/components/layout/MainLayout';
import { Button, Input, Alert, FormControl } from '@/components/ui/Button';
import { resetPassword } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setServerError('Por favor, informe um e-mail válido.');
      return;
    }
    
    setIsLoading(true);
    setServerError(null);
    
    try {
      const { data, error } = await resetPassword(email);
      
      if (error) {
        throw error;
      }
      
      setSuccessMessage(`E-mail de recuperação enviado para ${email}. Verifique sua caixa de entrada.`);
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      setServerError(error.message || 'Erro ao solicitar redefinição de senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Recuperar Senha" 
      description="Esqueceu sua senha? Recupere o acesso à sua conta."
    >
      <div className="w-full max-w-md">
        <div className="bg-phanteon-gray rounded-lg border border-phanteon-light overflow-hidden shadow-lg">
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">Recuperar Senha</h1>
              <p className="text-gray-400 mt-2">
                Enviaremos um link para redefinir sua senha
              </p>
            </div>
            
            {serverError && (
              <Alert variant="error" className="mb-4" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            )}
            
            {successMessage ? (
              <div className="text-center">
                <Alert variant="success" className="mb-6">
                  {successMessage}
                </Alert>
                
                <p className="text-gray-400 mb-4">
                  Não recebeu o e-mail? Verifique sua pasta de spam ou tente novamente.
                </p>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSuccessMessage(null);
                    setEmail('');
                  }}
                  className="mb-4"
                >
                  Tentar novamente
                </Button>
                
                <div className="mt-4">
                  <Link href="/auth/login" legacyBehavior>
                    <a className="text-phanteon-orange hover:underline flex items-center justify-center">
                      <FiArrowLeft className="mr-2" /> Voltar para o login
                    </a>
                  </Link>
                </div>
              </div>
            ) : (
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
                
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  fullWidth
                  className="mt-4"
                >
                  Enviar Link de Recuperação
                </Button>
                
                <div className="text-center mt-6">
                  <Link href="/auth/login" legacyBehavior>
                    <a className="text-phanteon-orange hover:underline flex items-center justify-center">
                      <FiArrowLeft className="mr-2" /> Voltar para o login
                    </a>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}