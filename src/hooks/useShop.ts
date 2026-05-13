import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ShopData } from '../types'

export function useShop(shopName: string | null | undefined) {
  const [shop, setShop] = useState<ShopData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!shopName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShop(null)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('shops')
      .select('*')
      .eq('name', shopName)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        setShop(data ?? null)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [shopName])

  return { shop, loading }
}
