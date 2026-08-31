"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Drawer } from "vaul";
import {
  AccountIcon,
  FanIcon,
  ListIcon,
  HelpIcon,
  MenuIcon,
  PaintbrushIcon,
  PlusIcon,
  TimerIcon,
  TrashIcon,
  YearIcon,
} from "./Icons";
import { useDeckControl } from "./deckControl";

interface SideBarProps {
  onOpenTimer: () => void;
}

const rowCls =
  "flex items-center gap-3 rounded px-2 py-3 text-base transition-colors active:bg-ink-95 disabled:cursor-not-allowed disabled:opacity-30";

export function SideBar({ onOpenTimer }: SideBarProps) {
  const deck = useDeckControl();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  // never leave the drawer (and its scroll-lock) hanging when we grow past mobile
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const buttonStyles =
    "group/button group-hover/sidebar:min-w-28 cursor-pointer disabled:cursor-not-allowed disabled:opacity-15 border-none bg-transperent outline-none flex items-center justify-end gap-2 transition-all";
  const spanStyles =
    "hidden group-hover/sidebar:flex group-hover/button:font-semibold transition-all";

  return (
    <>
      {/* ── desktop rail (≥ 640px) ─────────────────────────────── */}
      <section className="group/sidebar absolute top-0 right-0 z-50 hidden h-auto w-fit cursor-pointer md:block">
        <div className="p-4 flex flex-col gap-10 md:p-6">
          <div className="flex flex-col gap-3">
            <Link href="/" className={buttonStyles}>
              <span className={spanStyles}>List View</span>
              <ListIcon />
            </Link>
            <Link href="/year" className={buttonStyles}>
              <span className={spanStyles}>Year View</span>
              <YearIcon />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <button type="button" className={buttonStyles} onClick={deck.add} disabled={!deck.canAdd}>
              <span className={spanStyles}>New List</span>
              <PlusIcon />
            </button>
            <button type="button" className={buttonStyles} onClick={deck.remove} disabled={!deck.canRemove}>
              <span className={spanStyles}>Delete List</span>
              <TrashIcon />
            </button>
            <button type="button" className={buttonStyles} onClick={deck.toggle} disabled={!deck.canToggle}>
              <span className={spanStyles}>{deck.spread ? "Stack" : "Spread"}</span>
              <FanIcon />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <button type="button" className={buttonStyles} onClick={onOpenTimer} disabled>
              {/* <span className={spanStyles}>Timer</span> */}
              <TimerIcon />
            </button>
            <button type="button" className={buttonStyles} disabled>
              {/* <span className={spanStyles}>Account</span> */}
              <AccountIcon />
            </button>
            <button type="button" className={buttonStyles} disabled>
              {/* <span className={spanStyles}>Theme</span> */}
              <PaintbrushIcon />
            </button>
            <button type="button" className={buttonStyles} disabled>
              {/* <span className={spanStyles}>Help</span> */}
              <HelpIcon />
            </button>
          </div>
        </div>
      </section>

      {/* ── mobile menu bar (< 640px) ──────────────────────────── */}
      <div className="fixed inset-x-0 top-0 z-1110 flex justify-end border-b border-ink-90 bg-ink-100/85 px-4 py-2 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="flex items-center gap-2 text-sm font-semibold uppercase"
        >
          Menu
          <MenuIcon />
        </button>
      </div>

      <Drawer.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-1110 bg-ink-0/30 md:hidden" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-1110 rounded-t-xl border-t border-ink-90 bg-ink-100 p-4 pb-8 outline-none md:hidden">
            <div className="mx-auto flex max-w-sm flex-col">
              <Drawer.Title className="px-2 pb-1 text-lg sr-only">Menu</Drawer.Title>
              <Drawer.Description className="sr-only">List controls and navigation</Drawer.Description>

              <div className="flex flex-col">
                <Link href="/" className={rowCls} onClick={close}>
                  <ListIcon />
                  <span>List View</span>
                </Link>
                <Link href="/year" className={rowCls} onClick={close}>
                  <YearIcon />
                  <span>Year View</span>
                </Link>

              </div>

              <div className="my-2 border-t border-ink-90" />

              <div className="flex flex-col">
                <button
                  type="button"
                  className={rowCls}
                  disabled={!deck.canAdd}
                  onClick={() => {
                    deck.add();
                    close();
                  }}
                >
                  <PlusIcon />
                  <span>New List</span>
                </button>
                <button
                  type="button"
                  className={rowCls}
                  disabled={!deck.canRemove}
                  onClick={() => {
                    deck.remove();
                    close();
                  }}
                >
                  <TrashIcon />
                  <span>Delete List</span>
                </button>
                <button
                  type="button"
                  className={rowCls}
                  disabled={!deck.canToggle}
                  onClick={() => {
                    deck.toggle();
                    close();
                  }}
                >
                  <FanIcon />
                  <span>{deck.spread ? "Stack" : "Spread"}</span>
                </button>
              </div>

              <div className="my-2 border-t border-ink-90" />



              <div className="flex flex-col">
                <button type="button" className={rowCls} disabled>
                  <TimerIcon />
                  <span>Timer</span>
                </button>
                <button type="button" className={rowCls} disabled>
                  <AccountIcon />
                  <span>Account</span>
                </button>
                <button type="button" className={rowCls} disabled>
                  <PaintbrushIcon />
                  <span>Theme</span>
                </button>
                <button type="button" className={rowCls} disabled>
                  <HelpIcon />
                  <span>Help</span>
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
