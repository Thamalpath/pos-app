/**
 * Docked cart geometry.
 *
 * The keyboard dock is fixed to the bottom of the viewport but must stop at the
 * cart's edge, otherwise the keypad and its handle sit on top of CartSidebar and
 * cover the Pay button. That offset is expressed as Tailwind classes, and
 * Tailwind only generates what it can see as literal strings in source - so the
 * widths below are duplicated between the two files by necessity.
 *
 * If you change one, change both: CART_WIDTH_CLASS drives the <aside>, and
 * DOCK_RIGHT_CLASS keeps the dock flush against it.
 */
export const CART_WIDTH_CLASS = 'w-[340px] xl:w-[400px] 2xl:w-[420px]';

/**
 * Right inset for the fixed dock, matching the docked cart at each breakpoint.
 * Unprefixed (mobile/tablet) stays `right-0` because the cart is an off-canvas
 * drawer there, not a column in the layout.
 */
export const DOCK_RIGHT_CLASS = 'right-0 lg:right-[340px] xl:right-[400px] 2xl:right-[420px]';