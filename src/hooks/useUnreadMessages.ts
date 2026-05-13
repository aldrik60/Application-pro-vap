import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const LAST_READ_KEY = 'provap_messages_last_read'

/**
 * Compte les push messages reçus depuis la dernière visite de /messages.
 * Stockage en localStorage (un timestamp par appareil, simple et suffisant).
 */
export function useUnreadMessages(userId: string | undefined) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(0)
      return
    }
    let cancelled = false
    const lastReadRaw = localStorage.getItem(LAST_READ_KEY)
    const lastRead = lastReadRaw ? new Date(parseInt(lastReadRaw, 10)).toISOString() : new Date(0).toISOString()

    supabase.from('push_messages')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', lastRead)
      .then(({ count: c }) => {
        if (!cancelled) setCount(c ?? 0)
      })
    return () => { cancelled = true }
  }, [userId])

  return count
}
