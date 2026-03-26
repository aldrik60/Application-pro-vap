import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ShopData } from '../types'

export function useShop(shopName: string | null | undefined) {
  const [shop, setShop] = useState<ShopData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!shopName) {
      setShop(null)
      return
    }
    setLoading(true)
    supabase
      .from('shops')
      .select('*')
      .eq('name', shopName)
      .single()
      .then(({ data }) => {
        setShop(data ?? null)
        setLoading(false)
      })
  }, [shopName])

  return { shop, loading }
}
