"use client"

import * as React from "react"

/**
 * Rendered height (px) of an element, kept current with a ResizeObserver.
 * Used to give SVG overlays drawn in image-fraction units (viewBox 0..1) a stroke width in screen pixels:
 * width in viewBox units = px / (height / viewBox height). This replaces vector-effect="non-scaling-stroke", which some
 * browsers and design-capture tools do not honor, so outlines rendered hundreds of pixels thick there (V2-0399).
 */
export function useElementHeight<T extends Element>(): [(el: T | null) => void, number] {
  const [height, setHeight] = React.useState(0)
  const observer = React.useRef<ResizeObserver | null>(null)
  const ref = React.useCallback((el: T | null) => {
    observer.current?.disconnect()
    observer.current = null
    if (!el) return
    setHeight(el.getBoundingClientRect().height)
    observer.current = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height))
    observer.current.observe(el)
  }, [])
  React.useEffect(() => () => observer.current?.disconnect(), [])
  return [ref, height]
}
