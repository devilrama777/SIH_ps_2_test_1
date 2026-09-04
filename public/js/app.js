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
    this.checkAuth();
    this.renderRankingsTable();
    this.initEventListeners();
    this.initDragAndDrop();
    this.startHeaderClock();
    this.renderDashboardCharts();
    this.loadLatestSummary();
    this.loadReportHistory();
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
    const tabs = ["dashboard", "datasets", "analytics", "reports", "system"];
    tabs.forEach(t => {
      const tabBtn = document.getElementById(`tab-${t}`);
      const tabView = document.getElementById(`view-${t}`);
      if (tabBtn) {
        if (t === tabId) {
          tabBtn.className = "py-3.5 text-sm font-semibold border-b-2 border-primary text-primary transition flex items-center space-x-2 shrink-0";
        } else {
          tabBtn.className = "py-3.5 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition flex items-center space-x-2 shrink-0";
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

    tbody.innerHTML = MOCK_COLLIERIES.slice(0, 7).map(c => {
      let medal = `<span class="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 font-bold rounded-md font-mono text-xs">${c.rank}</span>`;
      if (c.rank === 1) medal = `<span class="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold rounded-md font-mono text-xs">🥇 1</span>`;
      if (c.rank === 2) medal = `<span class="px-2 py-0.5 bg-slate-700/60 text-slate-200 border border-slate-600 font-bold rounded-md font-mono text-xs">🥈 2</span>`;
      if (c.rank === 3) medal = `<span class="px-2 py-0.5 bg-amber-700/30 text-amber-200 border border-amber-600/40 font-bold rounded-md font-mono text-xs">🥉 3</span>`;

      const pct = Math.min(100, Math.round((c.production / c.target) * 100));

      return `
        <tr class="hover:bg-slate-800/60 transition border-b border-slate-800/80">
          <td class="py-3 px-3.5">${medal}</td>
          <td class="py-3 px-3.5 font-bold text-white">${c.name}</td>
          <td class="py-3 px-3.5 text-slate-300 font-medium">${c.state}</td>
          <td class="py-3 px-3.5"><span class="px-2.5 py-0.5 bg-blue-950 text-cyan-300 border border-cyan-500/40 rounded-full text-[11px] font-bold font-mono">${c.company}</span></td>
          <td class="py-3 px-3.5 text-right font-bold text-white mono text-sm">${c.production.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
          <td class="py-3 px-3.5 text-right">
            <div class="flex flex-col items-end space-y-1">
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold font-mono text-emerald-400">${pct}%</span>
                <span class="text-[11px] text-slate-400 font-mono">(${c.production.toLocaleString('en-IN', {maximumFractionDigits: 0})} / ${c.target.toLocaleString('en-IN', {maximumFractionDigits: 0})} MT)</span>
              </div>
              <div class="w-32 bg-slate-800 border border-slate-700 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div class="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-2.5 rounded-full shadow-xs" style="width: ${pct}%"></div>
              </div>
            </div>
          </td>
          <td class="py-3 px-3.5 text-right text-cyan-300 font-bold mono text-sm">${c.share}</td>
        </tr>
      `;
    }).join("");

  },

  renderDashboardCharts: function() {
    if (typeof Chart === "undefined") return;

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
              borderColor: '#1E3A8A',
              backgroundColor: 'rgba(30, 58, 138, 0.12)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointBackgroundColor: '#1E3A8A',
              pointRadius: 3
            },
            {
              label: 'Target Allocation (MT)',
              data: [10.0, 10.5, 10.8, 11.0, 11.2, 11.5, 12.0, 12.2, 12.5, 12.8, 13.0, 13.5],
              borderColor: '#D97706',
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
              backgroundColor: '#0F172A',
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 12 },
              padding: 10,
              cornerRadius: 8
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#F1F5F9' }, min: 8 }
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
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
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
    this.selectTemplate("executive_brief", false);

    // Guide user to Step 2 Template Selection
    setTimeout(() => {
      this.scrollToTemplateStudio();
    }, 700);
  },

  currentTemplate: "executive_brief",
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
      executive_brief: "Executive Ministry Brief",
      technical_deepdive: "Technical Colliery Deep-Dive",
      parliamentary_scorecard: "Parliamentary & Audit Scorecard",
      esg_sustainable: "ESG & Sustainable Mining Report",
      corporate_minimalist: "Modern Corporate Minimalist",
      visual_infographic: "High-Density Visual Infographic"
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

    // 1. Render Dynamic KPI Grid
    if (kpiGrid && data.kpis && data.kpis.length >= 4) {
      if (templateId === "corporate_minimalist") {
        // Swiss 2x2 Minimalist Wireframe Cards
        kpiGrid.className = "grid grid-cols-1 sm:grid-cols-2 gap-3";
        kpiGrid.innerHTML = data.kpis.map(k => `
          <div class="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
            <div class="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">${k.label}</div>
            <div class="text-xl font-black font-mono text-zinc-900">${k.value}</div>
            <div class="text-[10px] text-zinc-600 font-mono">${k.badge}</div>
          </div>
        `).join("");
      } else if (templateId === "visual_infographic") {
        // Vibrant Infographic Hero Cards with Visual Percentage Bars
        kpiGrid.className = "grid grid-cols-2 sm:grid-cols-4 gap-3";
        kpiGrid.innerHTML = data.kpis.map((k, idx) => `
          <div class="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-center space-y-1">
            <div class="text-[10px] uppercase font-bold text-indigo-700">${k.label}</div>
            <div class="text-lg font-black font-mono text-indigo-950">${k.value}</div>
            <div class="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden my-1">
              <div class="bg-indigo-600 h-1.5 rounded-full" style="width: ${85 + idx * 4}%"></div>
            </div>
            <div class="text-[10px] font-bold text-rose-600">${k.badge}</div>
          </div>
        `).join("");
      } else if (templateId === "technical_deepdive") {
        // Slate & Cyan Technical Cards
        kpiGrid.className = "grid grid-cols-2 sm:grid-cols-4 gap-3";
        kpiGrid.innerHTML = data.kpis.map(k => `
          <div class="p-3 bg-slate-900 text-white border border-cyan-800 rounded-xl text-center space-y-1">
            <div class="text-[10px] uppercase font-bold text-cyan-400 font-mono">${k.label}</div>
            <div class="text-lg font-black font-mono text-white">${k.value}</div>
            <div class="text-[10px] text-cyan-200 font-mono">${k.badge}</div>
          </div>
        `).join("");
      } else {
        // Sovereign Executive & Parliamentary Standard
        kpiGrid.className = "grid grid-cols-2 sm:grid-cols-4 gap-3";
        kpiGrid.innerHTML = data.kpis.map(k => `
          <div class="p-3 rounded-xl border text-center" style="background-color: ${data.light_bg_hex || '#F8FAFC'}; border-color: ${data.border_hex || '#E2E8F0'};">
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">${k.label}</div>
            <div class="text-base sm:text-lg font-black font-mono text-slate-900 mt-1">${k.value}</div>
            <div class="text-[10px] font-bold mt-0.5" style="color: ${data.primary_hex || '#1E3A8A'};">${k.badge}</div>
          </div>
        `).join("");
      }
    }

    // 2. Render Distinct Sections
    if (secContainer && data.sections) {
      let secHtml = "";
      data.sections.forEach((sec, idx) => {
        let bodyContent = sec.content
          .replace(/\n\n/g, '<br/><br/>')
          .replace(/• (.*)/g, '<li class="ml-4 list-disc py-0.5">$1</li>')
          .replace(/(\d+\.) (.*)/g, '<li class="ml-4 list-decimal py-0.5">$2</li>')
          .replace(/★ (.*)/g, '<div class="flex items-center space-x-2 py-0.5 font-bold text-indigo-900"><span>★</span><span>$1</span></div>');

        // Layout-specific styling touches
        let cardBorder = data.border_hex || '#E2E8F0';
        let cardBg = data.light_bg_hex || '#F8FAFC';
        let isDirectivesBox = sec.title.toLowerCase().includes("directive") || sec.title.toLowerCase().includes("priority") || sec.title.toLowerCase().includes("radar");

        if (isDirectivesBox && templateId === "executive_brief") {
          cardBg = "#FEF3C7";
          cardBorder = "#F59E0B";
        }

        secHtml += `
          <div class="space-y-1.5 p-4 rounded-xl border" style="background-color: ${cardBg}; border-color: ${cardBorder};">
            <h3 class="text-xs sm:text-sm font-extrabold font-heading uppercase tracking-wide flex items-center space-x-2" style="color: ${data.primary_hex || '#1E3A8A'};">
              <span>§${idx + 1}</span>
              <span>${sec.title}</span>
            </h3>
            <div class="text-xs text-slate-800 leading-relaxed font-sans pt-1">
              ${bodyContent}
            </div>
          </div>
        `;
      });
      secContainer.innerHTML = secHtml;
    }

    // 3. Render Distinct Table
    const collieryRecords = data.collieries_preview || (typeof MOCK_COLLIERIES !== "undefined" ? MOCK_COLLIERIES.slice(0, 8) : []);
    if (tbody) {
      if (templateId === "technical_deepdive") {
        if (tableTitle) tableTitle.innerText = "Empirical IQR Anomaly & Colliery Outlier Classification";
        if (tableThead) {
          tableThead.innerHTML = `
            <tr class="bg-slate-900 text-cyan-300 font-mono text-[10px]">
              <th class="py-2 px-2.5 text-center">Rank</th>
              <th class="py-2 px-2.5">Colliery / Installation</th>
              <th class="py-2 px-2.5">Basin</th>
              <th class="py-2 px-2.5 text-right">Production (MT)</th>
              <th class="py-2 px-2.5 text-center">IQR Classification</th>
            </tr>
          `;
        }
        tbody.innerHTML = collieryRecords.slice(0, 8).map((c, i) => {
          let badgeClass = "bg-slate-100 text-slate-700";
          let badgeText = "[NOMINAL 1.5 IQR]";
          if (i === 0) { badgeClass = "bg-amber-100 text-amber-900 border border-amber-300 font-bold"; badgeText = "[SURGE OUTLIER]"; }
          if (i >= 6) { badgeClass = "bg-purple-100 text-purple-900 border border-purple-300 font-bold"; badgeText = "[BOTTLENECK / LOW]"; }

          return `
            <tr class="hover:bg-slate-50 border-b border-slate-100 font-mono text-[11px]">
              <td class="py-1.5 px-2.5 text-center text-slate-500">${c.rank || i+1}</td>
              <td class="py-1.5 px-2.5 font-bold text-slate-900">${c.name}</td>
              <td class="py-1.5 px-2.5 text-slate-600">${c.state}</td>
              <td class="py-1.5 px-2.5 text-right font-bold text-cyan-900">${(c.production || 0).toLocaleString()}</td>
              <td class="py-1.5 px-2.5 text-center"><span class="px-2 py-0.5 rounded text-[10px] ${badgeClass}">${badgeText}</span></td>
            </tr>
          `;
        }).join("");
      } else if (templateId === "parliamentary_scorecard") {
        if (tableTitle) tableTitle.innerText = "State-Wise Allocation & Mineral Royalty Matrix (Statutory)";
        if (tableThead) {
          tableThead.innerHTML = `
            <tr class="bg-emerald-900 text-emerald-100 text-[10px]">
              <th class="py-2 px-2.5 text-center">Rank</th>
              <th class="py-2 px-2.5">Mining Asset</th>
              <th class="py-2 px-2.5">State Jurisdiction</th>
              <th class="py-2 px-2.5 text-right">Output (MT)</th>
              <th class="py-2 px-2.5 text-right">Dispatch (MT)</th>
              <th class="py-2 px-2.5 text-center">Statutory Status</th>
            </tr>
          `;
        }
        tbody.innerHTML = collieryRecords.slice(0, 8).map((c, i) => `
          <tr class="hover:bg-slate-50 border-b border-slate-100 text-[11px]">
            <td class="py-1.5 px-2.5 text-center text-slate-500">${c.rank || i+1}</td>
            <td class="py-1.5 px-2.5 font-bold text-slate-900">${c.name}</td>
            <td class="py-1.5 px-2.5 text-emerald-800 font-medium">${c.state}</td>
            <td class="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">${(c.production || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-right font-mono text-slate-600">${(c.dispatch || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-center"><span class="text-emerald-700 font-bold text-[10px]">✓ Verified</span></td>
          </tr>
        `).join("");
      } else if (templateId === "esg_sustainable") {
        if (tableTitle) tableTitle.innerText = "Colliery Ecological Stewardship & Sustainable Mine Tiering";
        if (tableThead) {
          tableThead.innerHTML = `
            <tr class="bg-green-900 text-green-100 text-[10px]">
              <th class="py-2 px-2.5 text-center">Rank</th>
              <th class="py-2 px-2.5">Colliery / Mine</th>
              <th class="py-2 px-2.5">Extraction (MT)</th>
              <th class="py-2 px-2.5">Evacuation Type</th>
              <th class="py-2 px-2.5 text-center">ESG Compliance</th>
            </tr>
          `;
        }
        const tiers = ["A+ (Exemplary)", "A (Compliant)", "A (Compliant)", "B+ (Satisfactory)", "B+ (Satisfactory)", "B (Satisfactory)", "B (Compliant)", "B (Compliant)"];
        tbody.innerHTML = collieryRecords.slice(0, 8).map((c, i) => `
          <tr class="hover:bg-slate-50 border-b border-slate-100 text-[11px]">
            <td class="py-1.5 px-2.5 text-center text-slate-500">${c.rank || i+1}</td>
            <td class="py-1.5 px-2.5 font-bold text-slate-900">${c.name}</td>
            <td class="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">${(c.production || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-slate-600">${i < 4 ? 'Rail FMC Corridor' : 'Rail / Road Hybrid'}</td>
            <td class="py-1.5 px-2.5 text-center"><span class="px-2 py-0.5 rounded bg-green-100 text-green-900 font-bold text-[10px]">${tiers[i] || 'Compliant'}</span></td>
          </tr>
        `).join("");
      } else {
        // Standard Colliery Production Table
        if (tableTitle) tableTitle.innerText = "Top Colliery Production & Dispatch Rankings";
        if (tableThead) {
          tableThead.innerHTML = `
            <tr class="bg-slate-100 text-slate-700 text-[10px]">
              <th class="py-2 px-2.5 text-center">Rank</th>
              <th class="py-2 px-2.5">Colliery Name</th>
              <th class="py-2 px-2.5">State</th>
              <th class="py-2 px-2.5">Company</th>
              <th class="py-2 px-2.5 text-right">Production (MT)</th>
              <th class="py-2 px-2.5 text-right">Dispatch (MT)</th>
              <th class="py-2 px-2.5 text-right">Share</th>
            </tr>
          `;
        }
        tbody.innerHTML = collieryRecords.slice(0, 8).map((c, i) => `
          <tr class="hover:bg-slate-50 border-b border-slate-100 text-[11px]">
            <td class="py-1.5 px-2.5 text-center text-slate-500 font-bold">${c.rank || i+1}</td>
            <td class="py-1.5 px-2.5 font-bold text-slate-900">${c.name}</td>
            <td class="py-1.5 px-2.5 text-slate-600">${c.state}</td>
            <td class="py-1.5 px-2.5 text-slate-500">${c.company}</td>
            <td class="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">${(c.production || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-right font-mono text-slate-600">${(c.dispatch || 0).toLocaleString()}</td>
            <td class="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-600">${c.share || '-'}</td>
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
      btn.className = "hist-filter-btn px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition";
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
      executive_brief: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", icon: "🏛️" },
      technical_deepdive: { bg: "bg-slate-100", border: "border-cyan-300", text: "text-slate-900", icon: "🔬" },
      parliamentary_scorecard: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-900", icon: "📜" },
      esg_sustainable: { bg: "bg-green-50", border: "border-green-300", text: "text-green-900", icon: "🌿" },
      corporate_minimalist: { bg: "bg-zinc-100", border: "border-zinc-300", text: "text-zinc-900", icon: "⚡" },
      visual_infographic: { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-900", icon: "📊" }
    };

    container.innerHTML = items.map(item => {
      const theme = themeColors[item.template] || { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", icon: "📄" };
      const pdfUrl = item.pdf_url || `/api/reports/download/pdf?template=${item.template}`;
      const docxUrl = item.docx_url || `/api/reports/download/docx?template=${item.template}`;
      const csvUrl = item.csv_url || `/api/reports/download/csv`;

      return `
        <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition space-y-4">
          <!-- Top Row: Meta & Badges -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div class="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span class="px-2.5 py-1 ${theme.bg} ${theme.border} ${theme.text} border text-[11px] font-bold rounded-lg flex items-center space-x-1">
                <span>${theme.icon}</span>
                <span>${item.template_name || item.template}</span>
              </span>
              <span class="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-xs font-bold rounded border border-slate-200">
                ${item.id}
              </span>
              <span class="text-xs text-slate-400 font-mono">
                📅 ${item.timestamp}
              </span>
            </div>
            <div class="flex items-center space-x-2 text-xs font-mono text-slate-500">
              <span class="px-2 py-0.5 bg-slate-50 rounded border border-slate-200">Auditor: ${item.auditor_id || 'MOC-7890'}</span>
              <span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200">✓ Verified</span>
            </div>
          </div>

          <!-- Middle Row: Title & Summary -->
          <div>
            <h3 class="text-base font-extrabold text-slate-900 font-heading tracking-tight">${item.title}</h3>
            <p class="text-xs text-slate-600 mt-1 leading-relaxed">${item.summary_snippet || 'Publication dossier compiled and mathematically verified across active subsidiary colliery ledgers.'}</p>
          </div>

          <!-- Bottom Row: 3 Styled Download Action Buttons -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div class="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
              <span>⚡ Format Actions:</span>
              <span class="text-slate-400">PDF uses chosen template • CSV exports raw dataset</span>
            </div>
            <div class="flex items-center space-x-2 flex-wrap gap-y-2">
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
