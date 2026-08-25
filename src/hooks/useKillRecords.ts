import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'boss-timer-records-v1'

/** key: `${bossId}:${line}` -> 击杀时间戳(ms) */
export type KillRecords = Record<string, number>

function load(): KillRecords {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as KillRecords
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export const recordKey = (bossId: string, line: number) => `${bossId}:${line}`

export function useKillRecords() {
  const [records, setRecords] = useState<KillRecords>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    } catch {
      // 存储失败时静默忽略，不影响使用
    }
  }, [records])

  const recordKill = useCallback((bossId: string, line: number) => {
    setRecords((prev) => ({ ...prev, [recordKey(bossId, line)]: Date.now() }))
  }, [])

  const clearRecord = useCallback((bossId: string, line: number) => {
    setRecords((prev) => {
      const next = { ...prev }
      delete next[recordKey(bossId, line)]
      return next
    })
  }, [])

  const clearBoss = useCallback((bossId: string) => {
    setRecords((prev) => {
      const next: KillRecords = {}
      for (const [k, v] of Object.entries(prev)) {
        if (!k.startsWith(`${bossId}:`)) next[k] = v
      }
      return next
    })
  }, [])

  const clearAll = useCallback(() => setRecords({}), [])

  return { records, recordKill, clearRecord, clearBoss, clearAll }
}
