'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { FaUser, FaEnvelope, FaSignOutAlt, FaCog, FaUserEdit } from 'react-icons/fa'

export default function ProfilePage() {
  const { user, profile, signOut, isLoading, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }

    if (profile) {
      setUsername(profile.username || '')
    }
  }, [isLoading, user, router, profile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const { error } = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
        }),
      }).then(res => res.json())
      
      if (error) {
        throw new Error(error)
      }
      
      await refreshProfile()
      setSuccessMessage('Perfil atualizado com sucesso!')
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil')
    } finally {
      setIsSaving(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-intense-orange"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Seu Perfil</h1>
        <p className="text-gray-300">
          Gerencie suas informações e preferências
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-olive-green/30 border border-olive-green text-white px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="bg-dark-green-black border border-olive-green rounded-lg p-6">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 bg-olive-green rounded-full flex items-center justify-center mb-4">
              <FaUser className="text-4xl text-white" />
            </div>
            <h2 className="text-xl font-bold mb-1">{profile?.username || user?.email?.split('@')[0]}</h2>
            <p className="text-gray-400 text-sm mb-4">{user?.email}</p>
            
            <div className="w-full pt-4 border-t border-olive-green mt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-2 mb-2 flex items-center justify-center gap-2 bg-olive-green rounded-md text-white hover:bg-olive-green/80 transition-colors"
              >
                <FaUserEdit />
                <span>Editar Perfil</span>
              </button>
              
              <button
                onClick={signOut}
                className="w-full py-2 flex items-center justify-center gap-2 bg-red-700 rounded-md text-white hover:bg-red-800 transition-colors"
              >
                <FaSignOutAlt />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="md:col-span-2">
          {isEditing ? (
            <div className="bg-dark-green-black border border-olive-green rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaUserEdit className="text-olive-green" />
                Editar Perfil
              </h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-1">
                    Nome de Usuário
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <FaUser />
                    </div>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-dark-green-black/50 border border-olive-green text-white py-2 pl-10 pr-4 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-intense-orange"
                      placeholder="Seu nome de usuário"
                    />
                  </div>
                </div>

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
                      value={user?.email || ''}
                      disabled
                      className="bg-dark-green-black/30 border border-olive-green/50 text-gray-400 py-2 pl-10 pr-4 rounded-md w-full cursor-not-allowed"
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-1">O email não pode ser alterado</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`py-2 px-4 rounded-md bg-intense-orange text-white font-medium transition-colors ${
                      isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-intense-orange/90'
                    }`}
                  >
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setUsername(profile?.username || '')
                    }}
                    className="py-2 px-4 rounded-md bg-gray-700 text-white font-medium hover:bg-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="bg-dark-green-black border border-olive-green rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FaUser className="text-olive-green" />
                  Informações da Conta
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Nome de Usuário</p>
                    <p className="text-lg">{profile?.username || 'Não definido'}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-lg">{user?.email}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Método de Login</p>
                    <p className="text-lg capitalize">
                      {user?.app_metadata?.provider || 'Email/Senha'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Membro desde</p>
                    <p className="text-lg">
                      {user?.created_at 
                        ? new Date(user.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-dark-green-black border border-olive-green rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FaCog className="text-olive-green" />
                  Plano de Assinatura
                </h3>
                
                <div className="p-4 bg-dark-green-black/50 border border-dashed border-olive-green rounded-lg text-center">
                  <p className="text-lg mb-2">Você não possui uma assinatura ativa</p>
                  <p className="text-gray-400 mb-4">Assine um plano para ter acesso a benefícios exclusivos</p>
                  <a
                    href="/planos"
                    className="inline-block py-2 px-6 bg-intense-orange hover:bg-intense-orange/90 text-white font-medium rounded-md transition-colors"
                  >
                    Ver Planos
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 