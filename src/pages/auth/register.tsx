import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { AuthLayout } from '@/components/layout/MainLayout';
import { Button, Input, Alert, FormControl } from '@/components/ui/Button';
import { signUp } from '@/lib/supabase';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpar erro ao editar o campo
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Nome de usuário é obrigatório';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Nome de usuário deve ter pelo menos 3 caracteres';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setServerError(null);
    
    try {
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        formData.username
      );
      
      if (error) {
        throw error;
      }
      
      setSuccessMessage('Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro.');
      
      // Redirecionar após alguns segundos
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      setServerError(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Criar Conta" 
      description="Crie sua conta na Phanteon Games e tenha acesso a recursos exclusivos."
    >
      <div className="w-full max-w-md">
        <div className="bg-phanteon-gray rounded-lg border border-phanteon-light overflow-hidden shadow-lg">
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">Criar Conta</h1>
              <p className="text-gray-400 mt-2">
                Junte-se à comunidade Phanteon Games
              </p>
            </div>
            
            {serverError && (
              <Alert variant="error" className="mb-4" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            )}
            
            {successMessage && (
              <Alert variant="success" className="mb-4">
                {successMessage}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <FormControl 
                label="Nome de usuário" 
                htmlFor="username" 
                error={errors.username}
              >
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Seu nome de usuário"
                  value={formData.username}
                  onChange={handleChange}
                  icon={<FiUser />}
                  autoComplete="username"
                  fullWidth
                  required
                />
              </FormControl>
              
              <FormControl 
                label="E-mail" 
                htmlFor="email" 
                error={errors.email}
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  icon={<FiMail />}
                  autoComplete="email"
                  fullWidth
                  required
                />
              </FormControl>
              
              <FormControl 
                label="Senha" 
                htmlFor="password" 
                error={errors.password}
              >
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={handleChange}
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
                label="Confirmar Senha" 
                htmlFor="confirmPassword" 
                error={errors.confirmPassword}
              >
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleChange}
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
                Criar Conta
              </Button>
            </form>
            
            <div className="text-center mt-4">
              <p className="text-gray-400">
                Já tem uma conta?{' '}
                <Link href="/auth/login" legacyBehavior>
                  <a className="text-phanteon-orange hover:underline">Entrar</a>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}