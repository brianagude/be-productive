'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Observer } from 'gsap/Observer'
import { useDeckControl } from './deckControl'

gsap.registerPlugin(useGSAP, Observer)

export interface DeckItem {
  key: string
  content: ReactNode
}

/* ─── Fan tuning (desktop + mouse) ─────────────────────────────────────────
 *   GAP        — px of scroll that moves the fan by one card
 *   FAN_SPREAD — px between adjacent cards once fanned open
 *   FAN_DROP   — px a card sinks per step² off centre (the arc)
 *   FAN_TILT   — degrees a card leans per step off centre
 *   ROW_SCALE  — how much the cards shrink once fanned (1 = no shrink)
 *   REACH_BY_WIDTH — how many cards show each side of centre, by viewport width
 *   STACK_PEEK — px vertical offset per card deeper in the stack
 *   THROW / SNAP / SNAP_EASE — drag momentum + settle feel
 *   OVERSCROLL — how far (in cards) you can pull past the ends before it springs
 *   SLIDE      — carousel: % of card width a neighbour sits off-centre
 * ─────────────────────────────────────────────────────────────────────────── */
const GAP = 360
const FAN_SPREAD = 470
const FAN_DROP = 16
const FAN_TILT = 4
const ROW_SCALE = 0.82
const REACH_BY_WIDTH: Array<{ min: number; reach: number }> = [
  { min: 1850, reach: 3 },
  { min: 1440, reach: 2 },
]
const DEFAULT_REACH = 1
const STACK_PEEK = -10
const THROW = 0.2
const SNAP = 0.9
const SNAP_EASE = 'power2.out'
const OVERSCROLL = 0.55
const SLIDE = 108

type Mode = 'fan' | 'carousel'

/** Fan needs a wide viewport AND a real mouse; everything else gets the carousel. */
const detectMode = (): Mode => {
  if (typeof window === 'undefined') return 'carousel'
  const wide = window.matchMedia('(min-width: 1024px)').matches
  const touch = window.matchMedia('(any-pointer: coarse)').matches
  return wide && !touch ? 'fan' : 'carousel'
}

const detectReach = () => {
  if (typeof window === 'undefined') return DEFAULT_REACH
  for (const { min, reach } of REACH_BY_WIDTH) {
    if (window.matchMedia(`(min-width: ${min}px)`).matches) return reach
  }
  return DEFAULT_REACH
}

const norm = (i: number, n: number) => ((i % n) + n) % n

/** Fold a raw offset onto the shortest way round — carousel only. */
const wrapRel = (rel: number, n: number) => {
  let r = norm(rel, n)
  if (r > n / 2) r -= n
  return r
}

/** Resisted overshoot past a bound — asymptotes to OVERSCROLL cards. */
const rubber = (v: number, min: number, max: number) => {
  const past = (x: number) => OVERSCROLL * (1 - 1 / (x / OVERSCROLL + 1))
  if (v < min) return min - past(min - v)
  if (v > max) return max + past(v - max)
  return v
}

/** Stacked deck: card at depth d (0 = the current/front card). */
const stackPos = (d: number) => ({
  x: 0,
  xPercent: 0,
  y: d * STACK_PEEK,
  rotation: d === 0 ? 0 : d % 2 ? 1.6 : -2,
  scale: 1 - Math.min(d, 4) * 0.03,
  opacity: d > 4 ? 0 : 1,
  zIndex: 1000 - d,
  transformOrigin: '50% 100%',
  pointerEvents: (d === 0 ? 'auto' : 'none') as 'auto' | 'none',
})

/** Fanned arc: card at offset rel from the centred (active) card. */
const rowPos = (rel: number, reach: number) => {
  const a = Math.abs(rel)
  return {
    x: rel * FAN_SPREAD,
    xPercent: 0,
    y: FAN_DROP * rel * rel,
    rotation: gsap.utils.clamp(-14, 14, rel * FAN_TILT),
    scale: ROW_SCALE,
    opacity: gsap.utils.clamp(0, 1, reach + 1 - a),
    zIndex: 1000 - Math.round(a),
    transformOrigin: '50% 50%',
    pointerEvents: (a > reach + 0.5 ? 'none' : 'auto') as 'auto' | 'none',
  }
}

/** Plain carousel: one card centred, neighbours parked just off-screen. */
const carouselPos = (rel: number) => ({
  x: 0,
  xPercent: rel * SLIDE,
  y: 0,
  rotation: 0,
  scale: 1,
  opacity: Math.abs(rel) > 1.001 ? 0 : 1,
  zIndex: rel === 0 ? 10 : 1,
  transformOrigin: '50% 50%',
  pointerEvents: (Math.abs(rel) < 0.5 ? 'auto' : 'none') as 'auto' | 'none',
})

interface CardDeckProps {
  items: DeckItem[]
  onAddCard?: () => void
  onDeleteCard?: (id: string) => void
}

export function CardDeck({ items, onAddCard, onDeleteCard }: CardDeckProps) {
  const scope = useRef<HTMLDivElement>(null)
  const nodes = useRef(new Map<string, HTMLDivElement>())
  const obsRef = useRef<Observer | null>(null)
  const busy = useRef(false)
  const [mode, setMode] = useState<Mode>('carousel')
  const [reach, setReach] = useState(DEFAULT_REACH)
  const deck = useDeckControl()
  // where the deck is, in card units. Stable object so GSAP can tween it.
  const view = useRef({ pos: 0, expanded: false })

  const n = items.length
  const el = (i: number) => nodes.current.get(items[i].key)!
  const allEls = () => items.map((_, i) => el(i))
  const maxH = () => {
    const els = allEls()
    return els.length ? Math.max(...els.map(e => e.offsetHeight)) : 0
  }

  const reduced = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const dur = (x: number) => (reduced() ? 0 : x)
  const clampPos = (p: number) => gsap.utils.clamp(0, n - 1, p)
  const curIndex = () => norm(Math.round(view.current.pos), n)
  const fanHeight = (h: number, exp: boolean) =>
    exp ? h + 70 + FAN_DROP * (reach + 0.5) ** 2 : h + 40

  // keep mode + reach in step with viewport width / pointer type
  useEffect(() => {
    const mqs = [
      window.matchMedia('(min-width: 1024px)'),
      window.matchMedia('(any-pointer: coarse)'),
      ...REACH_BY_WIDTH.map(r => window.matchMedia(`(min-width: ${r.min}px)`)),
    ]
    const sync = () => {
      setMode(detectMode())
      setReach(detectReach())
    }
    sync()
    mqs.forEach(mq => mq.addEventListener('change', sync))
    return () => mqs.forEach(mq => mq.removeEventListener('change', sync))
  }, [])

  const place = (animate: boolean) => {
    if (!items.length) return
    const pos = view.current.pos
    const exp = view.current.expanded
    const top = curIndex()
    items.forEach((_, i) => {
      const vars =
        mode === 'carousel'
          ? carouselPos(wrapRel(i - pos, n))
          : exp
            ? rowPos(i - pos, reach)
            : stackPos(norm(i - top, n))
      if (animate) {
        gsap.to(el(i), { ...vars, duration: dur(0.45), ease: 'power3.inOut', overwrite: 'auto' })
      } else {
        gsap.set(el(i), vars)
      }
    })
  }

  const glideTo = (target: number, d = 0.6, ease = 'power3.out') => {
    gsap.to(view.current, {
      pos: clampPos(target),
      duration: dur(d),
      ease,
      overwrite: true,
      onUpdate: () => place(false),
    })
  }

  /** fan: bring card i to the centre */
  const goto = (i: number) => {
    if (mode !== 'fan' || !view.current.expanded) return
    glideTo(i)
  }

  /** carousel: step one card, wrapping then renormalising pos */
  const step = (delta: number) => {
    if (mode !== 'carousel' || busy.current) return
    busy.current = true
    const target = Math.round(view.current.pos) + delta
    gsap.to(view.current, {
      pos: target,
      duration: dur(0.5),
      ease: 'power3.inOut',
      overwrite: true,
      onUpdate: () => place(false),
      onComplete: () => {
        view.current.pos = curIndex()
        place(false)
        busy.current = false
      },
    })
  }

  const toggle = () => {
    if (mode !== 'fan') return
    const exp = !view.current.expanded
    view.current.expanded = exp
    deck.report({ spread: exp })
    if (!exp) view.current.pos = Math.round(view.current.pos)
    gsap.to(scope.current, {
      height: fanHeight(maxH(), exp),
      duration: dur(0.4),
      ease: 'power3.inOut',
    })
    place(true)
    if (obsRef.current) exp ? obsRef.current.enable() : obsRef.current.disable()
  }

  // expose deck actions to the sidebar (fan mode only)
  const actionsRef = useRef({ toggle: () => {}, add: () => {}, remove: () => {} })
  actionsRef.current = {
    toggle,
    add: () => {
      view.current.pos = n // land on the freshly-added card once it's in
      onAddCard?.()
    },
    remove: () => {
      const id = items[curIndex()]?.key
      if (id) onDeleteCard?.(id)
    },
  }
  useEffect(() => {
    deck.bind(
      mode === 'fan'
        ? {
            toggle: () => actionsRef.current.toggle(),
            add: () => actionsRef.current.add(),
            remove: () => actionsRef.current.remove(),
          }
        : null,
    )
    return () => deck.bind(null)
  }, [mode, deck.bind])

  useEffect(() => {
    deck.report({ count: n })
  }, [n, deck.report])

  useGSAP(
    () => {
      // clean slate whenever mode / reach / card count changes
      view.current.expanded = false
      view.current.pos = gsap.utils.clamp(0, Math.max(0, n - 1), Math.round(view.current.pos))
      deck.report({ spread: false })

      const h = maxH()

      if (mode === 'carousel') {
        gsap.set(scope.current, { height: h + 24 })
        place(false)
        return
      }

      // ── fan mode ──
      gsap.set(scope.current, { height: fanHeight(h, false) })
      place(false)

      let glide: gsap.core.Tween | null = null

      const settle = () => {
        if (!view.current.expanded) return
        const target = clampPos(Math.round(view.current.pos))
        if (Math.abs(target - view.current.pos) < 0.001) return
        glide = gsap.to(view.current, {
          pos: target,
          duration: dur(SNAP),
          ease: SNAP_EASE,
          overwrite: true,
          onUpdate: () => place(false),
        })
      }

      const obs = Observer.create({
        target: scope.current!,
        type: 'wheel,touch,pointer',
        dragMinimum: 4,
        lockAxis: true,
        preventDefault: true,
        onStopDelay: 0.08,
        onChange: self => {
          glide?.kill()
          const { deltaX, deltaY } = self
          const move = Math.abs(deltaX) > Math.abs(deltaY) ? -deltaX : deltaY
          view.current.pos = rubber(view.current.pos + move / GAP, 0, n - 1)
          place(false)
        },
        onDragEnd: self => {
          const v =
            Math.abs(self.velocityX) > Math.abs(self.velocityY) ? -self.velocityX : self.velocityY
          const dist = gsap.utils.clamp(-4, 4, (v / GAP) * THROW)
          const target = clampPos(Math.round(view.current.pos + dist))
          glide = gsap.to(view.current, {
            pos: target,
            duration: dur(Math.max(SNAP, 0.7)),
            ease: SNAP_EASE,
            overwrite: true,
            onUpdate: () => place(false),
          })
        },
        onStop: () => {
          if (!glide?.isActive()) settle()
        },
      })
      obs.disable()
      obsRef.current = obs

      return () => {
        glide?.kill()
        obs.kill()
        obsRef.current = null
      }
    },
    { scope, dependencies: [mode, reach, n], revertOnUpdate: true },
  )

  const btn =
    'border border-ink-0 bg-ink-100 px-4 py-2 text-sm font-semibold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,0.15)] transition-transform active:translate-y-px'

  const cardCls =
    mode === 'fan'
      ? 'absolute left-1/2 top-10 -ml-[240px] w-[480px] cursor-pointer'
      : 'absolute inset-x-0 top-3'

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div
        ref={scope}
        className={
          mode === 'fan'
            ? 'relative mx-auto w-full'
            : 'relative mx-auto w-[min(440px,92vw)] overflow-hidden'
        }
      >
        {items.map((item, i) => (
          <div
            key={item.key}
            ref={node => {
              if (node) nodes.current.set(item.key, node)
              else nodes.current.delete(item.key)
            }}
            onClick={() => goto(i)}
            className={`${cardCls} will-change-transform`}
          >
            {item.content}
          </div>
        ))}
      </div>

      {mode === 'carousel' && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} className={btn}>
            Prev
          </button>
          <button type="button" onClick={() => step(1)} className={btn}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}
