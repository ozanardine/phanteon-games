'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { FaDiscord, FaSteam, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'
import supabase from '@/lib/supabase/client'

// Impedir que esta página seja renderizada estaticamente
export const dynamic = 'force-dynamic'

// Componente separado que usa useSearchParams
function RegisteredAlert() {
  const searchParams = useSearchParams()
  // Verificar se o usuário acabou de se registrar
  const justRegistered = searchParams.get('registered') === 'true'
  
  if (!justRegistered) return null
  
  return (
    <div className="bg-olive-green/30 border border-olive-green text-white px-4 py-3 rounded mb-6">
      Sua conta foi criada com sucesso! Agora você pode fazer login.
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    const { error: signInError } = await signIn(email, password)
    
    if (signInError) {
      setError(signInError)
      setIsLoading(false)
      return
    }
    
    // Redirecionar para a página de perfil após login bem-sucedido
    router.push('/perfil')
  }

  const handleDiscordLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'identify email',
      }
    })
    
    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  const handleSteamLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'steam',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    
    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Entrar</h1>
        <p className="text-gray-300">
          Acesse sua conta Phanter Ops
        </p>
      </div>

      <Suspense fallback={null}>
        <RegisteredAlert />
      </Suspense>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Opções de Login Social */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleDiscordLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <FaDiscord className="h-5 w-5" />
            <span>Discord</span>
          </button>
          
          <button
            onClick={handleSteamLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
          >
            <FaSteam className="h-5 w-5" />
            <span>Steam</span>
          </button>
        </div>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-olive-green"></div>
          <span className="mx-4 text-gray-400 text-sm">ou</span>
          <div className="flex-grow border-t border-olive-green"></div>
        </div>

        {/* Login com email/senha */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <FaEnvelope />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-dark-green-black border border-olive-green text-white py-2 pl-10 pr-4 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-intense-orange"
                placeholder="seu.email@exemplo.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <FaLock />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-dark-green-black border border-olive-green text-white py-2 pl-10 pr-10 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-intense-orange"
                placeholder="********"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-md bg-intense-orange text-white font-medium transition-colors ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-intense-orange/90'
            }`}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-300">
            Não tem uma conta?{" "}
            <Link href="/registro" className="text-intense-orange hover:underline">
              Registre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 