var llantasCache = [];

async function cargarLlantasCache() {
    try { llantasCache = await api.llantas.listar(); } catch (err) { console.error(err); }
}

/* ====== STOCK con Costo Promedio ====== */
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
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:#aaa;">No hay llantas registradas</td></tr>';
        return;
    }
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
            '<td style="text-align:right">' + (l.costoPromedio ? formatMoney(l.costoPromedio) : '-') + '</td>' +
            '<td style="text-align:right">' + (l.valorInventario ? formatMoney(l.valorInventario) : '-') + '</td>' +
            '</tr>';
    }).join('');
}

async function buscarLlantas() {
    var filtro = document.getElementById('buscarLlanta').value.trim();
    try {
        var llantas = filtro.length >= 2 ? await api.llantas.buscar(filtro) : await api.llantas.listar();
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

/* ====== MODAL NUEVA ENTRADA LLANTA (con costos) ====== */
var contadorDetalleEL = 0;

function toggleTipoCambio() {
    var moneda = document.getElementById('entLlantaMoneda').value;
    document.getElementById('grupTipoCambio').style.display = moneda === 'DOL' ? '' : 'none';
    if (moneda === 'SOL') {
        document.getElementById('entLlantaTipoCambio').value = '';
    }
    recalcularTotalEL();
}

function abrirModalEntradaLlanta() {
    contadorDetalleEL = 0;
    document.getElementById('entLlantaFecha').value = todayISO();
    document.getElementById('entLlantaRuc').value = '';
    document.getElementById('entLlantaProveedor').value = '';
    document.getElementById('entLlantaFactura').value = '';
    document.getElementById('entLlantaFormaPago').value = '';
    document.getElementById('entLlantaMoneda').value = 'SOL';
    document.getElementById('entLlantaTipoCambio').value = '';
    document.getElementById('grupTipoCambio').style.display = 'none';
    document.getElementById('detalleEntradaLlanta').innerHTML = '';
    document.getElementById('totalEntradaLlanta').textContent = '0.00';
    cargarLlantasCache();
    agregarFilaDetalleLlanta();
    abrirModal('modalEntradaLlanta');
}

function agregarFilaDetalleLlanta() {
    contadorDetalleEL++;
    var tbody = document.getElementById('detalleEntradaLlanta');
    var tr = document.createElement('tr');
    tr.innerHTML =
        '<td class="col-item">' + contadorDetalleEL + '</td>' +
        '<td><div class="select-search-wrapper">' +
        '<input type="text" placeholder="Buscar codigo..." style="min-width:120px" oninput="buscarLlantaSelect(this)" onfocus="buscarLlantaSelect(this)" data-id="" data-proveedor="">' +
        '<div class="select-search-dropdown"></div></div></td>' +
        '<td><input type="text" class="desc-field" readonly style="min-width:180px"></td>' +
        '<td><input type="text" class="medida-field" readonly style="width:70px"></td>' +
        '<td><input type="text" class="tipo-field" readonly style="width:65px"></td>' +
        '<td><input type="number" class="cant-field" value="1" min="1" onchange="recalcularTotalEL()"></td>' +
        '<td><input type="number" class="cu-field" value="0" step="0.01" min="0" onchange="recalcularTotalEL()"></td>' +
        '<td><input type="text" class="cus-field" value="0.00" readonly style="width:72px;text-align:right"></td>' +
        '<td><input type="text" class="ct-field" value="0.00" readonly style="width:80px;text-align:right"></td>' +
        '<td class="col-remove"><button class="btn-remove" onclick="this.closest(\'tr\').remove(); renumerarFilas(\'detalleEntradaLlanta\'); recalcularTotalEL();"><i class="fas fa-times"></i></button></td>';
    tbody.appendChild(tr);
}

function buscarLlantaSelect(input) {
    var filtro = input.value.toLowerCase();
    var dropdown = input.nextElementSibling;
    var filtered = llantasCache.filter(function (l) {
        return l.codigo.toLowerCase().includes(filtro) || l.producto.toLowerCase().includes(filtro);
    }).slice(0, 10);
    if (filtered.length === 0) {
        dropdown.innerHTML = '<div class="select-search-option" style="color:#aaa">Sin resultados</div>';
    } else {
        dropdown.innerHTML = filtered.map(function (l) {
            return '<div class="select-search-option" data-id="' + l.id + '" data-codigo="' + l.codigo + '" data-producto="' + l.producto + '" data-medida="' + (l.medida || '') + '" data-tipo="' + (l.tipo || '') + '" data-proveedor="' + (l.proveedor || '') + '" onclick="seleccionarLlanta(this)">' +
                '<span class="option-code">' + l.codigo + '</span> - <span class="option-desc">' + l.producto + '</span></div>';
        }).join('');
    }
    dropdown.classList.add('active');
    closeDropdownOnClickOutside(input, dropdown);
}

function seleccionarLlanta(option) {
    var tr = option.closest('tr');
    var input = tr.querySelector('.select-search-wrapper input');
    input.value = option.dataset.codigo;
    input.dataset.id = option.dataset.id;
    input.dataset.proveedor = option.dataset.proveedor;
    tr.querySelector('.desc-field').value = option.dataset.producto;
    tr.querySelector('.medida-field').value = option.dataset.medida;
    tr.querySelector('.tipo-field').value = option.dataset.tipo;
    option.closest('.select-search-dropdown').classList.remove('active');

    // Auto-llenar proveedor si el campo esta vacio
    var proveedorInput = document.getElementById('entLlantaProveedor');
    if (!proveedorInput.value.trim() && option.dataset.proveedor) {
        proveedorInput.value = option.dataset.proveedor;
    }
}

function recalcularTotalEL() {
    var moneda = document.getElementById('entLlantaMoneda').value;
    var tc = parseFloat(document.getElementById('entLlantaTipoCambio').value) || 0;
    var total = 0;

    document.querySelectorAll('#detalleEntradaLlanta tr').forEach(function (tr) {
        var cant = parseFloat(tr.querySelector('.cant-field').value) || 0;
        var cu = parseFloat(tr.querySelector('.cu-field').value) || 0;

        var cuSoles = cu;
        if (moneda === 'DOL' && tc > 0) {
            cuSoles = Math.round(cu * tc * 100) / 100;
        }
        var costoTotal = Math.round(cuSoles * cant * 100) / 100;

        tr.querySelector('.cus-field').value = cuSoles.toFixed(2);
        tr.querySelector('.ct-field').value = costoTotal.toFixed(2);
        total += costoTotal;
    });
    document.getElementById('totalEntradaLlanta').textContent = total.toFixed(2);
}

async function guardarEntradaLlanta() {
    var moneda = document.getElementById('entLlantaMoneda').value;
    var tc = parseFloat(document.getElementById('entLlantaTipoCambio').value) || null;
    var detalles = [];
    var valid = true;

    document.querySelectorAll('#detalleEntradaLlanta tr').forEach(function (tr) {
        var productoId = tr.querySelector('.select-search-wrapper input').dataset.id;
        var cantidad = parseInt(tr.querySelector('.cant-field').value) || 0;
        var costoUnitario = parseFloat(tr.querySelector('.cu-field').value) || 0;
        var costoUnitarioSoles = parseFloat(tr.querySelector('.cus-field').value) || 0;
        if (!productoId || productoId === '') { valid = false; return; }
        detalles.push({
            productoId: parseInt(productoId),
            cantidad: cantidad,
            precioUnitario: costoUnitarioSoles,
            moneda: moneda,
            costoUnitario: costoUnitario,
            tipoCambio: moneda === 'DOL' ? tc : null
        });
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
            var monedaStr = d.moneda === 'DOL' ? '$ ' + formatMoney(d.costoUnitario) + ' (TC: ' + (d.tipoCambio || '-') + ')' : '';
            return '<tr><td style="text-align:center">' + (i + 1) + '</td><td><strong>' + d.codigo + '</strong></td><td>' + d.descripcion + '</td><td style="text-align:center">' + d.cantidad + '</td><td style="text-align:right">' + formatMoney(d.costoUnitarioSoles || d.precioUnitario) + '</td><td style="text-align:right">' + formatMoney(d.costoTotalSoles || d.precioTotal) + '</td><td style="font-size:10px;color:#888">' + monedaStr + '</td></tr>';
        }).join('');
        document.getElementById('verDetalleContenido').innerHTML =
            '<div class="ver-info-grid">' +
            '<div class="ver-info-item"><span class="ver-info-label">Fecha</span><span class="ver-info-value">' + formatDate(e.fecha) + '</span></div>' +
            '<div class="ver-info-item"><span class="ver-info-label">RUC</span><span class="ver-info-value">' + (e.ruc || '-') + '</span></div>' +
            '<div class="ver-info-item full"><span class="ver-info-label">Proveedor</span><span class="ver-info-value">' + (e.proveedor || '-') + '</span></div>' +
            '<div class="ver-info-item"><span class="ver-info-label">Factura</span><span class="ver-info-value">' + (e.factura || '-') + '</span></div>' +
            '</div>' +
            '<table class="detalle-table ver-detalle-table"><thead><tr><th>Item</th><th>Codigo</th><th>Descripcion</th><th>Cant.</th><th>Costo Unit. S/</th><th>Costo Total S/</th><th>Moneda Orig.</th></tr></thead><tbody>' + rows + '</tbody></table>' +
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

/* Autocompletar llanta al presionar Enter */
function autocompletarLlanta(input) {
    var codigo = input.value.trim();
    if (!codigo) return;
    var codigoUpper = codigo.toUpperCase();

    var dropdown = input.nextElementSibling;
    if (dropdown) dropdown.classList.remove('active');

    var found = llantasCache.find(function (l) {
        return l.codigo.toUpperCase() === codigoUpper;
    });
    if (!found) {
        found = llantasCache.find(function (l) {
            return l.codigo.toUpperCase().startsWith(codigoUpper);
        });
    }
    if (!found) {
        found = llantasCache.find(function (l) {
            return l.codigo.toUpperCase().includes(codigoUpper);
        });
    }
    if (found) {
        var tr = input.closest('tr');
        input.value = found.codigo;
        input.dataset.id = found.id;
        input.dataset.proveedor = found.proveedor || '';
        tr.querySelector('.desc-field').value = found.producto;
        tr.querySelector('.medida-field').value = found.medida || '';
        tr.querySelector('.tipo-field').value = found.tipo || '';

        // Auto-llenar proveedor si el campo esta vacio
        var proveedorInput = document.getElementById('entLlantaProveedor');
        if (!proveedorInput.value.trim() && found.proveedor) {
            proveedorInput.value = found.proveedor;
        }
    } else {
        showToast('No se encontro llanta con codigo: ' + codigo, 'warning');
    }
}