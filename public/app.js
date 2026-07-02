// app.js — Sistema de Gestión Cunícola (frontend móvil)
'use strict';

const API = '/api';
const app = document.getElementById('app');
let CAT = null;            // catálogos (dropdowns)
let PARAMS = null;         // parámetros zootécnicos
const hoy = () => new Date().toISOString().slice(0, 10);
const LOCAL_API_PORTS = [3000, 3001, 3002, 3003];

// ---------- utilidades ----------
async function api(path, opts) {
  try {
    return await fetchApi(API + path, opts);
  } catch (err) {
    if (window.location.protocol === 'file:') {
      for (const port of LOCAL_API_PORTS) {
        try {
          return await fetchApi(`http://127.0.0.1:${port}/api${path}`, opts);
        } catch (_) {
          continue;
        }
      }
    }
    throw err;
  }
}

async function fetchApi(url, opts) {
  const r = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts && opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.error || `Error ${r.status}`);
  }
  return r.json();
}
function toast(msg, err) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast' + (err ? ' err' : '');
  setTimeout(() => t.classList.add('hidden'), 2600);
}
function esc(s) { return s == null ? '' : String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function addDays(iso, n) { if (!iso) return null; const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function fmt(iso) { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; }

function opts(list, sel, empty) {
  let h = empty ? `<option value="">${empty}</option>` : '';
  for (const o of list) {
    const v = typeof o === 'object' ? o.v ?? o.id : o;
    const t = typeof o === 'object' ? o.t ?? o.nombre : o;
    h += `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(t)}</option>`;
  }
  return h;
}

// ---------- modal ----------
const modal = document.getElementById('modal');
function openModal(title, bodyHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  modal.classList.remove('hidden');
}
function closeModal() { modal.classList.add('hidden'); }
document.getElementById('modalClose').onclick = closeModal;
modal.onclick = e => { if (e.target === modal) closeModal(); };

function confirmDialog(title, message, onConfirm) {
  openModal(title, `
    <div class="confirm-message">${esc(message)}</div>
    <div class="confirm-actions">
      <button class="btn danger" id="confirmAccept">Eliminar</button>
      <button class="btn sec" id="confirmCancel">Cancelar</button>
    </div>`);
  document.getElementById('confirmAccept').onclick = () => {
    closeModal(); onConfirm();
  };
  document.getElementById('confirmCancel').onclick = closeModal;
}

// ---------- router ----------
const nav = document.querySelectorAll('.bottomnav button');
nav.forEach(b => b.onclick = () => go(b.dataset.view));
function setActive(view) { nav.forEach(b => b.classList.toggle('active', b.dataset.view === view)); }
function setNavVisible(visible) {
  document.querySelector('.bottomnav').classList.toggle('hidden', !visible);
}

function moduleExitButton() {
  return `<div class="module-exit-wrap"><button class="btn sec btn-salir" onclick="go('home')">Salir</button></div>`;
}

async function go(view, arg) {
  if (view === 'home') return renderHome();
  if (['tablero', 'animales', 'nuevo'].includes(view)) {
    setActive(view);
    setNavVisible(true);
  } else {
    setNavVisible(false);
  }
  if (view === 'tablero') return renderTablero();
  if (view === 'animales') return renderAnimales();
  if (view === 'nuevo') return renderForm();
  if (view === 'almacen') return renderAlmacen();
  if (view === 'sensores') return renderSensores();
  if (view === 'vision') return renderVision();
  if (view === 'detalle') return renderDetalle(arg);
}

function renderHome() {
  setNavVisible(false);
  app.innerHTML = `
    <div class="home-shell">
      <div class="home-grid home-grid-full">
        <div class="home-card home-card-primary" data-action="app">
          <div class="home-content">
            <div class="home-icon">📊</div>
            <div class="home-title">Monitoreo de conejos</div>
            <div class="home-sub">Entrar al aplicativo</div>
          </div>
        </div>
        <div class="home-card home-card-accent" data-action="almacen">
          <div class="home-content">
            <div class="home-icon">🏷️</div>
            <div class="home-title">Almacén</div>
            <div class="home-sub">Control de alimentos y stock</div>
          </div>
        </div>
        <div class="home-card home-card-ghost" data-action="sensores">
          <div class="home-content">
            <div class="home-icon">📡</div>
            <div class="home-title">Sensores</div>
            <div class="home-sub">Datos ambientales y de bebederos</div>
          </div>
        </div>
        <div class="home-card home-card-ghost" data-action="vision">
          <div class="home-content">
            <div class="home-icon">📷</div>
            <div class="home-title">Visión Computacional</div>
            <div class="home-sub">Seguimiento automático por cámara</div>
          </div>
        </div>
      </div>
    </div>`;

  document.querySelectorAll('.home-card').forEach(card => {
    card.onclick = () => {
      const action = card.dataset.action;
      if (action === 'app') return go('tablero');
      if (action === 'almacen') return go('almacen');
      if (action === 'sensores') return go('sensores');
      if (action === 'vision') return go('vision');
      toast('Próximamente', true);
    };
  });
}

async function renderSensores() {
  app.innerHTML = `
    <div class="card">
      <div class="module-header">
        <div>
          <div class="module-title">Sensores</div>
          <div class="module-subtitle">Monitoreo automático de temperatura, humedad y bebederos</div>
        </div>
        ${moduleExitButton()}
      </div>
      <div class="kpi-grid">
        <div class="kpi"><div class="n">5</div><div class="l">Sensores activos</div></div>
        <div class="kpi"><div class="n">24°C</div><div class="l">Temperatura promedio</div></div>
        <div class="kpi"><div class="n">72%</div><div class="l">Humedad promedio</div></div>
      </div>
    </div>
    <div class="card">
      <div class="section-title">Alertas recientes</div>
      <div class="alert san"><span class="ico">💧</span><span class="txt">Nivel de agua bajo en bebedero 3</span><span class="fecha">Hace 12 min</span></div>
      <div class="alert pal"><span class="ico">🌡️</span><span class="txt">Temperatura superior al rango en zona 2</span><span class="fecha">Hace 28 min</span></div>
      <div class="alert pal"><span class="ico">🦺</span><span class="txt">Movimiento inusual detectado en pasillo</span><span class="fecha">Hace 45 min</span></div>
    </div>`;
}

async function renderVision() {
  app.innerHTML = `
    <div class="card">
      <div class="module-header">
        <div>
          <div class="module-title">Visión Computacional</div>
          <div class="module-subtitle">Análisis de cámaras para comportamiento y visitas</div>
        </div>
        ${moduleExitButton()}
      </div>
      <div class="kpi-grid">
        <div class="kpi"><div class="n">2</div><div class="l">Cámaras conectadas</div></div>
        <div class="kpi"><div class="n">8</div><div class="l">Eventos hoy</div></div>
        <div class="kpi"><div class="n">3</div><div class="l">Visitas detectadas</div></div>
      </div>
    </div>
    <div class="card">
      <div class="section-title">Eventos recientes</div>
      <div class="alert dest"><span class="ico">👀</span><span class="txt">Visita detectada en entrada principal</span><span class="fecha">Hace 16 min</span></div>
      <div class="alert nido"><span class="ico">🐇</span><span class="txt">Comportamiento de grupo inusual en zona A</span><span class="fecha">Hace 40 min</span></div>
      <div class="alert pal"><span class="ico">🔍</span><span class="txt">Actividad de conejo aumentada en jaula 7</span><span class="fecha">Hace 1 h</span></div>
    </div>`;
}

async function renderAlmacen() {
  app.innerHTML = '<div class="empty">Cargando almacén…</div>';
  try {
    const data = await api('/almacen');
    const items = data.items.map(item => `
      <div class="stock-item">
        <div class="stock-top">
          <div>
            <strong>${esc(item.nombre)}</strong>
            <div class="stock-meta">Stock: ${item.stock_kg} kg · Mínimo: ${item.minimo_kg} kg</div>
          </div>
          <div class="stock-actions">
            <button class="btn sec" onclick="modalAlmacenItem(${item.id})">Editar</button>
            <button class="btn danger" onclick="eliminarAlmacenItem(${item.id})">Eliminar</button>
          </div>
        </div>
        <div class="stock-badge ${item.estado === 'Alerta' ? 'alerta' : ''}">${esc(item.estado)}</div>
      </div>`).join('');

    app.innerHTML = `
      <div class="card">
        <div class="module-header">
          <div>
            <div class="module-title">Almacén</div>
            <div class="module-subtitle">Control de alimentos, insumos y stock disponible</div>
          </div>
          ${moduleExitButton()}
        </div>
        <div class="kpi-grid">
          <div class="kpi"><div class="n">${data.resumen.stock_total_kg} kg</div><div class="l">Stock total</div></div>
          <div class="kpi"><div class="n">${data.resumen.items_activos}</div><div class="l">Productos</div></div>
          <div class="kpi"><div class="n">${fmt(data.resumen.ultimo_movimiento)}</div><div class="l">Último movimiento</div></div>
        </div>
        <div class="btn-row" style="margin-top:16px">
          <button class="btn" onclick="modalAlmacenItem()">➕ Agregar producto</button>
        </div>
      </div>
      <div class="card">
        <div class="section-title">Productos del almacén</div>
        <div class="stock-list">${items || '<div class="empty">No hay productos registrados.</div>'}</div>
      </div>`;
  } catch (err) {
    app.innerHTML = `<div class="empty">No se pudo cargar el almacén.<br>${esc(err.message)}</div>`;
  }
}

window.modalAlmacenItem = async id => {
  let item = { nombre: '', stock_kg: '', minimo_kg: '', estado: 'OK' };
  let editar = false;
  if (id) {
    const data = await api('/almacen');
    item = data.items.find(x => x.id === id) || item;
    editar = true;
  }
  openModal(editar ? 'Editar producto' : 'Agregar producto', `
    <label>Nombre</label><input id="almNombre" value="${esc(item.nombre)}" />
    <div class="row2">
      <div><label>Stock (kg)</label><input type="number" step="0.01" id="almStock" value="${esc(item.stock_kg)}" /></div>
      <div><label>Mínimo (kg)</label><input type="number" step="0.01" id="almMinimo" value="${esc(item.minimo_kg)}" /></div>
    </div>
    <label>Estado</label><select id="almEstado">${opts(['OK', 'Alerta'], item.estado)}</select>
    <button class="btn" onclick="guardarAlmacenItem(${id || 'null'})">${editar ? 'Guardar cambios' : 'Agregar producto'}</button>`);
};

window.guardarAlmacenItem = async id => {
  const body = {
    nombre: val('almNombre'),
    stock_kg: parseFloat(val('almStock')) || 0,
    minimo_kg: parseFloat(val('almMinimo')) || 0,
    estado: val('almEstado') || 'OK'
  };
  if (!body.nombre) return toast('Ingrese el nombre', true);
  if (Number.isNaN(body.stock_kg)) return toast('Ingrese el stock', true);
  if (Number.isNaN(body.minimo_kg)) return toast('Ingrese el mínimo', true);
  if (id) {
    await api(`/almacen/items/${id}`, { method: 'PUT', body });
    toast('Producto actualizado');
  } else {
    await api('/almacen/items', { method: 'POST', body });
    toast('Producto agregado');
  }
  closeModal();
  go('almacen');
};

window.eliminarAlmacenItem = async id => {
  confirmDialog('Eliminar producto', '¿Eliminar este producto del almacén?', async () => {
    await api(`/almacen/items/${id}`, { method: 'DELETE' });
    toast('Producto eliminado');
    go('almacen');
  });
};

// ---------- TABLERO ----------
async function renderTablero() {
  app.innerHTML = '<div class="empty">Cargando…</div>';
  const d = await api('/dashboard');
  const a = d.alertas;
  const alertHtml = (arr, cls, ico, label, fn) => arr.length ? arr.map(x =>
    `<div class="alert ${cls}" ${fn ? `onclick="${fn}(${x.hembra_id || x.animal_id})"` : ''}>
      <span class="ico">${ico}</span>
      <span class="txt">${label(x)}</span>
      <span class="fecha">${fmt(x.fecha)}</span>
    </div>`).join('') : '';

  let alertas = '';
  alertas += alertHtml(a.palpaciones, 'pal', '🔍', x => `Palpar hembra — Jaula ${esc(x.jaula)}`, 'go2detalle');
  alertas += alertHtml(a.nidos, 'nido', '🪺', x => `Colocar nidal — Jaula ${esc(x.jaula)}`, 'go2detalle');
  alertas += alertHtml(a.partos, 'parto', '🐣', x => `Parto próximo — Jaula ${esc(x.jaula)}`, 'go2detalle');
  alertas += alertHtml(a.destetes, 'dest', '🥕', x => `Destete — Jaula ${esc(x.jaula)}`, 'go2detalle');
  alertas += alertHtml(a.sanidad, 'san', '💉', x => `${esc(x.tipo)} — Jaula ${esc(x.jaula)}`, 'go2detalle');
  const totalAlertas = a.palpaciones.length + a.nidos.length + a.partos.length + a.destetes.length + a.sanidad.length;

  app.innerHTML = `
    ${moduleExitButton()}
    <div class="section-title">Inventario</div>
    <div class="kpi-grid">
      <div class="kpi"><div class="n">${d.inventario.total}</div><div class="l">Activos</div></div>
      <div class="kpi"><div class="n">${d.inventario.hembras}</div><div class="l">Hembras</div></div>
      <div class="kpi"><div class="n">${d.inventario.machos}</div><div class="l">Machos</div></div>
    </div>
    <div class="section-title">Productividad</div>
    <div class="kpi-grid">
      <div class="kpi"><div class="n">${d.kpis.prolificidad}</div><div class="l">Nacidos vivos / parto</div></div>
      <div class="kpi"><div class="n">${d.kpis.mortalidad_predestete_pct}%</div><div class="l">Mort. predestete</div></div>
      <div class="kpi"><div class="n">${d.kpis.gazapos_destetados}</div><div class="l">Gazapos destetados</div></div>
    </div>
    <div class="section-title">Tareas de hoy ${totalAlertas ? `(${totalAlertas})` : ''}</div>
    ${alertas || '<div class="card empty">Sin tareas pendientes 🎉</div>'}
  `;
}
window.go2detalle = id => go('detalle', id);

// ---------- LISTA DE ANIMALES ----------
let filtro = { q: '', estado: 'Activo', sexo: '' };
async function renderAnimales() {
  app.innerHTML = `
    <div class="search">
      <input id="fq" placeholder="Buscar jaula, arete…" value="${esc(filtro.q)}" />
      <select id="fsexo">${opts([{ v: '', t: 'Todos' }, { v: 'H', t: 'Hembras' }, { v: 'M', t: 'Machos' }], filtro.sexo)}</select>
    </div>
    ${moduleExitButton()}
    <div id="lista"><div class="empty">Cargando…</div></div>`;
  const fq = document.getElementById('fq'), fs = document.getElementById('fsexo');
  fq.oninput = () => { filtro.q = fq.value; cargarLista(); };
  fs.onchange = () => { filtro.sexo = fs.value; cargarLista(); };
  cargarLista();
}
async function cargarLista() {
  const p = new URLSearchParams();
  if (filtro.q) p.set('q', filtro.q);
  if (filtro.sexo) p.set('sexo', filtro.sexo);
  if (filtro.estado) p.set('estado', filtro.estado);
  const rows = await api('/animales?' + p.toString());
  const cont = document.getElementById('lista');
  if (!cont) return;
  if (!rows.length) { cont.innerHTML = '<div class="empty">Sin resultados</div>'; return; }
  cont.innerHTML = rows.map(a => {
    const rep = a.sexo === 'H' && a.estado_reproductivo ? pill(a.estado_reproductivo) : '';
    const peso = a.peso_kg != null ? `${a.peso_kg} kg` : 'sin peso';
    return `<div class="card animal-card" onclick="go('detalle', ${a.id})">
      <div class="avatar ${a.sexo}">${a.sexo === 'M' ? '♂' : '♀'}</div>
      <div class="animal-info">
        <div class="top">Jaula ${esc(a.jaula || '—')} · ${esc(a.raza || 'Sin raza')}</div>
        <div class="sub">${peso}${a.edad_meses ? ' · ' + a.edad_meses + ' m' : ''} · ${esc(a.categoria || '')}</div>
      </div>
      ${rep}
    </div>`;
  }).join('');
}
function pill(estado) {
  const cls = estado === 'Preñada' ? 'prenada' : estado.startsWith('Servida') ? 'servida' : 'vacia';
  return `<span class="pill ${cls}">${esc(estado)}</span>`;
}

// ---------- FORM NUEVO/EDITAR ----------
async function renderForm(animal) {
  const a = animal || {};
  const editar = !!animal;
  app.innerHTML = `
    <div class="card">
      ${moduleExitButton()}
      <h3 style="margin-top:0">${editar ? 'Editar animal' : 'Nuevo animal'}</h3>
      <form id="frm">
        <div class="row2">
          <div><label>Jaula</label><input name="jaula" value="${esc(a.jaula)}" inputmode="numeric" /></div>
          <div><label>ID / Arete</label><input name="arete" value="${esc(a.arete)}" /></div>
        </div>
        <div class="row2">
          <div><label>Raza</label><select name="raza_id">${opts(CAT.razas, a.raza_id, 'Seleccione…')}</select></div>
          <div><label>Sexo</label><select name="sexo" id="fSexo">${opts(CAT.sexo, a.sexo, 'Seleccione…')}</select></div>
        </div>
        <div class="row2">
          <div><label>Fecha de nacimiento</label><input type="date" name="fecha_nacimiento" id="fNac" value="${esc(a.fecha_nacimiento)}" max="${hoy()}" /></div>
          <div><label>Edad (auto)</label><input id="fEdad" value="${a.edad_meses != null ? a.edad_meses + ' meses' : ''}" disabled /></div>
        </div>
        <div class="row2">
          <div><label>Categoría</label><select name="categoria">${opts(CAT.categoria, a.categoria, 'Seleccione…')}</select></div>
          <div><label>Origen</label><select name="origen">${opts(CAT.origen, a.origen || 'Nacido en granja')}</select></div>
        </div>
        <div class="row2">
          <div><label>Peso (kg)</label><input type="number" step="0.01" name="peso_kg" id="fPeso" value="${esc(a.peso_kg)}" inputmode="decimal" /></div>
          <div><label>Peso (lb, auto)</label><input id="fLb" value="${a.peso_lb != null ? a.peso_lb : ''}" disabled /></div>
        </div>
        <div class="row2">
          <div><label>Condición corporal</label><select name="condicion_corporal">${opts(CAT.condicion_corporal, a.condicion_corporal, '—')}</select></div>
          <div><label>Temperamento</label><select name="temperamento">${opts(CAT.temperamento, a.temperamento || 'Normal')}</select></div>
        </div>
        <div class="row2">
          <div><label>ID Padre</label><input name="id_padre" value="${esc(a.id_padre)}" /></div>
          <div><label>ID Madre</label><input name="id_madre" value="${esc(a.id_madre)}" /></div>
        </div>
        <div class="row2">
          <div><label>Estado sanitario</label><select name="estado_sanitario">${opts(CAT.estado_sanitario, a.estado_sanitario || 'Sano')}</select></div>
          <div><label>Estado</label><select name="estado" id="fEstado">${opts(CAT.estado, a.estado || 'Activo')}</select></div>
        </div>
        <div id="bajaWrap" style="display:none">
          <div class="row2">
            <div><label>Fecha de baja</label><input type="date" name="fecha_baja" value="${esc(a.fecha_baja)}" /></div>
            <div><label>Motivo / Destino</label><select name="motivo_destino">${opts(CAT.motivo_destino, a.motivo_destino, '—')}</select></div>
          </div>
        </div>
        <label>Observaciones</label>
        <textarea name="observaciones" rows="2">${esc(a.observaciones)}</textarea>
        <div class="hint" id="repHint"></div>
        <button class="btn" type="submit">${editar ? 'Guardar cambios' : 'Registrar animal'}</button>
        ${editar ? `<button type="button" class="btn danger" onclick="borrarAnimal(${a.id})">Eliminar animal</button>` : ''}
      </form>
    </div>`;

  const frm = document.getElementById('frm');
  const nac = document.getElementById('fNac'), edad = document.getElementById('fEdad');
  const peso = document.getElementById('fPeso'), lb = document.getElementById('fLb');
  const estadoSel = document.getElementById('fEstado'), bajaWrap = document.getElementById('bajaWrap');

  function calcEdad() {
    if (!nac.value) { edad.value = ''; return; }
    const dias = (Date.now() - new Date(nac.value + 'T00:00:00')) / 86400000;
    edad.value = (Math.round(dias / 30.44 * 10) / 10) + ' meses';
  }
  function calcLb() { lb.value = peso.value ? (Math.round(peso.value * 2.20462 * 100) / 100) : ''; }
  function toggleBaja() { bajaWrap.style.display = (estadoSel.value && estadoSel.value !== 'Activo') ? 'block' : 'none'; }
  nac.oninput = calcEdad; peso.oninput = calcLb; estadoSel.onchange = toggleBaja;
  calcEdad(); calcLb(); toggleBaja();

  frm.onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(frm).entries());
    try {
      if (editar) { await api('/animales/' + a.id, { method: 'PUT', body: data }); toast('Cambios guardados'); go('detalle', a.id); }
      else { const nuevo = await api('/animales', { method: 'POST', body: data }); toast('Animal registrado'); go('detalle', nuevo.id); }
    } catch (err) { toast(err.message, true); }
  };
}
window.borrarAnimal = async id => {
  if (!confirm('¿Eliminar este animal y todo su historial?')) return;
  await api('/animales/' + id, { method: 'DELETE' });
  toast('Animal eliminado'); go('animales');
};

// ---------- DETALLE ----------
let detTab = 'ficha';
async function renderDetalle(id) {
  app.innerHTML = '<div class="empty">Cargando…</div>';
  const a = await api('/animales/' + id);
  const rep = a.sexo === 'H' && a.estado_reproductivo ? pill(a.estado_reproductivo) : '';
  const tabs = a.sexo === 'H'
    ? [['ficha', 'Ficha'], ['repro', 'Reproducción'], ['peso', 'Peso'], ['san', 'Sanidad']]
    : [['ficha', 'Ficha'], ['peso', 'Peso'], ['san', 'Sanidad']];
  app.innerHTML = `
    <div class="card animal-card" style="cursor:default">
      ${moduleExitButton()}
      <div class="avatar ${a.sexo}">${a.sexo === 'M' ? '♂' : '♀'}</div>
      <div class="animal-info">
        <div class="top">Jaula ${esc(a.jaula || '—')} · ${esc(a.raza || '')}</div>
        <div class="sub">${esc(a.categoria || '')} · ${a.peso_kg != null ? a.peso_kg + ' kg' : 'sin peso'}${a.edad_meses ? ' · ' + a.edad_meses + ' m' : ''}</div>
      </div>${rep}
    </div>
    <div class="tabs" id="tabs">${tabs.map(t => `<button data-t="${t[0]}" class="${detTab === t[0] ? 'active' : ''}">${t[1]}</button>`).join('')}</div>
    <div id="tabbody"></div>
    <button class="btn sec" onclick="editarAnimal(${a.id})">✏️ Editar ficha</button>`;
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { detTab = b.dataset.t; renderTab(a); document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('active', x === b)); });
  renderTab(a);
}
window.editarAnimal = async id => { const a = await api('/animales/' + id); renderForm(a); };

function renderTab(a) {
  const b = document.getElementById('tabbody');
  if (detTab === 'ficha') return b.innerHTML = fichaHtml(a);
  if (detTab === 'peso') return b.innerHTML = pesoHtml(a);
  if (detTab === 'san') return b.innerHTML = sanHtml(a);
  if (detTab === 'repro') return b.innerHTML = reproHtml(a);
}

function kv(k, v) { return `<div class="kv"><span class="k">${k}</span><span class="v">${v ?? '—'}</span></div>`; }
function fichaHtml(a) {
  return `<div class="card">
    ${kv('ID / Arete', esc(a.arete))}
    ${kv('Raza', esc(a.raza))}
    ${kv('Sexo', a.sexo === 'M' ? 'Macho' : 'Hembra')}
    ${kv('Nacimiento', fmt(a.fecha_nacimiento))}
    ${kv('Edad', a.edad_meses != null ? a.edad_meses + ' meses' : '—')}
    ${kv('Origen', esc(a.origen))}
    ${kv('Genealogía', `${esc(a.id_padre) || '—'} × ${esc(a.id_madre) || '—'}`)}
    ${kv('Peso actual', a.peso_kg != null ? `${a.peso_kg} kg (${a.peso_lb} lb)` : '—')}
    ${kv('Cond. corporal', a.condicion_corporal ?? '—')}
    ${kv('Temperamento', esc(a.temperamento))}
    ${kv('Estado sanitario', esc(a.estado_sanitario))}
    ${kv('Estado', esc(a.estado))}
    ${a.observaciones ? kv('Observaciones', esc(a.observaciones)) : ''}
  </div>`;
}

// ---- Peso ----
function pesoHtml(a) {
  const list = a.pesajes.length ? a.pesajes.map(p =>
    `<div class="timeline-item"><b>${p.peso_kg} kg</b> (${Math.round(p.peso_kg * 2.20462 * 100) / 100} lb)${p.condicion_corporal ? ' · CC ' + p.condicion_corporal : ''}<div class="meta">${fmt(p.fecha)}</div></div>`).join('') : '<div class="empty">Sin pesajes</div>';
  return `<button class="btn" onclick="modalPeso(${a.id})">➕ Registrar pesaje</button>${list}`;
}
window.modalPeso = id => openModal('Nuevo pesaje', `
  <label>Fecha</label><input type="date" id="pFecha" value="${hoy()}" />
  <div class="row2">
    <div><label>Peso (kg)</label><input type="number" step="0.01" id="pKg" inputmode="decimal" oninput="document.getElementById('pLb').value=this.value?(Math.round(this.value*2.20462*100)/100):''" /></div>
    <div><label>Peso (lb, auto)</label><input id="pLb" disabled /></div>
  </div>
  <label>Condición corporal</label><select id="pCC">${opts(CAT.condicion_corporal, 3, '—')}</select>
  <button class="btn" onclick="guardarPeso(${id})">Guardar</button>`);
window.guardarPeso = async id => {
  const body = { fecha: val('pFecha'), peso_kg: parseFloat(val('pKg')) || null, condicion_corporal: val('pCC') || null };
  if (!body.peso_kg) return toast('Ingrese el peso', true);
  await api(`/animales/${id}/pesajes`, { method: 'POST', body }); closeModal(); toast('Pesaje guardado'); go('detalle', id);
};

// ---- Sanidad ----
function sanHtml(a) {
  const list = a.sanidad.length ? a.sanidad.map(s =>
    `<div class="timeline-item"><b>${esc(s.tipo)}</b>${s.producto ? ' · ' + esc(s.producto) : ''}${s.dosis ? ' (' + esc(s.dosis) + ')' : ''}<div class="meta">${fmt(s.fecha)}${s.proxima_fecha ? ' · próxima: ' + fmt(s.proxima_fecha) : ''}</div></div>`).join('') : '<div class="empty">Sin eventos de sanidad</div>';
  return `<button class="btn" onclick="modalSan(${a.id})">➕ Registrar sanidad</button>${list}`;
}
window.modalSan = id => openModal('Evento de sanidad', `
  <label>Tipo</label><select id="sTipo">${opts(CAT.sanidad_tipo)}</select>
  <label>Fecha</label><input type="date" id="sFecha" value="${hoy()}" />
  <div class="row2">
    <div><label>Producto</label><input id="sProd" /></div>
    <div><label>Dosis</label><input id="sDosis" /></div>
  </div>
  <label>Vía</label><select id="sVia">${opts(CAT.via_administracion, '', '—')}</select>
  <label>Próxima fecha (refuerzo)</label><input type="date" id="sProx" />
  <label>Notas</label><textarea id="sNotas" rows="2"></textarea>
  <button class="btn" onclick="guardarSan(${id})">Guardar</button>`);
window.guardarSan = async id => {
  const body = { tipo: val('sTipo'), fecha: val('sFecha'), producto: val('sProd'), dosis: val('sDosis'), via: val('sVia'), proxima_fecha: val('sProx') || null, notas: val('sNotas') };
  await api(`/animales/${id}/sanidad`, { method: 'POST', body }); closeModal(); toast('Evento guardado'); go('detalle', id);
};

// ---- Reproducción ----
function reproHtml(a) {
  let html = '';
  const m = a.monta_activa;
  if (m) {
    html += `<div class="card">
      <div class="section-title" style="margin-top:0">Ciclo activo</div>
      ${kv('Fecha de monta', fmt(m.fecha_monta))}
      ${kv('Palpar el', `${fmt(m.palpacion_fecha)} · <b>${esc(m.palpacion_resultado)}</b>`)}
      ${kv('Colocar nidal', fmt(m.nido_fecha))}
      ${kv('Parto probable', fmt(m.parto_probable))}
      <div class="btn-row">
        <button class="btn sec" onclick="modalPalpacion(${m.id}, ${a.id})">🔍 Palpación</button>
        <button class="btn" onclick="modalParto(${m.id}, ${a.id})">🐣 Registrar parto</button>
      </div>
    </div>`;
  } else {
    html += `<button class="btn" onclick="modalMonta(${a.id})">➕ Registrar monta</button>`;
  }
  // historial de partos
  if (a.partos && a.partos.length) {
    html += '<div class="section-title">Partos</div>';
    html += a.partos.map(p => `<div class="timeline-item">
      <b>${p.nacidos_vivos} vivos</b>, ${p.nacidos_muertos} muertos${p.gazapos_destetados != null ? ` · ${p.gazapos_destetados} destetados` : ''}
      <div class="meta">Parto ${fmt(p.fecha_parto)} · destete prob. ${fmt(p.fecha_destete_probable)}${p.fecha_destete_real ? ' · destetado ' + fmt(p.fecha_destete_real) : ''}</div>
      ${!p.fecha_destete_real ? `<button class="btn sec" style="margin-top:8px" onclick="modalDestete(${p.id}, ${a.id}, ${p.nacidos_vivos})">🥕 Registrar destete</button>` : ''}
    </div>`).join('');
  }
  return html;
}
window.modalMonta = async id => {
  const machos = await api('/animales?sexo=M&estado=Activo');
  openModal('Registrar monta', `
    <label>Fecha de monta</label><input type="date" id="mFecha" value="${hoy()}" max="${hoy()}" oninput="mCalc()" />
    <label>Macho</label><select id="mMacho">${opts([{ v: '', t: '— sin especificar —' }].concat(machos.map(x => ({ v: x.id, t: 'Jaula ' + (x.jaula || x.id) + ' · ' + (x.raza || '') }))))}</select>
    <label>Método</label><select id="mMetodo">${opts(CAT.metodo_monta)}</select>
    <div class="hint" id="mHint"></div>
    <label>Notas</label><textarea id="mNotas" rows="2"></textarea>
    <button class="btn" onclick="guardarMonta(${id})">Guardar</button>`);
  window.mCalc();
};
window.mCalc = () => {
  const f = val('mFecha'); const h = document.getElementById('mHint'); if (!h) return;
  if (!f) { h.textContent = ''; return; }
  h.innerHTML = `📅 Palpar: <b>${fmt(addDays(f, PARAMS.PALPACION_DIAS))}</b> · Nidal: <b>${fmt(addDays(f, PARAMS.NIDO_DIAS))}</b> · Parto probable: <b>${fmt(addDays(f, PARAMS.GESTACION_DIAS))}</b>`;
};
window.guardarMonta = async id => {
  const body = { fecha_monta: val('mFecha'), macho_id: val('mMacho') || null, metodo: val('mMetodo'), notas: val('mNotas') };
  if (!body.fecha_monta) return toast('Ingrese la fecha', true);
  await api(`/animales/${id}/montas`, { method: 'POST', body }); closeModal(); toast('Monta registrada'); go('detalle', id);
};
window.modalPalpacion = (mid, aid) => openModal('Resultado de palpación', `
  <label>Resultado</label><select id="palRes">${opts(CAT.palpacion_resultado)}</select>
  <p class="hint">Positiva = sigue el ciclo. Negativa = se cierra la monta para volver a servir.</p>
  <button class="btn" onclick="guardarPalpacion(${mid}, ${aid})">Guardar</button>`);
window.guardarPalpacion = async (mid, aid) => {
  const res = val('palRes');
  const body = { palpacion_resultado: res, estado: res === 'Negativa' ? 'Fallida' : 'Activa' };
  await api('/montas/' + mid, { method: 'PUT', body }); closeModal(); toast('Palpación registrada'); go('detalle', aid);
};
window.modalParto = (mid, aid) => openModal('Registrar parto', `
  <label>Fecha de parto</label><input type="date" id="ptFecha" value="${hoy()}" oninput="ptCalc()" />
  <div class="row2">
    <div><label>Nacidos vivos</label><input type="number" id="ptVivos" inputmode="numeric" value="0" /></div>
    <div><label>Nacidos muertos</label><input type="number" id="ptMuertos" inputmode="numeric" value="0" /></div>
  </div>
  <label>Peso de camada (kg, opcional)</label><input type="number" step="0.01" id="ptPeso" inputmode="decimal" />
  <div class="hint" id="ptHint"></div>
  <label>Notas</label><textarea id="ptNotas" rows="2"></textarea>
  <button class="btn" onclick="guardarParto(${mid}, ${aid})">Guardar</button>`);
window.ptCalc = () => { const f = val('ptFecha'); const h = document.getElementById('ptHint'); if (h && f) h.innerHTML = `🥕 Destete probable: <b>${fmt(addDays(f, PARAMS.DESTETE_DIAS))}</b>`; };
setTimeout(() => window.ptCalc && window.ptCalc(), 0);
window.guardarParto = async (mid, aid) => {
  const body = { fecha_parto: val('ptFecha'), nacidos_vivos: parseInt(val('ptVivos')) || 0, nacidos_muertos: parseInt(val('ptMuertos')) || 0, peso_camada_kg: parseFloat(val('ptPeso')) || null, notas: val('ptNotas') };
  if (!body.fecha_parto) return toast('Ingrese la fecha', true);
  await api(`/montas/${mid}/parto`, { method: 'POST', body }); closeModal(); toast('Parto registrado'); go('detalle', aid);
};
window.modalDestete = (pid, aid, vivos) => openModal('Registrar destete', `
  <label>Fecha de destete</label><input type="date" id="dtFecha" value="${hoy()}" />
  <label>Gazapos destetados</label><input type="number" id="dtNum" inputmode="numeric" value="${vivos}" />
  <label>Notas</label><textarea id="dtNotas" rows="2"></textarea>
  <button class="btn" onclick="guardarDestete(${pid}, ${aid})">Guardar</button>`);
window.guardarDestete = async (pid, aid) => {
  const body = { fecha_destete_real: val('dtFecha'), gazapos_destetados: parseInt(val('dtNum')) || 0, notas: val('dtNotas') };
  await api('/partos/' + pid, { method: 'PUT', body }); closeModal(); toast('Destete registrado'); go('detalle', aid);
};

function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }

// ---------- init ----------
(async function init() {
  try {
    CAT = await api('/catalogos'); PARAMS = CAT.params;
    go('home');
  } catch (e) {
    app.innerHTML = '<div class="empty">No se pudo conectar con el servidor.<br>Verifique que el sistema esté iniciado.</div>';
  }
})();
