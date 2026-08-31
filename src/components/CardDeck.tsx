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

/* ─── Tuning ───────────────────────────────────────────────────────────────
 *   GAP         — px of drag / scroll that moves the deck by one card
 *   STACK_SHIFT — px a card slides aside per step off the front
 *   STACK_LIFT  — px a card lifts up per step deeper in the stack
 *   STACK_TILT  — deg a card leans per step off the front
 *   FAN_SPREAD  — px between adjacent cards once spread wide
 *   FAN_DROP    — px a card sinks per step² off centre (the arc)
 *   FAN_TILT    — deg a card leans per step off centre when spread
 *   ROW_SCALE   — how much cards shrink once spread
 *   REACH_BY_WIDTH — how many cards show each side of centre, spread, by width
 *   THROW / SNAP / SNAP_EASE — drag momentum + settle feel
 *   OVERSCROLL  — how far (in cards) you can pull past the ends before it springs
 *   SLIDE       — carousel: % of card width a neighbour sits off-centre
 * ─────────────────────────────────────────────────────────────────────────── */
const GAP = 340
const STACK_SHIFT = 13
const STACK_LIFT = -5
const STACK_TILT = 1.3
const FAN_SPREAD = 470
const FAN_DROP = 16
const FAN_TILT = 4
const ROW_SCALE = 0.82
const REACH_BY_WIDTH: Array<{ min: number; reach: number }> = [
  { min: 1850, reach: 3 },
  { min: 1440, reach: 2 },
]
const DEFAULT_REACH = 1
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

/** Tight deck: card at signed offset rel from the front (active) card. */
const stackPos = (rel: number) => {
  const a = Math.abs(rel)
  const d = Math.min(a, 4)
  return {
    x: gsap.utils.clamp(-60, 60, rel * STACK_SHIFT),
    xPercent: 0,
    y: d * STACK_LIFT,
    rotation: gsap.utils.clamp(-4, 4, rel * STACK_TILT),
    scale: 1 - d * 0.02,
    opacity: gsap.utils.clamp(0, 1, 4 - a),
    zIndex: Math.round(1000 - a * 4),
    transformOrigin: '50% 100%',
    pointerEvents: (a < 0.5 ? 'auto' : 'none') as 'auto' | 'none',
  }
}

/** Spread arc: card at offset rel from the centred (active) card. */
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
  activeId?: string | null
  onActiveChange?: (id: string) => void
  onAddCard?: () => void
  onDeleteCard?: (id: string) => void
}

export function CardDeck({
  items,
  activeId,
  onActiveChange,
  onAddCard,
  onDeleteCard,
}: CardDeckProps) {
  const scope = useRef<HTMLDivElement>(null)
  const nodes = useRef(new Map<string, HTMLDivElement>())
  const obsRef = useRef<Observer | null>(null)
  const busy = useRef(false)
  const [mode, setMode] = useState<Mode>('carousel')
  const [reach, setReach] = useState(DEFAULT_REACH)
  const [idx, setIdx] = useState(0)
  const deck = useDeckControl()
  // where the deck is, in card units. Stable object so GSAP can tween it.
  const view = useRef({ pos: 0, expanded: false })

  const n = items.length
  const itemsRef = useRef(items)
  itemsRef.current = items
  const activeIdRef = useRef(activeId)
  activeIdRef.current = activeId

  const el = (i: number) => nodes.current.get(items[i].key)!
  const has = (i: number) => !!items[i] && nodes.current.has(items[i].key)
  const maxH = () => {
    const els = items
      .map((_, i) => nodes.current.get(items[i].key))
      .filter(Boolean) as HTMLDivElement[]
    return els.length ? Math.max(...els.map(e => e.offsetHeight)) : 0
  }

  const reduced = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const dur = (x: number) => (reduced() ? 0 : x)
  const clampPos = (p: number) => gsap.utils.clamp(0, Math.max(0, n - 1), p)
  const curIndex = () => (n ? norm(Math.round(view.current.pos), n) : 0)
  const indexOfActive = () => {
    const i = items.findIndex(it => it.key === activeIdRef.current)
    return i < 0 ? Math.max(0, n - 1) : i
  }
  const fanHeight = (h: number, exp: boolean) =>
    exp ? h + 70 + FAN_DROP * (reach + 0.5) ** 2 : h + 44

  /** the deck has come to rest on a card — remember it + announce it */
  const settled = () => {
    const i = curIndex()
    setIdx(i)
    const key = itemsRef.current[i]?.key
    if (key && key !== activeIdRef.current) onActiveChange?.(key)
  }

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

  // tell the sidebar what the deck can do
  useEffect(() => {
    deck.report({ mounted: true })
    return () => deck.report({ mounted: false })
  }, [deck.report])
  useEffect(() => {
    deck.report({ fanCapable: mode === 'fan' })
  }, [mode, deck.report])
  useEffect(() => {
    deck.report({ count: n })
  }, [n, deck.report])

  const place = (animate: boolean) => {
    if (!items.length) return
    const pos = view.current.pos
    const exp = view.current.expanded
    items.forEach((_, i) => {
      if (!has(i)) return
      const vars =
        mode === 'carousel'
          ? carouselPos(wrapRel(i - pos, n))
          : exp
            ? rowPos(i - pos, reach)
            : stackPos(i - pos)
      if (animate) {
        gsap.to(el(i), { ...vars, duration: dur(0.45), ease: 'power3.inOut', overwrite: 'auto' })
      } else {
        gsap.set(el(i), vars)
      }
    })
  }

  const glideTo = (target: number, d = 0.55, ease = 'power3.out') => {
    const t = clampPos(target)
    gsap.to(view.current, {
      pos: t,
      duration: dur(d),
      ease,
      overwrite: true,
      onUpdate: () => place(false),
      onComplete: () => {
        view.current.pos = t
        place(false)
        settled()
      },
    })
  }

  /** step one card — carousel buttons, or keyboard in either mode */
  const step = (delta: number) => {
    if (!n || busy.current) return
    if (mode === 'fan') {
      glideTo(Math.round(view.current.pos) + delta)
      return
    }
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
        settled()
        busy.current = false
      },
    })
  }

  /** fan: bring card i to the front */
  const goto = (i: number) => {
    if (mode !== 'fan') return
    glideTo(i)
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
  }

  // sidebar action bridge — keep latest closures without re-binding
  const actionsRef = useRef({ toggle: () => {}, add: () => {}, remove: () => {} })
  actionsRef.current = {
    toggle,
    add: () => onAddCard?.(),
    remove: () => {
      const id = itemsRef.current[curIndex()]?.key
      if (id) onDeleteCard?.(id)
    },
  }
  useEffect(() => {
    deck.bind({
      toggle: () => actionsRef.current.toggle(),
      add: () => actionsRef.current.add(),
      remove: () => actionsRef.current.remove(),
    })
    return () => deck.bind(null)
  }, [deck.bind])

  // restore / external sync — jump to the active card without animating
  useEffect(() => {
    if (!n) return
    const target = indexOfActive()
    if (target !== curIndex()) {
      gsap.killTweensOf(view.current)
      view.current.pos = target
      place(false)
    }
    setIdx(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, n])

  useGSAP(
    () => {
      // clean slate whenever mode / reach / card count changes
      view.current.expanded = false
      view.current.pos = clampPos(indexOfActive())
      setIdx(curIndex())
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
        const target = clampPos(Math.round(view.current.pos))
        if (Math.abs(target - view.current.pos) < 0.001) {
          settled()
          return
        }
        glide = gsap.to(view.current, {
          pos: target,
          duration: dur(SNAP),
          ease: SNAP_EASE,
          overwrite: true,
          onUpdate: () => place(false),
          onComplete: settled,
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
            onComplete: settled,
          })
        },
        onStop: () => {
          if (!glide?.isActive()) settle()
        },
      })
      obsRef.current = obs

      return () => {
        glide?.kill()
        obs.kill()
        obsRef.current = null
      }
    },
    { scope, dependencies: [mode, reach, n], revertOnUpdate: true },
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return // don't hijack caret keys inside a card's inputs
    let hit = true
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
        step(1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        step(-1)
        break
      case 'Home':
        mode === 'fan' ? glideTo(0) : step(-n)
        break
      case 'End':
        mode === 'fan' ? glideTo(n - 1) : step(n)
        break
      default:
        hit = false
    }
    if (hit) e.preventDefault()
  }

  const btn =
    'border border-ink-0 bg-ink-100 px-4 py-2 text-sm font-semibold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,0.15)] transition-transform active:translate-y-px'

  const cardCls =
    mode === 'fan'
      ? 'absolute left-1/2 top-10 -ml-[224px] w-[448px] cursor-pointer'
      : 'absolute inset-x-0 top-3'

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div
        ref={scope}
        role="group"
        aria-roledescription="card deck"
        aria-label={`Task lists, ${n} total`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={`${
          mode === 'fan'
            ? 'relative mx-auto w-full'
            : 'relative mx-auto w-[min(412px,92vw)] overflow-hidden'
        } outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-0`}
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

      {mode === 'carousel' ? (
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => step(-1)} className={btn}>
            Prev
          </button>
          <span className="min-w-[3.5rem] text-center text-sm font-semibold tabular-nums">
            {idx + 1} / {n}
          </span>
          <button type="button" onClick={() => step(1)} className={btn}>
            Next
          </button>
        </div>
      ) : (
        // fan mode drives by drag / scroll / keyboard — keep buttons for AT users
        <div className="sr-only">
          <button type="button" onClick={() => step(-1)} disabled={idx <= 0}>
            Previous list
          </button>
          <button type="button" onClick={() => step(1)} disabled={idx >= n - 1}>
            Next list
          </button>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {n ? `List ${idx + 1} of ${n}` : ''}
      </p>
    </div>
  )
}
