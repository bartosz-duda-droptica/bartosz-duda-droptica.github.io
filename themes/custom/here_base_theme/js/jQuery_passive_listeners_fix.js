/**
 * @file
 * Fix for jQuery non-passive event listeners.
 *
 * For jQuery < 4.0 - see more https://github.com/jquery/jquery/issues/2871#issuecomment-497975806
 * Based on https://github.com/angular/components/issues/4221#issuecomment-351660323
 *
 * Troublesome events are:
 * scroll, wheel, touchstart, touchmove, touchenter, touchend, touchleave, mouseout, mouseleave, mouseup, mousedown, mousemove, mouseenter, mousewheel, mouseover
 */

if ('undefined' === typeof window.jQuery) {
  console.log('Non-passive event listeners fix: jQuery not present');
}
else {
  /**
   * Fix for touchmove event.
   *
   * @type {{setup: jQuery.event.special.touchmove.setup}}
   */
  jQuery.event.special.touchmove = {
    setup: function (_, ns, handle) {
      if (ns.includes("noPreventDefault")) {
        this.addEventListener("touchmove", handle, { passive: false });
      }
      else {
        this.addEventListener("touchmove", handle, { passive: true });
      }
    }
  }
}
