document.addEventListener('DOMContentLoaded', () => {
    // --- THEME MANAGEMENT ---
    const themeSwitcher = document.getElementById('theme-switcher');
    const themeIcon = document.getElementById('theme-icon');
    const themes = ['stars', 'light', 'dark'];
    const icons = {
        stars: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
        light: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        dark: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
    };
    let currentThemeIndex = 0;

    function applyTheme(theme, isInitialLoad = false) {
        document.body.setAttribute('data-theme', theme);
        themeIcon.innerHTML = icons[theme];
        localStorage.setItem('stellarStatsTheme', theme);
        currentThemeIndex = themes.indexOf(theme);
        if (theme === 'stars' && typeof particlesJS !== 'undefined') {
            if(document.getElementById('particles-js').childElementCount === 0){
                 particlesJS("particles-js",{"particles":{"number":{"value":80,"density":{"enable":true,"value_area":800}},"color":{"value":"#ffffff"},"shape":{"type":"star"},"opacity":{"value":0.5,"random":true,"anim":{"enable":true,"speed":1,"opacity_min":0.1}},"size":{"value":3,"random":true},"move":{"enable":true,"speed":0.5,"direction":"none","random":true,"out_mode":"out"}}});
            }
        }
        if (!isInitialLoad) {
            render(); 
        }
    }

    themeSwitcher.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        applyTheme(themes[currentThemeIndex]);
    });

    // --- APP LOGIC ---
    const mainContent = document.getElementById('main-content');
    const mainNav = document.getElementById('main-nav');
    const modals = { category: document.getElementById('add-category-modal'), submetric: document.getElementById('submetric-modal'), data: document.getElementById('manage-data-modal'), confirm: document.getElementById('confirm-modal') };
    let state = { data: {}, currentCategory: null, activeCharts: new Map() };
    const colorPalette = ['#00BFFF', '#FF00C1', '#9D00FF', '#feca57', '#48dbfb', '#ff6b6b', '#1dd1a1'];

    function loadData() {
        try {
            const savedData = localStorage.getItem('stellarStatsData');
            if (savedData) {
                state.data = JSON.parse(savedData);
                Object.values(state.data).forEach(category => {
                    Object.entries(category).forEach(([name, submetric], index) => {
                        if (!submetric.color) { submetric.color = colorPalette[index % colorPalette.length]; }
                    });
                });
            } else {
                state.data = { "สุขภาพ": { "พลังงาน": { type: 'score', color: '#00BFFF', entries: [{date: '2025-08-05', value: 6}, {date: '2025-08-06', value: 8}] }, "การนอน": { type: 'score', color: '#FF00C1', entries: [{date: '2025-08-05', value: 7}, {date: '2025-08-06', value: 5}] }, "น้ำหนัก (กก.)": { type: 'value', color: '#9D00FF', entries: [{date: '2025-08-05', value: 75.5}, {date: '2025-08-06', value: 75.2}]} }, "อารมณ์": { "ความสุข": { type: 'score', color: '#feca57', entries: [{date: '2025-08-06', value: 7}]} } };
                saveData();
            }
            const categories = Object.keys(state.data);
            state.currentCategory = categories.length > 0 ? categories[0] : null;
        } catch (error) {
            console.error("Failed to load or parse data:", error);
            state.data = {}; state.currentCategory = null; saveData();
        }
    }
    function saveData() { localStorage.setItem('stellarStatsData', JSON.stringify(state.data)); }
    function render() {
        if (!state.currentCategory && Object.keys(state.data).length > 0) {
            state.currentCategory = Object.keys(state.data)[0];
        }
        destroyAllCharts(); 
        renderNav(); 
        renderCategoryView(); 
    }
    function destroyAllCharts() { state.activeCharts.forEach(chart => chart.destroy()); state.activeCharts.clear(); }

    function renderNav() {
        mainNav.innerHTML = '';
        const categories = Object.keys(state.data);
        if (categories.length === 0) mainNav.innerHTML = `<span style="color: var(--text-secondary);">เริ่มโดยการเพิ่มหมวดหมู่</span>`;
        categories.forEach(category => {
            const link = document.createElement('a');
            link.href = '#'; link.textContent = category; link.dataset.category = category;
            if (category === state.currentCategory) link.classList.add('active');
            link.addEventListener('click', e => { e.preventDefault(); state.currentCategory = category; render(); });
            mainNav.appendChild(link);
        });
    }

    function renderCategoryView() {
        mainContent.innerHTML = '';
        if (!state.currentCategory) { mainContent.innerHTML = `<div class="category-header"><h2>ยินดีต้อนรับ!</h2></div><p>กรุณาเพิ่มหมวดหมู่เพื่อเริ่มต้นบันทึกสถิติของคุณ</p>`; return; }
        const categoryData = state.data[state.currentCategory] || {};
        const header = document.createElement('div'); header.className = 'category-header'; header.innerHTML = `<h2>${state.currentCategory}</h2>`;
        const categoryActions = document.createElement('div'); categoryActions.className = 'category-actions';
        const addSubmetricBtn = document.createElement('button'); addSubmetricBtn.textContent = '＋ เพิ่มกราฟย่อย';
        addSubmetricBtn.addEventListener('click', () => openSubmetricModal());
        const deleteCategoryBtn = document.createElement('button'); deleteCategoryBtn.textContent = 'ลบหมวดหมู่นี้'; deleteCategoryBtn.className = 'danger-btn';
        deleteCategoryBtn.addEventListener('click', handleDeleteCategory);
        categoryActions.appendChild(addSubmetricBtn); categoryActions.appendChild(deleteCategoryBtn);
        header.appendChild(categoryActions); mainContent.appendChild(header);
        renderAggregateChart(categoryData);
        const grid = document.createElement('div'); grid.className = 'submetrics-grid';
        if (Object.keys(categoryData).length === 0) grid.innerHTML = `<p>ยังไม่มีกราฟย่อยในหมวดนี้</p>`;
        else { Object.entries(categoryData).forEach(([name, data]) => { const card = createSubmetricCard(name, data); grid.appendChild(card); const canvas = card.querySelector('canvas'); if (canvas && data.entries && data.entries.length > 0) renderSubmetricChart(canvas, name, data); }); }
        mainContent.appendChild(grid);
    }

    function createSubmetricCard(name, data) {
        const card = document.createElement('div'); card.className = 'submetric-card';
        const entries = data.entries || [];
        const latestEntry = entries.length > 0 ? [...entries].sort((a,b) => new Date(b.date) - new Date(a.date))[0] : null;
        const average = entries.length > 0 ? (entries.reduce((sum, entry) => sum + entry.value, 0) / entries.length).toFixed(1) : 'N/A';
        const canvasId = `chart-${state.currentCategory}-${name}`.replace(/\s+/g, '-');
        card.innerHTML = `
            <div class="card-header">
                <h3>${name} <span class="metric-type">${data.type === 'score' ? '0-10' : 'ค่า'}</span></h3>
                <button class="icon-btn edit-submetric-btn" title="แก้ไขกราฟย่อย"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
            </div>
            <div class="card-stats">ค่าเฉลี่ย: <strong>${average}</strong> | ล่าสุด: <strong>${latestEntry ? latestEntry.value : 'N/A'}</strong></div>
            <div class="chart-container-small" style="flex-grow: 1; position: relative;"><canvas id="${canvasId}"></canvas></div>
            <div class="card-actions"><button class="manage-data-btn">จัดการข้อมูล</button><button class="danger-btn">ลบ</button></div>`;
        card.querySelector('.manage-data-btn').addEventListener('click', () => openManageDataModal(name));
        card.querySelector('.danger-btn').addEventListener('click', () => { showConfirmationModal(`คุณแน่ใจหรือไม่ว่าต้องการลบกราฟย่อย "${name}"?`, () => { delete state.data[state.currentCategory][name]; saveData(); render(); }); });
        card.querySelector('.edit-submetric-btn').addEventListener('click', () => openSubmetricModal(name, data));
        return card;
    }

    function createChart(canvas, type, data, options) { if (!canvas) return; if (state.activeCharts.has(canvas.id)) state.activeCharts.get(canvas.id).destroy(); const chart = new Chart(canvas, { type, data, options }); state.activeCharts.set(canvas.id, chart); }
    
    function renderAggregateChart(categoryData) {
        const container = document.createElement('div'); container.className = 'chart-container';
        container.innerHTML = `<h3>ภาพรวมรายวัน (กราฟแท่ง)</h3><div style="position: relative; height: 250px;"><canvas id="aggregate-chart"></canvas></div>`;
        mainContent.appendChild(container);
        const canvas = document.getElementById('aggregate-chart');
        const scoreEntries = Object.values(categoryData).filter(sub => sub.type === 'score').flatMap(sub => sub.entries || []);
        if (scoreEntries.length === 0) { container.innerHTML += `<p style="text-align: center; color: var(--text-secondary); padding-top: 1rem;">ไม่มีข้อมูลประเภท "คะแนน" ให้แสดงผลรวม</p>`; return; }
        const dailyAverages = scoreEntries.reduce((acc, entry) => { acc[entry.date] = acc[entry.date] || { sum: 0, count: 0 }; acc[entry.date].sum += entry.value; acc[entry.date].count++; return acc; }, {});
        const sortedDates = Object.keys(dailyAverages).sort((a, b) => new Date(a) - new Date(b));
        
        const backgroundColors = sortedDates.map((_, index) => `${colorPalette[index % colorPalette.length]}33`);
        const borderColors = sortedDates.map((_, index) => colorPalette[index % colorPalette.length]);

        const chartData = {
            labels: sortedDates.map(date => new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })),
            datasets: [{ label: `ค่าเฉลี่ยรวม`, data: sortedDates.map(date => dailyAverages[date].sum / dailyAverages[date].count), backgroundColor: backgroundColors, borderColor: borderColors, borderWidth: 1, borderRadius: 5, hoverBackgroundColor: borderColors }]
        };
        const options = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 10, ticks: { color: 'var(--text-secondary)' }, grid: { color: 'rgba(128, 128, 128, 0.15)' } }, x: { ticks: { color: 'var(--text-secondary)' }, grid: { color: 'rgba(128, 128, 128, 0.15)' } } }, plugins: { legend: { display: false } } };
        createChart(canvas, 'bar', chartData, options);
    }
    
    function renderSubmetricChart(canvas, name, data) {
        const sortedEntries = [...data.entries].sort((a, b) => new Date(a.date) - new Date(b.date));
        const color = data.color || '#00BFFF';
        const chartData = { labels: sortedEntries.map(e => new Date(e.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })), datasets: [{ label: name, data: sortedEntries.map(e => e.value), borderColor: color, backgroundColor: `${color}33`, tension: 0.4, fill: true, pointRadius: 3 }] };
        const options = { responsive: true, maintainAspectRatio: false, scales: { y: { display: false, beginAtZero: true }, x: { display: false } }, plugins: { legend: { display: false } } };
        if (data.type === 'score') { options.scales.y.max = 10; options.scales.y.min = 0; }
        createChart(canvas, 'line', chartData, options);
    }
    
    function handleDeleteCategory() { showConfirmationModal(`คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${state.currentCategory}" ทั้งหมด?`, () => { delete state.data[state.currentCategory]; state.currentCategory = Object.keys(state.data)[0] || null; saveData(); render(); }); }
    
    function openSubmetricModal(name = null, data = null) {
        const modal = modals.submetric;
        modal.dataset.originalName = name || '';
        const isEditing = name !== null;
        modal.querySelector('#submetric-modal-title').textContent = isEditing ? 'แก้ไขกราฟย่อย' : 'เพิ่มกราฟย่อยใหม่';
        modal.querySelector('#submetric-name').value = isEditing ? name : '';
        modal.querySelector('#submetric-type-select').value = isEditing ? data.type : 'score';
        const palette = modal.querySelector('#color-palette');
        palette.innerHTML = '';
        let selectedColor = isEditing ? data.color : colorPalette[0];
        palette.dataset.selectedColor = selectedColor;
        colorPalette.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;
            if (color === selectedColor) { swatch.classList.add('selected'); }
            swatch.addEventListener('click', () => {
                palette.querySelector('.selected')?.classList.remove('selected');
                swatch.classList.add('selected');
                palette.dataset.selectedColor = color;
            });
            palette.appendChild(swatch);
        });
        openModal(modal);
    }
    
    function openManageDataModal(submetricName) {
        const modal = modals.data; const submetric = state.data[state.currentCategory][submetricName];
        modal.dataset.currentSubmetric = submetricName;
        modal.querySelector('#manage-data-modal-title').textContent = `จัดการข้อมูล`;
        modal.querySelector('#manage-data-modal-subtitle').textContent = `สำหรับ: ${submetricName}`;
        const scoreInput = modal.querySelector('#data-score'); const scoreLabel = modal.querySelector('#data-score-label');
        if (submetric.type === 'score') { scoreLabel.textContent = "คะแนน (0-10):"; scoreInput.min = 0; scoreInput.max = 10; scoreInput.step = 1; }
        else { scoreLabel.textContent = "ค่า:"; scoreInput.removeAttribute('min'); scoreInput.removeAttribute('max'); scoreInput.step = 'any'; }
        renderDataEntriesList(submetricName); resetDataForm(); openModal(modal);
    }
    
    function renderDataEntriesList(submetricName) {
        const listEl = document.getElementById('data-entries-list'); listEl.innerHTML = ''; const entries = state.data[state.currentCategory][submetricName].entries || [];
        if(entries.length === 0) { listEl.innerHTML = `<li>ไม่มีข้อมูล</li>`; return; }
        [...entries].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(entry => {
            const item = document.createElement('li'); item.className = 'entry-item';
            item.innerHTML = `<div class="info"><span class="date">${new Date(entry.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div><div class="info"><span class="score">${entry.value}</span></div><div class="actions"><button class="edit-btn">แก้ไข</button><button class="danger-btn">ลบ</button></div>`;
            item.querySelector('.edit-btn').addEventListener('click', () => populateDataFormForEdit(entry));
            item.querySelector('.danger-btn').addEventListener('click', () => { showConfirmationModal(`ลบข้อมูลวันที่ ${new Date(entry.date).toLocaleDateString('th-TH')}?`, () => deleteDataPoint(submetricName, entry.date)); });
            listEl.appendChild(item);
        });
    }
    function resetDataForm() { const form = document.getElementById('manage-data-form'); form.querySelector('#data-date').valueAsDate = new Date(); form.querySelector('#data-date').readOnly = false; form.querySelector('#data-score').value = state.data[state.currentCategory][modals.data.dataset.currentSubmetric].type === 'score' ? 5 : ''; form.querySelector('#confirm-manage-data').textContent = "＋ เพิ่มข้อมูลใหม่"; }
    function populateDataFormForEdit(entry) { const form = document.getElementById('manage-data-form'); form.querySelector('#data-date').value = entry.date; form.querySelector('#data-date').readOnly = true; form.querySelector('#data-score').value = entry.value; form.querySelector('#confirm-manage-data').textContent = "✓ อัปเดตข้อมูล"; }
    function deleteDataPoint(submetricName, date) { const entries = state.data[state.currentCategory][submetricName].entries; const index = entries.findIndex(e => e.date === date); if(index > -1) entries.splice(index, 1); saveData(); renderDataEntriesList(submetricName); }
    document.getElementById('confirm-manage-data').addEventListener('click', () => {
        const modal = modals.data; const submetricName = modal.dataset.currentSubmetric; const dateInput = modal.querySelector('#data-date'); const date = dateInput.value; const scoreInput = modal.querySelector('#data-score'); let score = parseFloat(scoreInput.value);
        if (!date || isNaN(score)) { alert('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
        const submetricType = state.data[state.currentCategory][submetricName].type;
        if (submetricType === 'score') { if (score < 0) score = 0; if (score > 10) score = 10; }
        const entries = state.data[state.currentCategory][submetricName].entries; const existingIndex = entries.findIndex(e => e.date === date);
        if (dateInput.readOnly) { if(existingIndex > -1) entries[existingIndex].value = score; }
        else { if(existingIndex > -1) { alert('มีข้อมูลสำหรับวันนี้อยู่แล้ว กรุณาใช้ปุ่ม "แก้ไข"'); return; } entries.push({ date, value: score }); }
        saveData(); renderDataEntriesList(submetricName); resetDataForm();
    });
    function openModal(modal) { modal.classList.add('show'); const input = modal.querySelector('input[type="text"]'); if (input) { input.focus(); } }
    function closeModal(modal) { modal.classList.remove('show'); if (modal.id !== 'confirm-modal') render(); }
    function showConfirmationModal(message, onConfirm) {
        const modal = modals.confirm; modal.querySelector('#confirm-modal-message').textContent = message;
        const confirmBtn = modal.querySelector('#confirm-modal-confirm-btn'); const cancelBtn = modal.querySelector('#confirm-modal-cancel-btn');
        const confirmHandler = () => { onConfirm(); closeModal(modal); }; const cancelHandler = () => closeModal(modal);
        confirmBtn.addEventListener('click', confirmHandler, { once: true }); cancelBtn.addEventListener('click', cancelHandler, { once: true });
        openModal(modal);
    }
    document.querySelectorAll('.modal').forEach(modal => { const closeBtn = modal.querySelector('.close-button'); if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal)); modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); }); });
    document.getElementById('add-category-btn').addEventListener('click', () => openModal(modals.category));
    document.getElementById('confirm-add-category').addEventListener('click', () => { const input = document.getElementById('new-category-name'); const newName = input.value.trim(); if (newName && !state.data[newName]) { state.data[newName] = {}; state.currentCategory = newName; saveData(); closeModal(modals.category); render(); } else { alert(newName ? 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' : 'กรุณาใส่ชื่อหมวดหมู่'); } });
    document.getElementById('confirm-submetric').addEventListener('click', () => {
        const modal = modals.submetric;
        const originalName = modal.dataset.originalName;
        const newName = modal.querySelector('#submetric-name').value.trim();
        const type = modal.querySelector('#submetric-type-select').value;
        const color = modal.querySelector('#color-palette').dataset.selectedColor;
        if (!newName) { alert('กรุณาใส่ชื่อกราฟย่อย'); return; }
        const currentSubmetrics = state.data[state.currentCategory];
        if (newName !== originalName && currentSubmetrics[newName]) { alert('ชื่อกราฟย่อยนี้มีอยู่แล้ว'); return; }
        if (originalName && newName !== originalName) {
            const dataToMove = currentSubmetrics[originalName];
            delete currentSubmetrics[originalName];
            currentSubmetrics[newName] = dataToMove;
        }
        if (!currentSubmetrics[newName]) {
            currentSubmetrics[newName] = { entries: [] };
        }
        currentSubmetrics[newName].type = type;
        currentSubmetrics[newName].color = color;
        saveData();
        closeModal(modal);
    });
    function exportToFile(filename, content, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
    document.getElementById('export-json').addEventListener('click', () => exportToFile('stellar_stats.json', JSON.stringify(state.data, null, 2), 'application/json'));
    document.getElementById('export-csv').addEventListener('click', () => { let csv = "Category,SubMetric,Type,Date,Value\n"; for (const cat in state.data) { for (const sub in state.data[cat]) { (state.data[cat][sub].entries || []).forEach(e => { csv += `${cat},${sub},${state.data[cat][sub].type},${e.date},${e.value}\n`; }); } } exportToFile('stellar_stats.csv', "\uFEFF" + csv, 'text/csv;charset=utf-8;'); });
    
    // --- INITIALIZATION (FIXED) ---
    function initializeApp() {
        const savedTheme = localStorage.getItem('stellarStatsTheme') || 'stars';
        document.body.setAttribute('data-theme', savedTheme);
        themeIcon.innerHTML = icons[savedTheme];
        currentThemeIndex = themes.indexOf(savedTheme);
        if (savedTheme === 'stars' && typeof particlesJS !== 'undefined') {
            particlesJS("particles-js",{"particles":{"number":{"value":80,"density":{"enable":true,"value_area":800}},"color":{"value":"#ffffff"},"shape":{"type":"star"},"opacity":{"value":0.5,"random":true,"anim":{"enable":true,"speed":1,"opacity_min":0.1}},"size":{"value":3,"random":true},"move":{"enable":true,"speed":0.5,"direction":"none","random":true,"out_mode":"out"}}});
        }
        
        loadData();
        render();
    }

    initializeApp();
});
</script>
