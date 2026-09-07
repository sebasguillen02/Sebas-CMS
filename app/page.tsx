'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, AtSign, BarChart3, Bell, BriefcaseBusiness, CalendarDays, Check,
  ChevronDown, FileText, LayoutDashboard, Lightbulb, Menu, MoreHorizontal, Plus,
  Search, Settings, Sparkles, WandSparkles, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type Platform = 'LinkedIn' | 'X';
type Status = 'Idea' | 'Borrador' | 'Revisión' | 'Programado' | 'Publicado';
type ContentItem = { id: number; title: string; excerpt: string; platform: Platform; status: Status; date: string };

const initialContent: ContentItem[] = [
  { id: 1, title: 'Por qué la mayoría de estrategias de IA fallan antes de empezar', excerpt: 'No es un problema de tecnología. Es un problema de claridad...', platform: 'LinkedIn', status: 'Revisión', date: 'Hoy, 10:30' },
  { id: 2, title: 'La ventaja no está en usar más herramientas', excerpt: 'Está en diseñar un sistema que convierta ideas en decisiones.', platform: 'X', status: 'Borrador', date: 'Ayer, 18:12' },
  { id: 3, title: 'Cinco aprendizajes construyendo productos con agentes', excerpt: 'Después de decenas de iteraciones, esto es lo que cambió...', platform: 'LinkedIn', status: 'Programado', date: 'Mar, 09:00' },
];

const nav = [
  { label: 'Inicio', icon: LayoutDashboard }, { label: 'Ideas', icon: Lightbulb },
  { label: 'Contenido', icon: FileText }, { label: 'Calendario', icon: CalendarDays },
  { label: 'Analítica', icon: BarChart3 },
];

const statusClass: Record<Status, string> = {
  Idea: 'status-idea', Borrador: 'status-draft', Revisión: 'status-review', Programado: 'status-scheduled', Publicado: 'status-published',
};

export default function Home() {
  const [content, setContent] = useState(initialContent);
  const [active, setActive] = useState('Inicio');
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [idea, setIdea] = useState('');
  const [platform, setPlatform] = useState<Platform>('LinkedIn');
  const [saving, setSaving] = useState(false);
  const visibleContent = useMemo(() => content.filter((item) => `${item.title} ${item.excerpt}`.toLowerCase().includes(query.toLowerCase())), [content, query]);

  const saveIdea = useCallback(async (title: string, targetPlatform: Platform) => {
    const optimisticItem: ContentItem = { id: Date.now(), title, excerpt: 'Nueva idea lista para desarrollar con tu voz y experiencia.', platform: targetPlatform, status: 'Idea', date: 'Ahora' };
    try {
      const response = await fetch('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, platform: targetPlatform }) });
      if (!response.ok) throw new Error('No se pudo guardar');
      const { item } = await response.json();
      setContent((items) => [{ ...item, date: 'Ahora' }, ...items]);
      return item.id as number;
    } catch {
      setContent((items) => [optimisticItem, ...items]);
      return optimisticItem.id;
    }
  }, []);

  useEffect(() => {
    fetch('/api/content')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ items }: { items: Array<Omit<ContentItem, 'date'> & { createdAt: string }> }) => {
        if (items.length) setContent([...items.map((item) => ({ ...item, date: 'Guardado' })), ...initialContent]);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    type ToolInput = { title?: unknown; platform?: unknown };
    type ModelContext = { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'create_content_idea',
      title: 'Crear idea de contenido',
      description: 'Guarda una idea nueva en Hype CMS para LinkedIn o X y la muestra en contenido reciente.',
      inputSchema: {
        type: 'object',
        properties: { title: { type: 'string', minLength: 1, maxLength: 280 }, platform: { type: 'string', enum: ['LinkedIn', 'X'] } },
        required: ['title', 'platform'], additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: ToolInput) {
        const title = typeof input.title === 'string' ? input.title.trim() : '';
        const targetPlatform = input.platform === 'X' ? 'X' : input.platform === 'LinkedIn' ? 'LinkedIn' : null;
        if (!title || !targetPlatform) throw new Error('Título o plataforma inválidos.');
        const id = await saveIdea(title, targetPlatform);
        return { id, status: 'Idea', platform: targetPlatform };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [saveIdea]);

  async function addIdea() {
    const title = idea.trim();
    if (!title) return;
    setSaving(true);
    try {
      await saveIdea(title, platform);
    } finally {
      setIdea(''); setSaving(false); setDialogOpen(false);
    }
  }

  const ideaDialog = (
    <DialogContent className="idea-dialog">
      <DialogHeader>
        <DialogTitle>Capturar una idea</DialogTitle>
        <DialogDescription>No tiene que estar terminada. Una frase alcanza para empezar.</DialogDescription>
      </DialogHeader>
      <Textarea value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Ej: Lo que aprendí automatizando mi proceso de ventas..." className="min-h-28 resize-none" autoFocus />
      <div className="platform-picker" aria-label="Plataforma inicial">
        <button className={platform === 'LinkedIn' ? 'selected' : ''} onClick={() => setPlatform('LinkedIn')}><BriefcaseBusiness size={16} /> LinkedIn {platform === 'LinkedIn' && <Check size={14} />}</button>
        <button className={platform === 'X' ? 'selected' : ''} onClick={() => setPlatform('X')}><AtSign size={16} /> X {platform === 'X' && <Check size={14} />}</button>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
        <Button onClick={addIdea} disabled={!idea.trim() || saving}>{saving ? 'Guardando...' : 'Guardar idea'}</Button>
      </DialogFooter>
    </DialogContent>
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span className="brand-icon"><Sparkles size={17} strokeWidth={2.4} /></span><span>Hype</span></div>
        <nav className="main-nav" aria-label="Navegación principal">
          <p className="nav-caption">ESPACIO DE TRABAJO</p>
          {nav.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => setActive(label)}>
              <Icon size={18} /><span>{label}</span>{label === 'Ideas' && <span className="nav-count">12</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><Settings size={18} /><span>Configuración</span></button>
          <div className="profile-card"><span className="avatar">SM</span><span className="profile-copy"><strong>Sebastián</strong><small>Marca personal</small></span><MoreHorizontal size={17} /></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menú"><Menu size={20} /></button>
          <div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ideas y contenido..." aria-label="Buscar ideas y contenido" />{query && <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda"><X size={15} /></button>}<kbd>⌘ K</kbd></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notificaciones"><Bell size={18} /></button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button className="new-content-button" />}><Plus data-icon="inline-start" /> Nueva idea</DialogTrigger>
              {ideaDialog}
            </Dialog>
          </div>
        </header>

        <div className="content-area">
          <div className="page-heading">
            <div><p className="eyebrow">LUNES, 7 DE SEPTIEMBRE</p><h1>Buenos días, Sebastián</h1><p>Tu sistema editorial está listo. Hay 2 piezas que necesitan tu atención.</p></div>
            <button className="period-button">Últimos 7 días <ChevronDown size={15} /></button>
          </div>

          <div className="metric-grid">
            <article className="metric-card"><div className="metric-top"><span className="metric-icon purple"><Lightbulb size={18} /></span><span className="trend positive">+4 esta semana</span></div><strong>12</strong><p>Ideas por desarrollar</p></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon blue"><FileText size={18} /></span><span className="trend">3 en revisión</span></div><strong>8</strong><p>Contenidos activos</p></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon amber"><CalendarDays size={18} /></span><span className="trend positive">Semana cubierta</span></div><strong>5</strong><p>Programados</p></article>
            <article className="metric-card insight-card"><div className="metric-top"><span className="metric-icon dark"><WandSparkles size={18} /></span><span className="insight-pill">INSIGHT</span></div><p className="insight-copy">Tus posts con historias personales generan <strong>2,4× más comentarios.</strong></p></article>
          </div>

          <div className="main-grid">
            <section className="panel content-panel">
              <div className="panel-heading"><div><h2>Contenido reciente</h2><p>Continúa donde lo dejaste</p></div><button onClick={() => setActive('Contenido')}>Ver todo <ArrowRight size={15} /></button></div>
              <div className="content-list">
                {visibleContent.length ? visibleContent.map((item) => (
                  <article className="content-row" key={item.id}>
                    <span className={`platform-icon ${item.platform === 'LinkedIn' ? 'linkedin' : 'x'}`}>{item.platform === 'LinkedIn' ? <BriefcaseBusiness size={17} /> : <AtSign size={17} />}</span>
                    <div className="row-copy"><h3>{item.title}</h3><p>{item.excerpt}</p></div>
                    <div className="row-meta"><Badge className={statusClass[item.status]}>{item.status}</Badge><small>{item.date}</small></div>
                    <button className="row-more" aria-label={`Opciones para ${item.title}`}><MoreHorizontal size={18} /></button>
                  </article>
                )) : <div className="empty-search"><Search size={20} /><p>No encontramos contenido con “{query}”.</p></div>}
              </div>
            </section>

            <aside className="panel next-panel">
              <div className="panel-heading"><div><h2>Próximo a publicar</h2><p>Hoy · 18:30</p></div><button className="row-more" aria-label="Más opciones"><MoreHorizontal size={18} /></button></div>
              <div className="network-label"><span className="platform-icon linkedin"><BriefcaseBusiness size={16} /></span><span><strong>LinkedIn</strong><small>Perfil personal</small></span></div>
              <h3>La IA no va a reemplazar tu trabajo.</h3>
              <p className="preview-copy">Pero alguien que sepa convertirla en un sistema probablemente cambie la forma en que compites...</p>
              <div className="preview-tags"><span>Liderazgo</span><span>IA aplicada</span></div>
              <Button variant="outline" className="review-button">Revisar publicación <ArrowRight size={15} /></Button>
            </aside>
          </div>

          <section className="quick-capture">
            <div className="capture-icon"><Lightbulb size={21} /></div><div><h2>¿Tenés algo dando vueltas?</h2><p>Capturalo ahora. Después lo convertimos en contenido.</p></div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger render={<Button variant="outline" className="capture-button" />}><Plus data-icon="inline-start" /> Agregar idea</DialogTrigger>{ideaDialog}</Dialog>
          </section>
        </div>
      </section>
    </main>
  );
}
