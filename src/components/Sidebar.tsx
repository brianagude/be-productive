"use client";

import Link from "next/link";
import {
  AccountIcon,
  FanIcon,
  ListIcon,
  HelpIcon,
  PaintbrushIcon,
  TimerIcon,
  YearIcon,
} from "./Icons";
import { useDeckControl } from "./deckControl";

interface SideBarProps {
  onOpenTimer: () => void;
}

export function SideBar({ onOpenTimer }: SideBarProps) {
  const deck = useDeckControl();
  const buttonStyles =
    "group/button group-hover/sidebar:min-w-28 cursor-pointer disabled:cursor-not-allowed disabled:opacity-15 border-none bg-transperent outline-none flex items-center justify-end gap-2 transition-all";
  const spanStyles =
    "hidden group-hover/sidebar:flex group-hover/button:font-semibold transition-all";

  return (
    <section className="group/sidebar fixed top-0 right-0 h-auto w-fit cursor-pointer z-50">
      <div className="p-4 flex flex-col gap-10 md:p-6">
        <div className="flex flex-col gap-3">
          {deck.available && (
            <button type="button" className={buttonStyles} onClick={deck.toggle}>
              <span className={spanStyles}>{deck.spread ? "Stack" : "Spread"}</span>
              <FanIcon />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/" className={buttonStyles}>
            <span className={spanStyles}>List View</span>
            <ListIcon />
          </Link>
          <Link href="/year" className={buttonStyles}>
            <span className={spanStyles}>Year View</span>
            <YearIcon />
          </Link>
          <button type="button" className={buttonStyles} onClick={onOpenTimer}>
            <span className={spanStyles}>Timer</span>
            <TimerIcon />
          </button>
        </div>
        <div className="flex flex-col gap-3">
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
  );
}
