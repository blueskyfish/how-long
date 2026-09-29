/**
 * Dispatches a touch event with the given finger positions. jsdom has no
 * `Touch` constructor, so the touch list is attached to a plain event.
 */
export function touch(
  target: EventTarget,
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  fingers: { x: number; y: number }[],
): void {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', {
    value: fingers.map(({ x, y }) => ({ clientX: x, clientY: y })),
  });
  target.dispatchEvent(event);
}
