// Test stand-in for next/navigation: real browser navigation. A move to a list screen
// (two path parts) keeps the black curtain closed across the page load, like the real app.
export function useRouter() {
  return {
    push(href: string) {
      try {
        if (href.split('/').filter(Boolean).length === 2) sessionStorage.setItem('isg-curtain', '1');
      } catch {
        /* ignore */
      }
      window.location.assign(href);
    },
    replace(href: string) {
      window.location.assign(href);
    },
    back() {
      window.history.back();
    },
  };
}
