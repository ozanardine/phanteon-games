import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { FormControl } from '@/components/ui/FormControl';
import { updatePassword } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const router = useRouter();

  // Verificar se há erro na URL
  useEffect(() => {
    const { error } = router.query;
    if (error) {
      setError(decodeURIComponent(error as string));
    }
  }, [router.query]);

  const validateForm = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await updatePassword(password);
      
      if (error) {
        throw error;
      }
      
      setSuccessMessage('Senha atualizada com sucesso!');
      
      // Redirecionar após alguns segundos
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('Update password error:', error);
      setError(error.message || 'Erro ao atualizar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Redefinir Senha" 
      description="Defina uma nova senha para sua conta."
    >
      <div className="w-full max-w-md">
        <div className="bg-phanteon-gray rounded-lg border border-phanteon-light overflow-hidden shadow-lg">
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">Redefinir Senha</h1>
              <p className="text-gray-400 mt-2">
                Escolha uma nova senha para sua conta
              </p>
            </div>
            
            {error && (
              <div className="mb-4">
                <Alert variant="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              </div>
            )}
            
            {successMessage ? (
              <div className="text-center">
                <div className="mb-6">
                  <Alert variant="success">
                    {successMessage}
                  </Alert>
                </div>
                
                <p className="text-gray-400 mb-4">
                  Redirecionando para a página de login...
                </p>
                
                <Link href="/auth/login" legacyBehavior>
                  <a className="text-phanteon-orange hover:underline">
                    Ir para o login
                  </a>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <FormControl 
                  label="Nova Senha" 
                  htmlFor="password"
                >
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nova senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={<FiLock />}
                      autoComplete="new-password"
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
                
                <FormControl 
                  label="Confirmar Nova Senha" 
                  htmlFor="confirmPassword"
                >
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      icon={<FiLock />}
                      autoComplete="new-password"
                      fullWidth
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </FormControl>
                
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  fullWidth
                  className="mt-6"
                >
                  Redefinir Senha
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