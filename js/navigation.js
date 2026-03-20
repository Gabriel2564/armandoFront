function initNavigation() {
    document.querySelectorAll('.nav-submenu a').forEach(function (item) {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo(item.dataset.section);
        });
    });
    document.querySelectorAll('.nav-item-simple').forEach(function (item) {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo(item.dataset.section);
        });
    });
}

function toggleNavGroup(groupId) {
    var group = document.getElementById(groupId);
    group.classList.toggle('open');
}

function navigateTo(section) {
    document.querySelectorAll('.nav-submenu a').forEach(function (a) { a.classList.remove('active'); });
    document.querySelectorAll('.nav-group-title').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.nav-item-simple').forEach(function (t) { t.classList.remove('active'); });

    var link = document.querySelector('[data-section="' + section + '"]');
    if (link) {
        link.classList.add('active');
        var group = link.closest('.nav-group');
        if (group) {
            group.classList.add('open');
            group.querySelector('.nav-group-title').classList.add('active');
        }
    }

    document.querySelectorAll('.section').forEach(function (sec) { sec.classList.add('hidden'); });

    var sectionMap = {
        'llantas-entradas':             'seccionLlantasEntradas',
        'llantas-salidas':              'seccionLlantasSalidas',
        'llantas-stock':                'seccionLlantasStock',
        'servicios-entradas':           'seccionServiciosEntradas',
        'servicios-salidas':            'seccionServiciosSalidas',
        'servicios-stock':              'seccionServiciosStock',
        'kardex':                       'seccionKardex',
        'reporte-llantas-entradas':     'seccionReporteLlantasEntradas',
        'reporte-llantas-salidas':      'seccionReporteLlantasSalidas',
        'reporte-servicios-entradas':   'seccionReporteServiciosEntradas',
        'reporte-servicios-salidas':    'seccionReporteServiciosSalidas'
    };

    var target = document.getElementById(sectionMap[section]);
    if (target) target.classList.remove('hidden');

    if (section === 'llantas-entradas')                 { cargarEntradasLlantas(); }
    else if (section === 'llantas-salidas')             { if (typeof cargarSalidasLlantas === 'function') cargarSalidasLlantas(); }
    else if (section === 'llantas-stock')               { cargarStockLlantas(); }
    else if (section === 'servicios-entradas')          { cargarEntradasServicios(); }
    else if (section === 'servicios-salidas')           { cargarOrdenes(); }
    else if (section === 'servicios-stock')             { cargarStockServicios(); }
    else if (section === 'kardex')                      { if (typeof cargarLlantasCache === 'function') cargarLlantasCache(); }
    else if (section === 'reporte-llantas-entradas')    { cargarReporteEntradasLlantas(); }
    else if (section === 'reporte-llantas-salidas')     { cargarReporteSalidasLlantas(); }
    else if (section === 'reporte-servicios-entradas')  { cargarReporteEntradasServicios(); }
    else if (section === 'reporte-servicios-salidas')   { cargarReporteSalidasServicios(); }
}

function abrirModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
}

// Click fuera del modal NO lo cierra (para evitar perder datos al llenar formularios)
// Solo se cierra con el boton X, Cancelar, o Escape si no hay formulario activo

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

document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var input = e.target;
    if (!input.closest || !input.closest('.select-search-wrapper')) return;
    e.preventDefault();
    var dropdown = input.nextElementSibling;
    if (dropdown) dropdown.classList.remove('active');
    var tr = input.closest('tr');
    var tbody = tr ? tr.closest('tbody') : null;
    if (!tbody) return;
    var tbodyId = tbody.id;
    if (tbodyId === 'detalleEntradaLlanta') { autocompletarLlanta(input); }
    else if (tbodyId === 'detalleEntradaServicio') { autocompletarServicio(input); }
    else if (tbodyId === 'detalleOrden') {
        var tipo = input.dataset.tipo || tr.dataset.tipo;
        if (tipo === 'llanta') { autocompletarLlantaOrden(input); }
        else { autocompletarServicioOrden(input); }
    } else if (tbodyId === 'detalleSalidaLlanta') {
        if (typeof autocompletarLlantaSL === 'function') autocompletarLlantaSL(input);
    }
});