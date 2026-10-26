import { createRoot } from 'react-dom/client';
import { LangProvider } from '@/lib/lang';
import { CurtainProvider } from '@/lib/curtain';
import { Disclaimer, Footer, Header } from '@/components/Chrome';
import { DetailView, ListView, NotFoundView, PersonaView, SearchView, WelcomeView } from '@/components/Views';
import { findPersona, findState } from '@/data/config';
import { getScheme } from '@/lib/search';

// Mirrors the route files in src/app so the real components can be exercised in a browser without Next.js.
function Route() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const sp = new URLSearchParams(window.location.search);
  if (parts.length === 0) return <WelcomeView />;
  if (parts[0] === 'search') {
    const found = findState(sp.get('state') ?? '');
    return <SearchView query={(sp.get('q') ?? '').slice(0, 100)} state={found && found.available ? found : undefined} />;
  }
  if (parts[0] === 'scheme' && parts.length === 2) {
    const scheme = getScheme(parts[1]);
    return scheme ? <DetailView scheme={scheme} /> : <NotFoundView />;
  }
  if (parts.length === 1) {
    const state = findState(parts[0]);
    return state && state.available ? <PersonaView state={state} /> : <NotFoundView />;
  }
  if (parts.length === 2) {
    const state = findState(parts[0]);
    const persona = findPersona(parts[1]);
    return state && state.available && persona ? <ListView state={state} persona={persona} /> : <NotFoundView />;
  }
  return <NotFoundView />;
}

createRoot(document.getElementById('root')!).render(
  <LangProvider>
    <CurtainProvider>
    <div className="app">
      <Header />
      <Disclaimer />
      <main>
        <Route />
      </main>
      <Footer />
    </div>
    </CurtainProvider>
  </LangProvider>,
);
