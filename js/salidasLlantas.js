/* ====== SALIDAS DE LLANTAS (Ventas directas) ====== */
/* NOTA: Por ahora usa el mismo endpoint de ordenes como backend
   hasta que se cree un endpoint separado para ventas de llantas.
   Las ventas de llantas son ordenes sin placa ni servicios. */

var contadorDetalleSL = 0;

async function cargarSalidasLlantas() {
    try {
        var todas = await api.ordenes.listar();
        // Solo mostrar ordenes SIN placa (ventas directas de llantas)
        var salidas = todas.filter(function (o) { return !o.placa || o.placa.trim() === '' || o.placa === '-'; });
        renderSalidasLlantas(salidas);
    } catch (err) { showToast('Error cargando salidas de llantas', 'error'); }
}

function renderSalidasLlantas(salidas) {
    var tbody = document.querySelector('#tablaSalidasLlantas tbody');
    var watermark = document.getElementById('watermarkSalidasLlantas');
    var tabla = document.getElementById('tablaSalidasLlantas');
    if (salidas.length === 0) {
        tbody.innerHTML = '';
        tabla.style.display = 'none';
        if (watermark) watermark.style.display = 'flex';
        return;
    }
    tabla.style.display = '';
    if (watermark) watermark.style.display = 'none';
    tbody.innerHTML = salidas.map(function (o) {
        return '<tr>' +
            '<td><strong>' + (o.comprobante || o.numeroOrden || '') + '</strong></td>' +
            '<td>' + formatDate(o.fecha) + '</td>' +
            '<td>' + (o.cliente || '') + '</td>' +
            '<td>' + (o.ruc || '') + '</td>' +
            '<td>' + formatFormaPago(o.formaPago) + '</td>' +
            '<td style="text-align:right"><strong>' + formatMoney(o.total) + '</strong></td>' +
            '<td>' +
            '<button class="btn-icon view" title="Ver detalle" onclick="verSalidaLlanta(' + o.id + ')"><i class="fas fa-eye"></i></button> ' +
            '<button class="btn-icon delete" title="Eliminar" onclick="eliminarSalidaLlanta(' + o.id + ')"><i class="fas fa-trash"></i></button>' +
            '</td></tr>';
    }).join('');
}

async function verSalidaLlanta(id) {
    try {
        var o = await api.ordenes.obtener(id);
        document.getElementById('verDetalleTitulo').textContent = 'VENTA DE LLANTAS';
        var rows = o.detalles.map(function (d, i) {
            return '<tr><td style="text-align:center">' + (i + 1) + '</td><td><strong>' + d.codigo + '</strong></td><td>' + d.descripcion + '</td><td style="text-align:center">' + d.cantidad + '</td><td style="text-align:right">' + formatMoney(d.precioUnitario) + '</td><td style="text-align:right">' + formatMoney(d.precioTotal) + '</td></tr>';
        }).join('');
        document.getElementById('verDetalleContenido').innerHTML =
            '<div class="ver-info-grid">' +
            '<div class="ver-info-item"><span class="ver-info-label">Fecha</span><span class="ver-info-value">' + formatDate(o.fecha) + '</span></div>' +
            '<div class="ver-info-item"><span class="ver-info-label">RUC</span><span class="ver-info-value">' + (o.ruc || '-') + '</span></div>' +
            '<div class="ver-info-item full"><span class="ver-info-label">Cliente</span><span class="ver-info-value">' + (o.cliente || '-') + '</span></div>' +
            '<div class="ver-info-item"><span class="ver-info-label">Comprobante</span><span class="ver-info-value">' + (o.comprobante || '-') + '</span></div>' +
            '</div>' +
            '<table class="detalle-table ver-detalle-table"><thead><tr><th>Item</th><th>Codigo</th><th>Descripcion</th><th>Cant.</th><th>P. Unit.</th><th>P. Total</th></tr></thead><tbody>' + rows + '</tbody></table>' +
            '<div class="ver-total-row"><span>TOTAL</span><span>' + formatMoney(o.total) + '</span></div>' +
            '<div class="forma-pago-row"><strong>Forma de pago</strong>&nbsp;&nbsp;&nbsp;&nbsp;' + formatFormaPago(o.formaPago) + '</div>';
        abrirModal('modalVerDetalle');
    } catch (err) { showToast('Error cargando detalle', 'error'); }
}

async function eliminarSalidaLlanta(id) {
    if (!confirm('Estas seguro de eliminar esta venta? Esto afectara el stock.')) return;
    try {
        await api.ordenes.eliminar(id);
        showToast('Venta eliminada correctamente');
        cargarSalidasLlantas();
        cargarStockLlantas();
    } catch (err) { showToast(err.message, 'error'); }
}

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
        // Reset comprobante buttons
        document.querySelectorAll('#comprobanteBtnsSalLlanta .btn-comprobante').forEach(function (b) { b.classList.remove('active'); });
        if (typeof cargarLlantasCache === 'function') cargarLlantasCache();
        agregarFilaSalidaLlanta();
        abrirModal('modalSalidaLlanta');
    } catch (err) {
        console.error('Error abriendo modal salida llanta:', err);
        alert('Error: ' + err.message);
    }
}

function seleccionarComprobanteSL(tipo) {
    document.getElementById('salLlantaTipoComprobante').value = tipo;
    document.querySelectorAll('#comprobanteBtnsSalLlanta .btn-comprobante').forEach(function (b) {
        b.classList.toggle('active', b.dataset.tipo === tipo);
    });
    var prefijos = { 'FACTURA': 'F001-', 'BOLETA': 'B001-', 'TICKET': 'T001-', 'NOTA_CREDITO': 'NC001-' };
    var campo = document.getElementById('salLlantaNumeroComprobante');
    campo.value = prefijos[tipo] || '';
    campo.focus();
}

function agregarFilaSalidaLlanta() {
    contadorDetalleSL++;
    var tbody = document.getElementById('detalleSalidaLlanta');
    var tr = document.createElement('tr');
    tr.innerHTML =
        '<td class="col-item">' + contadorDetalleSL + '</td>' +
        '<td><div class="select-search-wrapper">' +
        '<input type="text" placeholder="Buscar llanta..." oninput="buscarLlantaSelectSL(this)" onfocus="buscarLlantaSelectSL(this)" data-id="">' +
        '<div class="select-search-dropdown"></div></div></td>' +
        '<td><input type="text" class="desc-field" readonly></td>' +
        '<td><input type="number" class="cant-field" value="1" min="1" style="width:55px" onchange="recalcularTotalSL()"></td>' +
        '<td><input type="number" class="pu-field" value="0" step="0.01" min="0" style="width:80px" onchange="recalcularTotalSL()"></td>' +
        '<td><input type="text" class="pt-field" value="0.00" readonly style="width:85px;text-align:right"></td>' +
        '<td class="col-remove"><button class="btn-remove" onclick="this.closest(\'tr\').remove(); renumerarFilasSL(); recalcularTotalSL();"><i class="fas fa-times"></i></button></td>';
    tbody.appendChild(tr);
}

function buscarLlantaSelectSL(input) {
    var filtro = input.value.toLowerCase();
    var dropdown = input.nextElementSibling;
    if (!filtro) { dropdown.classList.remove('active'); return; }

    var resultados = llantasCache.filter(function (l) {
        return l.codigo.toLowerCase().includes(filtro) || l.producto.toLowerCase().includes(filtro);
    }).slice(0, 10);

    if (resultados.length === 0) { dropdown.classList.remove('active'); return; }

    dropdown.innerHTML = resultados.map(function (l) {
        return '<div class="select-search-option" data-id="' + l.id + '" data-codigo="' + l.codigo + '" data-desc="' + l.producto + '">' +
            '<strong>' + l.codigo + '</strong> - ' + l.producto +
            '</div>';
    }).join('');
    dropdown.classList.add('active');

    dropdown.querySelectorAll('.select-search-option').forEach(function (opt) {
        opt.addEventListener('click', function () {
            input.value = opt.dataset.codigo;
            input.dataset.id = opt.dataset.id;
            var tr = input.closest('tr');
            tr.querySelector('.desc-field').value = opt.dataset.desc;
            dropdown.classList.remove('active');

            // Sugerir precio basado en costo promedio
            seleccionarProductoSL(opt.dataset.id, tr);
        });
    });
    closeDropdownOnClickOutside(input, dropdown);
}

async function seleccionarProductoSL(llantaId, tr) {
    try {
        var resumen = await api.costos.resumen(llantaId);
        if (resumen && resumen.costoPromedio) {
            tr.querySelector('.pu-field').value = parseFloat(resumen.costoPromedio).toFixed(2);
            recalcularTotalSL();
        }
    } catch (err) { /* no pasa nada */ }
}

function autocompletarLlantaSalida(input) {
    var codigo = input.value.trim().toUpperCase();
    if (!codigo) return;
    var dropdown = input.nextElementSibling;
    if (dropdown) dropdown.classList.remove('active');

    var found = llantasCache.find(function (l) { return l.codigo.toUpperCase() === codigo; });
    if (!found) found = llantasCache.find(function (l) { return l.codigo.toUpperCase().startsWith(codigo); });

    if (found) {
        input.value = found.codigo;
        input.dataset.id = found.id;
        var tr = input.closest('tr');
        tr.querySelector('.desc-field').value = found.producto;
        seleccionarProductoSL(found.id, tr);
    }
}

function recalcularTotalSL() {
    var total = 0;
    document.querySelectorAll('#detalleSalidaLlanta tr').forEach(function (tr) {
        var cant = parseFloat(tr.querySelector('.cant-field').value) || 0;
        var pu = parseFloat(tr.querySelector('.pu-field').value) || 0;
        var pt = cant * pu;
        tr.querySelector('.pt-field').value = pt.toFixed(2);
        total += pt;
    });
    document.getElementById('totalSalidaLlanta').textContent = total.toFixed(2);
}

function renumerarFilasSL() {
    document.querySelectorAll('#detalleSalidaLlanta tr').forEach(function (tr, i) {
        var cell = tr.querySelector('.col-item');
        if (cell) cell.textContent = i + 1;
    });
    contadorDetalleSL = document.querySelectorAll('#detalleSalidaLlanta tr').length;
}

async function guardarSalidaLlanta() {
    var tipoComp = document.getElementById('salLlantaTipoComprobante').value;
    if (!tipoComp) { showToast('Selecciona un tipo de comprobante', 'warning'); return; }

    var detalles = [];
    var valid = true;
    var esNotaCredito = tipoComp === 'NOTA_CREDITO';

    document.querySelectorAll('#detalleSalidaLlanta tr').forEach(function (tr) {
        var input = tr.querySelector('.select-search-wrapper input');
        var id = input.dataset.id;
        var cantidad = parseInt(tr.querySelector('.cant-field').value) || 0;
        var precioUnitario = parseFloat(tr.querySelector('.pu-field').value) || 0;
        if (!id || id === '') { valid = false; return; }
        detalles.push({ llantaId: parseInt(id), cantidad: cantidad, precioUnitario: precioUnitario });
    });

    if (!valid || detalles.length === 0) { showToast('Selecciona al menos una llanta en cada fila', 'warning'); return; }

    // Para Nota de Crédito, usar endpoint específico (pendiente backend)
    // Por ahora usa ordenes con solo llantas
    var data = {
        fecha: document.getElementById('salLlantaFecha').value,
        ruc: document.getElementById('salLlantaRuc').value || null,
        cliente: document.getElementById('salLlantaCliente').value || null,
        placa: null,
        formaPago: document.getElementById('salLlantaFormaPago').value || null,
        tipoComprobante: tipoComp,
        numeroComprobante: document.getElementById('salLlantaNumeroComprobante').value || null,
        detalles: detalles
    };

    // Auto-generar numero de orden
    try {
        var resp = await api.ordenes.siguienteNumero();
        data.numeroOrden = resp.numeroOrden;
    } catch (err) {
        data.numeroOrden = '';
    }

    try {
        await api.ordenes.registrar(data);
        var msg = esNotaCredito ? 'Nota de crédito registrada (stock devuelto)' : 'Venta de llantas registrada';
        showToast(msg);
        cerrarModal('modalSalidaLlanta');
        cargarSalidasLlantas();
        cargarLlantasCache();
    } catch (err) { showToast(err.message, 'error'); }
}