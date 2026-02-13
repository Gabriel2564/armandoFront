function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(function (item) {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo(item.dataset.section);
        });
    });
    document.querySelectorAll('.tabs').forEach(function (tabGroup) {
        tabGroup.querySelectorAll('.tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                switchTab(tabGroup, tab.dataset.tab);
            });
        });
    });
}

function navigateTo(section) {
    document.querySelectorAll('.nav-item').forEach(function (item) {
        item.classList.toggle('active', item.dataset.section === section);
    });
    document.querySelectorAll('.section').forEach(function (sec) {
        sec.classList.add('hidden');
    });
    var map = { 'llantas': 'seccionLlantas', 'servicios': 'seccionServicios', 'salidas': 'seccionSalidas' };
    var target = document.getElementById(map[section]);
    if (target) target.classList.remove('hidden');

    if (section === 'llantas') { cargarEntradasLlantas(); cargarStockLlantas(); }
    else if (section === 'servicios') { cargarEntradasServicios(); cargarStockServicios(); }
    else if (section === 'salidas') { cargarOrdenes(); }
}

function switchTab(tabGroup, targetTab) {
    var section = tabGroup.closest('.section');
    tabGroup.querySelectorAll('.tab').forEach(function (t) {
        t.classList.toggle('active', t.dataset.tab === targetTab);
    });
    section.querySelectorAll('.tab-content').forEach(function (c) {
        c.classList.toggle('active', c.id === targetTab);
    });
}

function abrirModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(function (m) {
            m.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

function closeDropdownOnClickOutside(input, dropdown) {
    setTimeout(function () {
        document.addEventListener('click', function handler(e) {
            if (!input.closest('.select-search-wrapper').contains(e.target)) {
                dropdown.classList.remove('active');
                document.removeEventListener('click', handler);
            }
        });
    }, 10);
}

function renumerarFilas(tbodyId) {
    document.querySelectorAll('#' + tbodyId + ' tr').forEach(function (tr, i) {
        var cell = tr.querySelector('.col-item');
        if (cell) cell.textContent = i + 1;
    });
}