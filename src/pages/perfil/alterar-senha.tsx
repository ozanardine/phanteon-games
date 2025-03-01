// src/pages/perfil/alterar-senha.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import AuthGuard from '@/components/auth/AuthGuard';
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Primeiro, garantir que a senha atual está correta fazendo login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: supabase.auth.getUser(),
        password: currentPassword
      });
      
      if (signInError) {
        throw new Error('Senha atual incorreta');
      }
      
      // Atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      toast.success('Senha alterada com sucesso!');
      
      // Aguardar um pouco e redirecionar
      setTimeout(() => {
        router.push('/perfil');
      }, 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error((error as Error).message || 'Falha ao alterar senha');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <Layout
        title="Alterar Senha - Phanteon Games"
        description="Altere sua senha de acesso à conta na Phanteon Games."
      >
        <div className="container mx-auto px-4 py-8 mt-6">
          <div className="max-w-md mx-auto">
            <div className="flex items-center mb-6">
              <button 
                onClick={() => router.back()}
                className="text-zinc-400 hover:text-zinc-200 mr-3"
              >
                <FaArrowLeft />
              </button>
              <h1 className="text-3xl font-bold">Alterar Senha</h1>
            </div>
            
            <Card>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-zinc-400 mb-1">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-zinc-500" />
                    </div>
                    <input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      className="bg-zinc-900 border border-zinc-700 text-white rounded-md pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Digite sua senha atual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
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
                  <label htmlFor="newPassword" className="block text-sm font-medium text-zinc-400 mb-1">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-zinc-500" />
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      className="bg-zinc-900 border border-zinc-700 text-white rounded-md pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Digite sua nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-400 mb-1">
                    Confirmar Nova Senha
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
                
                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/perfil')}
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    Alterar Senha
                  </Button>
                </div>
              </form>
            </Card>
            
            <div className="mt-6 p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-400">
              <h3 className="font-semibold text-zinc-300 mb-2">Dicas de Segurança:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use uma senha diferente para cada serviço online</li>
                <li>Combine letras maiúsculas, minúsculas, números e símbolos</li>
                <li>Evite informações pessoais facilmente adivinháveis</li>
                <li>Use senhas com pelo menos 8 caracteres</li>
              </ul>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default ChangePasswordPage;