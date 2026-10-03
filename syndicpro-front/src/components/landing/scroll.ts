/** The public landing page scrolls inside .landing-scroll (app shell locks body scroll). */
export function landingScroller(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.landing-scroll');
}

export function landingScrollTop(): number {
  return landingScroller()?.scrollTop ?? window.scrollY;
}

export function onLandingScroll(listener: () => void): () => void {
  const scroller = landingScroller();
  if (scroller) {
    scroller.addEventListener('scroll', listener, { passive: true });
    return () => scroller.removeEventListener('scroll', listener);
  }
  window.addEventListener('scroll', listener, { passive: true });
  return () => window.removeEventListener('scroll', listener);
}

export function scrollLandingToTop(): void {
  const scroller = landingScroller();
  if (scroller) {
    scroller.scrollTo(0, 0);
  } else {
    window.scrollTo(0, 0);
  }
}
