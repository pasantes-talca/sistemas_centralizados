const icons = {
  cajas: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5"/>',
  aplicacion: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  grafico: '<path d="M4 3v17h17M8 15v-4m5 4V7m5 8V4"/>',
  escudo: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>'
};
const statusLabels = {available: 'Disponible', unavailable: 'No disponible', checking: 'Verificando…', unknown: 'Sin verificar'};
let systems = [], statuses = {}, category = 'Todas';
const grid = document.querySelector('#grid');
const message = document.querySelector('#message');
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function render() {
  const query = normalize(document.querySelector('#search').value.trim());
  const visible = systems.filter(s => (category === 'Todas' || (s.categoria || 'General') === category) && normalize(`${s.nombre} ${s.descripcion} ${s.categoria || ''}`).includes(query));
  grid.replaceChildren();
  document.querySelector('#count').textContent = systems.length;
  message.textContent = visible.length ? '' : 'No hay sistemas que coincidan con tu búsqueda.';
  message.hidden = visible.length > 0;
  for (const s of visible) {
    const card = element('article', 'card');
    const top = element('div', 'card-top');
    const icon = element('span', 'system-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = `<svg viewBox="0 0 24 24">${icons[s.icono] || icons.aplicacion}</svg>`;
    const state = statuses[s.id] || 'checking';
    const badge = element('span', `status ${state}`, statusLabels[state] || statusLabels.unknown);
    badge.dataset.systemId = s.id;
    top.append(icon, element('span', 'card-number', String(systems.indexOf(s) + 1).padStart(2, '0')));
    const link = element('a', 'enter', 'Ingresar');
    link.href = s.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Ingresar a ${s.nombre} (nueva pestaña)`);
    const arrow = element('span', 'arrow');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10"/></svg>';
    link.append(arrow);
    const bottom = element('div', 'card-bottom');
    bottom.append(badge, link);
    card.append(top, element('span', 'category', s.categoria || 'General'), element('h3', '', s.nombre), element('p', 'description', s.descripcion), bottom);
    grid.append(card);
  }
}
async function fetchJSON(url) {
  const response = await fetch(url, {signal: AbortSignal.timeout(6000)});
  if (!response.ok) throw new Error('Error de conexión');
  return response.json();
}
async function refreshStatus() {
  try {
    const data = await fetchJSON('/api/estado');
    statuses = data.statuses;
    document.querySelector('#last-check').textContent = data.checkedAt ? `Última comprobación: ${new Date(data.checkedAt * 1000).toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})}` : Object.values(statuses).includes('checking') ? 'Verificando disponibilidad…' : 'Disponibilidad sin verificar';
  } catch {
    statuses = Object.fromEntries(systems.map(s => [s.id, 'unknown']));
    document.querySelector('#last-check').textContent = 'No se pudo verificar la disponibilidad. Podés ingresar igualmente.';
  }
  document.querySelectorAll('[data-system-id]').forEach(badge => {
    const state = statuses[badge.dataset.systemId] || 'unknown';
    badge.className = `status ${state}`;
    badge.textContent = statusLabels[state] || statusLabels.unknown;
  });
}
async function init() {
  loadBrandLogo();
  document.querySelector('#year').textContent = new Date().getFullYear();
  try {
    systems = await fetchJSON('/api/sistemas');
    const categories = ['Todas', ...new Set(systems.map(s => s.categoria || 'General'))];
    for (const name of categories) {
      const button = element('button', 'filter', name);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(name === category));
      button.addEventListener('click', () => {
        category = name;
        document.querySelectorAll('.filter').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        render();
      });
      document.querySelector('#filters').append(button);
    }
    document.querySelector('#search').addEventListener('input', render);
    render();
    await refreshStatus();
    setInterval(() => { if (!document.hidden) refreshStatus(); }, 15000);
  } catch {
    message.textContent = 'No se pudieron cargar los sistemas. Recargá la página para volver a intentar.';
    document.querySelector('#last-check').textContent = 'Sin conexión con el portal';
  }
}
function loadBrandLogo() {
  const logo = document.querySelector('#brand-logo');
  const sources = ['/assets/talca-logo.svg', '/assets/talca-logo.png'];
  let index = 0;
  logo.addEventListener('load', () => {
    logo.hidden = false;
    document.querySelector('#brand-name').hidden = true;
  });
  logo.addEventListener('error', () => {
    index += 1;
    if (index < sources.length) logo.src = sources[index];
  });
  logo.src = sources[index];
}
init();
