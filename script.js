document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let appData = {
        categories: [],
        settings: {
            theme: 'theme-stars'
        },
        ui: {
            activeCategoryId: null
        }
    };
    let chartInstances = {};

    const PRESET_COLORS = [
        { name: 'สีน้ำเงิน', value: '#5470c6' }, { name: 'สีเขียว', value: '#91cc75' },
        { name: 'สีเหลือง', value: '#fac858' }, { name: 'สีแดง', value: '#ee6666' },
        { name: 'สีฟ้า', value: '#73c0de' }, { name: 'สีส้ม', value: '#fc8452' },
        { name: 'สีม่วง', value: '#9a60b4' }, { name: 'สีเขียวเข้ม', value: '#3ba272' }
    ];

    // --- DOM ELEMENTS ---
    const contentContainer = document.getElementById('content-container');
    const categoryList = document.getElementById('category-list');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const newCategoryNameInput = document.getElementById('new-category-name');
    const themeSelect = document.getElementById('theme-select');
    const mainTitle = document.getElementById('main-title');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    // --- DATA PERSISTENCE ---
    const saveData = () => localStorage.setItem('personalStatsAppModern', JSON.stringify(appData));
    const loadData = () => {
        const savedData = localStorage.getItem('personalStatsAppModern');
        if (savedData) {
            appData = JSON.parse(savedData);
            // --- Data Migration for older versions ---
            appData.categories.forEach(cat => {
                cat.graphs.forEach(graph => {
                    graph.data.forEach((d, index) => {
                        if (!d.id) {
                            d.id = `data-${Date.now()}-${index}`;
                        }
                    });
                });
            });
            if (!appData.ui) appData.ui = { activeCategoryId: null };
        } else {
            // Default data for new users
            appData.categories = [{
                id: 'cat-1', name: 'สุขภาพ',
                graphs: [
                    { id: 'graph-1', name: 'คุณภาพการนอน', type: 'scale', color: '#5470c6', data: [{id: 'd-1', date: '2025-08-01', value: 7}, {id: 'd-2', date: '2025-08-02', value: 8}, {id: 'd-3', date: '2025-08-03', value: 6.5}] },
                    { id: 'graph-2', name: 'ระดับความเครียด', type: 'scale', color: '#ee6666', data: [{id: 'd-4', date: '2025-08-01', value: 4}, {id: 'd-5', date: '2025-08-02', value: 3}, {id: 'd-6', date: '2025-08-03', value: 5}] }
                ]
            }];
        }
        if (!appData.ui.activeCategoryId && appData.categories.length > 0) {
            appData.ui.activeCategoryId = appData.categories[0].id;
        }
    };

    // --- RENDERING ENGINE ---
    const render = () => {
        applyTheme();
        renderNavigation();
        renderContent();
    };

    const renderNavigation = () => {
        categoryList.innerHTML = '';
        appData.categories.forEach(category => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'category-link';
            a.textContent = category.name;
            a.onclick = () => {
                appData.ui.activeCategoryId = category.id;
                if (window.innerWidth <= 768) sidebar.classList.remove('open');
                render();
            };
            if (category.id === appData.ui.activeCategoryId) {
                a.classList.add('active');
            }
            li.appendChild(a);
            categoryList.appendChild(li);
        });
    };

    const renderContent = () => {
        destroyAllCharts();
        const activeCategory = appData.categories.find(c => c.id === appData.ui.activeCategoryId);

        if (activeCategory) {
            mainTitle.textContent = activeCategory.name;
            contentContainer.innerHTML = `
                <div class="page-header">
                    <h2>ภาพรวม: ${activeCategory.name}</h2>
                    <div>
                        <button onclick="window.openAddGraphModal('${activeCategory.id}')">เพิ่มกราฟย่อย</button>
                        <button class="btn-danger" onclick="window.confirmDelete('category', '${activeCategory.id}')">ลบหมวดหมู่นี้</button>
                    </div>
                </div>
                <div class="card">
                    <canvas id="main-category-chart"></canvas>
                </div>
                <div class="graphs-grid">
                    ${activeCategory.graphs.map(createGraphCardHTML).join('')}
                </div>
            `;
            renderMainCategoryChart(activeCategory);
            activeCategory.graphs.forEach(graph => {
                renderSubGraph(graph);
                renderDataList(graph);
            });
        } else {
            mainTitle.textContent = 'Dashboard';
            contentContainer.innerHTML = `
                <div class="card" style="text-align: center; padding: 4rem;">
                    <h2>ยินดีต้อนรับ!</h2>
                    <p>เริ่มต้นด้วยการสร้าง "หมวดหมู่" ใหม่ทางด้านซ้ายมือ</p>
                </div>
            `;
        }
    };

    const createGraphCardHTML = (graph) => `
        <div class="card graph-card" id="graph-card-${graph.id}">
            <div class="graph-card-header">
                <h3>${graph.name}</h3>
                <button class="btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" onclick="window.confirmDelete('graph', '${graph.id}')">ลบ</button>
            </div>
            <canvas id="chart-graph-${graph.id}" height="200"></canvas>
            <button class="btn-secondary" style="width:100%; margin-top: 1rem;" onclick="window.openAddDataModal('${graph.id}', null)">เพิ่มข้อมูล</button>
            <ul class="data-list" id="data-list-${graph.id}"></ul>
        </div>
    `;

    const renderDataList = (graph) => {
        const listEl = document.getElementById(`data-list-${graph.id}`);
        if (!listEl) return;
        listEl.innerHTML = '';
        [...graph.data].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(dataPoint => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${dataPoint.date}: <strong>${dataPoint.value}</strong></span>
                <div>
                    <button style="background:none; color: var(--text-color);" onclick="window.openAddDataModal('${graph.id}', '${dataPoint.id}')">✏️</button>
                    <button style="background:none; color: var(--danger-color);" onclick="window.confirmDelete('data', '${graph.id}', '${dataPoint.id}')">🗑️</button>
                </div>
            `;
            listEl.appendChild(li);
        });
    };

    // --- CHART RENDERING ---
    const destroyAllCharts = () => {
        Object.values(chartInstances).forEach(chart => chart.destroy());
        chartInstances = {};
    };

    const getChartOptions = () => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-color'), font: { family: getComputedStyle(document.body).getPropertyValue('--font-family') } } },
            title: { color: getComputedStyle(document.body).getPropertyValue('--text-color'), font: { family: getComputedStyle(document.body).getPropertyValue('--font-family') } }
        },
        scales: {
            y: {
                ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-color'), font: { family: getComputedStyle(document.body).getPropertyValue('--font-family') } },
                grid: { color: getComputedStyle(document.body).getPropertyValue('--border-color') }
            },
            x: {
                ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-color'), font: { family: getComputedStyle(document.body).getPropertyValue('--font-family') } },
                grid: { color: getComputedStyle(document.body).getPropertyValue('--border-color') }
            }
        }
    });

    const renderMainCategoryChart = (category) => {
        const ctx = document.getElementById('main-category-chart')?.getContext('2d');
        if (!ctx) return;
        const chartOptions = getChartOptions();
        chartOptions.plugins.title = { display: true, text: `ภาพรวมคะแนนเฉลี่ย`, font: { size: 16 } };
        chartOptions.plugins.legend.display = false;

        chartInstances['main-category'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: category.graphs.map(g => g.name),
                datasets: [{
                    label: 'คะแนนเฉลี่ย',
                    data: category.graphs.map(g => g.data.length > 0 ? g.data.reduce((sum, item) => sum + parseFloat(item.value), 0) / g.data.length : 0),
                    backgroundColor: category.graphs.map(g => g.color),
                }]
            },
            options: chartOptions
        });
    };

    const renderSubGraph = (graph) => {
        const ctx = document.getElementById(`chart-graph-${graph.id}`)?.getContext('2d');
        if (!ctx) return;
        const chartOptions = getChartOptions();
        chartOptions.scales.y.beginAtZero = graph.type === 'scale';
        if (graph.type === 'scale') chartOptions.scales.y.max = 10;
        chartOptions.plugins.legend.display = false;
        chartOptions.scales.x.type = 'time';
        chartOptions.scales.x.time = { unit: 'day' };

        chartInstances[`graph-${graph.id}`] = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: graph.name,
                    data: [...graph.data].sort((a, b) => new Date(a.date) - new Date(b.date)).map(d => ({x: d.date, y: d.value})),
                    borderColor: graph.color,
                    tension: 0.3,
                    fill: true,
                    backgroundColor: `${graph.color}33`
                }]
            },
            options: chartOptions
        });
    };

    // --- THEME & ANIMATION ---
    const applyTheme = () => {
        document.body.className = '';
        document.body.classList.add(appData.settings.theme);
        themeSelect.value = appData.settings.theme;
        if (appData.settings.theme === 'theme-stars') {
            initStarsBackground();
        } else {
            const canvas = document.getElementById('stars-bg');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if(window.animationFrameId) cancelAnimationFrame(window.animationFrameId);
        }
    };

    themeSelect.addEventListener('change', (e) => {
        appData.settings.theme = e.target.value;
        saveData();
        render();
    });

    function initStarsBackground() {
        const canvas = document.getElementById('stars-bg');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particles = [];
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const createParticles = () => {
            particles = [];
            let numberOfParticles = (canvas.height * canvas.width) / 9000;
            for (let i = 0; i < numberOfParticles; i++) {
                let size = Math.random() * 2 + 1;
                let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
                let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
                let directionX = (Math.random() * .4) - .2;
                let directionY = (Math.random() * .4) - .2;
                particles.push({ x, y, directionX, directionY, size });
            }
        };

        const connect = () => {
            let opacityValue = 1;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
                                 + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                    if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                        opacityValue = 1 - (distance / 20000);
                        ctx.strokeStyle = `rgba(140, 155, 180, ${opacityValue})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            window.animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, innerWidth, innerHeight);
            for (let i = 0; i < particles.length; i++) {
                let particle = particles[i];
                if (particle.x < 0 || particle.x > canvas.width) particle.directionX = -particle.directionX;
                if (particle.y < 0 || particle.y > canvas.height) particle.directionY = -particle.directionY;
                particle.x += particle.directionX;
                particle.y += particle.directionY;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(224, 230, 241, 0.8)';
                ctx.fill();
            }
            connect();
        };
        
        window.addEventListener('resize', () => {
            canvas.width = innerWidth;
            canvas.height = innerHeight;
            createParticles();
        });

        if(window.animationFrameId) cancelAnimationFrame(window.animationFrameId);
        createParticles();
        animate();
    }

    // --- ACTIONS & EVENT HANDLERS ---
    addCategoryBtn.addEventListener('click', () => {
        const name = newCategoryNameInput.value.trim();
        if (name) {
            const newCategory = { id: `cat-${Date.now()}`, name, graphs: [] };
            appData.categories.push(newCategory);
            appData.ui.activeCategoryId = newCategory.id;
            saveData();
            render();
            newCategoryNameInput.value = '';
        }
    });

    const findGraph = (graphId) => {
        for (const category of appData.categories) {
            const graph = category.graphs.find(g => g.id === graphId);
            if (graph) return { category, graph };
        }
        return {};
    };

    const deleteCategory = (categoryId) => {
        appData.categories = appData.categories.filter(c => c.id !== categoryId);
        if (appData.ui.activeCategoryId === categoryId) {
            appData.ui.activeCategoryId = appData.categories.length > 0 ? appData.categories[0].id : null;
        }
        saveData();
        render();
    };

    const deleteGraph = (graphId) => {
        const { category } = findGraph(graphId);
        if (category) {
            category.graphs = category.graphs.filter(g => g.id !== graphId);
            saveData();
            render();
        }
    };

    const deleteData = (graphId, dataId) => {
        const { graph } = findGraph(graphId);
        if (graph) {
            graph.data = graph.data.filter(d => d.id !== dataId);
            saveData();
            render();
        }
    };

    // --- MODAL LOGIC (REFACTORED TO USE IDs) ---
    window.openAddGraphModal = (categoryId) => {
        document.getElementById('modal-category-id').value = categoryId;
        document.getElementById('graph-name').value = '';
        document.getElementById('graph-type').value = 'scale';
        const colorSelect = document.getElementById('graph-color');
        colorSelect.innerHTML = PRESET_COLORS.map(c => `<option value="${c.value}">${c.name}</option>`).join('');
        document.getElementById('add-graph-modal').style.display = 'flex';
    };

    document.getElementById('save-graph-btn').addEventListener('click', () => {
        const categoryId = document.getElementById('modal-category-id').value;
        const name = document.getElementById('graph-name').value.trim();
        const type = document.getElementById('graph-type').value;
        const color = document.getElementById('graph-color').value;
        if (name) {
            const newGraph = { id: `graph-${Date.now()}`, name, type, color, data: [] };
            appData.categories.find(c => c.id === categoryId).graphs.push(newGraph);
            saveData();
            render();
            closeModal('add-graph-modal');
        }
    });

    window.openAddDataModal = (graphId, dataId) => {
        const { graph } = findGraph(graphId);
        if (!graph) return;
        document.getElementById('modal-graph-id').value = graphId;
        const valueInput = document.getElementById('data-value');
        const valueLabel = document.getElementById('data-value-label');
        if (graph.type === 'scale') {
            valueInput.min = 0; valueInput.max = 10; valueInput.step = 0.1;
            valueLabel.textContent = 'คะแนน (0–10):';
        } else {
            valueInput.removeAttribute('min'); valueInput.removeAttribute('max'); valueInput.step = 'any';
            valueLabel.textContent = 'ค่า:';
        }
        
        if (dataId) { // Editing existing data
            const dataPoint = graph.data.find(d => d.id === dataId);
            document.getElementById('data-modal-title').textContent = 'แก้ไขข้อมูล';
            document.getElementById('data-date').value = dataPoint.date;
            document.getElementById('data-value').value = dataPoint.value;
            document.getElementById('modal-data-id').value = dataId;
        } else { // Adding new data
            document.getElementById('data-modal-title').textContent = 'เพิ่มข้อมูลใหม่';
            document.getElementById('data-date').valueAsDate = new Date();
            document.getElementById('data-value').value = '';
            document.getElementById('modal-data-id').value = ''; // Clear the ID
        }
        document.getElementById('add-data-modal').style.display = 'flex';
    };
    
    document.getElementById('save-data-btn').addEventListener('click', () => {
        const graphId = document.getElementById('modal-graph-id').value;
        const dataId = document.getElementById('modal-data-id').value;
        const date = document.getElementById('data-date').value;
        const valueStr = document.getElementById('data-value').value;
        if (!date || valueStr === '' || isNaN(parseFloat(valueStr))) return;
        const value = parseFloat(valueStr);
        const { graph } = findGraph(graphId);
        if (graph) {
            if (dataId) { // Editing
                const dataPoint = graph.data.find(d => d.id === dataId);
                if(dataPoint) {
                    dataPoint.date = date;
                    dataPoint.value = value;
                }
            } else { // Adding new
                graph.data.push({ id: `data-${Date.now()}`, date, value });
            }
            saveData();
            render();
            closeModal('add-data-modal');
        }
    });

    window.closeModal = (modalId) => document.getElementById(modalId).style.display = 'none';

    // --- CONFIRM MODAL ---
    let confirmCallback = null;
    window.confirmDelete = (type, id1, id2) => {
        document.getElementById('confirm-modal').style.display = 'flex';
        confirmCallback = () => {
            if (type === 'category') deleteCategory(id1);
            if (type === 'graph') deleteGraph(id1);
            if (type === 'data') deleteData(id1, id2);
            closeModal('confirm-modal');
        };
    };
    document.getElementById('confirm-ok-btn').addEventListener('click', () => confirmCallback && confirmCallback());
    document.getElementById('confirm-cancel-btn').addEventListener('click', () => closeModal('confirm-modal'));

    // Sidebar Toggle for Mobile
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target) && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // --- INITIALIZATION ---
    loadData();
    render();
});

