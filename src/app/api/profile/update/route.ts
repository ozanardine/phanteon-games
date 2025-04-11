import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Impedir que esta rota seja processada estaticamente
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login novamente.' },
        { status: 401 }
      )
    }
    
    const { username } = await request.json()
    
    if (!username || username.trim() === '') {
      return NextResponse.json(
        { error: 'Nome de usuário não pode estar vazio' },
        { status: 400 }
      )
    }
    
    // Verificar se o nome de usuário já está em uso (exceto pelo usuário atual)
    const { data: existingUsers, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', session.user.id)
    
    if (checkError) {
      console.error('Erro ao verificar username:', checkError)
      return NextResponse.json(
        { error: 'Erro ao verificar disponibilidade do nome de usuário' },
        { status: 500 }
      )
    }
    
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Este nome de usuário já está em uso' },
        { status: 400 }
      )
    }
    
    // Atualizar o perfil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
    
    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 