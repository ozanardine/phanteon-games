'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/supabase/database.types'

// Cliente Supabase para uso em componentes do lado do cliente
export const createClient = () => {
  return createClientComponentClient<Database>()
}

export default createClientComponentClient<Database>() 