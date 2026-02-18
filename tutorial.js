/* ══════════════════════════════════════
   TUTORIAL OKIRU
   Cole este bloco no final do script.js
══════════════════════════════════════ */

(function () {
  const STORAGE_KEY = "okiru_tutorial_done";

  // Verifica se já foi feito (usa localStorage)
  if (localStorage.getItem(STORAGE_KEY)) return;

  // ── Etapas do tutorial (depois da tela de boas-vindas) ──
  const steps = [
    {
      emoji: "🏠",
      title: "Início",
      desc: "Sua lista principal. Aqui ficam todos os animes organizados por categoria.",
      targetId: "btnHome",
      arrowDir: "right", // seta aponta para a direita (elemento à esquerda)
    },
    {
      emoji: "🔍",
      title: "Buscar animes",
      desc: "Pesquise qualquer anime e adicione direto à sua lista com um clique!",
      targetId: "btnSearch",
      arrowDir: "right",
    },
    {
      emoji: "📊",
      title: "Estatísticas",
      desc: "Veja seus gêneros favoritos, tempo assistido e muito mais.",
      targetId: "btnStats",
      arrowDir: "right",
    },
    {
      emoji: "⚙️",
      title: "Configurações",
      desc: "Personalize seu perfil, nome, foto e o tema do app.",
      targetId: "btnSettings",
      arrowDir: "right",
    },
    {
      emoji: "➕",
      title: "Adicionar anime",
      desc: "Clique neste botão para adicionar um anime manualmente à sua lista.",
      targetClass: "btn-add",
      arrowDir: "up",
    },
    {
      emoji: "🎉",
      title: "É isso!",
      desc: "Ainda tô fazendo algumas atualizações, então não espere muito kkkk\nBoa jornada no mundo dos animes! ⛩️",
      last: true,
    },
  ];

  // ── Criar elementos do tutorial ──
  function criarEl(tag, attrs = {}, html = "") {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    el.innerHTML = html;
    return el;
  }

  const backdrop = criarEl("div", { id: "tutorialBackdrop" });
  const highlight = criarEl("div", { class: "tutorial-highlight" });
  const arrowEl = criarEl("div", { class: "tutorial-arrow" });
  const tooltip = criarEl("div", { class: "tutorial-tooltip" });
  document.body.append(backdrop, highlight, arrowEl, tooltip);

  let currentStep = -1; // -1 = tela de boas-vindas

  // ── Tela de boas-vindas ──
  function showWelcome() {
    backdrop.classList.add("visible");
    posicionarTooltipCentro();
    tooltip.innerHTML = `
      <span class="tutorial-emoji">👋</span>
      <div class="tutorial-title">Bem-vindo ao Okiru!</div>
      <div class="tutorial-desc">Quer um tutorial rápido para conhecer o app?</div>
      <div class="tutorial-btns">
        <button class="tutorial-btn tutorial-btn-secondary" id="tutSkip">Agora não</button>
        <button class="tutorial-btn tutorial-btn-primary" id="tutStart">Claro!</button>
      </div>
    `;
    requestAnimationFrame(() => tooltip.classList.add("visible"));

    document.getElementById("tutStart").addEventListener("click", () => nextStep());
    document.getElementById("tutSkip").addEventListener("click", () => endTutorial());
  }

  // ── Posicionamentos ──
  function posicionarTooltipCentro() {
    tooltip.style.top = "50%";
    tooltip.style.left = "50%";
    tooltip.style.transform = "translate(-50%, -50%) scale(0.9)";
    // A transição de .visible vai reescrever o scale, mas precisa do translate
    tooltip.style.setProperty("--tt-translate", "translate(-50%, -50%)");
  }

  function posicionarPorElemento(el, arrowDir) {
    const rect = el.getBoundingClientRect();
    const tooltipW = Math.min(320, window.innerWidth * 0.9);
    const tooltipH = 200; // estimado
    const gap = 18;
    const isMobile = window.innerWidth <= 768;

    // Highlight
    const pad = 6;
    highlight.style.top    = (rect.top  - pad) + "px";
    highlight.style.left   = (rect.left - pad) + "px";
    highlight.style.width  = (rect.width  + pad * 2) + "px";
    highlight.style.height = (rect.height + pad * 2) + "px";
    highlight.style.borderRadius = isMobile ? "16px" : "14px";
    highlight.classList.add("visible");

    // Tooltip posição
    let top, left;
    if (isMobile) {
      // Mobile: sidebar na base — tooltip fica no centro da tela
      top  = window.innerHeight / 2 - tooltipH / 2;
      left = window.innerWidth  / 2 - tooltipW / 2;
    } else {
      // Desktop: sidebar à esquerda — tooltip à direita do elemento
      left = rect.right + gap;
      top  = rect.top + rect.height / 2 - tooltipH / 2;
      // Evitar sair da tela
      if (left + tooltipW > window.innerWidth - 16) left = rect.left - tooltipW - gap;
      if (top < 16) top = 16;
      if (top + tooltipH > window.innerHeight - 16) top = window.innerHeight - tooltipH - 16;
    }

    tooltip.style.top       = top  + "px";
    tooltip.style.left      = left + "px";
    tooltip.style.transform = "scale(0.9) translateY(8px)"; // reset p/ animação

    // Seta
    if (!isMobile) {
      arrowEl.textContent = "👈";
      arrowEl.style.top   = (rect.top + rect.height / 2 - 18) + "px";
      arrowEl.style.left  = (rect.right + gap - 42) + "px";
      arrowEl.classList.add("visible");
    } else {
      arrowEl.classList.remove("visible");
    }
  }

  function esconderHighlight() {
    highlight.classList.remove("visible");
    arrowEl.classList.remove("visible");
  }

  // ── Próxima etapa ──
  function nextStep() {
    currentStep++;

    // Fade out
    tooltip.classList.remove("visible");
    esconderHighlight();

    setTimeout(() => {
      if (currentStep >= steps.length) { endTutorial(); return; }

      const step = steps[currentStep];
      const total = steps.length;

      // Dots de progresso
      const dotsHTML = Array.from({ length: total }, (_, i) =>
        `<div class="tutorial-dot${i === currentStep ? " active" : ""}"></div>`
      ).join("");

      const isLast = step.last;

      tooltip.innerHTML = `
        <span class="tutorial-emoji">${step.emoji}</span>
        <div class="tutorial-progress">${dotsHTML}</div>
        <div class="tutorial-title">${step.title}</div>
        <div class="tutorial-desc">${step.desc.replace(/\n/g, "<br>")}</div>
        <div class="tutorial-btns">
          ${isLast
            ? `<button class="tutorial-btn tutorial-btn-primary" id="tutNext" style="flex:1">Entendido! 🎌</button>`
            : `<button class="tutorial-btn tutorial-btn-secondary" id="tutClose">Fechar</button>
               <button class="tutorial-btn tutorial-btn-primary"  id="tutNext">Próximo →</button>`
          }
        </div>
      `;

      // Posicionar
      let targetEl = null;
      if (step.targetId)    targetEl = document.getElementById(step.targetId);
      if (step.targetClass) targetEl = document.querySelector("." + step.targetClass);

      if (targetEl && !step.last) {
        posicionarPorElemento(targetEl, step.arrowDir);
      } else {
        posicionarTooltipCentro();
        tooltip.style.transform = "translate(-50%, -50%) scale(0.9)";
      }

      // Fade in
      requestAnimationFrame(() => {
        tooltip.style.transform = "";
        tooltip.classList.add("visible");
      });

      document.getElementById("tutNext")?.addEventListener("click", () => nextStep());
      document.getElementById("tutClose")?.addEventListener("click", () => endTutorial());

    }, 300); // tempo do fade out
  }

  // ── Encerrar ──
  function endTutorial() {
    tooltip.classList.remove("visible");
    backdrop.classList.remove("visible");
    highlight.classList.remove("visible");
    arrowEl.classList.remove("visible");
    setTimeout(() => {
      backdrop.remove();
      highlight.remove();
      arrowEl.remove();
      tooltip.remove();
    }, 400);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  // ── Iniciar após curto delay (app carregou) ──
  setTimeout(showWelcome, 600);
})();
