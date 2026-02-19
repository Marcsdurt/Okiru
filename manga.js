// ======== TRADUÇÃO DE GÊNEROS ========
const generosPT = {
  "Action":"Ação","Adventure":"Aventura","Comedy":"Comédia","Drama":"Drama",
  "Fantasy":"Fantasia","Horror":"Terror","Mystery":"Mistério","Romance":"Romance",
  "Sci-Fi":"Ficção Científica","Science Fiction":"Ficção Científica",
  "Slice of Life":"Slice of Life","Sports":"Esportes","Supernatural":"Sobrenatural",
  "Thriller":"Suspense","Psychological":"Psicológico","Mecha":"Mecha","Music":"Música",
  "School":"Escola","Military":"Militar","Historical":"Histórico","Parody":"Paródia",
  "Harem":"Harém","Martial Arts":"Artes Marciais","Magic":"Magia","Demons":"Demônios",
  "Vampire":"Vampiro","Space":"Espaço","Samurai":"Samurai","Game":"Jogos",
  "Josei":"Josei","Seinen":"Seinen","Shonen":"Shonen","Shounen":"Shonen",
  "Shoujo":"Shojo","Shojo":"Shojo","Award Winning":"Premiado",
  "Boys Love":"Boys Love","Girls Love":"Girls Love","Suspense":"Suspense",
  "Gore":"Gore","Ecchi":"Ecchi","Isekai":"Isekai",
};

function traduzirGenero(nome) { return generosPT[nome] || nome; }

function renderizarTagsGenero(generos) {
  if (!generos || generos.length === 0) return "";
  return generos.map(g => {
    const nome = typeof g === "string" ? g : g.name;
    return `<span class="genero-tag">${traduzirGenero(nome)}</span>`;
  }).join("");
}

// ======== DADOS ========
let mangas = JSON.parse(localStorage.getItem("mangas")) || [];
let mangaAtual = null;
let mangaEditMode = false;
let mangaSearchTimeout = null;
let sdMangaData = null;
let mangaOrdenacao = { lendo: "recentes", lidos: "recentes", paraLer: "recentes" };
let termoBuscaManga = "";

// ======== RECORTE DE IMAGEM (2:3) ========
function recortarImagem2x3(file, callback) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const W = 260, H = 390;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");
      const ratio = Math.max(W / img.width, H / img.height);
      const nw = img.width * ratio, nh = img.height * ratio;
      const ox = (W - nw) / 2, oy = (H - nh) / 2;
      ctx.drawImage(img, ox, oy, nw, nh);
      callback(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// Galeria modal mangá normal
document.getElementById("btnGaleriaManga").addEventListener("click", () => {
  document.getElementById("mCapaFileInput").click();
});
document.getElementById("mCapaFileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  recortarImagem2x3(file, dataUrl => {
    document.getElementById("mCapa").value = dataUrl;
  });
  e.target.value = "";
});

// Galeria modal mangá adulto
document.getElementById("btnGaleriaAdulto").addEventListener("click", () => {
  document.getElementById("aCapaFileInput").click();
});
document.getElementById("aCapaFileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  recortarImagem2x3(file, dataUrl => {
    document.getElementById("aCapa").value = dataUrl;
  });
  e.target.value = "";
});

// ======== DARK MODE (herda do app principal) ========
const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
if (usuario.darkMode) document.body.classList.add("dark");

// ======== DRAG-SCROLL ========
function ativarDragScroll(el) {
  let isDown = false, startX, scrollLeft, moved = false;
  el.addEventListener("mousedown", e => { isDown = true; moved = false; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; el.style.cursor = "grabbing"; });
  window.addEventListener("mouseup", () => { if (!isDown) return; isDown = false; el.style.cursor = ""; setTimeout(() => { moved = false; }, 10); });
  el.addEventListener("mousemove", e => { if (!isDown) return; const dx = e.pageX - el.offsetLeft - startX; if (Math.abs(dx) > 5) { moved = true; e.preventDefault(); el.scrollLeft = scrollLeft - dx * 1.2; } });
  el.addEventListener("mouseleave", () => { isDown = false; el.style.cursor = ""; });
  el._wasDragging = () => moved;
}

// ======== TOAST ========
function mostrarToast(msg) {
  const t = document.getElementById("toastManga");
  t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

// ======== BUSCA LOCAL ========
document.getElementById("buscaLocalManga").addEventListener("input", e => {
  termoBuscaManga = e.target.value.trim().toLowerCase();
  document.getElementById("buscaLocalMangaClear").style.display = termoBuscaManga ? "flex" : "none";
  renderizarMangas();
});
document.getElementById("buscaLocalMangaClear").addEventListener("click", () => {
  termoBuscaManga = "";
  document.getElementById("buscaLocalManga").value = "";
  document.getElementById("buscaLocalMangaClear").style.display = "none";
  renderizarMangas();
});

// ======== RENDER ========
function renderizarMangas() {
  const els = {
    lendo:   document.getElementById("mListaLendo"),
    lidos:   document.getElementById("mListaLidos"),
    paraLer: document.getElementById("mListaPara")
  };
  Object.values(els).forEach(l => l.innerHTML = "");
  const counts = { lendo: 0, lidos: 0, paraLer: 0 };
  const grupos = { lendo: [], lidos: [], paraLer: [] };

  mangas.forEach(m => {
    if (termoBuscaManga && !m.nome.toLowerCase().includes(termoBuscaManga)) return;
    counts[m.status] = (counts[m.status] || 0) + 1;
    grupos[m.status].push(m);
  });

  Object.keys(grupos).forEach(key => {
    grupos[key].sort((a, b) => mangaOrdenacao[key] === "recentes" ? b.id - a.id : a.id - b.id);
  });

  Object.entries(grupos).forEach(([key, lista]) => {
    const container = els[key];
    if (lista.length === 0) {
      const empty = document.createElement("div");
      empty.className = "lista-empty";
      if (termoBuscaManga) {
        empty.textContent = "Nenhum resultado";
        empty.style.cursor = "default";
      } else {
        empty.textContent = "+ Adicionar mangá";
        empty.addEventListener("click", () => document.getElementById("modalManga").style.display = "flex");
      }
      container.appendChild(empty);
    } else {
      lista.forEach(manga => {
        const card = document.createElement("div");
        card.classList.add("card");
        const totalCaps = parseInt(manga.totalCaps) || 0;
        const lidosCaps = parseInt(manga.lidosCaps) || 0;
        const pct = totalCaps > 0 ? Math.min(100, Math.round((lidosCaps / totalCaps) * 100)) : 0;
        card.innerHTML = `
          <img src="${manga.capa}" alt="${manga.nome}" onerror="this.src='https://via.placeholder.com/130x185?text=?'">
          <div class="card-info">
            <div class="card-title">${manga.nome}</div>
            <span class="card-badge">⭐ ${manga.nota}</span>
            ${totalCaps > 0 ? `
            <div class="eps-bar-wrap"><div class="eps-bar" style="width:${pct}%"></div></div>
            <div class="eps-label">${lidosCaps}/${totalCaps} caps</div>
            ` : ""}
          </div>`;
        card.addEventListener("click", () => {
          if (container._wasDragging && container._wasDragging()) return;
          abrirDetalheManga(manga);
        });
        container.appendChild(card);
      });
    }
    ativarDragScroll(container);
  });

  document.getElementById("mCountLendo").textContent = counts.lendo || 0;
  document.getElementById("mCountLidos").textContent = counts.lidos || 0;
  document.getElementById("mCountPara").textContent  = counts.paraLer || 0;
  document.getElementById("mStatLendo").textContent  = counts.lendo || 0;
  document.getElementById("mStatLidos").textContent  = counts.lidos || 0;
  document.getElementById("mStatPara").textContent   = counts.paraLer || 0;
}
renderizarMangas();

// ======== FILTROS ========
document.getElementById("mFilterLendo").addEventListener("click", () => toggleOrdenacao("lendo"));
document.getElementById("mFilterLidos").addEventListener("click", () => toggleOrdenacao("lidos"));
document.getElementById("mFilterPara").addEventListener("click",  () => toggleOrdenacao("paraLer"));

function toggleOrdenacao(key) {
  mangaOrdenacao[key] = mangaOrdenacao[key] === "recentes" ? "antigos" : "recentes";
  renderizarMangas();
  const mapa = { lendo: "mFilterLendo", lidos: "mFilterLidos", paraLer: "mFilterPara" };
  const btn = document.getElementById(mapa[key]);
  if (btn) btn.textContent = mangaOrdenacao[key] === "recentes" ? "↓ Recentes" : "↑ Antigos";
}

// ======== MODAL ADD MANUAL ========
document.getElementById("btnAddManga").addEventListener("click", () => document.getElementById("modalManga").style.display = "flex");
document.getElementById("mFechar").addEventListener("click", () => document.getElementById("modalManga").style.display = "none");
document.getElementById("mSalvar").addEventListener("click", () => {
  const nome = document.getElementById("mNome").value.trim();
  const capa = document.getElementById("mCapa").value.trim();
  const nota = document.getElementById("mNota").value;
  const status = document.getElementById("mStatus").value;
  const totalCaps = parseInt(document.getElementById("mTotalCaps").value) || 0;
  const lidosCaps = Math.min(parseInt(document.getElementById("mLidosCaps").value) || 0, totalCaps || 99999);
  if (!nome || !capa || !nota) { alert("Preencha os campos obrigatórios!"); return; }
  mangas.push({ id: Date.now(), nome, nota: parseFloat(nota).toFixed(1), capa, status, observacao: "", totalCaps, lidosCaps });
  localStorage.setItem("mangas", JSON.stringify(mangas));
  renderizarMangas();
  document.getElementById("modalManga").style.display = "none";
  ["mNome","mCapa","mNota","mTotalCaps","mLidosCaps"].forEach(id => document.getElementById(id).value = "");
  mostrarToast("📖 Mangá adicionado!");
});

// ======== MODAL DETALHE ========
function abrirDetalheManga(manga) {
  mangaAtual = manga;
  mangaEditMode = false;
  const EDIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M416.9 85.2L372 130.1L509.9 268L554.8 223.1C568.4 209.6 576 191.2 576 172C576 152.8 568.4 134.4 554.8 120.9L519.1 85.2C505.6 71.6 487.2 64 468 64C448.8 64 430.4 71.6 416.9 85.2zM338.1 164L122.9 379.1C112.2 389.8 104.4 403.2 100.3 417.8L64.9 545.6C62.6 553.9 64.9 562.9 71.1 569C77.3 575.1 86.2 577.5 94.5 575.2L222.3 539.7C236.9 535.6 250.2 527.9 261 517.1L476 301.9L338.1 164z"/></svg>`;
  const eb = document.getElementById("mEditBtn");
  eb.classList.remove("saving");
  eb.innerHTML = EDIT_SVG;
  document.getElementById("mDetalheCapa").src = manga.capa;
  document.getElementById("mDetalheNome").textContent = manga.nome;
  document.getElementById("mDetalheNota").textContent = manga.nota + "/10";
  document.getElementById("mDetalheObs").value = manga.observacao || "";
  document.getElementById("mMoverParaLista").value = manga.status;
  const tagsEl = document.getElementById("mDetalheGenerosTags");
  if (manga.generos && manga.generos.length > 0) {
    tagsEl.innerHTML = renderizarTagsGenero(manga.generos);
    tagsEl.style.display = "flex";
  } else {
    tagsEl.innerHTML = ""; tagsEl.style.display = "none";
  }
  renderCapitulosDetalhe(manga);
  document.getElementById("modalDetalheManga").style.display = "flex";
}

function renderCapitulosDetalhe(manga) {
  const totalCaps = parseInt(manga.totalCaps) || 0;
  const lidosCaps = parseInt(manga.lidosCaps) || 0;
  const pct = totalCaps > 0 ? Math.min(100, Math.round((lidosCaps / totalCaps) * 100)) : 0;
  document.getElementById("mDetalheEpisodios").innerHTML = `
    <div class="eps-detalhe-row">
      <div class="eps-detalhe-field">
        <label>Lidos</label>
        <input type="number" id="mDetalheLidosCaps" value="${lidosCaps}" min="0" max="${totalCaps || 99999}" placeholder="0">
      </div>
      <span class="eps-sep">/</span>
      <div class="eps-detalhe-field">
        <label>Total caps.</label>
        <input type="number" id="mDetalheTotalCaps" value="${totalCaps || ""}" min="0" placeholder="?">
      </div>
    </div>
    ${totalCaps > 0 ? `
    <div class="eps-detalhe-bar-wrap">
      <div class="eps-detalhe-bar" style="width:${pct}%"></div>
      <span class="eps-detalhe-pct">${pct}%</span>
    </div>` : ""}
  `;
  document.getElementById("mDetalheTotalCaps").addEventListener("change", salvarCapitulos);
  document.getElementById("mDetalheLidosCaps").addEventListener("change", salvarCapitulos);
  document.getElementById("mDetalheLidosCaps").addEventListener("input", salvarCapitulos);
}

function salvarCapitulos() {
  if (!mangaAtual) return;
  const totalCaps = parseInt(document.getElementById("mDetalheTotalCaps").value) || 0;
  const lidosCaps = Math.min(parseInt(document.getElementById("mDetalheLidosCaps").value) || 0, totalCaps || 99999);
  mangaAtual.totalCaps = totalCaps;
  mangaAtual.lidosCaps = lidosCaps;
  localStorage.setItem("mangas", JSON.stringify(mangas));
  renderCapitulosDetalhe(mangaAtual);
  renderizarMangas();
}

document.getElementById("mMoverParaLista").addEventListener("change", e => {
  if (!mangaAtual) return;
  mangaAtual.status = e.target.value;
  localStorage.setItem("mangas", JSON.stringify(mangas));
  renderizarMangas();
  const sel = e.target; sel.style.borderColor = "#9b2335";
  setTimeout(() => sel.style.borderColor = "", 900);
});

document.getElementById("mFecharDetalhe").addEventListener("click", () => document.getElementById("modalDetalheManga").style.display = "none");

document.getElementById("mDetalheObs").addEventListener("input", () => {
  if (!mangaAtual) return;
  mangaAtual.observacao = document.getElementById("mDetalheObs").value;
  localStorage.setItem("mangas", JSON.stringify(mangas));
});

document.getElementById("mDeleteBtn").addEventListener("click", () => {
  if (!mangaAtual || !confirm("Tem certeza?")) return;
  mangas = mangas.filter(m => m.id !== mangaAtual.id);
  localStorage.setItem("mangas", JSON.stringify(mangas));
  renderizarMangas();
  document.getElementById("modalDetalheManga").style.display = "none";
  mangaAtual = null;
  mostrarToast("🗑 Mangá removido");
});

document.getElementById("mEditBtn").addEventListener("click", () => {
  const capa = document.getElementById("mDetalheCapa");
  const nome = document.getElementById("mDetalheNome");
  const nota = document.getElementById("mDetalheNota");
  if (!mangaAtual) return;
  const EDIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M416.9 85.2L372 130.1L509.9 268L554.8 223.1C568.4 209.6 576 191.2 576 172C576 152.8 568.4 134.4 554.8 120.9L519.1 85.2C505.6 71.6 487.2 64 468 64C448.8 64 430.4 71.6 416.9 85.2zM338.1 164L122.9 379.1C112.2 389.8 104.4 403.2 100.3 417.8L64.9 545.6C62.6 553.9 64.9 562.9 71.1 569C77.3 575.1 86.2 577.5 94.5 575.2L222.3 539.7C236.9 535.6 250.2 527.9 261 517.1L476 301.9L338.1 164z"/></svg>`;
  const SAVE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M256 416.1L131.3 291.3L86.06 336.6L256 506.5L553.9 208.6L508.7 163.4L256 416.1z"/></svg>`;
  if (!mangaEditMode) {
    nome.innerHTML = `<input type="text" id="mEditNome" value="${mangaAtual.nome}" style="border:none;outline:none;font-size:18px;font-weight:900;font-family:'Nunito',sans-serif;text-align:center;width:100%;color:#2d2f4a;background:transparent;">`;
    nota.innerHTML = `<input type="number" id="mEditNota" value="${mangaAtual.nota}" min="0" max="10" step="0.1" style="border:1.5px solid #e0d0d0;border-radius:8px;padding:4px 8px;width:70px;font-size:14px;font-weight:700;font-family:'Nunito',sans-serif;text-align:center;outline:none;background:#fdf8f8;">`;
    capa.insertAdjacentHTML("afterend", `<input type="text" id="mEditCapa" class="edit-capa-input" value="${mangaAtual.capa}" placeholder="URL da capa">`);
    document.getElementById("mEditBtn").innerHTML = SAVE_SVG;
    document.getElementById("mEditBtn").classList.add("saving");
    mangaEditMode = true;
  } else {
    mangaAtual.nome = document.getElementById("mEditNome").value;
    mangaAtual.nota = document.getElementById("mEditNota").value;
    mangaAtual.capa = document.getElementById("mEditCapa").value;
    mangaAtual.observacao = document.getElementById("mDetalheObs").value;
    localStorage.setItem("mangas", JSON.stringify(mangas));
    document.getElementById("mEditCapa").remove();
    nome.textContent = mangaAtual.nome;
    nota.textContent = mangaAtual.nota + "/10";
    capa.src = mangaAtual.capa;
    renderizarMangas();
    document.getElementById("mEditBtn").innerHTML = EDIT_SVG;
    document.getElementById("mEditBtn").classList.remove("saving");
    mangaEditMode = false;
    mostrarToast("✅ Alterações salvas!");
  }
});

// ======== BUSCA JIKAN ========
const searchMangaOverlay  = document.getElementById("searchMangaOverlay");
const searchMangaInput    = document.getElementById("searchMangaInput");
const searchMangaResults  = document.getElementById("searchMangaResults");
const searchMangaLabel    = document.getElementById("searchMangaLabel");
const searchMangaDetail   = document.getElementById("searchMangaDetailOverlay");

document.getElementById("btnSearch").addEventListener("click", () => {
  searchMangaOverlay.style.display = "flex";
  searchMangaInput.focus();
});
document.getElementById("btnCloseMangaSearch").addEventListener("click", fecharBuscaManga);
searchMangaOverlay.addEventListener("click", e => { if (e.target === searchMangaOverlay) fecharBuscaManga(); });

function fecharBuscaManga() {
  searchMangaOverlay.style.display = "none";
  searchMangaInput.value = "";
  searchMangaResults.innerHTML = "";
  searchMangaLabel.textContent = "Resultados";
}

searchMangaInput.addEventListener("input", () => {
  clearTimeout(mangaSearchTimeout);
  const q = searchMangaInput.value.trim();
  if (!q) { searchMangaResults.innerHTML = ""; searchMangaLabel.textContent = "Resultados"; return; }
  mangaSearchTimeout = setTimeout(() => buscarManga(q), 700);
});

async function buscarManga(query) {
  searchMangaResults.innerHTML = `<div class="search-spinner">🔍 Buscando<span class="dots"></span></div>`;
  searchMangaLabel.textContent = "Buscando...";
  try {
    const res  = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=12&sfw=true`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    renderMangaResults(json.data || []);
  } catch {
    searchMangaResults.innerHTML = `<div class="search-spinner">❌ Erro ao buscar. Verifique sua conexão.</div>`;
    searchMangaLabel.textContent = "Resultados";
  }
}

function renderMangaResults(data) {
  searchMangaResults.innerHTML = "";
  if (!data.length) { searchMangaLabel.textContent = "Nenhum resultado encontrado"; return; }
  searchMangaLabel.textContent = `Resultados (${data.length})`;
  data.forEach(manga => {
    const item  = document.createElement("div");
    item.classList.add("search-result-item");
    const thumb = manga.images?.jpg?.image_url || "";
    const autor = manga.authors?.[0]?.name || "Autor desconhecido";
    const score = manga.score ? `⭐ ${parseFloat(manga.score).toFixed(1)}` : "Sem nota";
    const caps  = manga.chapters ? `${manga.chapters} caps` : "N/A";
    const title = manga.title_portuguese || manga.title_english || manga.title || "";
    item.innerHTML = `
      <img src="${thumb}" alt="${title}" onerror="this.style.background='#e0d0d0';this.src=''">
      <div style="flex:1;min-width:0">
        <div class="r-title">${title}</div>
        <div class="r-meta">${autor} · ${caps}</div>
        <div class="r-score">${score}</div>
      </div>
      <span style="color:#bbb;font-size:18px;flex-shrink:0">›</span>`;
    item.addEventListener("click", () => abrirDetalheMangaBusca(manga));
    searchMangaResults.appendChild(item);
  });
}

function abrirDetalheMangaBusca(manga) {
  sdMangaData = manga;
  const title = manga.title_portuguese || manga.title_english || manga.title || "";
  const capa  = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || "";
  const autor = manga.authors?.[0]?.name || "Autor desconhecido";
  const desc  = manga.synopsis ? manga.synopsis.replace("[Written by MAL Rewrite]", "").trim() : "Sem descrição disponível.";
  const caps  = manga.chapters || 0;

  document.getElementById("sdMangaTitle").textContent = title;
  document.getElementById("sdMangaImage").src = capa;
  document.getElementById("sdMangaAutor").textContent = "✍️ " + autor;
  document.getElementById("sdMangaDesc").textContent  = desc;

  const sdTags = document.getElementById("sdMangaGenerosTags");
  const generos = manga.genres || [];
  if (generos.length > 0) {
    sdTags.innerHTML = renderizarTagsGenero(generos);
    sdTags.style.display = "flex";
  } else {
    sdTags.innerHTML = ""; sdTags.style.display = "none";
  }

  document.getElementById("sdMangaNota").value      = manga.score ? Math.min(10, parseFloat(manga.score)).toFixed(1) : "";
  document.getElementById("sdMangaTotalCaps").value = caps || "";
  document.getElementById("sdMangaLidosCaps").value = "";

  const btn = document.getElementById("sdMangaAddBtn");
  btn.textContent = "+ Adicionar à Biblioteca"; btn.disabled = false; btn.style.background = "";
  searchMangaDetail.style.display = "flex";
}

document.getElementById("sdMangaClose").addEventListener("click", () => { searchMangaDetail.style.display = "none"; sdMangaData = null; });
searchMangaDetail.addEventListener("click", e => { if (e.target === searchMangaDetail) { searchMangaDetail.style.display = "none"; sdMangaData = null; } });

async function traduzirTexto(texto) {
  if (!texto) return null;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(texto)}`;
    const res  = await fetch(url);
    const json = await res.json();
    return json[0].map(item => item[0]).join("");
  } catch { return texto; }
}

document.getElementById("sdMangaAddBtn").addEventListener("click", async () => {
  if (!sdMangaData) return;
  const btn    = document.getElementById("sdMangaAddBtn");
  const nota   = document.getElementById("sdMangaNota").value || "0";
  const status = document.getElementById("sdMangaStatus").value;
  const titulo = sdMangaData.title_portuguese || sdMangaData.title_english || sdMangaData.title || "";
  const capa   = sdMangaData.images?.jpg?.large_image_url || sdMangaData.images?.jpg?.image_url || "";
  const totalCaps = parseInt(document.getElementById("sdMangaTotalCaps").value) || 0;
  const lidosCaps = Math.min(parseInt(document.getElementById("sdMangaLidosCaps").value) || 0, totalCaps || 99999);
  const autor  = sdMangaData.authors?.[0]?.name || null;
  const sinopseOriginal = sdMangaData.synopsis ? sdMangaData.synopsis.replace("[Written by MAL Rewrite]", "").trim() : null;
  const generos = sdMangaData.genres ? sdMangaData.genres.map(g => g.name) : [];

  if (mangas.find(m => m.nome === titulo)) { alert("Este mangá já está na sua lista!"); return; }

  btn.textContent = "⏳ Traduzindo..."; btn.disabled = true;
  const sinopse = await traduzirTexto(sinopseOriginal);

  mangas.push({ id: Date.now(), nome: titulo, nota: parseFloat(nota).toFixed(1), capa, status, observacao: "", totalCaps, lidosCaps, autor, sinopse, generos });
  localStorage.setItem("mangas", JSON.stringify(mangas));
  renderizarMangas();
  btn.textContent = "✅ Adicionado!"; btn.style.background = "linear-gradient(135deg,#34d399,#059669)";
  mostrarToast("📖 Mangá adicionado à biblioteca!");
  setTimeout(() => { searchMangaDetail.style.display = "none"; sdMangaData = null; }, 1200);
});

// ======== MODO +18 ========
let mangasAdultos = JSON.parse(localStorage.getItem("mangasAdultos")) || [];
let adultoAtual = null;
let adultoEditMode = false;
let adultoOrdenacao = { lendo: "recentes", lidos: "recentes", paraLer: "recentes" };
let termoBuscaAdulto = "";

const paginaAdulto  = document.getElementById("paginaAdulto");
const paginaMangas2 = document.getElementById("paginaMangas");
const btnAddAdulto  = document.getElementById("btnAddAdulto");

// ── Navegação ──
document.getElementById("btnAdulto").addEventListener("click", () => {
  setActive("btnAdulto");
  paginaMangas2.style.display = "none";
  paginaAdulto.style.display = "flex";
  paginaAdulto.style.flexDirection = "column";
  document.getElementById("btnAddManga").style.display = "none";
  btnAddAdulto.style.display = "flex";
  renderizarAdultos();
});
document.getElementById("btnHome").addEventListener("click", () => {
  setActive("btnHome");
  paginaAdulto.style.display = "none";
  paginaMangas2.style.display = "flex";
  btnAddAdulto.style.display = "none";
  document.getElementById("btnAddManga").style.display = "flex";
});

function setActive(id) {
  document.querySelectorAll(".sidebar .icon").forEach(i => i.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ── Busca local ──
document.getElementById("buscaLocalAdulto").addEventListener("input", e => {
  termoBuscaAdulto = e.target.value.trim().toLowerCase();
  document.getElementById("buscaLocalAdultoClear").style.display = termoBuscaAdulto ? "flex" : "none";
  renderizarAdultos();
});
document.getElementById("buscaLocalAdultoClear").addEventListener("click", () => {
  termoBuscaAdulto = "";
  document.getElementById("buscaLocalAdulto").value = "";
  document.getElementById("buscaLocalAdultoClear").style.display = "none";
  renderizarAdultos();
});

// ── Render ──
function renderizarAdultos() {
  const els = {
    lendo:   document.getElementById("aListaLendo"),
    lidos:   document.getElementById("aListaLidos"),
    paraLer: document.getElementById("aListaPara")
  };
  Object.values(els).forEach(l => l.innerHTML = "");
  const counts = { lendo: 0, lidos: 0, paraLer: 0 };
  const grupos = { lendo: [], lidos: [], paraLer: [] };

  mangasAdultos.forEach(m => {
    if (termoBuscaAdulto && !m.nome.toLowerCase().includes(termoBuscaAdulto)) return;
    counts[m.status] = (counts[m.status] || 0) + 1;
    grupos[m.status].push(m);
  });

  Object.keys(grupos).forEach(key => {
    grupos[key].sort((a, b) => adultoOrdenacao[key] === "recentes" ? b.id - a.id : a.id - b.id);
  });

  Object.entries(grupos).forEach(([key, lista]) => {
    const container = els[key];
    if (lista.length === 0) {
      const empty = document.createElement("div");
      empty.className = "lista-empty";
      if (termoBuscaAdulto) {
        empty.textContent = "Nenhum resultado";
        empty.style.cursor = "default";
      } else {
        empty.textContent = "+ Adicionar mangá";
        empty.addEventListener("click", () => document.getElementById("modalAdulto").style.display = "flex");
      }
      container.appendChild(empty);
    } else {
      lista.forEach(manga => {
        const card = document.createElement("div");
        card.classList.add("card");
        const totalCaps = parseInt(manga.totalCaps) || 0;
        const lidosCaps = parseInt(manga.lidosCaps) || 0;
        const pct = totalCaps > 0 ? Math.min(100, Math.round((lidosCaps / totalCaps) * 100)) : 0;
        card.innerHTML = `
          <img src="${manga.capa}" alt="${manga.nome}" onerror="this.src='https://via.placeholder.com/130x185?text=?'">
          <div class="card-info">
            <div class="card-title">${manga.nome}</div>
            <span class="card-badge" style="background:rgba(74,26,110,0.85)">⭐ ${manga.nota}</span>
            ${totalCaps > 0 ? `
            <div class="eps-bar-wrap"><div class="eps-bar" style="width:${pct}%;background:linear-gradient(90deg,#4a1a6e,#9b59b6)"></div></div>
            <div class="eps-label">${lidosCaps}/${totalCaps} caps</div>
            ` : ""}
          </div>`;
        card.addEventListener("click", () => {
          if (container._wasDragging && container._wasDragging()) return;
          abrirDetalheAdulto(manga);
        });
        container.appendChild(card);
      });
    }
    ativarDragScroll(container);
  });

  document.getElementById("aCountLendo").textContent = counts.lendo || 0;
  document.getElementById("aCountLidos").textContent = counts.lidos || 0;
  document.getElementById("aCountPara").textContent  = counts.paraLer || 0;
  document.getElementById("aStatLendo").textContent  = counts.lendo || 0;
  document.getElementById("aStatLidos").textContent  = counts.lidos || 0;
  document.getElementById("aStatPara").textContent   = counts.paraLer || 0;
}

// ── Filtros ──
document.getElementById("aFilterLendo").addEventListener("click", () => toggleAdultoOrdenacao("lendo"));
document.getElementById("aFilterLidos").addEventListener("click", () => toggleAdultoOrdenacao("lidos"));
document.getElementById("aFilterPara").addEventListener("click",  () => toggleAdultoOrdenacao("paraLer"));
function toggleAdultoOrdenacao(key) {
  adultoOrdenacao[key] = adultoOrdenacao[key] === "recentes" ? "antigos" : "recentes";
  renderizarAdultos();
  const mapa = { lendo: "aFilterLendo", lidos: "aFilterLidos", paraLer: "aFilterPara" };
  const btn = document.getElementById(mapa[key]);
  if (btn) btn.textContent = adultoOrdenacao[key] === "recentes" ? "↓ Recentes" : "↑ Antigos";
}

// ── Modal Add ──
document.getElementById("btnAddAdulto").addEventListener("click", () => document.getElementById("modalAdulto").style.display = "flex");
document.getElementById("aFechar").addEventListener("click", () => document.getElementById("modalAdulto").style.display = "none");
document.getElementById("aSalvar").addEventListener("click", () => {
  const nome = document.getElementById("aNome").value.trim();
  const capa = document.getElementById("aCapa").value.trim();
  const nota = document.getElementById("aNota").value;
  const autor = document.getElementById("aAutor").value.trim();
  const status = document.getElementById("aStatus").value;
  const totalCaps = parseInt(document.getElementById("aTotalCaps").value) || 0;
  const lidosCaps = Math.min(parseInt(document.getElementById("aLidosCaps").value) || 0, totalCaps || 99999);
  const observacao = document.getElementById("aObs").value.trim();
  if (!nome || !capa || !nota) { alert("Preencha os campos obrigatórios!"); return; }
  mangasAdultos.push({ id: Date.now(), nome, nota: parseFloat(nota).toFixed(1), capa, autor, status, observacao, totalCaps, lidosCaps });
  localStorage.setItem("mangasAdultos", JSON.stringify(mangasAdultos));
  renderizarAdultos();
  document.getElementById("modalAdulto").style.display = "none";
  ["aNome","aCapa","aNota","aAutor","aTotalCaps","aLidosCaps","aObs"].forEach(id => document.getElementById(id).value = "");
  mostrarToast("🔞 Mangá adicionado à coleção privada!");
});

// ── Modal Detalhe ──
function abrirDetalheAdulto(manga) {
  adultoAtual = manga;
  adultoEditMode = false;
  const EDIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M416.9 85.2L372 130.1L509.9 268L554.8 223.1C568.4 209.6 576 191.2 576 172C576 152.8 568.4 134.4 554.8 120.9L519.1 85.2C505.6 71.6 487.2 64 468 64C448.8 64 430.4 71.6 416.9 85.2zM338.1 164L122.9 379.1C112.2 389.8 104.4 403.2 100.3 417.8L64.9 545.6C62.6 553.9 64.9 562.9 71.1 569C77.3 575.1 86.2 577.5 94.5 575.2L222.3 539.7C236.9 535.6 250.2 527.9 261 517.1L476 301.9L338.1 164z"/></svg>`;
  document.getElementById("aEditBtn").classList.remove("saving");
  document.getElementById("aEditBtn").innerHTML = EDIT_SVG;
  document.getElementById("aDetalheCapa").src = manga.capa;
  document.getElementById("aDetalheNome").textContent = manga.nome;
  document.getElementById("aDetalheNota").textContent = manga.nota + "/10";
  document.getElementById("aDetalheAutor").textContent = manga.autor ? "✍️ " + manga.autor : "";
  document.getElementById("aDetalheObs").value = manga.observacao || "";
  document.getElementById("aMoverParaLista").value = manga.status;
  renderCapsAdulto(manga);
  document.getElementById("modalDetalheAdulto").style.display = "flex";
}

function renderCapsAdulto(manga) {
  const totalCaps = parseInt(manga.totalCaps) || 0;
  const lidosCaps = parseInt(manga.lidosCaps) || 0;
  const pct = totalCaps > 0 ? Math.min(100, Math.round((lidosCaps / totalCaps) * 100)) : 0;
  document.getElementById("aDetalheEpisodios").innerHTML = `
    <div class="eps-detalhe-row">
      <div class="eps-detalhe-field">
        <label>Lidos</label>
        <input type="number" id="aDetalheLidosCaps" value="${lidosCaps}" min="0" max="${totalCaps || 99999}" placeholder="0">
      </div>
      <span class="eps-sep">/</span>
      <div class="eps-detalhe-field">
        <label>Total caps.</label>
        <input type="number" id="aDetalheTotalCaps" value="${totalCaps || ""}" min="0" placeholder="?">
      </div>
    </div>
    ${totalCaps > 0 ? `
    <div class="eps-detalhe-bar-wrap">
      <div class="eps-detalhe-bar" style="width:${pct}%;background:linear-gradient(90deg,#4a1a6e,#9b59b6)"></div>
      <span class="eps-detalhe-pct">${pct}%</span>
    </div>` : ""}
  `;
  document.getElementById("aDetalheTotalCaps").addEventListener("change", salvarCapsAdulto);
  document.getElementById("aDetalheLidosCaps").addEventListener("change", salvarCapsAdulto);
  document.getElementById("aDetalheLidosCaps").addEventListener("input", salvarCapsAdulto);
}

function salvarCapsAdulto() {
  if (!adultoAtual) return;
  const totalCaps = parseInt(document.getElementById("aDetalheTotalCaps").value) || 0;
  const lidosCaps = Math.min(parseInt(document.getElementById("aDetalheLidosCaps").value) || 0, totalCaps || 99999);
  adultoAtual.totalCaps = totalCaps;
  adultoAtual.lidosCaps = lidosCaps;
  localStorage.setItem("mangasAdultos", JSON.stringify(mangasAdultos));
  renderCapsAdulto(adultoAtual);
  renderizarAdultos();
}

document.getElementById("aMoverParaLista").addEventListener("change", e => {
  if (!adultoAtual) return;
  adultoAtual.status = e.target.value;
  localStorage.setItem("mangasAdultos", JSON.stringify(mangasAdultos));
  renderizarAdultos();
  e.target.style.borderColor = "#4a1a6e";
  setTimeout(() => e.target.style.borderColor = "", 900);
});

document.getElementById("aFecharDetalhe").addEventListener("click", () => document.getElementById("modalDetalheAdulto").style.display = "none");

document.getElementById("aDetalheObs").addEventListener("input", () => {
  if (!adultoAtual) return;
  adultoAtual.observacao = document.getElementById("aDetalheObs").value;
  localStorage.setItem("mangasAdultos", JSON.stringify(mangasAdultos));
});

document.getElementById("aDeleteBtn").addEventListener("click", () => {
  if (!adultoAtual || !confirm("Tem certeza?")) return;
  mangasAdultos = mangasAdultos.filter(m => m.id !== adultoAtual.id);
  localStorage.setItem("mangasAdultos", JSON.stringify(mangasAdultos));
  renderizarAdultos();
  document.getElementById("modalDetalheAdulto").style.display = "none";
  adultoAtual = null;
  mostrarToast("🗑 Removido da coleção privada");
});

document.getElementById("aEditBtn").addEventListener("click", () => {
  if (!adultoAtual) return;
  const capa = document.getElementById("aDetalheCapa");
  const nome = document.getElementById("aDetalheNome");
  const nota = document.getElementById("aDetalheNota");
  const EDIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M416.9 85.2L372 130.1L509.9 268L554.8 223.1C568.4 209.6 576 191.2 576 172C576 152.8 568.4 134.4 554.8 120.9L519.1 85.2C505.6 71.6 487.2 64 468 64C448.8 64 430.4 71.6 416.9 85.2zM338.1 164L122.9 379.1C112.2 389.8 104.4 403.2 100.3 417.8L64.9 545.6C62.6 553.9 64.9 562.9 71.1 569C77.3 575.1 86.2 577.5 94.5 575.2L222.3 539.7C236.9 535.6 250.2 527.9 261 517.1L476 301.9L338.1 164z"/></svg>`;
  const SAVE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M256 416.1L131.3 291.3L86.06 336.6L256 506.5L553.9 208.6L508.7 163.4L256 416.1z"/></svg>`;
  if (!adultoEditMode) {
    nome.innerHTML = `<input type="text" id="aEditNome" value="${adultoAtual.nome}" style="border:none;outline:none;font-size:18px;font-weight:900;font-family:'Nunito',sans-serif;text-align:center;width:100%;color:#2d2f4a;background:transparent;">`;
    nota.innerHTML = `<input type="number" id="aEditNota" value="${adultoAtual.nota}" min="0" max="10" step="0.1" style="border:1.5px solid #d0c0e0;border-radius:8px;padding:4px 8px;width:70px;font-size:14px;font-weight:700;font-family:'Nunito',sans-serif;text-align:center;outline:none;background:#f8f0ff;">`;
    capa.insertAdjacentHTML("afterend", `<input type="text" id="aEditCapa" class="edit-capa-input" value="${adultoAtual.capa}" placeholder="URL da capa">`);
    document.getElementById("aEditBtn").innerHTML = SAVE_SVG;
    document.getElementById("aEditBtn").classList.add("saving");
    adultoEditMode = true;
  } else {
    adultoAtual.nome = document.getElementById("aEditNome").value;
    adultoAtual.nota = document.getElementById("aEditNota").value;
    adultoAtual.capa = document.getElementById("aEditCapa").value;
    adultoAtual.observacao = document.getElementById("aDetalheObs").value;
    localStorage.setItem("mangasAdultos", JSON.stringify(mangasAdultos));
    document.getElementById("aEditCapa").remove();
    nome.textContent = adultoAtual.nome;
    nota.textContent = adultoAtual.nota + "/10";
    capa.src = adultoAtual.capa;
    renderizarAdultos();
    document.getElementById("aEditBtn").innerHTML = EDIT_SVG;
    document.getElementById("aEditBtn").classList.remove("saving");
    adultoEditMode = false;
    mostrarToast("✅ Alterações salvas!");
  }
});