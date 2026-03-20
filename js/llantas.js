var llantasCache = [];

async function cargarLlantasCache() {
    try { llantasCache = await api.llantas.listar(); } catch (err) { console.error(err); }
}

/* ====== STOCK ====== */
async function cargarStockLlantas() {
    try {
        var llantas = await api.llantas.listar();
        llantasCache = llantas;
        renderStockLlantas(llantas);
    } catch (err) { showToast('Error cargando stock de llantas', 'error'); }
}

function renderStockLlantas(llantas) {
    var tbody = document.querySelector('#tablaStockLlantas tbody');
    if (llantas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#aaa;">No hay llantas registradas</td></tr>';
        return;
    }
    llantas.sort(function (a, b) {
        if (a.stock > 0 && b.stock <= 0) return -1;
        if (a.stock <= 0 && b.stock > 0) return 1;
        return 0;
    });
    tbody.innerHTML = llantas.map(function (l) {
        var cls = l.stock > 0 ? 'positive' : l.stock === 0 ? 'zero' : 'negative';
        return '<tr>' +
            '<td><strong>' + l.codigo + '</strong></td>' +
            '<td>' + l.producto + '</td>' +
            '<td>' + (l.medida || '') + '</td>' +
            '<td>' + (l.tipo || '') + '</td>' +
            '<td>' + (l.proveedor || '') + '</td>' +
            '<td style="text-align:center">' + l.entradas + '</td>' +
            '<td style="text-align:center">' + l.salidas + '</td>' +
            '<td style="text-align:center"><span class="stock-badge ' + cls + '">' + l.stock + '</span></td>' +
            '</tr>';
    }).join('');
}

async function buscarLlantas() {
    var filtro = document.getElementById('buscarLlanta').value.trim();
    try {
        var llantas = filtro.length >= 2
            ? await api.llantas.buscar(filtro) : await api.llantas.listar();
        renderStockLlantas(llantas);
    } catch (err) { showToast('Error buscando llantas', 'error'); }
}

/* ====== ENTRADAS LLANTAS ====== */
async function cargarEntradasLlantas() {
    try {
        var entradas = await api.entradasLlantas.listar();
        renderEntradasLlantas(entradas);
    } catch (err) { showToast('Error cargando entradas de llantas', 'error'); }
}

function renderEntradasLlantas(entradas) {
    var tbody = document.querySelector('#tablaEntradasLlantas tbody');
    var watermark = document.getElementById('watermarkEntradasLlantas');
    if (entradas.length === 0) {
        tbody.innerHTML = '';
        document.getElementById('tablaEntradasLlantas').style.display = 'none';
        watermark.style.display = 'flex';
        return;
    }
    document.getElementById('tablaEntradasLlantas').style.display = '';
    watermark.style.display = 'none';
    tbody.innerHTML = entradas.map(function (e) {
        return '<tr>' +
            '<td>' + e.id + '</td>' +
            '<td>' + formatDate(e.fecha) + '</td>' +
            '<td>' + (e.proveedor || '') + '</td>' +
            '<td>' + (e.factura || '') + '</td>' +
            '<td>' + formatFormaPago(e.formaPago) + '</td>' +
            '<td style="text-align:right"><strong>' + formatMoney(e.total) + '</strong></td>' +
            '<td>' +
            '<button class="btn-icon view" title="Ver detalle" onclick="verEntradaLlanta(' + e.id + ')"><i class="fas fa-eye"></i></button> ' +
            '<button class="btn-icon delete" title="Eliminar" onclick="eliminarEntradaLlanta(' + e.id + ')"><i class="fas fa-trash"></i></button>' +
            '</td></tr>';
    }).join('');
}

/* ====== MODAL NUEVA ENTRADA LLANTA ====== */
var contadorDetalleEL = 0;

function abrirModalEntradaLlanta() {
    contadorDetalleEL = 0;
    document.getElementById('entLlantaFecha').value = todayISO();
    document.getElementById('entLlantaRuc').value = '';
    document.getElementById('entLlantaProveedor').value = '';
    document.getElementById('entLlantaFactura').value = 'F001-';
    document.getElementById('entLlantaFormaPago').value = '';
    document.getElementById('entLlantaMoneda').value = 'SOL';
    document.getElementById('entLlantaTipoCambio').value = '';
    document.getElementById('grupTipoCambio').style.display = 'none';
    document.querySelectorAll('#tablaDetalleEL .col-dol').forEach(function(el) {
        el.style.display = 'none';
    });
    document.getElementById('detalleEntradaLlanta').innerHTML = '';
    document.getElementById('totalEntradaLlanta').textContent = '0.00';
    cargarLlantasCache();
    agregarFilaDetalleLlanta();
    abrirModal('modalEntradaLlanta');
}

/* ====== TOGGLE TIPO DE CAMBIO ====== */
function toggleTipoCambio() {
    var moneda = document.getElementById('entLlantaMoneda').value;
    var esDolar = moneda === 'DOL';
    document.getElementById('grupTipoCambio').style.display = esDolar ? '' : 'none';
    if (!esDolar) document.getElementById('entLlantaTipoCambio').value = '';
    document.querySelectorAll('#tablaDetalleEL .col-dol').forEach(function(el) {
        el.style.display = esDolar ? '' : 'none';
    });
    document.querySelectorAll('#detalleEntradaLlanta tr').forEach(function(tr) {
        tr.querySelectorAll('.col-dol').forEach(function(td) {
            td.style.display = esDolar ? '' : 'none';
        });
    });
    recalcularCostosEL();
}

/* ====== AGREGAR FILA DETALLE ====== */
function agregarFilaDetalleLlanta() {
    // Renumerar siempre desde las filas existentes para evitar huecos al borrar y agregar
    contadorDetalleEL = document.querySelectorAll('#detalleEntradaLlanta tr').length + 1;
    var moneda = document.getElementById('entLlantaMoneda').value;
    var esDolar = moneda === 'DOL';
    var colDolDisplay = esDolar ? '' : 'none';
    var tbody = document.getElementById('detalleEntradaLlanta');
    var tr = document.createElement('tr');
    tr.innerHTML =
        '<td class="col-item">' + contadorDetalleEL + '</td>' +
        '<td><div class="select-search-wrapper">' +
        '<input type="text" placeholder="Buscar codigo..." oninput="buscarLlantaSelect(this)" data-id="">' +
        '<div class="select-search-dropdown dropdown-horizontal"></div></div></td>' +
        '<td><input type="text" class="desc-field" readonly tabindex="-1"></td>' +
        '<td><input type="text" inputmode="numeric" class="cant-field" value="1" oninput="recalcularCostosEL()"></td>' +
        '<td class="col-dol" style="display:' + colDolDisplay + '"><input type="text" inputmode="decimal" class="cu-dol-field" value="" placeholder="Costo $" oninput="recalcularCostosEL()"></td>' +
        '<td class="col-dol" style="display:' + colDolDisplay + '"><input type="text" class="ct-dol-field" value="0.00" readonly style="text-align:right;background:#f9f9f9"></td>' +
        '<td><input type="text" inputmode="decimal" class="cu-sol-field" value="" placeholder="Costo S/" oninput="recalcularCostosEL()"></td>' +
        '<td><input type="text" class="ct-sol-field" value="0.00" readonly style="text-align:right;background:#f9f9f9"></td>' +
        '<td class="col-remove"><button class="btn-remove" onclick="this.closest(\'tr\').remove(); renumerarFilas(\'detalleEntradaLlanta\'); recalcularCostosEL();"><i class="fas fa-times"></i></button></td>';
    tbody.appendChild(tr);
}

/* ====== RECALCULAR COSTOS ====== */
function recalcularCostosEL() {
    var moneda = document.getElementById('entLlantaMoneda').value;
    var esDolar = moneda === 'DOL';
    var tc = parseFloat(document.getElementById('entLlantaTipoCambio').value) || 0;
    var totalSoles = 0;
    document.querySelectorAll('#detalleEntradaLlanta tr').forEach(function(tr) {
        var cant = parseFloat(tr.querySelector('.cant-field').value) || 0;
        if (esDolar) {
            var cuDol = parseFloat(tr.querySelector('.cu-dol-field').value) || 0;
            var ctDol = cant * cuDol;
            tr.querySelector('.ct-dol-field').value = ctDol.toFixed(2);
            var cuSol = tc > 0 ? cuDol * tc : 0;
            var ctSol = cant * cuSol;
            tr.querySelector('.cu-sol-field').value = cuSol.toFixed(4);
            tr.querySelector('.ct-sol-field').value = ctSol.toFixed(2);
            totalSoles += ctSol;
        } else {
            var cuSol = parseFloat(tr.querySelector('.cu-sol-field').value) || 0;
            var ctSol = cant * cuSol;
            tr.querySelector('.ct-sol-field').value = ctSol.toFixed(2);
            totalSoles += ctSol;
        }
    });
    document.getElementById('totalEntradaLlanta').textContent = totalSoles.toFixed(2);
}

function recalcularTotalEL() { recalcularCostosEL(); }

/* ====== BUSCAR LLANTA EN DROPDOWN ====== */
function buscarLlantaSelect(input) {
    var filtro = input.value.trim().toLowerCase();
    var dropdown = input.nextElementSibling;

    // No mostrar nada si hay menos de 2 caracteres
    if (filtro.length < 2) {
        dropdown.innerHTML = '';
        dropdown.classList.remove('active');
        return;
    }

    // Elevar z-index de la fila activa por encima de las demas
    var allRows = document.querySelectorAll('#detalleEntradaLlanta tr');
    allRows.forEach(function(r) { r.style.position = 'relative'; r.style.zIndex = '1'; });
    var currentRow = input.closest('tr');
    if (currentRow) currentRow.style.zIndex = '100';

    var filtroUp = filtro.toUpperCase();
    var filtered = llantasCache
        .filter(function (l) { return l.codigo.toUpperCase().startsWith(filtroUp); })
        .slice(0, 12);

    if (filtered.length === 0) {
        dropdown.innerHTML = '<div class="llanta-opt-none">Sin resultados</div>';
    } else {
        dropdown.innerHTML = filtered.map(function (l) {
            return '<div class="llanta-opt" data-id="' + l.id + '" data-codigo="' + l.codigo +
                '" data-producto="' + l.producto + '" data-medida="' + (l.medida || '') +
                '" data-tipo="' + (l.tipo || '') + '" onclick="seleccionarLlanta(this)">' +
                '<span class="llanta-opt-code">' + l.codigo + '</span>' +
                '<span class="llanta-opt-desc">' + l.producto + '</span>' +
                '</div>';
        }).join('');
    }
    // Posicionar dropdown relativo al input (fixed, siempre encima de otras filas)
    var rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 4) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.classList.add('active');
    closeDropdownOnClickOutside(input, dropdown);
}

function seleccionarLlanta(option) {
    var tr = option.closest('tr');
    var input = tr.querySelector('.select-search-wrapper input');
    input.value = option.dataset.codigo;
    input.dataset.id = option.dataset.id;
    tr.querySelector('.desc-field').value = option.dataset.producto;
    option.closest('.select-search-dropdown').classList.remove('active');
}

/* ====== GUARDAR ENTRADA LLANTA ====== */
async function guardarEntradaLlanta() {
    var moneda = document.getElementById('entLlantaMoneda').value;
    var esDolar = moneda === 'DOL';
    var tc = parseFloat(document.getElementById('entLlantaTipoCambio').value) || null;
    if (esDolar && !tc) { showToast('Ingresa el Tipo de Cambio para compras en dolares', 'warning'); return; }
    var detalles = [];
    var valid = true;
    document.querySelectorAll('#detalleEntradaLlanta tr').forEach(function(tr) {
        var productoId = tr.querySelector('.select-search-wrapper input').dataset.id;
        var cantidad = parseInt(tr.querySelector('.cant-field').value) || 0;
        if (!productoId || productoId === '') { valid = false; return; }
        var detalle = { productoId: parseInt(productoId), cantidad: cantidad, moneda: moneda };
        if (esDolar) {
            var cuDol = parseFloat(tr.querySelector('.cu-dol-field').value) || 0;
            var cuSol = parseFloat(tr.querySelector('.cu-sol-field').value) || 0;
            detalle.costoUnitario = cuDol;
            detalle.tipoCambio = tc;
            detalle.precioUnitario = parseFloat(cuSol.toFixed(4));
        } else {
            var cuSol = parseFloat(tr.querySelector('.cu-sol-field').value) || 0;
            detalle.costoUnitario = cuSol;
            detalle.tipoCambio = null;
            detalle.precioUnitario = cuSol;
        }
        detalles.push(detalle);
    });
    if (!valid || detalles.length === 0) { showToast('Selecciona al menos un producto en cada fila', 'warning'); return; }
    var data = {
        fecha: document.getElementById('entLlantaFecha').value,
        ruc: document.getElementById('entLlantaRuc').value,
        proveedor: document.getElementById('entLlantaProveedor').value,
        factura: document.getElementById('entLlantaFactura').value,
        formaPago: document.getElementById('entLlantaFormaPago').value || null,
        detalles: detalles
    };
    try {
        await api.entradasLlantas.registrar(data);
        showToast('Entrada de llantas registrada correctamente');
        cerrarModal('modalEntradaLlanta');
        cargarEntradasLlantas();
        cargarStockLlantas();
    } catch (err) { showToast(err.message, 'error'); }
}

/* ====== VER DETALLE ====== */
async function verEntradaLlanta(id) {
    try {
        var e = await api.entradasLlantas.obtener(id);
        document.getElementById('verDetalleTitulo').textContent = 'COMPRA LLANTAS';
        var rows = e.detalles.map(function (d, i) {
            return '<tr><td style="text-align:center">' + (i + 1) + '</td><td><strong>' + d.codigo + '</strong></td><td>' + d.descripcion + '</td><td>' + (d.tipoGrupo || '') + '</td><td style="text-align:center">' + d.cantidad + '</td><td style="text-align:right">' + formatMoney(d.precioUnitario) + '</td><td style="text-align:right">' + formatMoney(d.precioTotal) + '</td></tr>';
        }).join('');
        document.getElementById('verDetalleContenido').innerHTML =
            '<div class="ver-info-grid">' +
            '<div class="ver-info-item"><span class="ver-info-label">Fecha</span><span class="ver-info-value">' + formatDate(e.fecha) + '</span></div>' +
            '<div class="ver-info-item"><span class="ver-info-label">RUC</span><span class="ver-info-value">' + (e.ruc || '-') + '</span></div>' +
            '<div class="ver-info-item full"><span class="ver-info-label">Proveedor</span><span class="ver-info-value">' + (e.proveedor || '-') + '</span></div>' +
            '<div class="ver-info-item"><span class="ver-info-label">Factura</span><span class="ver-info-value">' + (e.factura || '-') + '</span></div>' +
            '</div>' +
            '<table class="detalle-table ver-detalle-table"><thead><tr><th>Item</th><th>Codigo</th><th>Descripcion</th><th>Tipo</th><th>Cantidad</th><th>P. Unit.</th><th>P. Total</th></tr></thead><tbody>' + rows + '</tbody></table>' +
            '<div class="ver-total-row"><span>TOTAL</span><span>' + formatMoney(e.total) + '</span></div>' +
            '<div class="forma-pago-row"><strong>Forma de pago</strong>&nbsp;&nbsp;&nbsp;&nbsp;' + formatFormaPago(e.formaPago) + '</div>';
        abrirModal('modalVerDetalle');
    } catch (err) { showToast('Error cargando detalle', 'error'); }
}

async function eliminarEntradaLlanta(id) {
    if (!confirm('Estas seguro de eliminar esta entrada? Esto afectara el stock.')) return;
    try {
        await api.entradasLlantas.eliminar(id);
        showToast('Entrada eliminada correctamente');
        cargarEntradasLlantas();
        cargarStockLlantas();
    } catch (err) { showToast(err.message, 'error'); }
}

function autocompletarLlanta(input) {
    var codigo = input.value.trim();
    if (!codigo) return;
    var codigoUpper = codigo.toUpperCase();
    var dropdown = input.nextElementSibling;
    if (dropdown) dropdown.classList.remove('active');
    var found = llantasCache.find(function (l) { return l.codigo.toUpperCase() === codigoUpper; });
    if (!found) { found = llantasCache.find(function (l) { return l.codigo.toUpperCase().startsWith(codigoUpper); }); }
    if (!found) { found = llantasCache.find(function (l) { return l.codigo.toUpperCase().includes(codigoUpper); }); }
    if (found) {
        var tr = input.closest('tr');
        input.value = found.codigo;
        input.dataset.id = found.id;
        tr.querySelector('.desc-field').value = found.producto;
    } else { showToast('No se encontro llanta con codigo: ' + codigo, 'warning'); }
}

function renumerarFilas(tbodyId) {
    document.querySelectorAll('#' + tbodyId + ' tr').forEach(function (tr, i) {
        var cell = tr.querySelector('.col-item');
        if (cell) cell.textContent = i + 1;
        tr.style.zIndex = '1';
    });
}