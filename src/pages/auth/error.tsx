import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaExclamationTriangle } from 'react-icons/fa';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';

export default function AuthErrorPage() {
  const router = useRouter();
  const { error } = router.query;

  // Mapeamento de códigos de erro para mensagens amigáveis
  const errorMessages: Record<string, string> = {
    Configuration: "Houve um problema na configuração do serviço de autenticação. Por favor, tente novamente mais tarde.",
    AccessDenied: "Acesso negado. Você não tem permissão para esta operação.",
    Verification: "O link de verificação expirou ou já foi usado.",
    Default: "Ocorreu um erro durante a autenticação. Por favor, tente novamente.",
    OAuthSignin: "Não foi possível iniciar o processo de login OAuth.",
    OAuthCallback: "Ocorreu um erro no retorno da autenticação OAuth.",
    OAuthCreateAccount: "Não foi possível criar uma conta com este provedor OAuth.",
    EmailCreateAccount: "Não foi possível criar uma conta com este e-mail.",
    Callback: "Ocorreu um erro durante o callback de autenticação.",
    OAuthAccountNotLinked: "Este e-mail já está associado a outra conta.",
    EmailSignin: "Não foi possível enviar o e-mail de login.",
    CredentialsSignin: "Falha no login. Verifique seus dados e tente novamente.",
    SessionRequired: "Esta página requer que você esteja autenticado.",
  };

  const errorMessage = error ? errorMessages[error as string] || errorMessages.Default : errorMessages.Default;

  return (
    <AuthLayout 
      title="Erro de Autenticação" 
      description="Ocorreu um erro durante o processo de autenticação."
    >
      <div className="w-full max-w-md">
        <div className="bg-phanteon-gray rounded-lg border border-red-500/30 overflow-hidden shadow-lg">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-red-500 text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Erro de Autenticação</h1>
            <p className="text-gray-300 mb-6">
              {errorMessage}
            </p>
            <div className="flex flex-col space-y-4">
              <Link href="/auth/login" passHref>
                <Button variant="primary" fullWidth>
                  Voltar ao Login
                </Button>
              </Link>
              {error === 'Configuration' && (
                <p className="text-sm text-gray-400">
                  Código de erro: {error}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}