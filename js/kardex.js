/* ====== KARDEX - COSTO PROMEDIO ====== */

function buscarLlantaKardex(input) {
    var filtro = input.value.toLowerCase();
    var dropdown = document.getElementById('kardexDropdown');
    var filtered = llantasCache.filter(function (l) {
        return l.codigo.toLowerCase().includes(filtro) || l.producto.toLowerCase().includes(filtro);
    }).slice(0, 10);

    if (filtered.length === 0) {
        dropdown.innerHTML = '<div class="select-search-option" style="color:#aaa">Sin resultados</div>';
    } else {
        dropdown.innerHTML = filtered.map(function (l) {
            return '<div class="select-search-option" data-id="' + l.id + '" data-codigo="' + l.codigo + '" data-producto="' + l.producto + '" onclick="seleccionarLlantaKardex(this)">' +
                '<span class="option-code">' + l.codigo + '</span> - <span class="option-desc">' + l.producto + '</span></div>';
        }).join('');
    }
    dropdown.classList.add('active');
    closeDropdownOnClickOutside(input, dropdown);
}

function seleccionarLlantaKardex(option) {
    var input = document.getElementById('kardexBuscarLlanta');
    input.value = option.dataset.codigo;
    input.dataset.id = option.dataset.id;
    option.closest('.select-search-dropdown').classList.remove('active');
    cargarKardex();
}

async function cargarKardex() {
    var input = document.getElementById('kardexBuscarLlanta');
    var llantaId = input.dataset.id;

    if (!llantaId) {
        // Intentar buscar por codigo
        var codigo = input.value.trim().toUpperCase();
        if (codigo) {
            var found = llantasCache.find(function (l) { return l.codigo.toUpperCase() === codigo; });
            if (!found) { found = llantasCache.find(function (l) { return l.codigo.toUpperCase().startsWith(codigo); }); }
            if (found) {
                llantaId = found.id;
                input.value = found.codigo;
                input.dataset.id = found.id;
            }
        }
    }

    if (!llantaId) {
        showToast('Selecciona una llanta primero', 'warning');
        return;
    }

    try {
        var kardex = await api.costos.kardex(llantaId);
        var resumen = await api.costos.resumen(llantaId);

        // Buscar info del producto
        var llanta = llantasCache.find(function (l) { return l.id == llantaId; });

        // Mostrar resumen
        document.getElementById('kardexResumen').style.display = '';
        document.getElementById('kardexProducto').textContent = llanta ? llanta.codigo + ' - ' + llanta.producto : '-';
        document.getElementById('kardexStock').textContent = resumen.stockActual;
        document.getElementById('kardexCostoPromedio').textContent = 'S/ ' + formatMoney(resumen.costoPromedio);
        document.getElementById('kardexValorInv').textContent = 'S/ ' + formatMoney(resumen.valorInventario);

        // Renderizar tabla
        renderKardex(kardex);
    } catch (err) {
        showToast('Error cargando Kardex: ' + err.message, 'error');
    }
}

function renderKardex(kardex) {
    var tabla = document.getElementById('tablaKardex');
    var watermark = document.getElementById('watermarkKardex');
    var tbody = document.getElementById('bodyKardex');

    if (kardex.length === 0) {
        tabla.style.display = 'none';
        watermark.style.display = 'flex';
        tbody.innerHTML = '';
        return;
    }

    tabla.style.display = '';
    watermark.style.display = 'none';

    tbody.innerHTML = kardex.map(function (k) {
        var esEntrada = k.tipo === 'ENTRADA';
        var rowClass = esEntrada ? 'row-entrada' : 'row-salida';

        return '<tr class="' + rowClass + '">' +
            '<td>' + formatDate(k.fecha) + '</td>' +
            '<td><span class="badge-tipo ' + (esEntrada ? 'badge-entrada' : 'badge-salida') + '">' + k.tipo + '</span></td>' +
            // Entrada
            '<td style="text-align:center">' + (k.entradaCantidad != null ? k.entradaCantidad : '') + '</td>' +
            '<td style="text-align:right">' + (k.entradaCosto != null ? formatMoney(k.entradaCosto) : '') + '</td>' +
            '<td style="text-align:right">' + (k.entradaTotal != null ? formatMoney(k.entradaTotal) : '') + '</td>' +
            // Salida
            '<td style="text-align:center">' + (k.salidaCantidad != null ? k.salidaCantidad : '') + '</td>' +
            '<td style="text-align:right">' + (k.salidaCosto != null ? formatMoney(k.salidaCosto) : '') + '</td>' +
            '<td style="text-align:right">' + (k.salidaTotal != null ? formatMoney(k.salidaTotal) : '') + '</td>' +
            // Saldo
            '<td style="text-align:center;font-weight:600">' + k.saldoCantidad + '</td>' +
            '<td style="text-align:right;font-weight:600">' + formatMoney(k.saldoValor) + '</td>' +
            '<td style="text-align:right;font-weight:700;color:var(--primary)">' + formatMoney(k.costoPromedio) + '</td>' +
            '</tr>';
    }).join('');
}