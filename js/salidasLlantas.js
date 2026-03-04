/* ====== SALIDAS DE LLANTAS (Ventas directas) ====== */

var contadorDetalleSL = 0;

/* ====== CARGAR Y RENDERIZAR TABLA ====== */
async function cargarSalidasLlantas() {
    try {
        var ventas = await api.ventasLlantas.listar();
        renderSalidasLlantas(ventas);
    } catch (err) { showToast('Error cargando salidas de llantas', 'error'); }
}

function renderSalidasLlantas(ventas) {
    var tbody = document.querySelector('#tablaSalidasLlantas tbody');
    var watermark = document.getElementById('watermarkSalidasLlantas');
    var tabla = document.getElementById('tablaSalidasLlantas');
    if (ventas.length === 0) {
        tbody.innerHTML = '';
        tabla.style.display = 'none';
        if (watermark) watermark.style.display = 'flex';
        return;
    }
    tabla.style.display = '';
    if (watermark) watermark.style.display = 'none';
    tbody.innerHTML = ventas.map(function (v) {
        var comprobante = v.numeroComprobante || v.numeroVenta || '';
        return '<tr>' +
            '<td><strong>' + comprobante + '</strong></td>' +
            '<td>' + formatDate(v.fecha) + '</td>' +
            '<td>' + (v.cliente || '') + '</td>' +
            '<td>' + (v.ruc || '') + '</td>' +
            '<td>' + formatFormaPago(v.formaPago) + '</td>' +
            '<td style="text-align:right"><strong>' + formatMoney(v.total) + '</strong></td>' +
            '<td>' +
            '<button class="btn-icon view" title="Ver detalle" onclick="verSalidaLlanta(' + v.id + ')"><i class="fas fa-eye"></i></button> ' +
            '<button class="btn-icon delete" title="Eliminar" onclick="eliminarSalidaLlanta(' + v.id + ')"><i class="fas fa-trash"></i></button>' +
            '</td></tr>';
    }).join('');
}

/* ====== BUSCAR ====== */
async function buscarSalidasLlantas() {
    var filtro = document.getElementById('buscarSalidaLlanta').value.trim();
    try {
        var ventas = filtro.length >= 2
            ? await api.ventasLlantas.buscarCliente(filtro)
            : await api.ventasLlantas.listar();
        renderSalidasLlantas(ventas);
    } catch (err) { showToast('Error buscando ventas', 'error'); }
}

/* ====== VER DETALLE ====== */
async function verSalidaLlanta(id) {
    try {
        var v = await api.ventasLlantas.obtener(id);
        document.getElementById('verDetalleTitulo').textContent = 'VENTA DE LLANTAS';
        var rows = v.detalles.map(function (d, i) {
            return '<tr>' +
                '<td style="text-align:center">' + (i + 1) + '</td>' +
                '<td><strong>' + d.codigo + '</strong></td>' +
                '<td>' + d.descripcion + '</td>' +
                '<td style="text-align:center">' + d.cantidad + '</td>' +
                '<td style="text-align:right">' + formatMoney(d.precioUnitario) + '</td>' +
                '<td style="text-align:right">' + formatMoney(d.precioTotal) + '</td>' +
                '</tr>';
        }).join('');
        document.getElementById('verDetalleContenido').innerHTML =
            '<div class="ver-info-grid">' +
            '<div class="ver-info-item"><span class="ver-info-label">Fecha</span><span class="ver-info-value">' + formatDate(v.fecha) + '</span></div>' +
            '<div class="ver-info-item"><span class="ver-info-label">RUC</span><span class="ver-info-value">' + (v.ruc || '-') + '</span></div>' +
            '<div class="ver-info-item full"><span class="ver-info-label">Cliente</span><span class="ver-info-value">' + (v.cliente || '-') + '</span></div>' +
            '<div class="ver-info-item"><span class="ver-info-label">Comprobante</span><span class="ver-info-value">' + (v.tipoComprobante || '-') + '</span></div>' +
            '<div class="ver-info-item"><span class="ver-info-label">N° Comprobante</span><span class="ver-info-value">' + (v.numeroComprobante || '-') + '</span></div>' +
            '</div>' +
            '<table class="detalle-table ver-detalle-table">' +
            '<thead><tr><th>Item</th><th>Codigo</th><th>Descripcion</th><th>Cantidad</th><th>P. Unit.</th><th>P. Total</th></tr></thead>' +
            '<tbody>' + rows + '</tbody></table>' +
            '<div class="ver-total-row"><span>TOTAL</span><span>' + formatMoney(v.total) + '</span></div>' +
            '<div class="forma-pago-row"><strong>Forma de pago</strong>&nbsp;&nbsp;&nbsp;&nbsp;' + formatFormaPago(v.formaPago) + '</div>';
        abrirModal('modalVerDetalle');
    } catch (err) { showToast('Error cargando detalle', 'error'); }
}

/* ====== ELIMINAR ====== */
async function eliminarSalidaLlanta(id) {
    if (!confirm('Estas seguro de eliminar esta venta? Esto afectara el stock.')) return;
    try {
        await api.ventasLlantas.eliminar(id);
        showToast('Venta eliminada correctamente');
        cargarSalidasLlantas();
        cargarStockLlantas();
    } catch (err) { showToast(err.message, 'error'); }
}

/* ====== ABRIR MODAL ====== */
function abrirModalSalidaLlanta() {
    try {
        contadorDetalleSL = 0;
        document.getElementById('salLlantaFecha').value = todayISO();
        document.getElementById('salLlantaRuc').value = '';
        document.getElementById('salLlantaCliente').value = '';
        document.getElementById('salLlantaTipoComprobante').value = '';
        document.getElementById('salLlantaNumeroComprobante').value = '';
        document.getElementById('salLlantaFormaPago').value = '';
        document.getElementById('detalleSalidaLlanta').innerHTML = '';
        document.getElementById('totalSalidaLlanta').textContent = '0.00';
        // Reset botones comprobante
        document.querySelectorAll('#comprobanteBtnsSalLlanta .btn-comprobante').forEach(function (b) {
            b.classList.remove('active');
        });
        if (typeof cargarLlantasCache === 'function') cargarLlantasCache();
        agregarFilaSalidaLlanta();
        abrirModal('modalSalidaLlanta');
    } catch (err) {
        console.error('Error abriendo modal salida llanta:', err);
        alert('Error: ' + err.message);
    }
}

/* ====== SELECCIONAR COMPROBANTE ====== */
function seleccionarComprobanteSL(tipo) {
    document.getElementById('salLlantaTipoComprobante').value = tipo;
    document.querySelectorAll('#comprobanteBtnsSalLlanta .btn-comprobante').forEach(function (b) {
        b.classList.toggle('active', b.dataset.tipo === tipo);
    });
    var prefijos = { 'FACTURA': 'F001-', 'BOLETA': 'B001-', 'TICKET': 'T001-' };
    var campo = document.getElementById('salLlantaNumeroComprobante');
    campo.value = prefijos[tipo] || '';
    campo.focus();
}

/* ====== AGREGAR FILA DETALLE ====== */
function agregarFilaSalidaLlanta() {
    contadorDetalleSL++;
    var tbody = document.getElementById('detalleSalidaLlanta');
    var tr = document.createElement('tr');
    tr.innerHTML =
        '<td class="col-item">' + contadorDetalleSL + '</td>' +
        '<td>' +
        '<div class="select-search-wrapper">' +
        '<input type="text" placeholder="Buscar llanta..." oninput="buscarLlantaSL(this)" onfocus="buscarLlantaSL(this)" onkeydown="if(event.key===\'Enter\'){autocompletarLlantaSL(this)}" data-id="">' +
        '<div class="select-search-dropdown"></div>' +
        '</div>' +
        '</td>' +
        '<td><input type="text" class="desc-field" readonly placeholder="Descripcion"></td>' +
        '<td><input type="number" class="cant-field" value="1" min="1" oninput="recalcularFilaSL(this)"></td>' +
        '<td><input type="number" class="pu-field" value="0" min="0" step="0.01" oninput="recalcularFilaSL(this)"></td>' +
        '<td><input type="number" class="pt-field" value="0.00" readonly></td>' +
        '<td class="col-remove"><button type="button" class="btn-remove" onclick="eliminarFilaSL(this)"><i class="fas fa-times"></i></button></td>';
    tbody.appendChild(tr);
}

/* ====== BUSCAR LLANTA EN DROPDOWN ====== */
function buscarLlantaSL(input) {
    var filtro = input.value.toLowerCase();
    var dropdown = input.nextElementSibling;
    var filtered = llantasCache.filter(function (l) {
        return l.codigo.toLowerCase().includes(filtro) || l.producto.toLowerCase().includes(filtro);
    }).slice(0, 10);
    if (filtered.length === 0) {
        dropdown.innerHTML = '<div class="select-search-option" style="color:#aaa">Sin resultados</div>';
    } else {
        dropdown.innerHTML = filtered.map(function (l) {
            return '<div class="select-search-option" data-id="' + l.id + '" data-codigo="' + l.codigo + '" data-producto="' + l.producto + '" onclick="seleccionarLlantaSL(this)">' +
                '<span class="option-code">' + l.codigo + '</span> - <span class="option-desc">' + l.producto + '</span></div>';
        }).join('');
    }
    dropdown.classList.add('active');
    closeDropdownOnClickOutside(input, dropdown);
}

/* ====== SELECCIONAR LLANTA DEL DROPDOWN ====== */
function seleccionarLlantaSL(option) {
    var tr = option.closest('tr');
    var input = tr.querySelector('.select-search-wrapper input');
    input.value = option.dataset.codigo;
    input.dataset.id = option.dataset.id;
    tr.querySelector('.desc-field').value = option.dataset.producto;
    option.closest('.select-search-dropdown').classList.remove('active');
    tr.querySelector('.cant-field').focus();
}

/* ====== AUTOCOMPLETAR POR CODIGO ====== */
function autocompletarLlantaSL(input) {
    var codigo = input.value.trim().toUpperCase();
    if (!codigo) return;
    var found = llantasCache.find(function (l) { return l.codigo.toUpperCase() === codigo; });
    if (!found) found = llantasCache.find(function (l) { return l.codigo.toUpperCase().startsWith(codigo); });
    if (!found) found = llantasCache.find(function (l) { return l.codigo.toUpperCase().includes(codigo); });
    if (found) {
        var tr = input.closest('tr');
        input.value = found.codigo;
        input.dataset.id = found.id;
        tr.querySelector('.desc-field').value = found.producto;
        input.nextElementSibling.classList.remove('active');
        tr.querySelector('.cant-field').focus();
    } else {
        showToast('No se encontro llanta con codigo: ' + codigo, 'warning');
    }
}

/* ====== RECALCULAR FILA ====== */
function recalcularFilaSL(input) {
    var tr = input.closest('tr');
    var cant = parseFloat(tr.querySelector('.cant-field').value) || 0;
    var pu = parseFloat(tr.querySelector('.pu-field').value) || 0;
    tr.querySelector('.pt-field').value = (cant * pu).toFixed(2);
    recalcularTotalSL();
}

/* ====== RECALCULAR TOTAL ====== */
function recalcularTotalSL() {
    var total = 0;
    document.querySelectorAll('#detalleSalidaLlanta tr').forEach(function (tr) {
        total += parseFloat(tr.querySelector('.pt-field').value) || 0;
    });
    document.getElementById('totalSalidaLlanta').textContent = total.toFixed(2);
}

/* ====== ELIMINAR FILA ====== */
function eliminarFilaSL(btn) {
    btn.closest('tr').remove();
    recalcularTotalSL();
    // Renumerar items
    document.querySelectorAll('#detalleSalidaLlanta tr').forEach(function (tr, i) {
        var cell = tr.querySelector('.col-item');
        if (cell) cell.textContent = i + 1;
    });
    contadorDetalleSL = document.querySelectorAll('#detalleSalidaLlanta tr').length;
}

/* ====== GUARDAR VENTA ====== */
async function guardarSalidaLlanta() {
    var tipoComp = document.getElementById('salLlantaTipoComprobante').value;
    if (!tipoComp) { showToast('Selecciona un tipo de comprobante', 'warning'); return; }

    var formaPago = document.getElementById('salLlantaFormaPago').value;
    if (!formaPago) { showToast('Selecciona una forma de pago', 'warning'); return; }

    var detalles = [];
    var valid = true;

    document.querySelectorAll('#detalleSalidaLlanta tr').forEach(function (tr) {
        var input = tr.querySelector('.select-search-wrapper input');
        var id = input ? input.dataset.id : null;
        var cantidad = parseInt(tr.querySelector('.cant-field').value) || 0;
        var precioUnitario = parseFloat(tr.querySelector('.pu-field').value) || 0;
        if (!id || id === '') { valid = false; return; }
        if (cantidad <= 0) { valid = false; return; }
        detalles.push({ llantaId: parseInt(id), cantidad: cantidad, precioUnitario: precioUnitario });
    });

    if (!valid || detalles.length === 0) {
        showToast('Completa todos los campos del detalle', 'warning');
        return;
    }

    var numeroComprobante = document.getElementById('salLlantaNumeroComprobante').value || null;

    var data = {
        numeroVenta: numeroComprobante || ('VL-' + Date.now()),
        fecha: document.getElementById('salLlantaFecha').value,
        ruc: document.getElementById('salLlantaRuc').value || null,
        cliente: document.getElementById('salLlantaCliente').value || null,
        tipoComprobante: tipoComp,
        numeroComprobante: numeroComprobante,
        formaPago: formaPago,
        detalles: detalles
    };

    try {
        await api.ventasLlantas.registrar(data);
        showToast('Venta de llantas registrada correctamente');
        cerrarModal('modalSalidaLlanta');
        cargarSalidasLlantas();
        cargarStockLlantas();
        if (typeof cargarLlantasCache === 'function') cargarLlantasCache();
    } catch (err) { showToast(err.message, 'error'); }
}