import type { RouterConfig } from '@nuxt/schema';
import { START_LOCATION, type RouteLocationNormalized } from 'vue-router';
import { hashIds } from './utils/hash-ids';

/**
 * Nuxt's default scrollBehavior, except for how a hash target is found. GitHub-style heading
 * ids can start with a digit (`#050` for a `0.5.0` changelog heading), which is not a valid CSS
 * selector: Nuxt's `querySelector` lookup then fails and the heading lands under the sticky
 * header. Look the element up by id and keep its `scroll-margin-top`.
 */
function hashPosition(to: RouteLocationNormalized, behavior: ScrollBehavior) {
  // Decoded id first, then the raw hash; a malformed `%` sequence never throws
  const el = hashIds(to.hash)
    .map(id => document.getElementById(id))
    .find(Boolean);
  if (!el) return { left: 0, top: 0 };
  const top =
    (Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0) +
    (Number.parseFloat(
      getComputedStyle(document.documentElement).scrollPaddingTop,
    ) || 0);
  // `el` as an element: vue-router would otherwise resolve the string through querySelector too
  return { el, top, behavior };
}

export default {
  scrollBehavior(to, from, savedPosition) {
    const samePage =
      to.path.replace(/\/$/, '') === from.path.replace(/\/$/, '');
    if (samePage) {
      if (to.hash) return hashPosition(to, 'auto');
      return from.hash ? { left: 0, top: 0 } : false;
    }
    if (savedPosition) return savedPosition;
    if (!to.hash) return { left: 0, top: 0 };
    if (from === START_LOCATION) return hashPosition(to, 'auto');
    // Arriving on another page: wait for it to render before looking for the heading
    const nuxtApp = useNuxtApp();
    return new Promise(resolve => {
      nuxtApp.hooks.hookOnce('page:loading:end', () => {
        requestAnimationFrame(() => resolve(hashPosition(to, 'instant')));
      });
    });
  },
} satisfies RouterConfig;
