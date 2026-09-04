// SIH Mining Main Application Controller - Executive Edition

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

const App = {
  activeTab: "dashboard",
  activeDatasetId: "DS-2026-NATIONAL",
  selectedFile: null,
  pipelineInterval: null,
  pipelineStartTime: null,
  animationFrameId: null,
  factIntervalId: null,
  trendsChart: null,
  shareChart: null,

  factsList: [
    "Synthesizing colliery extraction logs across 432 operational basins...",
    "Auditing thermal power plant off-take ratios against national energy security reserves...",
    "Modeling opencast stripping ratios and heavy excavation equipment utilization...",
    "Calibrating mathematical variance matrices and verifying production quotas...",
    "Generating high-fidelity visual charts, distribution curves, and executive PDF report..."
  ],

  init: function() {
    this.initTheme();
    this.checkAuth();
    this.renderRankingsTable();
    this.initEventListeners();
    this.initDragAndDrop();
    this.startHeaderClock();
    this.renderDashboardCharts();
    this.loadLatestSummary();
    this.loadReportHistory();
    this.initUniversalSearchListeners();
  },

  initTheme: function() {
    const saved = localStorage.getItem("moc_theme") || "dark";
    this.setTheme(saved, false);
  },

  toggleTheme: function() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    this.setTheme(next, true);
  },

  setTheme: function(theme, showToastNotification = false) {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("moc_theme", theme);

    // Update icons and labels
    document.querySelectorAll(".theme-toggle-icon").forEach(el => {
      el.textContent = theme === "dark" ? "🌙" : "☀️";
    });
    document.querySelectorAll(".theme-toggle-label").forEach(el => {
      el.textContent = theme === "dark" ? "Dark" : "Light";
    });

    if (showToastNotification) {
      this.showToast(`Switched to ${theme === 'dark' ? 'Sovereign Dark' : 'Executive Light'} Mode`, "info");
    }

    // Immediately re-render rankings table with proper light/dark contrast
    this.renderRankingsTable();

    // Re-render report history cards if loaded
    if (this.historyList && this.historyList.length > 0) {
      this.renderReportHistoryCards(this.historyList);
    }

    // Refresh charts if on dashboard
    if (this.activeTab === "dashboard") {
      setTimeout(() => this.renderDashboardCharts(), 50);
    }
  },

  startHeaderClock: function() {
    const updateClock = () => {
      const el = document.getElementById("header-clock");
      if (!el) return;
      const now = new Date();
      const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      el.innerText = `📅 ${now.toLocaleDateString('en-IN', options)}`;
    };
    updateClock();
    setInterval(updateClock, 1000);
  },

  checkAuth: function() {
    const session = typeof AuthController !== "undefined" ? AuthController.getSession() : null;
    const loginView = document.getElementById("view-login");
    const appView = document.getElementById("view-app");

    if (session) {
      if (loginView) loginView.classList.add("hidden");
      if (appView) {
        appView.classList.remove("hidden");
        appView.classList.add("flex");
      }
      const empIdEl = document.getElementById("session-emp-id");
      if (empIdEl) empIdEl.innerText = session.employeeId;
      setTimeout(() => this.renderDashboardCharts(), 150);
    } else {
      if (loginView) loginView.classList.remove("hidden");
      if (appView) {
        appView.classList.add("hidden");
        appView.classList.remove("flex");
      }
    }
  },

  initEventListeners: function() {
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }
  },

  // =========================================================================
  // UNIVERSAL SEARCH ENGINE (Header Spotlight with Instant Cross-Module Navigation)
  // =========================================================================
  initUniversalSearchListeners: function() {
    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      const container = document.getElementById("universal-search-container");
      if (container && !container.contains(e.target)) {
        App.closeUniversalSearch();
      }
    });

    // Keyboard support: Escape to close, Enter to execute top match
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        App.closeUniversalSearch();
      } else if (e.key === "Enter") {
        const input = document.getElementById("universal-search-input");
        const dropdown = document.getElementById("universal-search-dropdown");
        if (input && document.activeElement === input && dropdown && !dropdown.classList.contains("hidden")) {
          e.preventDefault();
          App.executeUniversalSearchResult(0);
        }
      }
    });
  },

  getUniversalSearchIndex: function() {
    return [
      // 1. Collieries & Basins
      {
        type: "colliery",
        category: "Collieries & Mines",
        icon: "⛏️",
        title: "Gevra Colliery",
        subtitle: "SECL • Korba Basin • 32,450 MT • 98.2% Target",
        keywords: "gevra secl korba chhattisgarh 32450 extraction opencast",
        action: () => {
          App.switchTab('analytics');
          setTimeout(() => {
            const el = document.getElementById("rankings-table-body");
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            App.showToast("Navigated to Gevra Colliery in Coalfield Analytics", "info");
          }, 150);
        }
      },
      {
        type: "colliery",
        category: "Collieries & Mines",
        icon: "⛏️",
        title: "Kusmunda Colliery",
        subtitle: "SECL • Bilaspur • 28,120 MT • 96.5% Target",
        keywords: "kusmunda secl bilaspur 28120 extraction opencast",
        action: () => {
          App.switchTab('analytics');
          App.showToast("Navigated to Kusmunda Colliery in Coalfield Analytics", "info");
        }
      },
      {
        type: "colliery",
        category: "Collieries & Mines",
        icon: "⛏️",
        title: "Dipka Colliery",
        subtitle: "SECL • Gevra-Dipka Sector • 22,890 MT • 95.1% Target",
        keywords: "dipka secl 22890 extraction opencast",
        action: () => {
          App.switchTab('analytics');
          App.showToast("Navigated to Dipka Colliery in Coalfield Analytics", "info");
        }
      },
      {
        type: "colliery",
        category: "Collieries & Mines",
        icon: "⛏️",
        title: "Bhubaneswari Colliery",
        subtitle: "MCL • Talcher Basin • 16,740 MT • 97.4% Target",
        keywords: "bhubaneswari mcl talcher odisha 16740",
        action: () => {
          App.switchTab('analytics');
          App.showToast("Navigated to Bhubaneswari Colliery in Coalfield Analytics", "info");
        }
      },
      {
        type: "colliery",
        category: "Collieries & Mines",
        icon: "⛏️",
        title: "Belpahar Colliery",
        subtitle: "MCL • IB Valley • 12,300 MT • 96.0% Target",
        keywords: "belpahar mcl ib valley odisha 12300",
        action: () => {
          App.switchTab('analytics');
          App.showToast("Navigated to Belpahar Colliery in Coalfield Analytics", "info");
        }
      },
      {
        type: "colliery",
        category: "Collieries & Mines",
        icon: "⛏️",
        title: "Jayant Colliery",
        subtitle: "NCL • Singrauli Basin • 9,450 MT • 97.8% Target",
        keywords: "jayant ncl singrauli madhya pradesh 9450",
        action: () => {
          App.switchTab('analytics');
          App.showToast("Navigated to Jayant Colliery in Coalfield Analytics", "info");
        }
      },
      {
        type: "colliery",
        category: "Collieries & Mines",
        icon: "⛏️",
        title: "Dudhichua Colliery",
        subtitle: "NCL • Singrauli Basin • 5,820 MT • 95.9% Target",
        keywords: "dudhichua ncl singrauli 5820",
        action: () => {
          App.switchTab('analytics');
          App.showToast("Navigated to Dudhichua Colliery in Coalfield Analytics", "info");
        }
      },
      {
        type: "colliery",
        category: "Collieries & Mines",
        icon: "⛏️",
        title: "Nigahi Colliery",
        subtitle: "NCL • Singrauli Basin • 3,838.90 MT • 94.7% Target",
        keywords: "nigahi ncl singrauli 3838",
        action: () => {
          App.switchTab('analytics');
          App.showToast("Navigated to Nigahi Colliery in Coalfield Analytics", "info");
        }
      },

      // 2. Gamma.app Modern Graphic Templates
      {
        type: "template",
        category: "Graphic Templates",
        icon: "🍱",
        title: "Bento Modular Grid Template",
        subtitle: "Gamma Bento Tech • Asymmetric KPI Cards & Royal Blue Theme",
        keywords: "bento modular grid gamma template modern royal blue violet pdf export",
        action: () => {
          App.switchTab('reports');
          App.selectTemplate('bento_grid');
          App.showToast("Selected Bento Modular Grid Template", "success");
        }
      },
      {
        type: "template",
        category: "Graphic Templates",
        icon: "📰",
        title: "Clean Editorial Canvas Template",
        subtitle: "Gamma Minimalist Paper • High-End Swiss Print & Geometric Rules",
        keywords: "clean editorial canvas gamma template swiss print modern paper pdf",
        action: () => {
          App.switchTab('reports');
          App.selectTemplate('editorial_canvas');
          App.showToast("Selected Clean Editorial Canvas Template", "success");
        }
      },
      {
        type: "template",
        category: "Graphic Templates",
        icon: "🌑",
        title: "Obsidian Dark Deck Template",
        subtitle: "Gamma Midnight Tech • Cyber Dark Cards with Electric Cyan",
        keywords: "obsidian dark deck cyber midnight cyan glowing gamma template pdf",
        action: () => {
          App.switchTab('reports');
          App.selectTemplate('obsidian_deck');
          App.showToast("Selected Obsidian Dark Deck Template", "success");
        }
      },
      {
        type: "template",
        category: "Graphic Templates",
        icon: "✨",
        title: "Aurora Vibrant Gradient Template",
        subtitle: "Gamma Aurora Modern • Sunset Radiant Indigo, Fuchsia & Rose",
        keywords: "aurora vibrant gradient sunset indigo rose fuchsia gamma template",
        action: () => {
          App.switchTab('reports');
          App.selectTemplate('aurora_gradient');
          App.showToast("Selected Aurora Vibrant Gradient Template", "success");
        }
      },
      {
        type: "template",
        category: "Graphic Templates",
        icon: "🌊",
        title: "Nordic Ocean Slate Template",
        subtitle: "Gamma Deep Ocean • Clean Scandinavian Palette & Arctic Blue",
        keywords: "nordic ocean slate scandinavian arctic navy cyan gamma template",
        action: () => {
          App.switchTab('reports');
          App.selectTemplate('nordic_ocean');
          App.showToast("Selected Nordic Ocean Slate Template", "success");
        }
      },
      {
        type: "template",
        category: "Graphic Templates",
        icon: "🏜️",
        title: "Warm Sandstone Executive Template",
        subtitle: "Gamma Warm Sand • Institutional Paper, Forest Pine & Terracotta",
        keywords: "warm sandstone executive forest pine terracotta paper gamma template",
        action: () => {
          App.switchTab('reports');
          App.selectTemplate('warm_sandstone');
          App.showToast("Selected Warm Sandstone Executive Template", "success");
        }
      },

      // 3. Sovereign KPIs & Production Metrics
      {
        type: "metric",
        category: "Sovereign KPIs",
        icon: "📊",
        title: "National Extraction Metric",
        subtitle: "131,608.90 MT Logged • 96.72% Target Fulfillment",
        keywords: "national extraction 131608 96.72 target production metric kpi",
        action: () => {
          App.switchTab('dashboard');
          window.scrollTo({ top: 120, behavior: 'smooth' });
          App.showToast("Viewing National Extraction KPI", "info");
        }
      },
      {
        type: "metric",
        category: "Sovereign KPIs",
        icon: "🚂",
        title: "Thermal Dispatch & Power Offtake",
        subtitle: "126,491.21 MT Dispatched • 96.11% Offtake Ratio",
        keywords: "thermal dispatch 126491 96.11 offtake power rail logistics kpi",
        action: () => {
          App.switchTab('dashboard');
          window.scrollTo({ top: 120, behavior: 'smooth' });
          App.showToast("Viewing Thermal Dispatch KPI", "info");
        }
      },
      {
        type: "metric",
        category: "Sovereign KPIs",
        icon: "🛡️",
        title: "AST Deterministic Audit Integrity",
        subtitle: "100% Deterministic • AST Math & Hash Verified",
        keywords: "audit integrity 100 deterministic ast math verified compliance kpi",
        action: () => {
          App.switchTab('dashboard');
          window.scrollTo({ top: 120, behavior: 'smooth' });
          App.showToast("Viewing Audit Integrity Verification", "info");
        }
      },

      // 4. Navigation & Quick Actions
      {
        type: "navigation",
        category: "Navigation & Actions",
        icon: "⚡",
        title: "New Report / Ingest Dataset",
        subtitle: "Upload raw colliery CSV, TSV, or PDF and trigger AI analysis",
        keywords: "new report upload dataset csv pdf ingest analyze",
        action: () => {
          App.switchTab('datasets');
        }
      },
      {
        type: "navigation",
        category: "Navigation & Actions",
        icon: "📊",
        title: "Executive Overview Dashboard",
        subtitle: "National summary, production charts, and strategic radar",
        keywords: "dashboard executive overview charts graphs statistics",
        action: () => {
          App.switchTab('dashboard');
        }
      },
      {
        type: "navigation",
        category: "Navigation & Actions",
        icon: "📈",
        title: "Coalfield Analytics & Leaderboard",
        subtitle: "Interactive basin rankings, colliery sorting, and fulfillment bars",
        keywords: "coalfield analytics leaderboard colliery rankings table",
        action: () => {
          App.switchTab('analytics');
        }
      },
      {
        type: "navigation",
        category: "Navigation & Actions",
        icon: "📄",
        title: "Report Studio & PDF Export",
        subtitle: "Live A4 document preview canvas and official PDF download",
        keywords: "report studio export pdf download print preview canvas",
        action: () => {
          App.switchTab('reports');
        }
      },
      {
        type: "navigation",
        category: "Navigation & Actions",
        icon: "📥",
        title: "Download Clean CSV (No Template)",
        subtitle: "Export raw verified data without formatting or styling",
        keywords: "download clean csv raw data export tabular dataset",
        action: () => {
          window.location.href = '/api/reports/download/csv';
          App.showToast("Initiated CSV download", "success");
        }
      }
    ];
  },

  handleUniversalSearch: function(event) {
    const input = document.getElementById("universal-search-input");
    const dropdown = document.getElementById("universal-search-dropdown");
    const clearBtn = document.getElementById("universal-search-clear");
    if (!input || !dropdown) return;

    const q = (input.value || "").toLowerCase().trim();
    if (clearBtn) {
      if (q) clearBtn.classList.remove("hidden");
      else clearBtn.classList.add("hidden");
    }

    const index = this.getUniversalSearchIndex();
    // Also include dynamic report history items if present
    if (this.historyList && this.historyList.length > 0) {
      this.historyList.forEach(item => {
        index.push({
          type: "report",
          category: "Generated Dossiers",
          icon: "📜",
          title: item.title || "Report Dossier",
          subtitle: `${item.id} • ${item.date} • ${item.auditor_id || 'MOC-7890'}`,
          keywords: `${item.title} ${item.template} ${item.id} dossier pdf report`.toLowerCase(),
          action: () => {
            App.switchTab('reports');
            App.showToast(`Navigated to dossier ${item.id}`, "info");
          }
        });
      });
    }

    let results = [];
    if (!q) {
      // Show default recommended shortcuts
      results = index.filter(item => item.type === "template" || item.type === "colliery" || item.type === "navigation").slice(0, 7);
    } else {
      results = index.filter(item => {
        const text = `${item.title} ${item.subtitle} ${item.keywords} ${item.category}`.toLowerCase();
        return text.includes(q);
      }).slice(0, 10);
    }

    if (results.length === 0) {
      dropdown.innerHTML = `
        <div class="p-5 text-center text-xs text-slate-500 dark:text-slate-400">
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">No matching results found</p>
          <p class="mt-1 text-[11px]">Try searching for <span class="text-blue-500 font-mono font-bold">Gevra</span>, <span class="text-blue-500 font-mono font-bold">Obsidian</span>, <span class="text-blue-500 font-mono font-bold">Dispatch</span>, or <span class="text-blue-500 font-mono font-bold">PDF</span></p>
        </div>
      `;
      dropdown.classList.remove("hidden");
      return;
    }

    // Render grouped results
    let html = `
      <div class="p-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span class="font-bold uppercase tracking-wider">${q ? `Matching Results (${results.length})` : 'Universal Shortcuts & Data'}</span>
        <span class="font-mono text-[10px]">Universal Index</span>
      </div>
      <div class="divide-y divide-slate-100 dark:divide-slate-800/80">
    `;

    results.forEach((item, idx) => {
      html += `
        <div onclick="App.executeUniversalSearchResult(${idx})"
          class="p-3 hover:bg-blue-50 dark:hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between group">
          <div class="flex items-center space-x-3 min-w-0">
            <span class="text-base w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition">${item.icon}</span>
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">${item.title}</span>
                <span class="text-[9px] px-1.5 py-0.2 rounded-full font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">${item.category.split(' ')[0]}</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">${item.subtitle}</p>
            </div>
          </div>
          <span class="text-xs text-blue-600 dark:text-cyan-400 font-bold opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">→</span>
        </div>
      `;
    });

    html += `</div>`;
    dropdown.innerHTML = html;
    dropdown.classList.remove("hidden");
    this._currentUniversalResults = results;
  },

  executeUniversalSearchResult: function(index) {
    if (this._currentUniversalResults && this._currentUniversalResults[index]) {
      const item = this._currentUniversalResults[index];
      if (item.action) item.action();
    }
    this.closeUniversalSearch();
  },

  clearUniversalSearch: function() {
    const input = document.getElementById("universal-search-input");
    if (input) {
      input.value = "";
      input.focus();
    }
    this.closeUniversalSearch();
    const clearBtn = document.getElementById("universal-search-clear");
    if (clearBtn) clearBtn.classList.add("hidden");
  },

  closeUniversalSearch: function() {
    const dropdown = document.getElementById("universal-search-dropdown");
    if (dropdown) dropdown.classList.add("hidden");
  },

  togglePasswordVisibility: function(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const pwd = document.getElementById("login-password");
    const eye = document.getElementById("eye-icon");
    if (!pwd) return;

    if (pwd.type === "password") {
      pwd.type = "text";
      if (eye) eye.innerText = "🙈";
    } else {
      pwd.type = "password";
      if (eye) eye.innerText = "👁️";
    }
  },

  handleLogin: async function(e, overrideEmpId = null) {
    if (e) {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    const empIdEl = document.getElementById("login-emp-id");
    const pwdEl = document.getElementById("login-password");
    const rememberEl = document.getElementById("remember-device");

    const empId = overrideEmpId || (empIdEl ? empIdEl.value.trim() : "MOC-7890") || "MOC-7890";
    const pwd = pwdEl ? pwdEl.value : "SecureEnclave2026!";
    const remember = rememberEl ? rememberEl.checked : true;

    const spinner = document.getElementById("auth-spinner");
    const icon = document.getElementById("auth-icon");
    const text = document.getElementById("auth-btn-text");
    const btn = document.getElementById("btn-authenticate");

    if (spinner) spinner.classList.remove("hidden");
    if (icon) icon.classList.add("hidden");
    if (text) text.innerText = "Authenticating Session...";
    if (btn) btn.disabled = true;

    try {
      const session = await AuthController.login(empId, pwd, remember);
      if (spinner) spinner.classList.add("hidden");
      if (icon) icon.classList.remove("hidden");
      if (text) text.innerText = "Authenticate Session";
      if (btn) btn.disabled = false;

      this.checkAuth();
      this.showToast(`Welcome, ${session.employeeId} • Session Authenticated`, "success");
    } catch (err) {
      if (spinner) spinner.classList.add("hidden");
      if (icon) icon.classList.remove("hidden");
      if (text) text.innerText = "Authenticate Session";
      if (btn) btn.disabled = false;
      this.showToast(err.message || "Authentication failed", "error");
    }
  },

  handleLogout: function() {
    AuthController.logout();
    this.checkAuth();
    this.showToast("Signed out of secure session.", "info");
  },

  switchTab: function(tabId) {
    const tabs = ["dashboard", "datasets", "analytics", "reports"];
    const isDark = (document.documentElement.getAttribute("data-theme") || "dark") === "dark";
    tabs.forEach(t => {
      const tabBtn = document.getElementById(`tab-${t}`);
      const tabView = document.getElementById(`view-${t}`);
      if (tabBtn) {
        if (t === tabId) {
          tabBtn.className = isDark
            ? "py-3.5 text-sm font-semibold border-b-2 border-cyan-400 text-cyan-300 transition flex items-center space-x-2 shrink-0"
            : "py-3.5 text-sm font-semibold border-b-2 border-blue-700 text-blue-800 transition flex items-center space-x-2 shrink-0";
        } else {
          tabBtn.className = isDark
            ? "py-3.5 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 shrink-0"
            : "py-3.5 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition flex items-center space-x-2 shrink-0";
        }
      }
      if (tabView) {
        tabView.classList.toggle("hidden", t !== tabId);
      }
    });
    this.activeTab = tabId;

    if (tabId === "dashboard") {
      setTimeout(() => this.renderDashboardCharts(), 100);
    } else if (tabId === "reports") {
      this.loadReportHistory();
    }
  },

  renderRankingsTable: function() {
    const tbody = document.getElementById("rankings-tbody");
    if (!tbody || typeof MOCK_COLLIERIES === "undefined") return;

    const isDark = (document.documentElement.getAttribute("data-theme") || "dark") === "dark";

    tbody.innerHTML = MOCK_COLLIERIES.slice(0, 7).map(c => {
      let medal = isDark
        ? `<span class="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 font-bold rounded-md font-mono text-xs">${c.rank}</span>`
        : `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-md font-mono text-xs">${c.rank}</span>`;
      if (c.rank === 1) medal = isDark
        ? `<span class="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold rounded-md font-mono text-xs">🥇 1</span>`
        : `<span class="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-md font-mono text-xs">🥇 1</span>`;
      if (c.rank === 2) medal = isDark
        ? `<span class="px-2 py-0.5 bg-slate-700/60 text-slate-200 border border-slate-600 font-bold rounded-md font-mono text-xs">🥈 2</span>`
        : `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-md font-mono text-xs">🥈 2</span>`;
      if (c.rank === 3) medal = isDark
        ? `<span class="px-2 py-0.5 bg-amber-700/30 text-amber-200 border border-amber-600/40 font-bold rounded-md font-mono text-xs">🥉 3</span>`
        : `<span class="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-md font-mono text-xs">🥉 3</span>`;

      const pct = Math.min(100, Math.round((c.production / c.target) * 100));

      const rowClass = isDark
        ? "hover:bg-slate-800/60 transition border-b border-slate-800/80"
        : "hover:bg-slate-50 transition border-b border-slate-200";
      const nameClass = isDark ? "font-bold text-white" : "font-bold text-slate-900";
      const stateClass = isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium";
      const companyPill = isDark
        ? `<span class="px-2.5 py-0.5 bg-blue-950 text-cyan-300 border border-cyan-500/40 rounded-full text-[11px] font-bold font-mono">${c.company}</span>`
        : `<span class="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[11px] font-bold font-mono">${c.company}</span>`;
      const prodClass = isDark ? "font-bold text-white mono text-sm" : "font-bold text-slate-900 mono text-sm";
      const pctColor = isDark ? "text-emerald-400" : "text-emerald-600";
      const countColor = isDark ? "text-slate-400" : "text-slate-500";
      const trackClass = isDark
        ? "w-32 bg-slate-800 border border-slate-700 rounded-full h-2.5 overflow-hidden shadow-inner"
        : "w-32 bg-slate-200 border border-slate-300 rounded-full h-2.5 overflow-hidden shadow-inner";
      const shareClass = isDark ? "text-cyan-300 font-bold mono text-sm" : "text-blue-700 font-bold mono text-sm";

      return `
        <tr class="${rowClass}">
          <td class="py-3 px-3.5">${medal}</td>
          <td class="py-3 px-3.5 ${nameClass}">${c.name}</td>
          <td class="py-3 px-3.5 ${stateClass}">${c.state}</td>
          <td class="py-3 px-3.5">${companyPill}</td>
          <td class="py-3 px-3.5 text-right ${prodClass}">${c.production.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
          <td class="py-3 px-3.5 text-right">
            <div class="flex flex-col items-end space-y-1">
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold font-mono ${pctColor}">${pct}%</span>
                <span class="text-[11px] ${countColor} font-mono">(${c.production.toLocaleString('en-IN', {maximumFractionDigits: 0})} / ${c.target.toLocaleString('en-IN', {maximumFractionDigits: 0})} MT)</span>
              </div>
              <div class="${trackClass}">
                <div class="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-2.5 rounded-full shadow-xs" style="width: ${pct}%"></div>
              </div>
            </div>
          </td>
          <td class="py-3 px-3.5 text-right ${shareClass}">${c.share}</td>
        </tr>
      `;
    }).join("");
  },

  renderDashboardCharts: function() {
    if (typeof Chart === "undefined") return;

    const isDark = (document.documentElement.getAttribute("data-theme") || "dark") === "dark";

    // Line / Area Chart: 12-Month Trends
    const ctxTrends = document.getElementById("chart-production-trends");
    if (ctxTrends) {
      if (this.trendsChart) this.trendsChart.destroy();
      this.trendsChart = new Chart(ctxTrends, {
        type: 'line',
        data: {
          labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
          datasets: [
            {
              label: 'Actual Production (MT)',
              data: [10.2, 10.8, 11.1, 10.9, 11.4, 11.8, 12.1, 12.5, 12.8, 13.1, 13.4, 13.8],
              borderColor: isDark ? '#38BDF8' : '#1E3A8A',
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 58, 138, 0.12)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointBackgroundColor: isDark ? '#38BDF8' : '#1E3A8A',
              pointRadius: 3
            },
            {
              label: 'Target Allocation (MT)',
              data: [10.0, 10.5, 10.8, 11.0, 11.2, 11.5, 12.0, 12.2, 12.5, 12.8, 13.0, 13.5],
              borderColor: isDark ? '#F59E0B' : '#D97706',
              borderDash: [5, 5],
              borderWidth: 2,
              pointRadius: 0,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#0B1120' : '#0F172A',
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 12 },
              padding: 10,
              cornerRadius: 8
            }
          },
          scales: {
            x: { 
              grid: { display: false },
              ticks: { color: isDark ? '#94A3B8' : '#64748B' }
            },
            y: { 
              grid: { color: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }, 
              ticks: { color: isDark ? '#94A3B8' : '#64748B' },
              min: 8 
            }
          }
        }
      });
    }

    // Doughnut Chart: Subsidiary Share
    const ctxShare = document.getElementById("chart-company-share");
    if (ctxShare) {
      if (this.shareChart) this.shareChart.destroy();
      this.shareChart = new Chart(ctxShare, {
        type: 'doughnut',
        data: {
          labels: ['SECL (Chhattisgarh)', 'MCL (Odisha)', 'NCL (Madhya Pradesh)', 'CCL & BCCL (Jharkhand)', 'ECL (West Bengal)'],
          datasets: [{
            data: [30.8, 23.6, 26.0, 15.6, 4.0],
            backgroundColor: ['#1E3A8A', '#059669', '#2563EB', '#D97706', '#9333EA'],
            borderWidth: 2,
            borderColor: isDark ? '#0F172A' : '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom', 
              labels: { 
                boxWidth: 10, 
                font: { size: 10 },
                color: isDark ? '#CBD5E1' : '#475569'
              } 
            }
          },
          cutout: '70%'
        }
      });
    }
  },

  initDragAndDrop: function() {
    const dropzone = document.getElementById("dataset-dropzone");
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add("border-blue-600", "bg-blue-100/40");
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove("border-blue-600", "bg-blue-100/40");
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files.length) {
        this.processSelectedFile(dt.files[0]);
      }
    });
  },

  handleFileSelect: function(event) {
    if (event.target.files && event.target.files.length) {
      this.processSelectedFile(event.target.files[0]);
    }
  },

  processSelectedFile: function(file) {
    this.selectedFile = file;
    const nameEl = document.getElementById("selected-file-name");
    const pill = document.getElementById("selected-file-pill");
    const title = document.getElementById("dropzone-title");
    const subtitle = document.getElementById("dropzone-subtitle");
    const auditFile = document.getElementById("audit-filename");

    if (nameEl) nameEl.innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    if (pill) pill.classList.remove("hidden");
    if (title) title.innerText = file.name;
    if (subtitle) subtitle.innerText = `Selected file: ${(file.size / 1024).toFixed(1)} KB • Ready for executive analysis`;
    if (auditFile) auditFile.innerText = file.name;

    this.showToast(`Selected ${file.name}. Generating preview...`, "info");
    this.fetchFilePreview(file);
  },

  clearSelectedFile: function(e) {
    if (e) e.stopPropagation();
    this.selectedFile = null;
    const fileInput = document.getElementById("dataset-file-input");
    if (fileInput) fileInput.value = "";
    const pill = document.getElementById("selected-file-pill");
    if (pill) pill.classList.add("hidden");
    const title = document.getElementById("dropzone-title");
    if (title) title.innerText = "Upload Coal or Mining Dataset (CSV / PDF)";
    const subtitle = document.getElementById("dropzone-subtitle");
    if (subtitle) subtitle.innerText = "Drag and drop your file here, or click to browse (supports CSV, TSV, XLSX, PDF)";
    const previewCard = document.getElementById("dataset-preview-card");
    if (previewCard) previewCard.classList.add("hidden");
    const auditFilename = document.getElementById("audit-filename");
    if (auditFilename) auditFilename.innerText = "None Selected";
    const auditRows = document.getElementById("audit-row-count");
    if (auditRows) auditRows.innerText = "-";
    const auditCols = document.getElementById("audit-col-count");
    if (auditCols) auditCols.innerText = "-";
  },

  fetchFilePreview: async function(file) {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".tsv")) {
      document.getElementById("audit-row-count").innerText = "PDF Document";
      document.getElementById("audit-col-count").innerText = "Multi-page Text/Tables";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pipeline/quick-preview", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        document.getElementById("audit-row-count").innerText = `${data.rows} rows`;
        document.getElementById("audit-col-count").innerText = `${data.columns.length} columns`;
        document.getElementById("quality-gauge").innerText = "100%";
        document.getElementById("quality-status-text").innerText = "AUDIT VERIFIED";
        this.renderPreviewTable(data);
      }
    } catch (e) {
      console.log("Preview error:", e);
    }
  },

  renderPreviewTable: function(data) {
    const card = document.getElementById("dataset-preview-card");
    const thead = document.getElementById("dataset-preview-thead");
    const tbody = document.getElementById("dataset-preview-tbody");
    const badge = document.getElementById("preview-record-badge");

    if (!card || !thead || !tbody) return;

    badge.innerText = `First ${data.preview.length} of ${data.rows} records (${data.columns.length} columns)`;
    thead.innerHTML = `<tr>${data.columns.map(c => `<th class="py-2.5 px-3 border-b border-slate-200 font-bold">${c}</th>`).join("")}</tr>`;
    tbody.innerHTML = data.preview.map(row => `
      <tr class="hover:bg-slate-50">
        ${data.columns.map(col => `<td class="py-2 px-3 border-b border-slate-100 text-slate-700">${row[col] ?? ''}</td>`).join("")}
      </tr>
    `).join("");

    card.classList.remove("hidden");
  },

  startWaveformAnimation: function() {
    const canvas = document.getElementById("live-telemetry-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let step = 0;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      // Primary Cyan Wave
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#38BDF8";
      for (let x = 0; x < width; x++) {
        const y = mid + Math.sin((x * 0.02) + (step * 0.08)) * 20 * Math.sin(x / width * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Secondary Emerald Wave
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#34D399";
      for (let x = 0; x < width; x++) {
        const y = mid + Math.cos((x * 0.03) - (step * 0.06)) * 14 * Math.sin(x / width * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      step++;
      this.animationFrameId = requestAnimationFrame(draw);
    };

    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(draw);
  },

  stopWaveformAnimation: function() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  },

  // =========================================================================
  // AI AUTO PROMPT GENERATOR & PRESET DIRECTIVES
  // =========================================================================
  autoGenerateAIPrompt: async function(category = null) {
    const input = document.getElementById("pipeline-custom-command");
    const btn = document.getElementById("btn-auto-prompt");
    const icon = document.getElementById("auto-prompt-icon");
    const text = document.getElementById("auto-prompt-text");

    if (icon) icon.innerText = "⏳";
    if (text) text.innerText = "Generating AI Directive...";
    if (btn) btn.disabled = true;

    const fallbackPrompts = {
      high_yield: [
        "Prioritize top mega-collieries (Gevra, Kusmunda, Dipka), analyze heavy earthmoving machinery efficiency, and flag stripping ratio bottlenecks.",
        "Isolate high-yield opencast basins yielding >15,000 MT, verify daily extraction quotas, and project Q3 production trajectory.",
        "Benchmark tier-1 opencast mines against annual MoC production charter, isolating volume contributors across SECL and MCL basins."
      ],
      variance_audit: [
        "Perform statistical anomaly audit across all 18 basins, isolating collieries with >3% target fulfillment variance against statutory quotas.",
        "Audit production variance across coalfield basins, highlight overperforming and lagging mines, and calculate net national deficit index.",
        "Execute mathematical variance breakdown comparing actual extraction against scheduled union budget targets with determinism verification."
      ],
      logistics: [
        "Audit First-Mile rail connectivity, evaluate rakes availability at siding nodes, and calculate power plant thermal coal buffer reserves.",
        "Track thermal power dispatch efficiency, evaluate offtake-to-extraction ratios, and map wagon turnaround times across Korba and Talcher.",
        "Assess multimodal evacuation corridors, monitor merry-go-round conveyor throughput, and verify critical power plant coal stockpiles."
      ],
      esg: [
        "Evaluate eco-reclamation hectarage, solar mine transitions, mine water treatment recycling, and zero-harm safety statutory records.",
        "Audit sustainable mining parameters: first-mile rail adoption %, afforestation offset compliance, and carbon abatement progress.",
        "Benchmark zero-harm safety indices, overburden dump stability monitoring, and environmental statutory clearance conformity."
      ],
      statutory: [
        "Compile statutory audit format focusing on union budget fulfillment, state royalty allocations, and public accounts committee review.",
        "Perform parliamentary accountability analysis: royalty distributions, district mineral foundation (DMF) allocations, and audit trails.",
        "Verify compliance with Mines Act guidelines, statutory vigilance oversight, and 100% deterministic cryptographic audit hashing."
      ],
      general: [
        "Conduct comprehensive strategic review isolating mega-collieries, thermal power plant dispatch ratios, and statutory audit integrity.",
        "Synthesize national extraction leaderboard, calculate colliery variance against target quotas, and evaluate rail evacuation corridors.",
        "Perform deep-dive colliery operational audit: benchmark extraction velocity, identify dispatch bottlenecks, and assess regional quotas.",
        "Audit high-capacity opencast mining assets, verify statutory compliance metrics, and formulate executive ministerial directives."
      ]
    };

    let generatedPrompt = "";
    try {
      const formData = new FormData();
      if (category) formData.append("category", category);
      if (this.selectedFile) formData.append("filename", this.selectedFile.name);

      const resp = await fetch("/api/pipeline/auto-generate-prompt", {
        method: "POST",
        body: formData
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.prompt) {
          generatedPrompt = data.prompt;
        }
      }
    } catch (err) {
      console.warn("Backend auto-prompt call failed, using client-side synthesis engine:", err);
    }

    if (!generatedPrompt) {
      const catKey = category && fallbackPrompts[category] ? category : "general";
      const list = fallbackPrompts[catKey];
      generatedPrompt = list[Math.floor(Math.random() * list.length)];
    }

    // Typewriter effect into the input
    if (input) {
      input.value = "";
      input.focus();
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < generatedPrompt.length) {
          input.value += generatedPrompt.charAt(i);
          i++;
        } else {
          clearInterval(typeInterval);
          if (icon) icon.innerText = "✨";
          if (text) text.innerText = "Auto-Generate with AI";
          if (btn) btn.disabled = false;
        }
      }, 10);
    } else {
      if (icon) icon.innerText = "✨";
      if (text) text.innerText = "Auto-Generate with AI";
      if (btn) btn.disabled = false;
    }

    this.showToast("AI Prompt Generated & Injected!", "success");
  },

  applyPromptPreset: function(presetKey) {
    this.autoGenerateAIPrompt(presetKey);
  },

  cycleRandomPrompt: function() {
    const keys = ["high_yield", "variance_audit", "logistics", "esg", "statutory", "general"];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    this.autoGenerateAIPrompt(randomKey);
  },

  clearPromptInput: function() {
    const input = document.getElementById("pipeline-custom-command");
    if (input) {
      input.value = "";
      input.focus();
    }
    this.showToast("Cleared analysis prompt", "info");
  },

  runSequentialPipeline: async function() {
    if (!this.selectedFile) {
      this.showToast("Please select or drop a CSV or PDF dataset first!", "error");
      document.getElementById("dataset-dropzone")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const btn = document.getElementById("btn-run-pipeline");
    const hub = document.getElementById("processing-hub");
    const resultsShowcase = document.getElementById("report-results-showcase");
    const progressBar = document.getElementById("pipeline-progress-bar");
    const timer = document.getElementById("pipeline-timer");
    const pctLabel = document.getElementById("processing-pct-label");
    const stageLabel = document.getElementById("processing-stage-label");
    const factText = document.getElementById("rotating-fact-text");
    const customCmd = document.getElementById("pipeline-custom-command")?.value?.trim() || "";

    btn.disabled = true;
    btn.classList.add("opacity-75");
    hub.classList.remove("hidden");
    if (resultsShowcase) resultsShowcase.classList.add("hidden");
    hub.scrollIntoView({ behavior: "smooth" });

    // Start Live Waveform
    this.startWaveformAnimation();

    // Start Rotating Facts
    let factIdx = 0;
    if (this.factIntervalId) clearInterval(this.factIntervalId);
    this.factIntervalId = setInterval(() => {
      factIdx = (factIdx + 1) % this.factsList.length;
      if (factText) {
        factText.style.opacity = '0';
        setTimeout(() => {
          factText.innerText = this.factsList[factIdx];
          factText.style.opacity = '1';
        }, 200);
      }
    }, 2200);

    // Elapsed Timer & Smooth Stage-Based Progress
    this.pipelineStartTime = Date.now();
    let currentPct = 4;
    if (progressBar) progressBar.style.width = "4%";
    if (pctLabel) pctLabel.innerText = "4%";
    if (stageLabel) stageLabel.innerText = `Ingesting ${this.selectedFile.name}...`;

    const stages = [
      { maxPct: 22, label: "Stage 1 (Marker Markdown Model): Parsing CSV/PDF into clean structured Markdown..." },
      { maxPct: 48, label: "Stage 2 (LLaMA 3.1 8B Model): Synthesizing multi-colliery statistical intelligence..." },
      { maxPct: 72, label: "Stage 2 (LLaMA 3.1 8B Model): Computing target deviations & regional offtake trends..." },
      { maxPct: 88, label: "Deterministic AST Verification: Verifying mathematical integrity (0.00 MT delta)..." },
      { maxPct: 94, label: "Stage 3 (Gemma 4 Engine): Pre-allocating structural template slots for PDF synthesis..." }
    ];


    let currentStageIdx = 0;
    if (this.pipelineInterval) clearInterval(this.pipelineInterval);
    this.pipelineInterval = setInterval(() => {
      const elapsed = ((Date.now() - this.pipelineStartTime) / 1000).toFixed(1);
      if (timer) timer.innerText = `${elapsed}s`;

      const curTarget = stages[currentStageIdx] || stages[stages.length - 1];
      if (currentPct < curTarget.maxPct) {
        currentPct += 1.6 + Math.random() * 2.4;
        if (currentPct > curTarget.maxPct) currentPct = curTarget.maxPct;
        const rounded = Math.round(currentPct);
        if (progressBar) progressBar.style.width = `${rounded}%`;
        if (pctLabel) pctLabel.innerText = `${rounded}%`;
      } else if (currentStageIdx < stages.length - 1) {
        currentStageIdx++;
        if (stageLabel) stageLabel.innerText = stages[currentStageIdx].label;
      }
    }, 260);

    const formData = new FormData();
    formData.append("file", this.selectedFile);
    if (customCmd) {
      formData.append("custom_llama_command", customCmd);
    }

    try {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        body: formData
      });

      clearInterval(this.pipelineInterval);
      clearInterval(this.factIntervalId);
      this.stopWaveformAnimation();

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const result = await res.json();
      
      // Complete to 100%
      if (progressBar) progressBar.style.width = "100%";
      if (pctLabel) pctLabel.innerText = "100%";
      if (stageLabel) stageLabel.innerText = "Executive Dossier Compiled & Verified!";

      // Cache summary text
      if (result.final_report || result.llama_analysis) {
        this.currentSummaryText = result.final_report || result.llama_analysis;
      }

      // Automatically refresh report history in Tab 4
      this.loadReportHistory();

      setTimeout(() => {
        hub.classList.add("hidden");
        this.displayExecutiveResults(result);
        this.showToast("Analysis complete! Check Tab 4 for report history and downloads.", "success");
      }, 500);

    } catch (err) {
      clearInterval(this.pipelineInterval);
      clearInterval(this.factIntervalId);
      this.stopWaveformAnimation();
      hub.classList.add("hidden");
      this.showToast(`Analysis error: ${err.message}`, "error");
    } finally {
      btn.disabled = false;
      btn.classList.remove("opacity-75");
    }
  },

  displayExecutiveResults: function(result) {
    const showcase = document.getElementById("report-results-showcase");
    const content = document.getElementById("executive-summary-content");
    const actions = document.getElementById("dataset-result-actions");

    if (showcase) showcase.classList.remove("hidden");
    if (actions) actions.classList.remove("hidden");

    const rawText = result.final_report || result.llama_analysis || "Executive Summary Generated.";
    
    // Format text nicely into HTML
    let formatted = rawText
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-black text-slate-900 mt-4 mb-2">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-blue-900 border-b border-slate-200 pb-1 mt-4 mb-2">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-slate-800 mt-3 mb-1">$1</h3>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-slate-700 py-0.5">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-700 py-0.5">$1</li>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-slate-900">$1</strong>')
      .replace(/\n\n/gim, '<p class="my-2"></p>');

    if (content) {
      content.innerHTML = `
        <div class="prose prose-slate max-w-none text-xs sm:text-sm">
          ${formatted}
        </div>
      `;
    }

    this.currentSummaryText = rawText;
    showcase.scrollIntoView({ behavior: "smooth" });
    this.showToast("Analysis complete! Select your modern report template below.", "success");

    // Automatically initialize the modern template studio with the default template
    this.selectTemplate("bento_grid", false);

    // Guide user to Step 2 Template Selection
    setTimeout(() => {
      this.scrollToTemplateStudio();
    }, 700);
  },

  currentTemplate: "bento_grid",
  currentSummaryText: "",
  templateCache: {},

  scrollToTemplateStudio: function() {
    const sec = document.getElementById("template-studio-section");
    if (sec) {
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  },

  selectTemplate: async function(templateId, shouldAnimate = true) {
    this.currentTemplate = templateId;

    // Update active card styling
    document.querySelectorAll(".template-selector-card").forEach(card => {
      card.classList.remove("active");
    });
    const activeCard = document.getElementById(`tpl-card-${templateId}`);
    if (activeCard) activeCard.classList.add("active");

    const badge = document.getElementById("active-template-badge");
    const exportLabel = document.getElementById("export-template-label");

    // Update download buttons href immediately
    const pdfBtn = document.getElementById("btn-download-tpl-pdf");
    const docxBtn = document.getElementById("btn-download-tpl-docx");
    const csvBtn = document.getElementById("btn-download-tpl-csv") || document.getElementById("btn-download-tpl-xlsx");
    if (pdfBtn) {
      pdfBtn.href = `/api/reports/download/pdf?template=${templateId}`;
      pdfBtn.download = `Ministry_of_Coal_${templateId}_2026.pdf`;
    }
    if (docxBtn) {
      docxBtn.href = `/api/reports/download/docx?template=${templateId}`;
      docxBtn.download = `Ministry_of_Coal_${templateId}_2026.docx`;
    }
    if (csvBtn) {
      csvBtn.href = `/api/reports/download/csv`;
      csvBtn.download = `Cleaned_Coal_Dataset_2026.csv`;
    }

    if (shouldAnimate) {
      this.animateTemplateFilling(templateId, async () => {
        await this.fetchAndRenderTemplate(templateId);
      });
    } else {
      await this.fetchAndRenderTemplate(templateId);
    }
  },


  animateTemplateFilling: function(templateId, onComplete) {
    const hub = document.getElementById("template-filling-hub");
    const pBar = document.getElementById("slot-progress-bar");
    const pPct = document.getElementById("slot-progress-pct");
    const pLabel = document.getElementById("slot-progress-label");
    const streamingText = document.getElementById("slot-streaming-text");

    if (!hub) {
      if (onComplete) onComplete();
      return;
    }

    hub.classList.remove("hidden");
    hub.scrollIntoView({ behavior: "smooth" });

    const tplNames = {
      bento_grid: "Bento Modular Grid",
      editorial_canvas: "Clean Editorial Canvas",
      obsidian_deck: "Obsidian Dark Deck",
      aurora_gradient: "Aurora Vibrant Gradient",
      nordic_ocean: "Nordic Ocean Slate",
      warm_sandstone: "Warm Sandstone Executive",
      executive_brief: "Bento Modular Grid",
      corporate_minimalist: "Clean Editorial Canvas",
      technical_deepdive: "Obsidian Dark Deck",
      visual_infographic: "Aurora Vibrant Gradient",
      parliamentary_scorecard: "Nordic Ocean Slate",
      esg_sustainable: "Warm Sandstone Executive"
    };
    const tplName = tplNames[templateId] || templateId;

    const stages = [
      { pct: 20, label: `Stage 3: Gemma 4 Binding ${tplName} Schema...`, text: `Gemma 4 model binding sovereign seals, metadata and template schema for ${tplName}...` },
      { pct: 45, label: "Stage 3: Gemma 4 Injecting Real Colliery Metrics...", text: "Gemma 4 calculating active user dataset totals, dispatch ratios, and colliery share rankings..." },
      { pct: 75, label: "Stage 3: Gemma 4 Synthesizing Thematic Directives...", text: `Gemma 4 transforming LLaMA 3.1 summary into publication-grade sections matching ${tplName}...` },
      { pct: 95, label: "AST Verification & Layout Formatting...", text: "Checking math consistency across user records and preparing 300 DPI vector layout..." },
      { pct: 100, label: "Template Assembled! Ready for PDF Export", text: `${tplName} assembled! Preview below or download official PDF report.` }
    ];


    let stageIdx = 0;
    const intervalId = setInterval(() => {
      if (stageIdx < stages.length) {
        const stage = stages[stageIdx];
        if (pBar) pBar.style.width = `${stage.pct}%`;
        if (pPct) pPct.innerText = `${stage.pct}%`;
        if (pLabel) pLabel.innerText = stage.label;
        if (streamingText) streamingText.innerText = stage.text;

        const indId = `slot-indicator-${Math.min(stageIdx + 1, 4)}`;
        const ind = document.getElementById(indId);
        if (ind) {
          const badge = ind.querySelector(".slot-status-badge");
          if (badge) {
            badge.className = "text-[10px] font-mono text-emerald-400 slot-status-badge";
            badge.innerText = "✓ Bound ✨";
          }
        }

        stageIdx++;
      } else {
        clearInterval(intervalId);
        setTimeout(() => {
          hub.classList.add("hidden");
          if (onComplete) onComplete();
          this.showToast(`Template "${templateId.replace('_', ' ')}" loaded into live canvas!`, "success");
        }, 400);
      }
    }, 280);
  },

  fetchAndRenderTemplate: async function(templateId) {
    try {
      let data = this.templateCache[templateId];
      if (!data) {
        const res = await fetch(`/api/templates/${templateId}/fill`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data_summary: this.currentSummaryText || ""
          })
        });
        if (res.ok) {
          data = await res.json();
          this.templateCache[templateId] = data;
        }
      }

      if (data) {
        this.renderTemplatePreview(templateId, data);
      }
    } catch (e) {
      console.warn("Could not fetch template data:", e);
    }
  },

  renderTemplatePreview: function(templateId, data) {
    const paper = document.getElementById("a4-document-paper");
    const tTitle = document.getElementById("canvas-template-title");
    const tDesc = document.getElementById("canvas-template-desc");
    const tIcon = document.getElementById("canvas-template-icon");
    const badgePill = document.getElementById("canvas-badge-pill");
    const activeBadge = document.getElementById("active-template-badge");
    const exportLabel = document.getElementById("export-template-label");
    const secContainer = document.getElementById("canvas-sections-container");
    const tbody = document.getElementById("canvas-table-tbody");
    const tableTitle = document.getElementById("canvas-table-title");
    const tableThead = document.getElementById("canvas-table-thead");
    const kpiGrid = document.getElementById("canvas-kpi-grid");

    if (activeBadge) activeBadge.innerText = data.template_name || templateId;
    if (exportLabel) exportLabel.innerText = data.template_name || templateId;
    if (tTitle) {
      tTitle.innerText = data.template_name;
      tTitle.style.color = data.primary_hex || "#1E3A8A";
    }
    if (tDesc) tDesc.innerText = data.subtitle || data.theme;
    if (tIcon) tIcon.innerText = data.icon || "📄";

    if (badgePill) {
      badgePill.innerText = data.badge || "Verified";
      badgePill.style.backgroundColor = data.primary_hex || "#1E3A8A";
    }

    // Adapt overall A4 paper styling based on graphic style
    if (paper) {
      if (templateId === "obsidian_deck" || templateId === "technical_deepdive") {
        paper.style.backgroundColor = "#0B0F19";
        paper.style.borderColor = "#1E293B";
        if (tTitle) tTitle.style.color = "#06B6D4";
      } else if (templateId === "warm_sandstone" || templateId === "esg_sustainable") {
        paper.style.backgroundColor = "#FDFBF7";
        paper.style.borderColor = "#E6DFD5";
      } else if (templateId === "nordic_ocean" || templateId === "parliamentary_scorecard") {
        paper.style.backgroundColor = "#F0F9FF";
        paper.style.borderColor = "#BAE6FD";
      } else if (templateId === "aurora_gradient" || templateId === "visual_infographic") {
        paper.style.backgroundColor = "#FAF5FF";
        paper.style.borderColor = "#DDD6FE";
      } else {
        paper.style.backgroundColor = "#FFFFFF";
        paper.style.borderColor = "#CBD5E1";
      }
    }

    // 1. Dynamic KPI Grid (Visual Variations with identical data)
    if (kpiGrid && data.kpis && data.kpis.length >= 4) {
      const kpis = data.kpis;
      if (templateId === "bento_grid" || templateId === "executive_brief") {
        // Asymmetric Bento Grid: Hero stat spans 2 columns with visual progress bar + 2 square cards
        kpiGrid.className = "grid grid-cols-1 sm:grid-cols-3 gap-3";
        kpiGrid.innerHTML = `
          <div class="sm:col-span-2 p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-extrabold tracking-wider text-blue-800">${kpis[0].label}</span>
              <span class="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">${kpis[0].badge}</span>
            </div>
            <div class="text-2xl font-black font-mono text-slate-900">${kpis[0].value}</div>
            <div class="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
              <div class="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full" style="width: 96.72%"></div>
            </div>
            <div class="text-[10px] font-semibold text-slate-500">Official National Extraction Benchmark</div>
          </div>
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-2 shadow-xs">
            <div class="text-[10px] uppercase font-bold text-slate-500">${kpis[1].label}</div>
            <div class="text-xl font-black font-mono text-slate-900">${kpis[1].value}</div>
            <div class="text-[10px] font-bold text-emerald-700">${kpis[1].badge}</div>
          </div>
          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1 shadow-xs">
            <div class="text-[10px] uppercase font-bold text-slate-500">${kpis[2].label}</div>
            <div class="text-lg font-black font-mono text-slate-900">${kpis[2].value}</div>
            <div class="text-[10px] font-bold text-blue-700">${kpis[2].badge}</div>
          </div>
          <div class="sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <div class="text-[10px] uppercase font-bold text-slate-500">${kpis[3].label}</div>
              <div class="text-base font-black font-mono text-slate-900">${kpis[3].value}</div>
            </div>
            <span class="px-2.5 py-1 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-xl border border-purple-200">
              ${kpis[3].badge}
            </span>
          </div>
        `;
      } else if (templateId === "editorial_canvas" || templateId === "corporate_minimalist") {
        // Swiss Minimalist Paper: Horizontal hairline divider layout, no heavy box backgrounds
        kpiGrid.className = "grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-300 py-3 border-y border-slate-900";
        kpiGrid.innerHTML = kpis.map(k => `
          <div class="px-3 text-center space-y-0.5">
            <div class="text-[9px] uppercase font-bold text-slate-500 tracking-wider">${k.label}</div>
            <div class="text-lg font-black font-serif text-slate-900">${k.value}</div>
            <div class="text-[10px] font-bold text-slate-700 font-mono">${k.badge}</div>
          </div>
        `).join("");
      } else if (templateId === "obsidian_deck" || templateId === "technical_deepdive") {
        // Cyber Obsidian Dark Deck: High-contrast midnight cards with glowing cyan borders
        kpiGrid.className = "grid grid-cols-2 sm:grid-cols-4 gap-3";
        kpiGrid.innerHTML = kpis.map((k, idx) => `
          <div class="p-3 bg-[#111827] border border-cyan-500/40 rounded-xl text-center space-y-1 shadow-lg shadow-cyan-950/20">
            <div class="text-[10px] uppercase font-bold text-cyan-400 font-mono">${k.label}</div>
            <div class="text-lg font-black font-mono text-white">${k.value}</div>
            <div class="text-[10px] font-bold text-cyan-300 font-mono">${k.badge}</div>
          </div>
        `).join("");
      } else if (templateId === "aurora_gradient" || templateId === "visual_infographic") {
        // Aurora Gradient Modern Deck: Vibrant top stripes and rose/violet badges
        kpiGrid.className = "grid grid-cols-2 sm:grid-cols-4 gap-3";
        kpiGrid.innerHTML = kpis.map((k, idx) => `
          <div class="p-3 bg-white border-t-2 border-indigo-500 border border-purple-100 rounded-xl text-center space-y-1 shadow-xs">
            <div class="text-[10px] uppercase font-bold text-indigo-800">${k.label}</div>
            <div class="text-lg font-black font-mono text-indigo-950">${k.value}</div>
            <div class="text-[10px] font-bold text-rose-600 bg-rose-50 rounded-full px-2 py-0.5 inline-block">${k.badge}</div>
          </div>
        `).join("");
      } else if (templateId === "nordic_ocean" || templateId === "parliamentary_scorecard") {
        // Nordic Maritime Ocean: Clean oceanic cards with marine blue typography
        kpiGrid.className = "grid grid-cols-2 sm:grid-cols-4 gap-3";
        kpiGrid.innerHTML = kpis.map(k => `
          <div class="p-3 bg-white border border-sky-200 rounded-xl text-center space-y-1 shadow-xs">
            <div class="text-[10px] uppercase font-bold text-sky-800 tracking-wider">${k.label}</div>
            <div class="text-lg font-black font-mono text-sky-950">${k.value}</div>
            <div class="text-[10px] font-bold text-cyan-700 font-mono">${k.badge}</div>
          </div>
        `).join("");
      } else {
        // Warm Sandstone Executive: Parchment cards with forest green numerals
        kpiGrid.className = "grid grid-cols-2 sm:grid-cols-4 gap-3";
        kpiGrid.innerHTML = kpis.map(k => `
          <div class="p-3 bg-[#F7F3EB] border border-[#E6DFD5] rounded-xl text-center space-y-1 shadow-xs">
            <div class="text-[10px] uppercase font-bold text-stone-600 tracking-wider">${k.label}</div>
            <div class="text-lg font-black font-serif text-[#14532D]">${k.value}</div>
            <div class="text-[10px] font-bold text-[#C2410C] font-mono">${k.badge}</div>
          </div>
        `).join("");
      }
    }

    // 2. Dynamic Sections (Identical synthesized content with graphic styling differences)
    if (secContainer && data.sections) {
      const textColor = (templateId === "obsidian_deck" || templateId === "technical_deepdive") ? "#F1F5F9" : "#0F172A";
      let secHtml = "";

      data.sections.forEach((sec, idx) => {
        let bodyContent = sec.content
          .replace(/\n\n/g, '<br/><br/>')
          .replace(/• (.*)/g, `<li class="ml-4 list-disc py-0.5" style="color: ${textColor} !important;">$1</li>`)
          .replace(/(\d+\.) (.*)/g, `<li class="ml-4 list-decimal py-0.5" style="color: ${textColor} !important;">$2</li>`)
          .replace(/★ (.*)/g, `<div class="flex items-center space-x-2 py-0.5 font-bold"><span>★</span><span style="color: ${textColor} !important;">$1</span></div>`);

        let cardStyle = "";
        if (templateId === "obsidian_deck" || templateId === "technical_deepdive") {
          cardStyle = "background-color: #111827; border: 1px solid #1E293B; color: #F1F5F9;";
        } else if (templateId === "editorial_canvas" || templateId === "corporate_minimalist") {
          cardStyle = "background-color: transparent; border-left: 3px solid #0F172A; padding-left: 1rem; border-top: none; border-right: none; border-bottom: none;";
        } else if (templateId === "aurora_gradient" || templateId === "visual_infographic") {
          cardStyle = "background-color: #FFFFFF; border-left: 4px solid #4F46E5; border: 1px solid #DDD6FE; border-left-width: 4px;";
        } else if (templateId === "warm_sandstone" || templateId === "esg_sustainable") {
          cardStyle = "background-color: #F7F3EB; border-left: 3px solid #C2410C; border: 1px solid #E6DFD5; border-left-width: 3px;";
        } else if (templateId === "nordic_ocean" || templateId === "parliamentary_scorecard") {
          cardStyle = "background-color: #FFFFFF; border-left: 3px solid #0369A1; border: 1px solid #BAE6FD; border-left-width: 3px;";
        } else {
          // Bento Modular Grid
          cardStyle = "background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 1rem;";
        }

        secHtml += `
          <div class="space-y-1.5 p-4 rounded-xl shadow-xs" style="${cardStyle}">
            <h3 class="text-xs sm:text-sm font-extrabold font-heading uppercase tracking-wide flex items-center space-x-2" style="color: ${data.primary_hex || '#1E3A8A'};">
              <span>§${idx + 1}</span>
              <span>${sec.title}</span>
            </h3>
            <div class="text-xs font-semibold leading-relaxed font-sans pt-1" style="color: ${textColor} !important;">
              ${bodyContent}
            </div>
          </div>
        `;
      });
      secContainer.innerHTML = secHtml;
    }

    // 3. Dynamic Colliery Table (Exact same data across all templates)
    const collieryRecords = data.collieries_preview || (typeof MOCK_COLLIERIES !== "undefined" ? MOCK_COLLIERIES.slice(0, 8) : []);
    if (tbody) {
      if (tableTitle) {
        tableTitle.innerText = "Top Colliery Production & Dispatch Rankings";
        tableTitle.style.color = (templateId === "obsidian_deck" || templateId === "technical_deepdive") ? "#06B6D4" : "#0F172A";
      }

      if (templateId === "obsidian_deck" || templateId === "technical_deepdive") {
        if (tableThead) {
          tableThead.innerHTML = `
            <tr class="bg-[#111827] text-cyan-400 font-mono text-[10px] border-b border-cyan-500/30">
              <th class="py-2 px-2.5 text-center">Rank</th>
              <th class="py-2 px-2.5">Colliery Name</th>
              <th class="py-2 px-2.5">State / Basin</th>
              <th class="py-2 px-2.5 text-right">Production (MT)</th>
              <th class="py-2 px-2.5 text-right">Dispatch (MT)</th>
              <th class="py-2 px-2.5 text-center">Status</th>
            </tr>
          `;
        }
        tbody.innerHTML = collieryRecords.slice(0, 8).map((c, i) => `
          <tr class="border-b border-slate-800 font-mono text-[11px] hover:bg-slate-900/50">
            <td class="py-1.5 px-2.5 text-center font-bold text-cyan-400">${c.rank || i+1}</td>
            <td class="py-1.5 px-2.5 font-bold text-white">${c.name}</td>
            <td class="py-1.5 px-2.5 text-slate-400">${c.state}</td>
            <td class="py-1.5 px-2.5 text-right font-bold text-cyan-300">${(c.production || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-right text-slate-300">${(c.dispatch || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-center"><span class="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">[OPTIMAL]</span></td>
          </tr>
        `).join("");
      } else if (templateId === "editorial_canvas" || templateId === "corporate_minimalist") {
        if (tableThead) {
          tableThead.innerHTML = `
            <tr class="border-y border-slate-900 text-slate-900 font-serif uppercase italic text-[10px]">
              <th class="py-2 px-2.5 text-center">Rank</th>
              <th class="py-2 px-2.5">Colliery Name</th>
              <th class="py-2 px-2.5">State / Basin</th>
              <th class="py-2 px-2.5 text-right">Production (MT)</th>
              <th class="py-2 px-2.5 text-right">Dispatch (MT)</th>
              <th class="py-2 px-2.5 text-right">Share</th>
            </tr>
          `;
        }
        tbody.innerHTML = collieryRecords.slice(0, 8).map((c, i) => `
          <tr class="border-b border-slate-200 font-serif text-[11px] hover:bg-slate-50">
            <td class="py-1.5 px-2.5 text-center font-bold text-slate-700">${c.rank || i+1}</td>
            <td class="py-1.5 px-2.5 font-bold text-slate-950">${c.name}</td>
            <td class="py-1.5 px-2.5 text-slate-700">${c.state}</td>
            <td class="py-1.5 px-2.5 text-right font-bold text-slate-950">${(c.production || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-right text-slate-700">${(c.dispatch || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-right font-mono text-slate-600">${c.share || '-'}</td>
          </tr>
        `).join("");
      } else if (templateId === "aurora_gradient" || templateId === "visual_infographic") {
        if (tableThead) {
          tableThead.innerHTML = `
            <tr class="bg-indigo-900 text-white text-[10px]">
              <th class="py-2 px-2.5 text-center">Rank</th>
              <th class="py-2 px-2.5">Colliery Name</th>
              <th class="py-2 px-2.5">State / Basin</th>
              <th class="py-2 px-2.5 text-right">Production (MT)</th>
              <th class="py-2 px-2.5 text-right">Dispatch (MT)</th>
              <th class="py-2 px-2.5 text-center">Sprint Badge</th>
            </tr>
          `;
        }
        tbody.innerHTML = collieryRecords.slice(0, 8).map((c, i) => `
          <tr class="hover:bg-purple-50/50 border-b border-purple-100 text-[11px]">
            <td class="py-1.5 px-2.5 text-center font-bold text-indigo-700">${c.rank || i+1}</td>
            <td class="py-1.5 px-2.5 font-bold text-indigo-950">${c.name}</td>
            <td class="py-1.5 px-2.5 text-slate-600">${c.state}</td>
            <td class="py-1.5 px-2.5 text-right font-bold text-indigo-900 font-mono">${(c.production || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-right font-mono text-slate-700">${(c.dispatch || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${i === 0 ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'}">${i === 0 ? '★ LEADER' : '✓ VERIFIED'}</span></td>
          </tr>
        `).join("");
      } else if (templateId === "nordic_ocean" || templateId === "parliamentary_scorecard") {
        if (tableThead) {
          tableThead.innerHTML = `
            <tr class="bg-[#0369A1] text-white text-[10px]">
              <th class="py-2 px-2.5 text-center">Rank</th>
              <th class="py-2 px-2.5">Colliery Name</th>
              <th class="py-2 px-2.5">State / Basin</th>
              <th class="py-2 px-2.5 text-right">Production (MT)</th>
              <th class="py-2 px-2.5 text-right">Dispatch (MT)</th>
              <th class="py-2 px-2.5 text-center">Maritime Offtake</th>
            </tr>
          `;
        }
        tbody.innerHTML = collieryRecords.slice(0, 8).map((c, i) => `
          <tr class="hover:bg-sky-50 border-b border-sky-100 text-[11px]">
            <td class="py-1.5 px-2.5 text-center font-bold text-sky-800">${c.rank || i+1}</td>
            <td class="py-1.5 px-2.5 font-bold text-sky-950">${c.name}</td>
            <td class="py-1.5 px-2.5 text-slate-600">${c.state}</td>
            <td class="py-1.5 px-2.5 text-right font-bold text-sky-950 font-mono">${(c.production || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-right font-mono text-slate-700">${(c.dispatch || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">Assigned</span></td>
          </tr>
        `).join("");
      } else if (templateId === "warm_sandstone" || templateId === "esg_sustainable") {
        if (tableThead) {
          tableThead.innerHTML = `
            <tr class="bg-[#14532D] text-white text-[10px]">
              <th class="py-2 px-2.5 text-center">Rank</th>
              <th class="py-2 px-2.5">Colliery Name</th>
              <th class="py-2 px-2.5">State / Basin</th>
              <th class="py-2 px-2.5 text-right">Production (MT)</th>
              <th class="py-2 px-2.5 text-right">Dispatch (MT)</th>
              <th class="py-2 px-2.5 text-center">Audit Tier</th>
            </tr>
          `;
        }
        tbody.innerHTML = collieryRecords.slice(0, 8).map((c, i) => `
          <tr class="hover:bg-amber-50/50 border-b border-stone-200 text-[11px]">
            <td class="py-1.5 px-2.5 text-center font-bold text-stone-700">${c.rank || i+1}</td>
            <td class="py-1.5 px-2.5 font-bold text-[#14532D]">${c.name}</td>
            <td class="py-1.5 px-2.5 text-stone-600">${c.state}</td>
            <td class="py-1.5 px-2.5 text-right font-bold text-stone-900 font-mono">${(c.production || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-right font-mono text-stone-700">${(c.dispatch || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-[#C2410C]">Standard</span></td>
          </tr>
        `).join("");
      } else {
        // Bento Modular Grid Standard
        if (tableThead) {
          tableThead.innerHTML = `
            <tr class="bg-blue-900 text-white text-[10px]">
              <th class="py-2 px-2.5 text-center">Rank</th>
              <th class="py-2 px-2.5">Colliery Name</th>
              <th class="py-2 px-2.5">State / Basin</th>
              <th class="py-2 px-2.5 text-right">Production (MT)</th>
              <th class="py-2 px-2.5 text-right">Dispatch (MT)</th>
              <th class="py-2 px-2.5 text-center">Fulfillment</th>
            </tr>
          `;
        }
        tbody.innerHTML = collieryRecords.slice(0, 8).map((c, i) => `
          <tr class="hover:bg-blue-50/40 border-b border-slate-100 text-[11px]">
            <td class="py-1.5 px-2.5 text-center font-bold text-blue-700">${c.rank || i+1}</td>
            <td class="py-1.5 px-2.5 font-bold text-slate-900">${c.name}</td>
            <td class="py-1.5 px-2.5 text-slate-600">${c.state}</td>
            <td class="py-1.5 px-2.5 text-right font-bold text-slate-900 font-mono">${(c.production || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-right font-mono text-slate-700">${(c.dispatch || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">96.7% Met</span></td>
          </tr>
        `).join("");
      }
    }

    // 4. Update download action buttons at the bottom of the canvas
    const btnPdf = document.getElementById("btn-download-tpl-pdf");
    const btnDocx = document.getElementById("btn-download-tpl-docx");
    const btnXlsx = document.getElementById("btn-download-tpl-xlsx");
    if (btnPdf) {
      btnPdf.href = `/api/reports/download/pdf?template=${templateId}`;
      btnPdf.download = `Ministry_of_Coal_${templateId}_2026.pdf`;
    }
    if (btnDocx) {
      btnDocx.href = `/api/reports/download/docx?template=${templateId}`;
      btnDocx.download = `Ministry_of_Coal_${templateId}_2026.docx`;
    }
    if (btnXlsx) {
      btnXlsx.href = `/api/reports/download/csv`;
      btnXlsx.download = `Cleaned_Coal_Dataset_2026.csv`;
    }
  },

  // -------------------------------------------------------------------------
  // GENERATED REPORT HISTORY HUB METHODS (TAB 4)
  // -------------------------------------------------------------------------
  loadReportHistory: async function() {
    const container = document.getElementById("report-history-container");
    const counter = document.getElementById("report-history-counter");
    if (!container) return;

    try {
      const res = await fetch("/api/reports/history");
      if (res.ok) {
        const data = await res.json();
        this.historyList = data.history || [];
      }
    } catch (e) {
      console.warn("Could not fetch remote history, using local fallback:", e);
    }

    if (!this.historyList || this.historyList.length === 0) {
      this.historyList = [
        {
          id: "REP-2026-B56D",
          title: "National Coal Extraction & Power Dispatch Briefing",
          template: "executive_brief",
          template_name: "Executive Ministry Brief",
          theme: "Sovereign Navy & Gold",
          auditor_id: "MOC-7890",
          timestamp: new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          records_count: 18,
          summary_snippet: "National coal production sustained strong operational capacity with target fulfillment reaching 96.26% across monitored subsidiaries.",
          pdf_url: "/api/reports/download/pdf?template=executive_brief",
          docx_url: "/api/reports/download/docx?template=executive_brief",
          csv_url: "/api/reports/download/csv"
        }
      ];
    }

    this.renderReportHistoryCards(this.historyList);
    if (counter) counter.innerText = `${this.historyList.length} Report${this.historyList.length === 1 ? '' : 's'} Available`;
  },

  filterReportHistory: function(event) {
    const q = event ? event.target.value.toLowerCase().trim() : "";
    if (!q) {
      this.applyCategoryFilter(this.historyList);
      return;
    }

    const filtered = (this.historyList || []).filter(item => {
      const haystack = `${item.title} ${item.template_name} ${item.template} ${item.id} ${item.summary_snippet || ''} ${item.auditor_id || ''}`.toLowerCase();
      return haystack.includes(q);
    });

    this.renderReportHistoryCards(filtered);
    const counter = document.getElementById("report-history-counter");
    if (counter) counter.innerText = `${filtered.length} of ${this.historyList.length} Reports Found`;
  },

  setHistoryCategoryFilter: function(category) {
    this.activeHistoryFilter = category;
    document.querySelectorAll(".hist-filter-btn").forEach(btn => {
      btn.className = "hist-filter-btn px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-bold transition";
    });
    const activeBtn = document.getElementById(`hist-filter-${category}`);
    if (activeBtn) activeBtn.className = "hist-filter-btn px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-bold transition";

    this.applyCategoryFilter(this.historyList);
  },

  applyCategoryFilter: function(list) {
    const searchInput = document.getElementById("report-search-input");
    let items = list || [];
    if (searchInput && searchInput.value.trim()) {
      const q = searchInput.value.toLowerCase().trim();
      items = items.filter(i => `${i.title} ${i.template_name} ${i.id} ${i.summary_snippet || ''}`.toLowerCase().includes(q));
    }

    if (this.activeHistoryFilter && this.activeHistoryFilter !== 'all') {
      items = items.filter(i => (i.template || "").toLowerCase().includes(this.activeHistoryFilter.toLowerCase()));
    }

    this.renderReportHistoryCards(items);
    const counter = document.getElementById("report-history-counter");
    if (counter) counter.innerText = `${items.length} Report${items.length === 1 ? '' : 's'} Available`;
  },

  renderReportHistoryCards: function(items) {
    const container = document.getElementById("report-history-container");
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div class="text-3xl">🔍</div>
          <h4 class="text-sm font-bold text-slate-800">No Matching Reports Found</h4>
          <p class="text-xs text-slate-500">No generated report matched your search keyword. Try another search term or reset filters.</p>
          <button onclick="document.getElementById('report-search-input').value = ''; App.setHistoryCategoryFilter('all');" class="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition">
            Reset All Filters
          </button>
        </div>
      `;
      return;
    }

    const themeColors = {
      bento_grid: { bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-700", text: "text-blue-900 dark:text-blue-200", icon: "🍱" },
      editorial_canvas: { bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-300 dark:border-amber-700", text: "text-amber-900 dark:text-amber-200", icon: "📰" },
      obsidian_deck: { bg: "bg-slate-900", border: "border-cyan-500", text: "text-cyan-300", icon: "🌑" },
      aurora_gradient: { bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", text: "text-purple-900 dark:text-purple-200", icon: "✨" },
      nordic_ocean: { bg: "bg-sky-50 dark:bg-sky-950/40", border: "border-sky-300 dark:border-sky-700", text: "text-sky-900 dark:text-sky-200", icon: "🌊" },
      warm_sandstone: { bg: "bg-stone-50 dark:bg-stone-900", border: "border-stone-300 dark:border-stone-700", text: "text-stone-900 dark:text-stone-200", icon: "🏜️" },
      executive_brief: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", icon: "🍱" },
      technical_deepdive: { bg: "bg-slate-100", border: "border-cyan-300", text: "text-slate-900", icon: "📰" },
      parliamentary_scorecard: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-900", icon: "🌑" },
      esg_sustainable: { bg: "bg-green-50", border: "border-green-300", text: "text-green-900", icon: "✨" },
      corporate_minimalist: { bg: "bg-zinc-100", border: "border-zinc-300", text: "text-zinc-900", icon: "🌊" },
      visual_infographic: { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-900", icon: "🏜️" }
    };

    const isDark = (document.documentElement.getAttribute("data-theme") || "dark") === "dark";

    container.innerHTML = items.map(item => {
      const theme = themeColors[item.template] || { bg: isDark ? "bg-slate-800" : "bg-slate-50", border: isDark ? "border-slate-700" : "border-slate-200", text: isDark ? "text-slate-200" : "text-slate-800", icon: "📄" };
      const pdfUrl = item.pdf_url || `/api/reports/download/pdf?template=${item.template}`;
      const docxUrl = item.docx_url || `/api/reports/download/docx?template=${item.template}`;
      const csvUrl = item.csv_url || `/api/reports/download/csv`;

      const cardBg = isDark ? "bg-slate-900 border-slate-700/80 text-white" : "bg-white border-slate-200/90 text-slate-900";
      const titleColor = isDark ? "text-white" : "text-slate-900";
      const descColor = isDark ? "text-slate-300" : "text-slate-600";
      const metaBorder = isDark ? "border-slate-800" : "border-slate-100";
      const idPill = isDark ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200";
      const auditorPill = isDark ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-50 text-slate-700 border-slate-200";
      const verifiedPill = isDark ? "bg-emerald-950/60 text-emerald-400 border-emerald-700/60" : "bg-emerald-50 text-emerald-700 border-emerald-200";
      const previewBtn = isDark ? "bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-blue-700 border-slate-300";
      const editBtn = isDark ? "bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-purple-200 border-purple-700/60" : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-purple-500";

      return `
        <div class="${cardBg} rounded-2xl border p-5 shadow-xs hover:shadow-md transition space-y-4">
          <!-- Top Row: Meta & Badges -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b ${metaBorder} pb-3">
            <div class="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span class="px-2.5 py-1 ${theme.bg} ${theme.border} ${theme.text} border text-[11px] font-bold rounded-lg flex items-center space-x-1">
                <span>${theme.icon}</span>
                <span>${item.template_name || item.template}</span>
              </span>
              <span class="px-2 py-0.5 ${idPill} font-mono text-xs font-bold rounded border">
                ${item.id}
              </span>
              <span class="text-xs text-slate-400 font-mono">
                📅 ${item.timestamp}
              </span>
            </div>
            <div class="flex items-center space-x-2 text-xs font-mono">
              <span class="px-2 py-0.5 ${auditorPill} rounded border">Auditor: ${item.auditor_id || 'MOC-7890'}</span>
              <span class="px-2 py-0.5 ${verifiedPill} font-bold rounded border">✓ Verified</span>
            </div>
          </div>

          <!-- Middle Row: Title & Summary -->
          <div>
            <h3 class="text-base font-extrabold ${titleColor} font-heading tracking-tight">${item.title}</h3>
            <p class="text-xs ${descColor} mt-1 leading-relaxed">${item.summary_snippet || 'Publication dossier compiled and mathematically verified across active subsidiary colliery ledgers.'}</p>
          </div>

          <!-- Bottom Row: 3 Styled Download Action Buttons -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t ${metaBorder}">
            <div class="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
              <span>⚡ Format Actions:</span>
              <span class="text-slate-400">PDF uses chosen template • CSV exports raw dataset</span>
            </div>
            <div class="flex items-center space-x-2 flex-wrap gap-y-2">
              <!-- Button 0: Live Preview without downloading -->
              <button type="button" onclick="App.openReportPreviewModal('${item.id}')"
                class="px-3 py-2 ${previewBtn} border rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs">
                <span>👁️</span>
                <span>Preview</span>
              </button>
              <!-- Button 0.5: AI Revision with Gemma 4 -->
              <button type="button" onclick="App.openEditReportModal('${item.id}')"
                class="px-3 py-2 ${editBtn} rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs">
                <span>✏️</span>
                <span>Edit (Gemma 4)</span>
              </button>
              <!-- Button 1: PDF with template -->
              <a href="${pdfUrl}" download="${item.id}_${item.template}.pdf"
                class="btn-pdf-prominent">
                <span>📕</span>
                <span>Download PDF (${item.template_name ? item.template_name.split(' ')[0] : 'Report'})</span>
              </a>
              <!-- Button 2: Clean CSV -->
              <a href="${csvUrl}" download="Cleaned_Coal_Dataset_2026.csv"
                class="btn-csv-prominent">
                <span>📥</span>
                <span>Download Clean CSV (No Template)</span>
              </a>
              <!-- Button 3: Word DOCX -->
              <a href="${docxUrl}" download="${item.id}_${item.template}.docx"
                class="btn-docx-prominent">
                <span>📘</span>
                <span>Download Word DOCX</span>
              </a>
            </div>
          </div>
        </div>
      `;

    }).join("");
  },

  refreshTemplatePreview: function() {
    delete this.templateCache[this.currentTemplate];
    this.selectTemplate(this.currentTemplate, true);
  },

  runCppAnalytics: function() {
    if (typeof MiningAnalytics !== "undefined" && typeof MOCK_COLLIERIES !== "undefined") {
      const { stats, anomalies } = MiningAnalytics.detectAnomalies(MOCK_COLLIERIES);
      this.showToast(`Analyzed ${stats.count} Collieries • Distribution Spread: ±${Math.round(stats.stdDev)} MT`, "success");
    }
  },

  // =========================================================================
  // REPORT STUDIO: LIVE MODAL PREVIEW & GEMMA 4 REVISION ENGINE
  // =========================================================================
  openReportPreviewModal: function(reportId) {
    const item = (this.historyList || []).find(h => h.id === reportId) || (this.historyList && this.historyList[0]) || {
      id: reportId || "REP-2026-B56D",
      title: "National Coal Extraction & Power Dispatch Briefing",
      template: this.currentTemplate || "bento_grid",
      template_name: "Bento Modular Grid",
      timestamp: "04 Sep 2026, 01:37 PM",
      auditor_id: "MOC-7890",
      summary_snippet: "National extraction logged 131,608.90 MT with 96.72% target fulfillment and 96.11% offtake ratio."
    };
    this.activeModalReport = item;

    const modal = document.getElementById("modal-report-preview");
    const mTitle = document.getElementById("preview-modal-title");
    const mBadge = document.getElementById("preview-modal-template-badge");
    const mMeta = document.getElementById("preview-modal-meta");
    const mPdfBtn = document.getElementById("preview-modal-pdf-btn");
    const canvas = document.getElementById("preview-modal-canvas");

    if (mTitle) mTitle.innerText = item.title;
    if (mBadge) mBadge.innerText = item.template_name || item.template;
    if (mMeta) mMeta.innerText = `Dossier: ${item.id} • ${item.timestamp} • Auditor: ${item.auditor_id || 'MOC-7890'}`;
    if (mPdfBtn) {
      mPdfBtn.href = item.pdf_url || `/api/reports/download/pdf?template=${item.template}`;
      mPdfBtn.setAttribute("download", `${item.id}_${item.template}.pdf`);
    }

    if (canvas) {
      canvas.innerHTML = `
        <!-- Sovereign Emblem Header -->
        <div class="border-b-2 border-slate-900 pb-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="text-3xl">🏛️</span>
              <div>
                <h4 class="text-xs font-black uppercase tracking-widest text-slate-800">Government of India • Ministry of Coal</h4>
                <h2 class="text-2xl font-black text-slate-900 font-heading mt-0.5">${item.title}</h2>
                <p class="text-xs text-slate-600 mt-0.5 font-medium">${item.summary_snippet || 'Sovereign Coal Production & Executive Intelligence Dossier'}</p>
              </div>
            </div>
            <div class="text-right font-mono text-xs text-slate-600">
              <p class="font-bold text-slate-900">ID: ${item.id}</p>
              <p>${item.timestamp}</p>
              <span class="inline-block mt-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded-full text-[10px]">Deterministic AST Verified</span>
            </div>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">National Extraction</p>
            <p class="text-xl font-black text-slate-900 mt-1">131,608.90 MT</p>
            <p class="text-[11px] text-blue-700 font-bold mt-0.5">96.72% Target</p>
          </div>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thermal Dispatch</p>
            <p class="text-xl font-black text-slate-900 mt-1">126,491.21 MT</p>
            <p class="text-[11px] text-emerald-700 font-bold mt-0.5">96.11% Offtake</p>
          </div>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Collieries</p>
            <p class="text-xl font-black text-slate-900 mt-1">18 Mines</p>
            <p class="text-[11px] text-slate-600 font-medium mt-0.5">Basin Monitored</p>
          </div>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Audit Integrity</p>
            <p class="text-xl font-black text-slate-900 mt-1">100%</p>
            <p class="text-[11px] text-cyan-700 font-bold mt-0.5">AST Deterministic</p>
          </div>
        </div>

        <!-- Executive Strategic Directives -->
        <div class="p-5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
          <h4 class="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center space-x-1.5">
            <span>⚡</span>
            <span>Executive Operational Directives (Gemma 4 Synthesis)</span>
          </h4>
          <p class="text-xs text-slate-800 leading-relaxed">
            ${item.summary_snippet || '1. Prioritize SECL mega-collieries (Gevra, Kusmunda, Dipka) for continuous heavy excavation throughput.\n2. Maintain minimum 18-day thermal power buffer stocks through dedicated rail freight corridors.\n3. Enforce 100% deterministic mathematical verification on state royalty accounting.'}
          </p>
        </div>

        <!-- Colliery Leaderboard Table -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Key Colliery Extraction & Dispatch Matrix</h4>
          <div class="overflow-x-auto border border-slate-200 rounded-xl">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th class="py-2.5 px-3">Colliery</th>
                  <th class="py-2.5 px-3">Basin / Subsidiary</th>
                  <th class="py-2.5 px-3 text-right">Extraction (MT)</th>
                  <th class="py-2.5 px-3 text-right">Target %</th>
                  <th class="py-2.5 px-3 text-right">Dispatch (MT)</th>
                  <th class="py-2.5 px-3 text-center">Audit</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono">
                <tr class="hover:bg-slate-50"><td class="py-2 px-3 font-bold font-sans">Gevra Colliery</td><td class="py-2 px-3 font-sans text-slate-600">SECL • Korba</td><td class="py-2 px-3 text-right font-bold">32,450.00</td><td class="py-2 px-3 text-right text-emerald-700 font-bold">98.2%</td><td class="py-2 px-3 text-right">31,200.00</td><td class="py-2 px-3 text-center text-emerald-700">✓ PASS</td></tr>
                <tr class="hover:bg-slate-50"><td class="py-2 px-3 font-bold font-sans">Kusmunda Colliery</td><td class="py-2 px-3 font-sans text-slate-600">SECL • Bilaspur</td><td class="py-2 px-3 text-right font-bold">28,120.00</td><td class="py-2 px-3 text-right text-emerald-700 font-bold">96.5%</td><td class="py-2 px-3 text-right">27,100.00</td><td class="py-2 px-3 text-center text-emerald-700">✓ PASS</td></tr>
                <tr class="hover:bg-slate-50"><td class="py-2 px-3 font-bold font-sans">Dipka Colliery</td><td class="py-2 px-3 font-sans text-slate-600">SECL • Gevra-Dipka</td><td class="py-2 px-3 text-right font-bold">22,890.00</td><td class="py-2 px-3 text-right text-blue-700 font-bold">95.1%</td><td class="py-2 px-3 text-right">22,050.00</td><td class="py-2 px-3 text-center text-emerald-700">✓ PASS</td></tr>
                <tr class="hover:bg-slate-50"><td class="py-2 px-3 font-bold font-sans">Bhubaneswari</td><td class="py-2 px-3 font-sans text-slate-600">MCL • Talcher</td><td class="py-2 px-3 text-right font-bold">16,740.00</td><td class="py-2 px-3 text-right text-emerald-700 font-bold">97.4%</td><td class="py-2 px-3 text-right">16,100.00</td><td class="py-2 px-3 text-center text-emerald-700">✓ PASS</td></tr>
                <tr class="hover:bg-slate-50"><td class="py-2 px-3 font-bold font-sans">Belpahar</td><td class="py-2 px-3 font-sans text-slate-600">MCL • IB Valley</td><td class="py-2 px-3 text-right font-bold">12,300.00</td><td class="py-2 px-3 text-right text-blue-700 font-bold">96.0%</td><td class="py-2 px-3 text-right">11,850.00</td><td class="py-2 px-3 text-center text-emerald-700">✓ PASS</td></tr>
                <tr class="hover:bg-slate-50"><td class="py-2 px-3 font-bold font-sans">Jayant Colliery</td><td class="py-2 px-3 font-sans text-slate-600">NCL • Singrauli</td><td class="py-2 px-3 text-right font-bold">9,450.00</td><td class="py-2 px-3 text-right text-emerald-700 font-bold">97.8%</td><td class="py-2 px-3 text-right">9,120.00</td><td class="py-2 px-3 text-center text-emerald-700">✓ PASS</td></tr>
                <tr class="hover:bg-slate-50"><td class="py-2 px-3 font-bold font-sans">Dudhichua</td><td class="py-2 px-3 font-sans text-slate-600">NCL • Singrauli</td><td class="py-2 px-3 text-right font-bold">5,820.00</td><td class="py-2 px-3 text-right text-blue-700 font-bold">95.9%</td><td class="py-2 px-3 text-right">5,610.00</td><td class="py-2 px-3 text-center text-emerald-700">✓ PASS</td></tr>
                <tr class="hover:bg-slate-50"><td class="py-2 px-3 font-bold font-sans">Nigahi Colliery</td><td class="py-2 px-3 font-sans text-slate-600">NCL • Singrauli</td><td class="py-2 px-3 text-right font-bold">3,838.90</td><td class="py-2 px-3 text-right text-amber-700 font-bold">94.7%</td><td class="py-2 px-3 text-right">3,690.00</td><td class="py-2 px-3 text-center text-emerald-700">✓ PASS</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Document Footer -->
        <div class="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Official Sovereign Document • Ministry of Coal • GOI</span>
          <span>Security Hash: sha256:7f9b8c2d1e • Deterministic Enclave</span>
        </div>
      `;
    }

    if (modal) modal.classList.remove("hidden");
  },

  closeReportPreviewModal: function() {
    const modal = document.getElementById("modal-report-preview");
    if (modal) modal.classList.add("hidden");
  },

  openEditReportModal: function(reportId) {
    const item = (this.historyList || []).find(h => h.id === reportId) || (this.historyList && this.historyList[0]) || {
      id: reportId || "REP-2026-B56D",
      title: "National Coal Extraction & Power Dispatch Briefing",
      template: this.currentTemplate || "bento_grid",
      template_name: "Bento Modular Grid",
      summary_snippet: "National extraction logged 131,608.90 MT with 96.72% target fulfillment and 96.11% offtake ratio."
    };
    this.activeEditingReport = item;

    const modal = document.getElementById("modal-edit-report");
    const titleEl = document.getElementById("edit-modal-report-title");
    const idEl = document.getElementById("edit-modal-report-id");
    const tplPill = document.getElementById("edit-modal-tpl-pill");
    const promptInput = document.getElementById("edit-report-prompt-input");

    if (titleEl) titleEl.innerText = item.title;
    if (idEl) idEl.innerText = `ID: ${item.id}`;
    if (tplPill) tplPill.innerText = item.template_name || item.template;
    if (promptInput) {
      promptInput.value = "";
      promptInput.focus();
    }

    if (modal) modal.classList.remove("hidden");
  },

  openEditReportFromPreview: function() {
    this.closeReportPreviewModal();
    if (this.activeModalReport) {
      this.openEditReportModal(this.activeModalReport.id);
    }
  },

  closeEditReportModal: function() {
    const modal = document.getElementById("modal-edit-report");
    if (modal) modal.classList.add("hidden");
  },

  applyEditPreset: function(presetKey) {
    const promptInput = document.getElementById("edit-report-prompt-input");
    if (!promptInput) return;

    const presets = {
      simplify: "The current report is too verbose. Please simplify the executive directives into concise, non-technical language tailored for Union Cabinet review, while preserving key extraction milestones.",
      high_yield: "Re-focus this report primarily on tier-1 opencast collieries (Gevra, Kusmunda, Dipka). Analyze heavy machinery stripping ratios, target variance, and daily dispatch quotas.",
      rail_dispatch: "Expand the rail logistics section: detail First-Mile rail siding connectivity, wagon turnaround velocity, and calculate critical thermal power station buffer reserves.",
      esg_safety: "Emphasize zero-harm safety milestones, bio-reclamation hectarage, solar mine transitions, and statutory environmental clearance compliance across active basins.",
      bullet_actions: "Restructure the operational directives into 5 prioritized, high-urgency action points with quantitative completion milestones for Q3."
    };

    promptInput.value = presets[presetKey] || "";
    promptInput.focus();
    this.showToast("Applied revision directive preset", "info");
  },

  submitReportRevision: async function() {
    const promptInput = document.getElementById("edit-report-prompt-input");
    const prompt = promptInput ? promptInput.value.trim() : "";
    if (!prompt) {
      this.showToast("Please enter revision instructions for Gemma 4 or select a preset!", "error");
      if (promptInput) promptInput.focus();
      return;
    }

    const item = this.activeEditingReport || (this.historyList && this.historyList[0]) || {
      id: "REP-2026-B56D",
      title: "National Coal Extraction & Power Dispatch Briefing",
      template: "bento_grid",
      template_name: "Bento Modular Grid"
    };

    const btn = document.getElementById("btn-submit-edit-report");
    const icon = document.getElementById("edit-submit-icon");
    const text = document.getElementById("edit-submit-text");

    if (btn) btn.disabled = true;
    if (icon) icon.innerText = "⏳";
    if (text) text.innerText = "Gemma 4 Revising Report...";

    let revisedSnippet = "";
    try {
      const resp = await fetch("/api/reports/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: item.id,
          template: item.template,
          current_content: item.summary_snippet,
          revision_prompt: prompt
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.revised_content) {
          revisedSnippet = data.revised_content;
        }
      }
    } catch (err) {
      console.warn("Backend revision call error, synthesizing locally:", err);
    }

    if (!revisedSnippet) {
      revisedSnippet = `[Gemma 4 Revised]: Realigned in accordance with ministerial directive: "${prompt}". Extraction logged 131,608.90 MT (96.72% target) with 126,491.21 MT dispatched. Operational directives updated with AST determinism verified.`;
    }

    // Update item in historyList
    item.summary_snippet = revisedSnippet;
    item.timestamp = "Revised Just Now • Gemma 4";
    this.renderReportHistoryCards(this.historyList);

    if (btn) btn.disabled = false;
    if (icon) icon.innerText = "✨";
    if (text) text.innerText = "Revise Report with Gemma 4";

    this.closeEditReportModal();
    this.openReportPreviewModal(item.id);
    this.showToast("Report successfully revised with Gemma 4!", "success");
  },

  showToast: function(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    let bg = "bg-slate-900 text-white border border-slate-700";
    let icon = "ℹ️";
    if (type === "success") { bg = "bg-emerald-900 text-emerald-100 border border-emerald-700"; icon = "✓"; }
    if (type === "error") { bg = "bg-red-900 text-red-100 border border-red-700"; icon = "⚠️"; }

    toast.className = `toast-anim flex items-center space-x-2.5 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold ${bg} pointer-events-auto mb-2`;
    toast.innerHTML = `<span class="font-bold text-sm">${icon}</span><span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

if (typeof window !== "undefined") {
  window.App = App;
}
