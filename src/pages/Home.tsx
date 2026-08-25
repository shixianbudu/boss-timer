import { useEffect, useMemo, useRef, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BOSSES, formatCountdown, respawnMs } from '@/lib/bosses'
import { recordKey, useKillRecords } from '@/hooks/useKillRecords'
import { useNow } from '@/hooks/useNow'
import BossPanel from '@/sections/BossPanel'
import '../App.css'

/** 简易提示音（WebAudio，无需音频文件） */
function playBeep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 880
    g.gain.setValueAtTime(0.001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.7)
    o.onended = () => void ctx.close()
  } catch {
    // 浏览器未授权音频时忽略
  }
}

interface UpcomingItem {
  bossId: string
  bossName: string
  icon: string
  line: number
  remaining: number
}

export default function Home() {
  const now = useNow()
  const { records, recordKill, clearRecord, clearBoss, clearAll } = useKillRecords()
  const [soundOn, setSoundOn] = useState(true)
  const alertedRef = useRef<Set<string>>(new Set())

  const bossMap = useMemo(() => new Map(BOSSES.map((b) => [b.id, b])), [])

  // 计算各 boss 的活跃计时数量 & 全局限时将刷新列表
  const { activeByBoss, upcoming } = useMemo(() => {
    const activeByBoss = new Map<string, number>()
    const items: UpcomingItem[] = []
    for (const [key, killAt] of Object.entries(records)) {
      const sep = key.indexOf(':')
      const bossId = key.slice(0, sep)
      const line = Number(key.slice(sep + 1))
      const boss = bossMap.get(bossId)
      if (!boss) continue
      activeByBoss.set(bossId, (activeByBoss.get(bossId) ?? 0) + 1)
      const remaining = killAt + respawnMs(boss) - now
      if (remaining > 0) items.push({ bossId, bossName: boss.name, icon: boss.icon, line, remaining })
    }
    items.sort((a, b) => a.remaining - b.remaining)
    return { activeByBoss, upcoming: items.slice(0, 6) }
  }, [records, now, bossMap])

  // 到点提示音：只在从 >0 跨到 <=0 的瞬间响一次
  useEffect(() => {
    if (!soundOn) return
    for (const [key, killAt] of Object.entries(records)) {
      const sep = key.indexOf(':')
      const boss = bossMap.get(key.slice(0, sep))
      if (!boss) continue
      const remaining = killAt + respawnMs(boss) - now
      if (remaining <= 0 && !alertedRef.current.has(key)) {
        alertedRef.current.add(key)
        playBeep()
      } else if (remaining > 0 && alertedRef.current.has(key)) {
        // 重新击杀后重置，下次到点再响
        alertedRef.current.delete(key)
      }
    }
  }, [records, now, soundOn, bossMap])

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-[1600px] px-4 py-5">
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-wide">
            <span className="mr-2">⚔️</span>Boss 刷新倒计时
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundOn((v) => !v)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                soundOn
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                  : 'border-neutral-700 bg-neutral-800 text-neutral-400'
              }`}
              title="Boss 刷新时播放提示音"
            >
              {soundOn ? '🔔 提示音开' : '🔕 提示音关'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('确定清除所有 Boss 的全部记录吗？')) clearAll()
              }}
              className="rounded-md border border-red-900 bg-red-950/50 px-3 py-1.5 text-sm text-red-300 hover:bg-red-900/50"
            >
              全部清空
            </button>
          </div>
        </header>

        {upcoming.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-2">
            <span className="text-xs font-semibold text-neutral-400">即将刷新：</span>
            {upcoming.map((u) => {
              const danger = u.remaining < 5 * 60 * 1000
              return (
                <span
                  key={recordKey(u.bossId, u.line)}
                  className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${
                    danger ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/15 text-emerald-300'
                  }`}
                >
                  {u.icon} {u.bossName} · {u.line}线 · {formatCountdown(u.remaining)}
                </span>
              )
            })}
          </div>
        )}

        <Tabs defaultValue={BOSSES[0].id}>
          <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-1 bg-neutral-900 p-1">
            {BOSSES.map((boss) => {
              const active = activeByBoss.get(boss.id) ?? 0
              return (
                <TabsTrigger
                  key={boss.id}
                  value={boss.id}
                  className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
                >
                  <span className="mr-1">{boss.icon}</span>
                  {boss.name}
                  <span className="ml-1.5 rounded bg-black/30 px-1 font-mono text-[10px] text-neutral-400">
                    {boss.respawnMinutes >= 60 ? `${boss.respawnMinutes / 60}h` : `${boss.respawnMinutes}m`}
                  </span>
                  {active > 0 && (
                    <span className="ml-1 rounded-full bg-emerald-500/25 px-1.5 text-[10px] font-semibold text-emerald-300">
                      {active}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {BOSSES.map((boss) => (
            <TabsContent key={boss.id} value={boss.id}>
              <BossPanel
                boss={boss}
                records={records}
                now={now}
                onKill={recordKill}
                onClear={clearRecord}
                onClearBoss={clearBoss}
              />
            </TabsContent>
          ))}
        </Tabs>

        <footer className="mt-6 text-center text-xs text-neutral-600">
          点击卡片记录击杀时间并开始倒计时 · 再次点击重新计时 · 点 × 清除单条 · 数据保存在本机浏览器
        </footer>
      </div>
    </div>
  )
}
