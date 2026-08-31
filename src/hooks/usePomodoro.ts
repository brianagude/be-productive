'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  PomodoroSettings,
  getPomodoroSettings,
  savePomodoroSettings,
  addFocusSession,
} from '@/lib/pomodoroStorage'

export type PomodoroPhase = 'idle' | 'work' | 'break' | 'paused' | 'prompt'

export interface UsePomodoroReturn {
  phase: PomodoroPhase
  secondsLeft: number
  totalSeconds: number
  settings: PomodoroSettings
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  skipBreak: () => void
  continueWork: () => void
  updateSettings: (s: PomodoroSettings) => void
}

function beep(ctx: AudioContext, frequency: number, duration: number, startTime: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.3, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

function playWorkDone(ctx: AudioContext) {
  const t = ctx.currentTime
  beep(ctx, 880, 0.3, t)
  beep(ctx, 880, 0.3, t + 0.4)
}

function playBreakDone(ctx: AudioContext) {
  beep(ctx, 660, 0.3, ctx.currentTime)
}

// Soft two-note chime played once near the end of the break
function playAmbientChime(ctx: AudioContext) {
  const t = ctx.currentTime
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.type = 'sine'
  osc1.frequency.value = 392 // G4
  gain1.gain.setValueAtTime(0.12, t)
  gain1.gain.exponentialRampToValueAtTime(0.001, t + 2.0)
  osc1.start(t)
  osc1.stop(t + 2.0)

  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.type = 'sine'
  osc2.frequency.value = 523.25 // C5
  gain2.gain.setValueAtTime(0.001, t + 0.3)
  gain2.gain.linearRampToValueAtTime(0.1, t + 0.4)
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 2.3)
  osc2.start(t + 0.3)
  osc2.stop(t + 2.3)
}

function sendNotification(title: string, body: string) {
  if (typeof window === 'undefined') return
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  }
}

export function usePomodoro(): UsePomodoroReturn {
  const [phase, setPhase] = useState<PomodoroPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [settings, setSettings] = useState<PomodoroSettings>(() => getPomodoroSettings())

  const phaseRef = useRef<PomodoroPhase>('idle')
  const totalSecondsRef = useRef(0)
  const settingsRef = useRef(settings)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Wall-clock refs so tab-throttling can't drift the countdown
  const endTimeRef = useRef<number>(0)
  const remainingSecondsRef = useRef<number>(0)

  useEffect(() => {
    phaseRef.current = phase
    totalSecondsRef.current = totalSeconds
    settingsRef.current = settings
  })

  const handlePhaseCompleteRef = useRef<() => void>(() => {})

  const handlePhaseComplete = useCallback(() => {
    const currentPhase = phaseRef.current
    const ctx = audioCtxRef.current

    if (currentPhase === 'work') {
      addFocusSession(settingsRef.current.workMins)
      if (ctx) playWorkDone(ctx)
      sendNotification('Work session complete!', 'Time for a break.')
      const breakSecs = settingsRef.current.breakMins * 60
      endTimeRef.current = Date.now() + breakSecs * 1000
      setTotalSeconds(breakSecs)
      setSecondsLeft(breakSecs)
      setPhase('break')
    } else if (currentPhase === 'break') {
      if (ctx) playBreakDone(ctx)
      sendNotification('Break over!', 'Ready for another session?')
      setPhase('prompt')
      setSecondsLeft(0)
      setTotalSeconds(0)
    }
  }, [])

  useEffect(() => {
    handlePhaseCompleteRef.current = handlePhaseComplete
  }, [handlePhaseComplete])

  // Countdown interval (work + break)
  useEffect(() => {
    if (phase !== 'work' && phase !== 'break') return

    const id = setInterval(() => {
      const secs = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000))
      setSecondsLeft(secs)
      if (secs <= 0) {
        clearInterval(id)
        setTimeout(() => handlePhaseCompleteRef.current(), 0)
      }
    }, 500)

    return () => clearInterval(id)
  }, [phase])

  // Ambient chime once at the 1-minute break warning
  const chimePlayedRef = useRef(false)
  useEffect(() => {
    if (phase === 'break') chimePlayedRef.current = false
  }, [phase])

  useEffect(() => {
    if (phase !== 'break' || chimePlayedRef.current) return
    if (secondsLeft <= 60 && secondsLeft > 0) {
      chimePlayedRef.current = true
      const ctx = audioCtxRef.current
      if (ctx) playAmbientChime(ctx)
    }
  }, [phase, secondsLeft])

  // Countdown in the tab title while active
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (phase === 'idle' || phase === 'prompt') {
      document.title = 'Be Productive'
      return () => { document.title = 'Be Productive' }
    }
    const m = Math.floor(secondsLeft / 60)
    const s = secondsLeft % 60
    const label = phase === 'work' ? 'Work' : phase === 'break' ? 'Break' : 'Paused'
    document.title = `${m}:${s.toString().padStart(2, '0')} · ${label} · Be Productive`
    return () => { document.title = 'Be Productive' }
  }, [phase, secondsLeft])

  const start = useCallback(() => {
    // AudioContext must be created in a user gesture (iOS)
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    const secs = settingsRef.current.workMins * 60
    endTimeRef.current = Date.now() + secs * 1000
    setTotalSeconds(secs)
    setSecondsLeft(secs)
    setPhase('work')
  }, [])

  const pause = useCallback(() => {
    remainingSecondsRef.current = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000))
    setPhase('paused')
  }, [])

  const resume = useCallback(() => {
    endTimeRef.current = Date.now() + remainingSecondsRef.current * 1000
    setPhase('work')
  }, [])

  const stop = useCallback(() => {
    const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000))
    const total = totalSecondsRef.current
    const elapsed = total - (phaseRef.current === 'paused' ? remainingSecondsRef.current : remaining)
    if ((phaseRef.current === 'work' || phaseRef.current === 'paused') && elapsed > 0) {
      addFocusSession(elapsed / 60)
    }
    setPhase('idle')
    setSecondsLeft(0)
    setTotalSeconds(0)
  }, [])

  const skipBreak = useCallback(() => {
    setPhase('idle')
    setSecondsLeft(0)
    setTotalSeconds(0)
  }, [])

  const continueWork = useCallback(() => {
    const secs = settingsRef.current.workMins * 60
    endTimeRef.current = Date.now() + secs * 1000
    setTotalSeconds(secs)
    setSecondsLeft(secs)
    setPhase('work')
  }, [])

  const updateSettings = useCallback((s: PomodoroSettings) => {
    setSettings(s)
    savePomodoroSettings(s)
  }, [])

  return {
    phase,
    secondsLeft,
    totalSeconds,
    settings,
    start,
    pause,
    resume,
    stop,
    skipBreak,
    continueWork,
    updateSettings,
  }
}
