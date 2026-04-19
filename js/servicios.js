/* ====================================================
   SERVICIOS — Compra de insumos + Stock
   ==================================================== */

var serviciosCache = [];

async function cargarServiciosCache() {
    try {
        var todos = await api.servicios.listar();
        serviciosCache = todos.filter(function (s) { return s.codigo; });
    } catch (err) { console.error('Error cargando servicios', err); }
}

/* ====== STOCK SERVICIOS ====== */
async function cargarStockServicios() {
    try {
        var servicios = await api.servicios.listar();
        serviciosCache = servicios.filter(function (s) { return s.codigo; });
        renderStockServicios(servicios);
    } catch (err) { showToast('Error cargando stock de servicios', 'error'); }
}

function renderStockServicios(servicios) {
    var tbody = document.querySelector('#tablaStockServicios tbody');
    if (servicios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#aaa">Sin datos</td></tr>';
        return;
    }
    tbody.innerHTML = servicios.map(function (s) {
        var cls = s.stock > 0 ? 'positive' : s.stock === 0 ? 'zero' : 'negative';
        return '<tr>' +
            '<td><strong>' + s.codigo + '</strong></td>' +
            '<td>' + s.producto + '</td>' +
            '<td>' + (s.tipo || '') + '</td>' +
            '<td style="text-align:right">' + (s.precio != null ? formatMoney(s.precio) : '-') + '</td>' +
            '<td style="text-align:center">' + s.entradas + '</td>' +
            '<td style="text-align:center">' + s.salidas + '</td>' +
            '<td style="text-align:center"><span class="stock-badge ' + cls + '">' + s.stock + '</span></td>' +
            '</tr>';
    }).join('');
}

async function buscarServicios() {
    var filtro = document.getElementById('buscarServicio').value.trim();
    try {
        var servicios = filtro.length >= 2 ? await api.servicios.buscar(filtro) : await api.servicios.listar();
        renderStockServicios(servicios);
    } catch (err) { showToast('Error buscando servicios', 'error'); }
}

/* ====== ENTRADAS SERVICIOS ====== */
async function cargarEntradasServicios() {
    try {
        var entradas = await api.entradasServicios.listar();
        renderEntradasServicios(entradas);
    } catch (err) { showToast('Error cargando entradas de servicios', 'error'); }
}

function renderEntradasServicios(entradas) {
    var tbody = document.querySelector('#tablaEntradasServicios tbody');
    var watermark = document.getElementById('watermarkEntradasServicios');
    if (entradas.length === 0) {
        tbody.innerHTML = '';
        document.getElementById('tablaEntradasServicios').style.display = 'none';
        watermark.style.display = 'flex';
        return;
    }
    document.getElementById('tablaEntradasServicios').style.display = '';
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
            '<button class="btn-icon view" title="Ver detalle" onclick="verEntradaServicio(' + e.id + ')"><i class="fas fa-eye"></i></button> ' +
            '<button class="btn-icon delete" title="Eliminar" onclick="eliminarEntradaServicio(' + e.id + ')"><i class="fas fa-trash"></i></button>' +
            '</td></tr>';
    }).join('');
}

/* ====== MODAL NUEVA ENTRADA SERVICIO ====== */
var contadorDetalleES = 0;

function abrirModalEntradaServicio() {
    contadorDetalleES = 0;
    document.getElementById('entServicioFecha').value = todayISO();
    document.getElementById('entServicioRuc').value = '';
    document.getElementById('entServicioProveedor').value = '';
    document.getElementById('entServicioFactura').value = 'F001-';
    document.getElementById('entServicioFormaPago').value = '';
    document.getElementById('detalleEntradaServicio').innerHTML = '';
    document.getElementById('totalEntradaServicio').textContent = '0.00';
    var tipoComp = document.getElementById('entServicioTipoComprobante');
    if (tipoComp) tipoComp.value = '';
    document.querySelectorAll('#comprobanteBtnsEntServ .btn-comprobante').forEach(function (b) { b.classList.remove('active'); });
    cargarServiciosCache();
    agregarFilaDetalleServicio();
    abrirModal('modalEntradaServicio');
}

function seleccionarComprobanteEntServ(tipo) {
    var tipoComp = document.getElementById('entServicioTipoComprobante');
    if (tipoComp) tipoComp.value = tipo;
    document.querySelectorAll('#comprobanteBtnsEntServ .btn-comprobante').forEach(function (b) {
        b.classList.toggle('active', b.dataset.tipo === tipo);
    });
    var prefijos = { 'FACTURA': 'F001-', 'TICKET': 'T001-' };
    var campo = document.getElementById('entServicioFactura');
    campo.value = prefijos[tipo] || '';
    campo.focus();
}

/* ====== AGREGAR FILA DETALLE ====== */
function agregarFilaDetalleServicio() {
    contadorDetalleES = document.querySelectorAll('#detalleEntradaServicio tr').length + 1;
    var tbody = document.getElementById('detalleEntradaServicio');
    var tr = document.createElement('tr');
    tr.innerHTML =
        '<td class="col-item">' + contadorDetalleES + '</td>' +
        '<td><div class="select-search-wrapper">' +
        '<input type="text" placeholder="Buscar codigo..." oninput="buscarServicioSelect(this)" data-id="">' +
        '<div class="select-search-dropdown dropdown-horizontal"></div></div></td>' +
        '<td><input type="text" class="desc-field" readonly tabindex="-1" style="height:27px"></td>' +
        '<td><input type="text" class="tipo-field" readonly tabindex="-1" style="width:90px;height:27px"></td>' +
        '<td><input type="text" inputmode="numeric" class="cant-field" value="1" oninput="recalcularTotalES()" style="width:52px;text-align:right"></td>' +
        '<td><input type="text" inputmode="decimal" class="pu-field" value="" placeholder="0.00" oninput="recalcularTotalES()" style="width:80px;text-align:right"></td>' +
        '<td><input type="text" class="pt-field" value="0.00" readonly style="width:80px;text-align:right;background:#f9f9f9"></td>' +
        '<td class="col-remove"><button class="btn-remove" onclick="eliminarFilaES(this)"><i class="fas fa-times"></i></button></td>';
    tbody.appendChild(tr);
}

/* ====== BUSCAR SERVICIO EN DROPDOWN ====== */
function buscarServicioSelect(input) {
    var filtro = input.value.trim().toUpperCase();
    var dropdown = input.nextElementSibling;

    if (filtro.length < 2) {
        dropdown.innerHTML = '';
        dropdown.classList.remove('active');
        return;
    }

    document.querySelectorAll('#detalleEntradaServicio tr').forEach(function (r) {
        r.style.position = 'relative'; r.style.zIndex = '1';
    });
    var currentRow = input.closest('tr');
    if (currentRow) currentRow.style.zIndex = '100';

    var filtered = serviciosCache
        .filter(function (s) { return s.codigo.toUpperCase().startsWith(filtro); })
        .slice(0, 12);

    if (filtered.length === 0) {
        dropdown.innerHTML = '<div class="llanta-opt-none">Sin resultados</div>';
    } else {
        dropdown.innerHTML = filtered.map(function (s) {
            return '<div class="llanta-opt" data-id="' + s.id + '" data-codigo="' + s.codigo +
                '" data-producto="' + s.producto + '" data-tipo="' + (s.tipo || '') +
                '" data-precio="' + (s.precio || 0) + '" onclick="seleccionarServicio(this)">' +
                '<span class="llanta-opt-code">' + s.codigo + '</span>' +
                '<span class="llanta-opt-desc">' + s.producto + '</span>' +
                '</div>';
        }).join('');
    }

    var rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 4) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.classList.add('active');
    closeDropdownOnClickOutside(input, dropdown);
}

function seleccionarServicio(option) {
    var dropdown = option.closest('.select-search-dropdown');
    var input = dropdown.closest('.select-search-wrapper').querySelector('input');
    var tr = input.closest('tr');
    input.value = option.dataset.codigo;
    input.dataset.id = option.dataset.id;
    tr.querySelector('.desc-field').value = option.dataset.producto;
    tr.querySelector('.tipo-field').value = option.dataset.tipo;
    var precio = parseFloat(option.dataset.precio) || 0;
    if (precio > 0) {
        tr.querySelector('.pu-field').value = precio.toFixed(2);
        recalcularTotalES();
    }
    dropdown.classList.remove('active');
    tr.querySelector('.cant-field').focus();
}

function autocompletarServicio(input) {
    var codigo = input.value.trim().toUpperCase();
    if (!codigo) return;
    var dropdown = input.nextElementSibling;
    if (dropdown) dropdown.classList.remove('active');
    var found = serviciosCache.find(function (s) { return s.codigo.toUpperCase() === codigo; });
    if (!found) found = serviciosCache.find(function (s) { return s.codigo.toUpperCase().startsWith(codigo); });
    if (!found) found = serviciosCache.find(function (s) { return s.codigo.toUpperCase().includes(codigo); });
    if (found) {
        var tr = input.closest('tr');
        input.value = found.codigo;
        input.dataset.id = found.id;
        tr.querySelector('.desc-field').value = found.producto;
        tr.querySelector('.tipo-field').value = found.tipo || '';
        if (found.precio && found.precio > 0) {
            tr.querySelector('.pu-field').value = found.precio.toFixed(2);
            recalcularTotalES();
        }
    } else { showToast('No se encontro servicio con codigo: ' + codigo, 'warning'); }
}

/* ====== RECALCULAR / ELIMINAR ====== */
function recalcularTotalES() {
    var total = 0;
    document.querySelectorAll('#detalleEntradaServicio tr').forEach(function (tr) {
        var cant = parseFloat(tr.querySelector('.cant-field').value) || 0;
        var pu = parseFloat(tr.querySelector('.pu-field').value) || 0;
        var pt = cant * pu;
        tr.querySelector('.pt-field').value = pt.toFixed(2);
        total += pt;
    });
    document.getElementById('totalEntradaServicio').textContent = total.toFixed(2);
}

function eliminarFilaES(btn) {
    btn.closest('tr').remove();
    recalcularTotalES();
    document.querySelectorAll('#detalleEntradaServicio tr').forEach(function (tr, i) {
        var cell = tr.querySelector('.col-item');
        if (cell) cell.textContent = i + 1;
        tr.style.zIndex = '1';
    });
    contadorDetalleES = document.querySelectorAll('#detalleEntradaServicio tr').length;
}

/* ====== GUARDAR ====== */
async function guardarEntradaServicio() {
    var detalles = [];
    var valid = true;
    document.querySelectorAll('#detalleEntradaServicio tr').forEach(function (tr) {
        var productoId = tr.querySelector('.select-search-wrapper input').dataset.id;
        var cantidad = parseInt(tr.querySelector('.cant-field').value) || 0;
        var precioUnitario = parseFloat(tr.querySelector('.pu-field').value) || 0;
        if (!productoId || productoId === '') { valid = false; return; }
        detalles.push({ productoId: parseInt(productoId), cantidad: cantidad, precioUnitario: precioUnitario });
    });
    if (!valid || detalles.length === 0) { showToast('Selecciona al menos un producto en cada fila', 'warning'); return; }
    var data = {
        fecha: document.getElementById('entServicioFecha').value,
        ruc: document.getElementById('entServicioRuc').value,
        proveedor: document.getElementById('entServicioProveedor').value,
        factura: document.getElementById('entServicioFactura').value,
        formaPago: document.getElementById('entServicioFormaPago').value || null,
        detalles: detalles
    };
    try {
        await api.entradasServicios.registrar(data);
        showToast('Entrada de servicios registrada correctamente');
        cerrarModal('modalEntradaServicio');
        cargarEntradasServicios();
        cargarStockServicios();
    } catch (err) { showToast(err.message, 'error'); }
}

/* ====== VER / ELIMINAR ====== */
async function verEntradaServicio(id) {
    try {
        var e = await api.entradasServicios.obtener(id);
        document.getElementById('verDetalleTitulo').textContent = 'COMPRA INSUMOS SERVICIOS';
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

async function eliminarEntradaServicio(id) {
    if (!confirm('Estas seguro de eliminar esta entrada? Esto afectara el stock.')) return;
    try {
        await api.entradasServicios.eliminar(id);
        showToast('Entrada eliminada correctamente');
        cargarEntradasServicios();
        cargarStockServicios();
    } catch (err) { showToast(err.message, 'error'); }
}