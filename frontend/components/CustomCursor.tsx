"use client";

import { useEffect, useRef, useState } from "react";

type CursorMode = "default" | "pointer";

function ArrowCursor() {
  return (
    <svg
      viewBox="0 0 42 42"
      aria-hidden="true"
      className="custom-cursor-svg"
    >
      <path
        d="M8 4.5L31 19.5L20.5 22.5L27.8 36L21.8 38L14.4 24.8L8 29.8Z"
        fill="#06080f"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HandCursor() {
  return (
    <svg
      viewBox="0 0 42 42"
      aria-hidden="true"
      className="custom-cursor-svg"
    >
      <path
        d="M15.2 36.4C11.8 36.4 9 33.8 9 30.3V18.8C9 17 10.2 15.8 11.8 15.8C13 15.8 14 16.5 14.4 17.5V10.9C14.4 9 15.8 7.5 17.6 7.5C19.5 7.5 20.9 9 20.9 10.9V14.2C21.3 13.1 22.3 12.3 23.5 12.3C25.2 12.3 26.5 13.6 26.5 15.4V17.2C26.9 16.2 27.9 15.5 29.1 15.5C30.8 15.5 32.1 16.9 32.1 18.6V20.4C32.5 19.4 33.5 18.7 34.7 18.7C36.4 18.7 37.8 20.1 37.8 21.8V29.1C37.8 33.2 34.9 36.4 30.8 36.4H15.2Z"
        fill="#ffffff"
        stroke="#06080f"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.4 17.7V25.7"
        stroke="#06080f"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M20.9 10.7V24.8"
        stroke="#06080f"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M26.5 15.4V24.7"
        stroke="#06080f"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M32.1 18.4V24.1"
        stroke="#06080f"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function isPointerTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      'a, button, summary, label, select, [role="button"], [data-cursor="pointer"], input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], input[type="range"]',
    ),
  );
}

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);
  const hasPosition = useRef(false);
  const modeRef = useRef<CursorMode>("default");
  const pressedRef = useRef(false);
  const visibleRef = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [mode, setMode] = useState<CursorMode>("default");

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    pressedRef.current = pressed;
  }, [pressed]);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(pointer: fine)");
    if (!mediaQuery.matches) {
      return undefined;
    }

    setEnabled(true);
    document.documentElement.classList.add("custom-cursor-enabled");

    const setCursorMode = (target: EventTarget | null) => {
      setMode((current) => {
        const next = isPointerTarget(target) ? "pointer" : "default";
        return current === next ? current : next;
      });
    };

    const tick = () => {
      const node = cursorRef.current;
      if (node && hasPosition.current) {
        const smoothing = pressedRef.current ? 0.15 : 0.18;
        currentPosition.current.x +=
          (targetPosition.current.x - currentPosition.current.x) * smoothing;
        currentPosition.current.y +=
          (targetPosition.current.y - currentPosition.current.y) * smoothing;

        const scale = pressedRef.current ? 0.92 : modeRef.current === "pointer" ? 1.06 : 1;
        node.style.transform = `translate3d(${currentPosition.current.x}px, ${currentPosition.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      }

      animationFrame.current = window.requestAnimationFrame(tick);
    };

    const handleMove = (event: MouseEvent) => {
      targetPosition.current = { x: event.clientX, y: event.clientY };

      if (!hasPosition.current) {
        hasPosition.current = true;
        currentPosition.current = { x: event.clientX, y: event.clientY };
      }

      if (!visibleRef.current) {
        setVisible(true);
      }

      setCursorMode(event.target);
    };

    const handleEnter = (event: MouseEvent) => {
      targetPosition.current = { x: event.clientX, y: event.clientY };
      currentPosition.current = { x: event.clientX, y: event.clientY };
      hasPosition.current = true;
      setVisible(true);
      setCursorMode(event.target);
    };

    const handleLeave = () => {
      setVisible(false);
      setPressed(false);
    };

    const handlePointerOver = (event: Event) => {
      setCursorMode(event.target);
    };

    const handleDown = () => setPressed(true);
    const handleUp = () => setPressed(false);

    animationFrame.current = window.requestAnimationFrame(tick);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseenter", handleEnter);
    window.addEventListener("mouseleave", handleLeave);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);
    document.addEventListener("mouseover", handlePointerOver);

    return () => {
      document.documentElement.classList.remove("custom-cursor-enabled");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseenter", handleEnter);
      window.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      document.removeEventListener("mouseover", handlePointerOver);

      if (animationFrame.current !== null) {
        window.cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      className={[
        "custom-cursor",
        visible ? "is-visible" : "",
        mode === "pointer" ? "is-pointer" : "",
        pressed ? "is-pressed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="custom-cursor-glow" />
      <span className="custom-cursor-shell">
        {mode === "pointer" ? <HandCursor /> : <ArrowCursor />}
      </span>
    </div>
  );
}
