/* ====================================================
   REPORTES
   ==================================================== */

/* ====== REPORTE: ENTRADAS LLANTAS ====== */
async function cargarReporteEntradasLlantas() {
    try {
        var entradas = await api.entradasLlantas.listar();
        // Expandir cada entrada en sus líneas de detalle (una fila por producto)
        var filas = [];
        entradas.forEach(function(e) {
            if (e.detalles && e.detalles.length > 0) {
                e.detalles.forEach(function(d) {
                    filas.push({
                        factura:    e.factura  || '',
                        fecha:      e.fecha    || '',
                        mes:        e.fecha    ? formatMes(e.fecha) : '',
                        anio:       e.fecha    ? new Date(e.fecha).getFullYear() : '',
                        proveedor:  e.proveedor|| '',
                        codigo:     d.codigo   || '',
                        producto:   d.descripcion || '',
                        cantidad:   d.cantidad || 0,
                        moneda:     d.moneda   || 'SOL',
                        costoUni:   d.costoUnitario    != null ? d.costoUnitario    : '',
                        costoTotal: d.precioTotal       != null ? d.precioTotal       : '',
                        tc:         d.tipoCambio        != null ? d.tipoCambio        : '',
                        costoSunat: d.costoTotalSoles   != null ? d.costoTotalSoles   : '',
                        costoUniSol:d.costoUnitarioSoles!= null ? d.costoUnitarioSoles: '',
                        condicion:  e.formaPago ? formatFormaPago(e.formaPago) : ''
                    });
                });
            }
        });
        renderReporteEntradasLlantas(filas);
    } catch(err) { showToast('Error cargando reporte entradas llantas', 'error'); }
}

function renderReporteEntradasLlantas(filas) {
    var tbody = document.querySelector('#tablaReporteEntLlantas tbody');
    if (!tbody) return;
    if (filas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:40px;color:#aaa">Sin datos</td></tr>';
        return;
    }
    tbody.innerHTML = filas.map(function(f) {
        var esDolar = f.moneda === 'DOL';
        return '<tr>' +
            '<td>' + f.factura + '</td>' +
            '<td>' + formatDate(f.fecha) + '</td>' +
            '<td>' + f.mes + '</td>' +
            '<td>' + f.anio + '</td>' +
            '<td>' + f.proveedor + '</td>' +
            '<td><strong>' + f.codigo + '</strong></td>' +
            '<td>' + f.producto + '</td>' +
            '<td style="text-align:center">' + f.cantidad + '</td>' +
            '<td style="text-align:center"><span class="badge-moneda ' + (esDolar ? 'dol' : 'sol') + '">' + f.moneda + '</span></td>' +
            '<td style="text-align:right">' + (f.costoUni !== '' ? Number(f.costoUni).toFixed(2) : '') + '</td>' +
            '<td style="text-align:right">' + (f.costoTotal !== '' ? Number(f.costoTotal).toFixed(2) : '') + '</td>' +
            '<td style="text-align:right">' + (f.tc !== '' ? Number(f.tc).toFixed(3) : '') + '</td>' +
            '<td style="text-align:right">' + (f.costoSunat !== '' ? Number(f.costoSunat).toFixed(2) : '') + '</td>' +
            '<td style="text-align:right">' + (f.costoUniSol !== '' ? Number(f.costoUniSol).toFixed(4) : '') + '</td>' +
            '<td>' + f.condicion + '</td>' +
            '</tr>';
    }).join('');
}

/* ====== REPORTE: SALIDAS LLANTAS ====== */
async function cargarReporteSalidasLlantas() {
    try {
        var ventas = await api.ventasLlantas.listar();
        var filas = [];
        ventas.forEach(function(v) {
            if (v.detalles && v.detalles.length > 0) {
                v.detalles.forEach(function(d) {
                    filas.push({
                        comprobante: v.numeroComprobante || v.numeroVenta || '',
                        tipoDoc:     v.tipoComprobante || '',
                        fecha:       v.fecha   || '',
                        mes:         v.fecha   ? formatMes(v.fecha) : '',
                        anio:        v.fecha   ? new Date(v.fecha).getFullYear() : '',
                        ruc:         v.ruc     || '',
                        cliente:     v.cliente || '',
                        codigo:      d.codigo  || '',
                        producto:    d.descripcion || '',
                        cantidad:    d.cantidad|| 0,
                        preUni:      d.precioUnitario != null ? d.precioUnitario : '',
                        preTotal:    d.precioTotal    != null ? d.precioTotal    : '',
                        condicion:   v.formaPago ? formatFormaPago(v.formaPago) : '',
                        estado:      'Cancelado'
                    });
                });
            }
        });
        renderReporteSalidasLlantas(filas);
    } catch(err) { showToast('Error cargando reporte salidas llantas', 'error'); }
}

function renderReporteSalidasLlantas(filas) {
    var tbody = document.querySelector('#tablaReporteSalLlantas tbody');
    if (!tbody) return;
    if (filas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:40px;color:#aaa">Sin datos</td></tr>';
        return;
    }
    tbody.innerHTML = filas.map(function(f) {
        return '<tr>' +
            '<td><strong>' + f.comprobante + '</strong></td>' +
            '<td>' + f.tipoDoc + '</td>' +
            '<td>' + formatDate(f.fecha) + '</td>' +
            '<td>' + f.mes + '</td>' +
            '<td>' + f.anio + '</td>' +
            '<td>' + f.ruc + '</td>' +
            '<td>' + f.cliente + '</td>' +
            '<td><strong>' + f.codigo + '</strong></td>' +
            '<td>' + f.producto + '</td>' +
            '<td style="text-align:center">' + f.cantidad + '</td>' +
            '<td style="text-align:right">' + (f.preUni !== '' ? Number(f.preUni).toFixed(2) : '') + '</td>' +
            '<td style="text-align:right">' + (f.preTotal !== '' ? Number(f.preTotal).toFixed(2) : '') + '</td>' +
            '<td>' + f.condicion + '</td>' +
            '</tr>';
    }).join('');
}

/* ====== REPORTE: ENTRADAS SERVICIOS ====== */
async function cargarReporteEntradasServicios() {
    try {
        var entradas = await api.entradasServicios.listar();
        var filas = [];
        entradas.forEach(function(e) {
            if (e.detalles && e.detalles.length > 0) {
                e.detalles.forEach(function(d) {
                    filas.push({
                        factura:    e.factura  || '',
                        fecha:      e.fecha    || '',
                        mes:        e.fecha    ? formatMes(e.fecha) : '',
                        anio:       e.fecha    ? new Date(e.fecha).getFullYear() : '',
                        proveedor:  e.proveedor|| '',
                        codigo:     d.codigo   || '',
                        producto:   d.descripcion || '',
                        tipo:       d.tipoGrupo|| '',
                        cantidad:   d.cantidad || 0,
                        costoUni:   d.precioUnitario != null ? d.precioUnitario : '',
                        costoTotal: d.precioTotal    != null ? d.precioTotal    : '',
                        condicion:  e.formaPago ? formatFormaPago(e.formaPago) : ''
                    });
                });
            }
        });
        renderReporteEntradasServicios(filas);
    } catch(err) { showToast('Error cargando reporte entradas servicios', 'error'); }
}

function renderReporteEntradasServicios(filas) {
    var tbody = document.querySelector('#tablaReporteEntServicios tbody');
    if (!tbody) return;
    if (filas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:40px;color:#aaa">Sin datos</td></tr>';
        return;
    }
    tbody.innerHTML = filas.map(function(f) {
        return '<tr>' +
            '<td>' + f.factura + '</td>' +
            '<td>' + formatDate(f.fecha) + '</td>' +
            '<td>' + f.mes + '</td>' +
            '<td>' + f.anio + '</td>' +
            '<td>' + f.proveedor + '</td>' +
            '<td><strong>' + f.codigo + '</strong></td>' +
            '<td>' + f.producto + '</td>' +
            '<td>' + f.tipo + '</td>' +
            '<td style="text-align:center">' + f.cantidad + '</td>' +
            '<td style="text-align:right">' + (f.costoUni !== '' ? Number(f.costoUni).toFixed(2) : '') + '</td>' +
            '<td style="text-align:right">' + (f.costoTotal !== '' ? Number(f.costoTotal).toFixed(2) : '') + '</td>' +
            '<td>' + f.condicion + '</td>' +
            '</tr>';
    }).join('');
}

/* ====== REPORTE: SALIDAS SERVICIOS (Ordenes) ====== */
async function cargarReporteSalidasServicios() {
    try {
        var ordenes = await api.ordenes.listar();
        var filas = [];
        ordenes.forEach(function(o) {
            if (o.detalles && o.detalles.length > 0) {
                o.detalles.forEach(function(d) {
                    filas.push({
                        orden:      o.numeroOrden  || '',
                        servicio:   o.numeroComprobante || '',
                        fecha:      o.fecha        || '',
                        mes:        o.fecha        ? formatMes(o.fecha) : '',
                        anio:       o.fecha        ? new Date(o.fecha).getFullYear() : '',
                        cliente:    o.cliente      || '',
                        placa:      o.placa        || '',
                        codigo:     d.codigo       || '',
                        producto:   d.descripcion  || '',
                        cantidad:   d.cantidad     || 0,
                        preUni:     d.precioUnitario!= null ? d.precioUnitario : '',
                        preTotal:   d.precioTotal   != null ? d.precioTotal    : '',
                        costoUni:   d.costoUnitario != null ? d.costoUnitario  : '',
                        costoTotal: d.costoTotal    != null ? d.costoTotal     : '',
                        ganancia:   d.ganancia      != null ? d.ganancia       : '',
                        condicion:  o.formaPago ? formatFormaPago(o.formaPago) : ''
                    });
                });
            }
        });
        renderReporteSalidasServicios(filas);
    } catch(err) { showToast('Error cargando reporte salidas servicios', 'error'); }
}

function renderReporteSalidasServicios(filas) {
    var tbody = document.querySelector('#tablaReporteSalServicios tbody');
    if (!tbody) return;
    if (filas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:40px;color:#aaa">Sin datos</td></tr>';
        return;
    }
    tbody.innerHTML = filas.map(function(f) {
        return '<tr>' +
            '<td><strong>' + f.orden + '</strong></td>' +
            '<td>' + f.servicio + '</td>' +
            '<td>' + formatDate(f.fecha) + '</td>' +
            '<td>' + f.mes + '</td>' +
            '<td>' + f.anio + '</td>' +
            '<td>' + f.cliente + '</td>' +
            '<td>' + f.placa + '</td>' +
            '<td><strong>' + f.codigo + '</strong></td>' +
            '<td>' + f.producto + '</td>' +
            '<td style="text-align:center">' + f.cantidad + '</td>' +
            '<td style="text-align:right">' + (f.preUni    !== '' ? Number(f.preUni).toFixed(2)    : '') + '</td>' +
            '<td style="text-align:right">' + (f.preTotal  !== '' ? Number(f.preTotal).toFixed(2)  : '') + '</td>' +
            '<td style="text-align:right">' + (f.costoUni  !== '' ? Number(f.costoUni).toFixed(2)  : '') + '</td>' +
            '<td style="text-align:right">' + (f.costoTotal!== '' ? Number(f.costoTotal).toFixed(2): '') + '</td>' +
            '<td style="text-align:right">' + (f.ganancia  !== '' ? Number(f.ganancia).toFixed(2)  : '') + '</td>' +
            '<td>' + f.condicion + '</td>' +
            '</tr>';
    }).join('');
}

/* ====== HELPER: formato mes abreviado ====== */
function formatMes(fechaStr) {
    var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var d = new Date(fechaStr);
    return meses[d.getMonth()] || '';
}

/* ====== EXPORTAR A CSV ====== */
function exportarCSV(tablaId, nombreArchivo) {
    var tabla = document.getElementById(tablaId);
    if (!tabla) return;
    var filas = tabla.querySelectorAll('tr');
    var csv = [];
    filas.forEach(function(fila) {
        var cols = fila.querySelectorAll('th, td');
        var fila_csv = Array.from(cols).map(function(col) {
            var texto = col.innerText.replace(/"/g, '""').trim();
            return '"' + texto + '"';
        });
        csv.push(fila_csv.join(','));
    });
    var blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}