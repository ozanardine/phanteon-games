import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/supabase/database.types'
import { cache } from 'react'

// Cliente Supabase para uso em componentes do lado do servidor
// Utilizando cache para evitar múltiplas instâncias durante o SSR
export const createClient = cache(() => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}) 