var contadorDetalleOrden = 0;

/* ====== LISTAR ORDENES ====== */
async function cargarOrdenes() {
    try {
        var ordenes = await api.ordenes.listar();
        renderOrdenes(ordenes);
    } catch (err) { showToast('Error cargando ordenes de servicio', 'error'); }
}

function renderOrdenes(ordenes) {
    var tbody = document.querySelector('#tablaOrdenes tbody');
    var watermark = document.getElementById('watermarkOrdenes');
    if (ordenes.length === 0) {
        tbody.innerHTML = '';
        document.getElementById('tablaOrdenes').style.display = 'none';
        watermark.style.display = 'flex';
        return;
    }
    document.getElementById('tablaOrdenes').style.display = '';
    watermark.style.display = 'none';
    tbody.innerHTML = ordenes.map(function (o) {
        return '<tr>' +
            '<td><strong>' + o.numeroOrden + '</strong></td>' +
            '<td>' + formatDate(o.fecha) + '</td>' +
            '<td>' + (o.cliente || '') + '</td>' +
            '<td>' + (o.placa || '') + '</td>' +
            '<td>' + formatFormaPago(o.formaPago) + '</td>' +
            '<td style="text-align:right"><strong>' + formatMoney(o.total) + '</strong></td>' +
            '<td>' +
            '<button class="btn-icon view" title="Ver detalle" onclick="verOrdenServicio(' + o.id + ')"><i class="fas fa-eye"></i></button> ' +
            '<button class="btn-icon delete" title="Eliminar" onclick="eliminarOrden(' + o.id + ')"><i class="fas fa-trash"></i></button>' +
            '</td></tr>';
    }).join('');
}

/* ====== MODAL NUEVA ORDEN ====== */
function abrirModalOrdenServicio() {
    contadorDetalleOrden = 0;
    document.getElementById('ordenNumero').value = '';
    document.getElementById('ordenFecha').value = todayISO();
    document.getElementById('ordenRuc').value = '';
    document.getElementById('ordenCliente').value = '';
    document.getElementById('ordenPlaca').value = '';
    document.getElementById('ordenFormaPago').value = '';
    document.getElementById('detalleOrden').innerHTML = '';
    document.getElementById('totalOrden').textContent = '0.00';
    cargarLlantasCache();
    cargarServiciosCache();
    abrirModal('modalOrdenServicio');
}

function agregarFilaOrdenLlanta() {
    contadorDetalleOrden++;
    var tbody = document.getElementById('detalleOrden');
    var tr = document.createElement('tr');
    tr.dataset.tipo = 'llanta';
    tr.innerHTML =
        '<td class="col-item">' + contadorDetalleOrden + '</td>' +
        '<td><div class="select-search-wrapper">' +
        '<input type="text" placeholder="Buscar llanta..." oninput="buscarLlantaOrden(this)" onfocus="buscarLlantaOrden(this)" data-id="" data-tipo="llanta">' +
        '<div class="select-search-dropdown"></div></div></td>' +
        '<td><input type="text" class="desc-field" readonly></td>' +
        '<td><input type="number" class="cant-field" value="1" min="1" onchange="recalcularTotalOrden()"></td>' +
        '<td><input type="number" class="pu-field" value="0" step="0.01" min="0" onchange="recalcularTotalOrden()"></td>' +
        '<td><input type="text" class="pt-field" value="0.00" readonly style="width:80px;text-align:right"></td>' +
        '<td class="col-remove"><button class="btn-remove" onclick="this.closest(\'tr\').remove(); renumerarFilasOrden(); recalcularTotalOrden();"><i class="fas fa-times"></i></button></td>';
    tbody.appendChild(tr);
}

function agregarFilaOrdenServicio() {
    contadorDetalleOrden++;
    var tbody = document.getElementById('detalleOrden');
    var tr = document.createElement('tr');
    tr.dataset.tipo = 'servicio';
    tr.innerHTML =
        '<td class="col-item">' + contadorDetalleOrden + '</td>' +
        '<td><div class="select-search-wrapper">' +
        '<input type="text" placeholder="Buscar servicio..." oninput="buscarServicioOrden(this)" onfocus="buscarServicioOrden(this)" data-id="" data-tipo="servicio">' +
        '<div class="select-search-dropdown"></div></div></td>' +
        '<td><input type="text" class="desc-field" readonly></td>' +
        '<td><input type="number" class="cant-field" value="1" min="1" onchange="recalcularTotalOrden()"></td>' +
        '<td><input type="number" class="pu-field" value="0" step="0.01" min="0" onchange="recalcularTotalOrden()"></td>' +
        '<td><input type="text" class="pt-field" value="0.00" readonly style="width:80px;text-align:right"></td>' +
        '<td class="col-remove"><button class="btn-remove" onclick="this.closest(\'tr\').remove(); renumerarFilasOrden(); recalcularTotalOrden();"><i class="fas fa-times"></i></button></td>';
    tbody.appendChild(tr);
}

function buscarLlantaOrden(input) {
    var filtro = input.value.toLowerCase();
    var dropdown = input.nextElementSibling;
    var filtered = llantasCache.filter(function (l) {
        return l.codigo.toLowerCase().includes(filtro) || l.producto.toLowerCase().includes(filtro);
    }).slice(0, 10);
    if (filtered.length === 0) {
        dropdown.innerHTML = '<div class="select-search-option" style="color:#aaa">Sin resultados</div>';
    } else {
        dropdown.innerHTML = filtered.map(function (l) {
            return '<div class="select-search-option" data-id="' + l.id + '" data-codigo="' + l.codigo + '" data-producto="' + l.producto + '" data-tipo="llanta" data-precio="0" onclick="seleccionarProductoOrden(this)">' +
                '<span class="option-code">' + l.codigo + '</span> - <span class="option-desc">' + l.producto + '</span></div>';
        }).join('');
    }
    dropdown.classList.add('active');
    closeDropdownOnClickOutside(input, dropdown);
}

function buscarServicioOrden(input) {
    var filtro = input.value.toLowerCase();
    var dropdown = input.nextElementSibling;
    var filtered = serviciosCache.filter(function (s) {
        return s.codigo.toLowerCase().includes(filtro) || s.producto.toLowerCase().includes(filtro);
    }).slice(0, 10);
    if (filtered.length === 0) {
        dropdown.innerHTML = '<div class="select-search-option" style="color:#aaa">Sin resultados</div>';
    } else {
        dropdown.innerHTML = filtered.map(function (s) {
            return '<div class="select-search-option" data-id="' + s.id + '" data-codigo="' + s.codigo + '" data-producto="' + s.producto + '" data-tipo="servicio" data-precio="' + (s.precio || 0) + '" onclick="seleccionarProductoOrden(this)">' +
                '<span class="option-code">' + s.codigo + '</span> - <span class="option-desc">' + s.producto + '</span></div>';
        }).join('');
    }
    dropdown.classList.add('active');
    closeDropdownOnClickOutside(input, dropdown);
}

function seleccionarProductoOrden(option) {
    var tr = option.closest('tr');
    var input = tr.querySelector('.select-search-wrapper input');
    input.value = option.dataset.codigo;
    input.dataset.id = option.dataset.id;
    input.dataset.tipo = option.dataset.tipo;
    tr.querySelector('.desc-field').value = option.dataset.producto;
    var precio = parseFloat(option.dataset.precio) || 0;
    if (precio > 0) {
        tr.querySelector('.pu-field').value = precio;
        recalcularTotalOrden();
    }
    option.closest('.select-search-dropdown').classList.remove('active');
}

function recalcularTotalOrden() {
    var total = 0;
    document.querySelectorAll('#detalleOrden tr').forEach(function (tr) {
        var cant = parseFloat(tr.querySelector('.cant-field').value) || 0;
        var pu = parseFloat(tr.querySelector('.pu-field').value) || 0;
        var pt = cant * pu;
        tr.querySelector('.pt-field').value = pt.toFixed(2);
        total += pt;
    });
    document.getElementById('totalOrden').textContent = total.toFixed(2);
}

function renumerarFilasOrden() {
    document.querySelectorAll('#detalleOrden tr').forEach(function (tr, i) {
        var cell = tr.querySelector('.col-item');
        if (cell) cell.textContent = i + 1;
    });
    contadorDetalleOrden = document.querySelectorAll('#detalleOrden tr').length;
}

/* ====== GUARDAR ORDEN ====== */
async function guardarOrdenServicio() {
    var numeroOrden = document.getElementById('ordenNumero').value.trim();
    if (!numeroOrden) { showToast('El numero de orden es obligatorio', 'warning'); return; }

    var detalles = [];
    var valid = true;
    document.querySelectorAll('#detalleOrden tr').forEach(function (tr) {
        var input = tr.querySelector('.select-search-wrapper input');
        var id = input.dataset.id;
        var tipo = input.dataset.tipo;
        var cantidad = parseInt(tr.querySelector('.cant-field').value) || 0;
        var precioUnitario = parseFloat(tr.querySelector('.pu-field').value) || 0;
        if (!id || id === '') { valid = false; return; }
        var detalle = { cantidad: cantidad, precioUnitario: precioUnitario };
        if (tipo === 'llanta') { detalle.llantaId = parseInt(id); }
        else { detalle.servicioId = parseInt(id); }
        detalles.push(detalle);
    });

    if (!valid || detalles.length === 0) { showToast('Selecciona al menos un producto en cada fila', 'warning'); return; }

    var data = {
        numeroOrden: numeroOrden,
        fecha: document.getElementById('ordenFecha').value,
        ruc: document.getElementById('ordenRuc').value,
        cliente: document.getElementById('ordenCliente').value,
        placa: document.getElementById('ordenPlaca').value,
        formaPago: document.getElementById('ordenFormaPago').value || null,
        detalles: detalles
    };

    try {
        await api.ordenes.registrar(data);
        showToast('Orden de servicio registrada correctamente');
        cerrarModal('modalOrdenServicio');
        cargarOrdenes();
        cargarLlantasCache();
        cargarServiciosCache();
    } catch (err) { showToast(err.message, 'error'); }
}

/* ====== VER DETALLE ORDEN ====== */
async function verOrdenServicio(id) {
    try {
        var o = await api.ordenes.obtener(id);
        document.getElementById('verDetalleTitulo').textContent = 'Orden de Servicio     ' + o.numeroOrden;
        var rows = o.detalles.map(function (d, i) {
            return '<tr><td style="text-align:center">' + (i + 1) + '</td><td><strong>' + d.codigo + '</strong></td><td>' + d.descripcion + '</td><td style="text-align:center">' + d.cantidad + '</td><td style="text-align:right">' + formatMoney(d.precioUnitario) + '</td><td style="text-align:right">' + formatMoney(d.precioTotal) + '</td></tr>';
        }).join('');
        document.getElementById('verDetalleContenido').innerHTML =
            '<div class="ver-info-grid">' +
            '<div class="ver-info-item"><span class="ver-info-label">Fecha</span><span class="ver-info-value">' + formatDate(o.fecha) + '</span></div>' +
            '<div class="ver-info-item"><span class="ver-info-label">RUC</span><span class="ver-info-value">' + (o.ruc || '-') + '</span></div>' +
            '<div class="ver-info-item full"><span class="ver-info-label">Cliente</span><span class="ver-info-value">' + (o.cliente || '-') + '</span></div>' +
            '<div class="ver-info-item"><span class="ver-info-label">Placa</span><span class="ver-info-value">' + (o.placa || '-') + '</span></div>' +
            '</div>' +
            '<table class="detalle-table ver-detalle-table"><thead><tr><th>Item</th><th>Codigo</th><th>Descripcion</th><th>Cantidad</th><th>P. Unit.</th><th>P. Total</th></tr></thead><tbody>' + rows + '</tbody></table>' +
            '<div class="ver-total-row"><span>TOTAL</span><span>' + formatMoney(o.total) + '</span></div>' +
            '<div class="forma-pago-row"><strong>Forma de pago</strong>&nbsp;&nbsp;&nbsp;&nbsp;' + formatFormaPago(o.formaPago) + '</div>';
        abrirModal('modalVerDetalle');
    } catch (err) { showToast('Error cargando detalle de la orden', 'error'); }
}

async function eliminarOrden(id) {
    if (!confirm('Estas seguro de eliminar esta orden? Esto afectara el stock.')) return;
    try {
        await api.ordenes.eliminar(id);
        showToast('Orden eliminada correctamente');
        cargarOrdenes();
    } catch (err) { showToast(err.message, 'error'); }
}