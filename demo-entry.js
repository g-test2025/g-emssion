(function () {
  var storageKey = 'esg-carbon-report-assistant-demo-activities-v1';
  var companyStorageKey = 'esg-carbon-report-assistant-demo-company-v1';
  var seedCount = Array.isArray(window.activities) ? window.activities.length : 0;
  var company = {
    name: 'Demo Company Co., Ltd.',
    reportingYear: '2026',
    baseYear: '2024',
    owner: 'ESG Manager',
    note: 'Demo workspace for GitHub Pages'
  };

  function txt(th, en) {
    return window.state && window.state.lang === 'th' ? th : en;
  }

  function safe(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function saveCompany() {
    window.localStorage.setItem(companyStorageKey, JSON.stringify(company));
  }

  function loadCompany() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(companyStorageKey) || 'null');
      if (saved && typeof saved === 'object') company = Object.assign(company, saved);
    } catch (_error) {
      window.localStorage.removeItem(companyStorageKey);
    }
  }

  function saveCustomActivities() {
    window.localStorage.setItem(storageKey, JSON.stringify(window.activities.slice(seedCount)));
  }

  function loadCustomActivities() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(saved)) return;
      saved.forEach(function (activity) {
        if (activity && activity.factorId && Number(activity.qty) > 0) window.activities.push(activity);
      });
    } catch (_error) {
      window.localStorage.removeItem(storageKey);
    }
  }

  function projectPayload() {
    return {
      app: 'G-Emission ESG Carbon Report Assistant',
      format: 'github-pages-demo-workspace',
      version: 1,
      exportedAt: new Date().toISOString(),
      company: company,
      customActivities: window.activities.slice(seedCount)
    };
  }

  function downloadProjectFile() {
    var blob = new Blob([JSON.stringify(projectPayload(), null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var filename = 'esg-carbon-demo-' + (company.name || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.json';
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function importProjectFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var payload = JSON.parse(String(reader.result || '{}'));
        if (!payload || !Array.isArray(payload.customActivities)) throw new Error('Invalid demo workspace file');
        company = Object.assign(company, payload.company || {});
        window.activities.splice(seedCount);
        payload.customActivities.forEach(function (activity) {
          if (activity && activity.factorId && Number(activity.qty) > 0) window.activities.push(activity);
        });
        saveCompany();
        saveCustomActivities();
        window.renderAll();
      } catch (error) {
        window.alert(txt('ไฟล์ไม่ถูกต้องหรืออ่านไม่ได้', 'Invalid or unreadable file'));
      }
    };
    reader.readAsText(file);
  }

  function renderCompanyPanel() {
    var mount = document.getElementById('demoCompanyMount');
    if (!mount) return;

    mount.innerHTML =
      '<section class="panel demo-entry company-panel">' +
        '<div class="demo-entry-head">' +
          '<div>' +
            '<h3>' + txt('ข้อมูลบริษัท Demo', 'Demo Company Workspace') + '</h3>' +
            '<p>' + txt('สร้างบริษัทใหม่ คีย์กิจกรรม แล้ว export เป็นไฟล์ JSON เพื่อไป import ทำต่อบนเครื่องอื่นได้', 'Create a company workspace, enter activities, export JSON, and import it on another computer.') + '</p>' +
          '</div>' +
          '<div class="company-actions">' +
            '<button id="exportDemoProject" class="primary-button" type="button">' + txt('Export ไฟล์', 'Export file') + '</button>' +
            '<button id="importDemoProjectButton" class="ghost-button" type="button">' + txt('Import ไฟล์', 'Import file') + '</button>' +
            '<input id="importDemoProject" type="file" accept="application/json,.json" hidden>' +
          '</div>' +
        '</div>' +
        '<form id="demoCompanyForm" class="demo-form company-form">' +
          '<label>' + txt('ชื่อบริษัท', 'Company name') + '<input name="name" required value="' + safe(company.name) + '"></label>' +
          '<label>' + txt('ปีรายงาน', 'Reporting year') + '<input name="reportingYear" required value="' + safe(company.reportingYear) + '"></label>' +
          '<label>' + txt('ปีฐาน', 'Base year') + '<input name="baseYear" value="' + safe(company.baseYear) + '"></label>' +
          '<label>' + txt('ผู้รับผิดชอบ', 'Owner') + '<input name="owner" value="' + safe(company.owner) + '"></label>' +
          '<label class="wide-field">' + txt('หมายเหตุ', 'Note') + '<input name="note" value="' + safe(company.note) + '"></label>' +
          '<div class="demo-actions"><strong>' + safe(company.name) + ' / FY' + safe(company.reportingYear) + '</strong><button class="primary-button" type="submit">' + txt('บันทึกบริษัท', 'Save company') + '</button></div>' +
        '</form>' +
      '</section>';

    document.getElementById('demoCompanyForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var form = event.currentTarget;
      company = {
        name: form.name.value,
        reportingYear: form.reportingYear.value,
        baseYear: form.baseYear.value,
        owner: form.owner.value,
        note: form.note.value
      };
      saveCompany();
      renderCompanyPanel();
    });

    document.getElementById('exportDemoProject').addEventListener('click', downloadProjectFile);
    document.getElementById('importDemoProjectButton').addEventListener('click', function () {
      document.getElementById('importDemoProject').click();
    });
    document.getElementById('importDemoProject').addEventListener('change', function (event) {
      var file = event.target.files && event.target.files[0];
      if (file) importProjectFile(file);
      event.target.value = '';
    });
  }

  function renderActivityRowsWithActions() {
    var body = document.getElementById('activityRows');
    if (!body) return;

    body.innerHTML = window.activities.map(function (activity, index) {
      var factor = window.F(activity.factorId);
      var isCustom = index >= seedCount;
      var activityName = window.L(activity.th, activity.en);
      var siteName = window.L(activity.siteTh, activity.siteEn);
      var actionCell = isCustom
        ? '<button class="text-button danger" type="button" data-delete-demo="' + index + '">' + txt('ลบ', 'Delete') + '</button>'
        : '';

      return '<tr>' +
        '<td>' + safe(activityName) + (isCustom ? ' <span class="demo-chip">' + txt('ข้อมูลที่คีย์เอง', 'Custom') + '</span>' : '') + '</td>' +
        '<td>' + safe(siteName) + '</td>' +
        '<td>' + safe(activity.scope) + '</td>' +
        '<td>' + window.N(activity.qty, 0) + ' ' + safe(activity.unit) + '</td>' +
        '<td>' + factor.factor + ' ' + safe(factor.unit) + '</td>' +
        '<td><strong>' + window.N(window.E(activity)) + '</strong></td>' +
        '<td>' + window.tag(activity.evidence) + '</td>' +
        '<td>' + actionCell + '</td>' +
      '</tr>';
    }).join('');

    document.querySelectorAll('[data-delete-demo]').forEach(function (button) {
      button.addEventListener('click', function () {
        window.activities.splice(Number(button.dataset.deleteDemo), 1);
        saveCustomActivities();
        window.renderAll();
        renderDemoEntry();
      });
    });
  }

  function renderDemoEntry() {
    var mount = document.getElementById('demoEntryMount');
    if (!mount) return;

    var factorOptions = window.factors.map(function (factor) {
      return '<option value="' + safe(factor.id) + '">' +
        safe(window.L(factor.th, factor.en)) + ' - ' + factor.factor + ' ' + safe(factor.unit) +
      '</option>';
    }).join('');

    mount.innerHTML =
      '<section class="panel demo-entry">' +
        '<div class="demo-entry-head">' +
          '<div>' +
            '<h3>' + txt('เพิ่มข้อมูลกิจกรรมแบบ Demo', 'Add Demo Activity Record') + '</h3>' +
            '<p>' + txt('บันทึกใน browser นี้ด้วย localStorage เพื่อสาธิตการคีย์ข้อมูลบน GitHub Pages ข้อมูลนี้ยังไม่ใช่ฐานข้อมูลกลาง', 'Saved only in this browser with localStorage for GitHub Pages demo. This is not a shared database.') + '</p>' +
          '</div>' +
          '<button id="resetDemoData" class="ghost-button" type="button">' + txt('ล้างข้อมูลที่คีย์เอง', 'Reset custom data') + '</button>' +
        '</div>' +
        '<form id="demoActivityForm" class="demo-form">' +
          '<label>' + txt('กิจกรรม', 'Activity') + '<input name="activity" required placeholder="' + txt('เช่น ไฟฟ้าที่ซื้อ', 'e.g. Purchased electricity') + '"></label>' +
          '<label>' + txt('สถานที่', 'Site') + '<input name="site" required placeholder="' + txt('เช่น โรงงานระยอง', 'e.g. Rayong Plant') + '"></label>' +
          '<label>Scope<select name="scope"><option>Scope 1</option><option>Scope 2</option><option>Scope 3</option></select></label>' +
          '<label>' + txt('ปริมาณ', 'Quantity') + '<input name="qty" required type="number" min="0" step="0.001"></label>' +
          '<label>' + txt('หน่วย', 'Unit') + '<input name="unit" required placeholder="kWh, L, kg, km"></label>' +
          '<label>Emission Factor<select name="factorId">' + factorOptions + '</select></label>' +
          '<label>' + txt('หลักฐาน', 'Evidence') + '<select name="evidence"><option value="ready">' + txt('ครบ', 'Ready') + '</option><option value="review">' + txt('รอตรวจ', 'Review') + '</option><option value="missing">' + txt('ขาด', 'Missing') + '</option></select></label>' +
          '<div class="demo-actions"><strong id="demoPreview">0.0 tCO2e</strong><button class="primary-button" type="submit">' + txt('บันทึก Demo', 'Save demo record') + '</button></div>' +
        '</form>' +
      '</section>';

    var form = document.getElementById('demoActivityForm');
    var previewNode = document.getElementById('demoPreview');

    function preview() {
      var quantity = Number(form.qty.value || 0);
      var factor = window.F(form.factorId.value);
      previewNode.textContent = window.N(factor ? quantity * factor.factor / 1000 : 0) + ' tCO2e';
    }

    form.qty.addEventListener('input', preview);
    form.factorId.addEventListener('change', preview);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var factor = window.F(form.factorId.value);
      window.activities.push({
        th: form.activity.value,
        en: form.activity.value,
        siteTh: form.site.value,
        siteEn: form.site.value,
        scope: form.scope.value,
        qty: Number(form.qty.value),
        unit: form.unit.value || factor.unit.replace('kgCO2e/', ''),
        factorId: form.factorId.value,
        evidence: form.evidence.value
      });
      saveCustomActivities();
      form.reset();
      preview();
      window.renderAll();
      renderDemoEntry();
    });

    document.getElementById('resetDemoData').addEventListener('click', function () {
      window.localStorage.removeItem(storageKey);
      window.activities.splice(seedCount);
      window.renderAll();
      renderDemoEntry();
    });

    preview();
  }

  function install() {
    loadCompany();
    loadCustomActivities();
    window.renderActivity = renderActivityRowsWithActions;
    var oldRenderAll = window.renderAll;
    window.renderAll = function () {
      oldRenderAll();
      renderCompanyPanel();
      renderDemoEntry();
    };
    window.renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();
