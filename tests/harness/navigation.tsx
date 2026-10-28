// Test stand-in for next/navigation: real browser navigation.
export function useRouter() {
  return {
    push(href: string) {
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
