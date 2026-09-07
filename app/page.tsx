'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, AtSign, BarChart3, Bell, BriefcaseBusiness, CalendarDays,
  Check, ChevronDown, FileText, LayoutDashboard, Lightbulb, Menu, MoreHorizontal,
  Plus, Search, Settings, Sparkles, WandSparkles, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Platform = 'LinkedIn' | 'X';
type Status = 'Idea' | 'Borrador' | 'Revisión' | 'Programado' | 'Publicado';
type ContentItem = { id: number; title: string; excerpt: string; platform: Platform; status: Status; date: string };
type EditorialProfile = {
  id: 'hype' | 'sebastian'; name: string; kind: string; initials: string; audience: string;
  goals: string; voiceSummary: string; referenceAccounts: string; linkedinFrequency: number;
  xFrequency: number; requireApproval: boolean;
};

const profileDefaults: EditorialProfile[] = [
  { id: 'hype', name: 'Hype', kind: 'Empresa', initials: 'HY', audience: 'Fundadores, inversores y personas interesadas en startups y tecnología.', goals: 'Construir autoridad, generar comunidad y aumentar el alcance.', voiceSummary: 'Directa, ambiciosa y clara. Frases breves, ideas contundentes y foco en construir compañías reales junto a creadores. Sin lenguaje corporativo vacío.', referenceAccounts: 'https://x.com/hypeco0\nhttps://www.linkedin.com/company/hype-c0/posts/', linkedinFrequency: 3, xFrequency: 5, requireApproval: true },
  { id: 'sebastian', name: 'Sebastián', kind: 'Marca personal', initials: 'SM', audience: 'Fundadores, inversores y personas del ecosistema startup y tecnología.', goals: 'Construir autoridad personal, generar comunidad y aumentar el alcance.', voiceSummary: 'Perfil listo para definir con ejemplos personales. Debe sentirse humano, específico y basado en experiencia propia.', referenceAccounts: '', linkedinFrequency: 0, xFrequency: 0, requireApproval: true },
];

const sampleContent: Record<EditorialProfile['id'], ContentItem[]> = {
  hype: [
    { id: -1, title: 'Los creadores tienen la atención, pero no la infraestructura', excerpt: 'Ahí entra Hype: company builder de consumo masivo junto a influencers.', platform: 'X', status: 'Publicado', date: 'Referencia' },
    { id: -2, title: 'Los creadores ya tienen la atención, la comunidad y la confianza', excerpt: 'Construimos compañías reales, con producto, fabricación, distribución y retail.', platform: 'LinkedIn', status: 'Publicado', date: 'Referencia' },
    { id: -3, title: 'Qué significa construir junto a un creador', excerpt: 'Una idea para desarrollar desde la experiencia de Hype.', platform: 'LinkedIn', status: 'Idea', date: 'Pendiente' },
  ],
  sebastian: [
    { id: -4, title: 'Por qué decidí construir desde Buenos Aires', excerpt: 'Una historia personal sobre ambición, ecosistema y ejecución.', platform: 'LinkedIn', status: 'Idea', date: 'Pendiente' },
    { id: -5, title: 'Lo que aprendí construyendo Hype', excerpt: 'Notas personales para convertir en una serie de publicaciones.', platform: 'X', status: 'Idea', date: 'Pendiente' },
  ],
};

const nav = [
  { label: 'Inicio', icon: LayoutDashboard }, { label: 'Ideas', icon: Lightbulb },
  { label: 'Contenido', icon: FileText }, { label: 'Calendario', icon: CalendarDays },
  { label: 'Analítica', icon: BarChart3 },
];

const statusClass: Record<Status, string> = {
  Idea: 'status-idea', Borrador: 'status-draft', Revisión: 'status-review', Programado: 'status-scheduled', Publicado: 'status-published',
};

export default function Home() {
  const [profiles, setProfiles] = useState(profileDefaults);
  const [activeProfileId, setActiveProfileId] = useState<EditorialProfile['id']>('hype');
  const [content, setContent] = useState(sampleContent.hype);
  const [active, setActive] = useState('Inicio');
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [idea, setIdea] = useState('');
  const [platform, setPlatform] = useState<Platform>('LinkedIn');
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(profileDefaults[0]);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profileDefaults[0];
  const visibleContent = useMemo(() => content.filter((item) => `${item.title} ${item.excerpt}`.toLowerCase().includes(query.toLowerCase())), [content, query]);

  const saveIdea = useCallback(async (title: string, targetPlatform: Platform, profileId: EditorialProfile['id']) => {
    const optimisticItem: ContentItem = { id: Date.now(), title, excerpt: 'Nueva idea lista para desarrollar con tu voz y experiencia.', platform: targetPlatform, status: 'Idea', date: 'Ahora' };
    try {
      const response = await fetch('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, platform: targetPlatform, profileId }) });
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
    fetch('/api/profiles')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ profiles: stored }: { profiles: EditorialProfile[] }) => stored.length && setProfiles(stored))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setContent(sampleContent[activeProfileId]);
    fetch(`/api/content?profile=${activeProfileId}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ items }: { items: Array<Omit<ContentItem, 'date'> & { createdAt: string }> }) => {
        if (items.length) setContent([...items.map((item) => ({ ...item, date: 'Guardado' })), ...sampleContent[activeProfileId]]);
      })
      .catch(() => undefined);
  }, [activeProfileId]);

  useEffect(() => {
    type ToolInput = { title?: unknown; platform?: unknown; profile?: unknown };
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
        properties: { title: { type: 'string', minLength: 1, maxLength: 280 }, platform: { type: 'string', enum: ['LinkedIn', 'X'] }, profile: { type: 'string', enum: ['hype', 'sebastian'] } },
        required: ['title', 'platform', 'profile'], additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: ToolInput) {
        const title = typeof input.title === 'string' ? input.title.trim() : '';
        const targetPlatform = input.platform === 'X' ? 'X' : input.platform === 'LinkedIn' ? 'LinkedIn' : null;
        const targetProfile = input.profile === 'hype' || input.profile === 'sebastian' ? input.profile : null;
        if (!title || !targetPlatform || !targetProfile) throw new Error('Título, plataforma o perfil inválidos.');
        const id = await saveIdea(title, targetPlatform, targetProfile);
        return { id, status: 'Idea', platform: targetPlatform, profile: targetProfile };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [saveIdea]);

  async function addIdea() {
    const title = idea.trim();
    if (!title) return;
    setSaving(true);
    try {
      await saveIdea(title, platform, activeProfileId);
    } finally {
      setIdea(''); setSaving(false); setDialogOpen(false);
    }
  }

  function openProfileSettings() {
    setSettingsDraft(activeProfile);
    setSettingsOpen(true);
  }

  async function saveProfileSettings() {
    setSettingsSaving(true);
    try {
      const response = await fetch('/api/profiles', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settingsDraft) });
      if (!response.ok) throw new Error('No se pudo guardar');
      const { profile } = await response.json();
      setProfiles((items) => items.map((item) => item.id === profile.id ? profile : item));
      setSettingsOpen(false);
    } finally {
      setSettingsSaving(false);
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
        <div className="brand-mark"><span className="brand-icon"><Sparkles size={17} strokeWidth={2.4} /></span><span>CMS</span></div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<button className="profile-switcher" />}>
            <span className={`profile-logo ${activeProfile.id}`} aria-hidden="true">{activeProfile.initials}</span>
            <span><small>PERFIL ACTIVO</small><strong>{activeProfile.name}</strong></span>
            <ChevronDown size={15} />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="profile-menu" sideOffset={7}>
            <DropdownMenuLabel>Perfiles editoriales</DropdownMenuLabel>
            {profiles.map((profile) => (
              <DropdownMenuItem key={profile.id} className="profile-menu-item" onClick={() => setActiveProfileId(profile.id)}>
                <span className={`profile-logo ${profile.id}`}>{profile.initials}</span>
                <span><strong>{profile.name}</strong><small>{profile.kind}</small></span>
                {profile.id === activeProfileId && <Check className="profile-check" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openProfileSettings}><Settings /> Configurar perfil activo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <nav className="main-nav" aria-label="Navegación principal">
          <p className="nav-caption">ESPACIO DE TRABAJO</p>
          {nav.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => setActive(label)}>
              <Icon size={18} /><span>{label}</span>{label === 'Ideas' && <span className="nav-count">12</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={openProfileSettings}><Settings size={18} /><span>Voz y referencias</span></button>
          <div className="profile-card"><span className="avatar">SM</span><span className="profile-copy"><strong>Sebastián</strong><small>Administrador</small></span><MoreHorizontal size={17} /></div>
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
            <div><p className="eyebrow">PERFIL · {activeProfile.kind.toUpperCase()}</p><h1>{activeProfile.name}</h1><p>{activeProfile.goals}</p></div>
            <button className="period-button">Últimos 7 días <ChevronDown size={15} /></button>
          </div>

          <div className="metric-grid">
            <article className="metric-card"><div className="metric-top"><span className="metric-icon purple"><Lightbulb size={18} /></span><span className="trend positive">Perfil separado</span></div><strong>{content.filter((item) => item.status === 'Idea').length}</strong><p>Ideas por desarrollar</p></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon blue"><BriefcaseBusiness size={18} /></span><span className="trend">Por semana</span></div><strong>{activeProfile.linkedinFrequency || '—'}</strong><p>Publicaciones en LinkedIn</p></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon amber"><AtSign size={18} /></span><span className="trend">Por semana</span></div><strong>{activeProfile.xFrequency || '—'}</strong><p>Publicaciones en X</p></article>
            <article className="metric-card insight-card"><div className="metric-top"><span className="metric-icon dark"><WandSparkles size={18} /></span><span className="insight-pill">VOZ</span></div><p className="insight-copy">{activeProfile.voiceSummary}</p></article>
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
              <div className="network-label"><span className="platform-icon linkedin"><BriefcaseBusiness size={16} /></span><span><strong>LinkedIn</strong><small>{activeProfile.name} · {activeProfile.kind}</small></span></div>
              <h3>{activeProfile.id === 'hype' ? 'Los creadores tienen la atención. Hype construye lo que sigue.' : 'Por qué decidí construir desde Buenos Aires.'}</h3>
              <p className="preview-copy">Esta publicación está separada dentro del perfil {activeProfile.name} y requiere aprobación antes de salir.</p>
              <div className="preview-tags"><span>{activeProfile.id === 'hype' ? 'Company building' : 'Founder journey'}</span><span>Startups</span></div>
              <Button variant="outline" className="review-button">Revisar antes de publicar <ArrowRight size={15} /></Button>
            </aside>
          </div>

          <section className="quick-capture">
            <div className="capture-icon"><Lightbulb size={21} /></div><div><h2>¿Tenés algo dando vueltas?</h2><p>Capturalo ahora. Después lo convertimos en contenido.</p></div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger render={<Button variant="outline" className="capture-button" />}><Plus data-icon="inline-start" /> Agregar idea</DialogTrigger>{ideaDialog}</Dialog>
          </section>
        </div>
      </section>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="profile-settings-dialog">
          <DialogHeader>
            <DialogTitle>Voz y referencias · {settingsDraft.name}</DialogTitle>
            <DialogDescription>Esta configuración se usa solamente dentro de este perfil editorial.</DialogDescription>
          </DialogHeader>
          <div className="settings-grid">
            <div className="settings-field"><Label htmlFor="audience">Audiencia</Label><Input id="audience" value={settingsDraft.audience} onChange={(event) => setSettingsDraft({ ...settingsDraft, audience: event.target.value })} /></div>
            <div className="settings-field"><Label htmlFor="goals">Objetivos</Label><Input id="goals" value={settingsDraft.goals} onChange={(event) => setSettingsDraft({ ...settingsDraft, goals: event.target.value })} /></div>
            <div className="settings-field"><Label htmlFor="voice">Voz y tono</Label><Textarea id="voice" className="min-h-28 resize-none" value={settingsDraft.voiceSummary} onChange={(event) => setSettingsDraft({ ...settingsDraft, voiceSummary: event.target.value })} /></div>
            <div className="settings-field"><Label htmlFor="references">Cuentas de referencia</Label><Textarea id="references" className="min-h-24 resize-none" placeholder="Una URL o @usuario por línea" value={settingsDraft.referenceAccounts} onChange={(event) => setSettingsDraft({ ...settingsDraft, referenceAccounts: event.target.value })} /></div>
            <div className="approval-note"><Check size={16} /><span><strong>Aprobación obligatoria</strong><small>Nada se publicará sin que lo revises.</small></span></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancelar</Button><Button onClick={saveProfileSettings} disabled={settingsSaving}>{settingsSaving ? 'Guardando...' : 'Guardar configuración'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
