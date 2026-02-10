// Estado de la aplicación
let todosLosLotes = [];
let todosLosProductos = [];
let productoSeleccionado = null;

// Elementos del DOM
const filterTipo = document.getElementById('filter-tipo');
const filterEstado = document.getElementById('filter-estado');
const searchInput = document.getElementById('search-input');
const stockBody = document.getElementById('stock-body');
const btnIrVentas = document.getElementById('btn-ir-ventas');
const btnNuevoStock = document.getElementById('btn-nuevo-stock');

const modalNuevoStock = document.getElementById('modal-nuevo-stock');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelar = document.getElementById('btn-cancelar');
const selectProducto = document.getElementById('select-producto');
const productoInfo = document.getElementById('producto-info');
const formNuevoLote = document.getElementById('form-nuevo-lote');

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatos();
    configurarEventListeners();
});

// Configurar event listeners
function configurarEventListeners() {
    btnIrVentas.addEventListener('click', () => window.location.href = 'ventas.html');
    btnNuevoStock.addEventListener('click', abrirModalNuevoStock);
    btnCloseModal.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);
    
    filterTipo.addEventListener('change', filtrarLotes);
    filterEstado.addEventListener('change', filtrarLotes);
    searchInput.addEventListener('input', filtrarLotes);
    
    selectProducto.addEventListener('change', mostrarInfoProducto);
    formNuevoLote.addEventListener('submit', registrarNuevoLote);
}

// Cargar datos iniciales
async function cargarDatos() {
    await Promise.all([
        cargarLotes(),
        cargarProductos(),
        cargarTipos()
    ]);
}

// Cargar lotes
async function cargarLotes() {
    try {
        todosLosLotes = await API.obtenerLotes();
        renderizarLotes(todosLosLotes);
    } catch (error) {
        console.error('Error al cargar lotes:', error);
    }
}

// Cargar productos
async function cargarProductos() {
    try {
        todosLosProductos = await API.obtenerProductos();
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Cargar tipos de productos
async function cargarTipos() {
    try {
        const tipos = await API.obtenerTiposProductos();
        filterTipo.innerHTML = '<option value="">Todas las Familias (Tipos)</option>';
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            filterTipo.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar tipos:', error);
    }
}

// Renderizar lotes en la tabla
function renderizarLotes(lotes) {
    if (lotes.length === 0) {
        stockBody.innerHTML = '<tr><td colspan="12" class="loading">No hay lotes para mostrar</td></tr>';
        return;
    }

    stockBody.innerHTML = lotes.map(lote => {
        const fechaEntrada = formatearFecha(lote.fechaEntrada);
        const fechaTerminacion = lote.fechaTerminacion ? formatearFecha(lote.fechaTerminacion) : '-';
        const estadoBadge = lote.estado === 'ACTIVO' 
            ? '<span class="badge badge-activo">ACTIVO</span>'
            : '<span class="badge badge-agotado">AGOTADO</span>';
        
        const tipoBadge = obtenerBadgeTipo(lote.productoTipo);

        return `
            <tr>
                <td><strong>${lote.productoCodigo}</strong></td>
                <td>${lote.productoNombre}</td>
                <td>${tipoBadge}</td>
                <td>${lote.numeroLote}</td>
                <td>${lote.stockInicial}</td>
                <td><strong>${lote.stockActual}</strong></td>
                <td>${lote.stockVendido || 0}</td>
                <td>S/ ${formatearPrecio(lote.precioCompra || 0)}</td>
                <td>${fechaEntrada}</td>
                <td>${fechaTerminacion}</td>
                <td>${lote.diasActivo || 0} días</td>
                <td>${estadoBadge}</td>
            </tr>
        `;
    }).join('');
}

// Filtrar lotes
function filtrarLotes() {
    const tipoSeleccionado = filterTipo.value;
    const estadoSeleccionado = filterEstado.value;
    const terminoBusqueda = searchInput.value.toLowerCase();

    let lotesFiltrados = todosLosLotes;

    // Filtrar por tipo
    if (tipoSeleccionado) {
        lotesFiltrados = lotesFiltrados.filter(l => l.productoTipo === tipoSeleccionado);
    }

    // Filtrar por estado
    if (estadoSeleccionado) {
        lotesFiltrados = lotesFiltrados.filter(l => l.estado === estadoSeleccionado);
    }

    // Filtrar por búsqueda
    if (terminoBusqueda) {
        lotesFiltrados = lotesFiltrados.filter(l => 
            l.productoCodigo.toLowerCase().includes(terminoBusqueda) ||
            l.productoNombre.toLowerCase().includes(terminoBusqueda) ||
            l.numeroLote.toLowerCase().includes(terminoBusqueda)
        );
    }

    renderizarLotes(lotesFiltrados);
}

// Abrir modal para nuevo stock
async function abrirModalNuevoStock() {
    // Cargar productos en el select (solo productos físicos, no servicios)
    const productosConStock = todosLosProductos.filter(p => p.tipo !== 'SERVICIO');
    
    selectProducto.innerHTML = '<option value="">-- Seleccione un producto --</option>';
    productosConStock.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto.id;
        option.textContent = `${producto.codigo} - ${producto.nombre}`;
        selectProducto.appendChild(option);
    });

    modalNuevoStock.classList.remove('hidden');
}

// Cerrar modal
function cerrarModal() {
    modalNuevoStock.classList.add('hidden');
    formNuevoLote.reset();
    productoInfo.classList.add('hidden');
    formNuevoLote.classList.add('hidden');
    productoSeleccionado = null;
}

// Mostrar información del producto seleccionado
function mostrarInfoProducto() {
    const productoId = parseInt(selectProducto.value);
    
    if (!productoId) {
        productoInfo.classList.add('hidden');
        formNuevoLote.classList.add('hidden');
        return;
    }

    productoSeleccionado = todosLosProductos.find(p => p.id === productoId);
    
    if (!productoSeleccionado) return;

    document.getElementById('info-nombre').textContent = productoSeleccionado.nombre;
    document.getElementById('info-codigo').textContent = productoSeleccionado.codigo;
    document.getElementById('info-tipo').textContent = productoSeleccionado.tipo;
    document.getElementById('info-precio').textContent = formatearPrecio(productoSeleccionado.precioVenta);
    document.getElementById('info-stock-actual').textContent = productoSeleccionado.stockTotalActivo || 0;

    // Sugerir precio de compra (70% del precio de venta)
    const precioCompraSugerido = (productoSeleccionado.precioVenta * 0.70).toFixed(2);
    document.getElementById('input-precio-compra').value = precioCompraSugerido;

    productoInfo.classList.remove('hidden');
    formNuevoLote.classList.remove('hidden');
}

// Registrar nuevo lote
async function registrarNuevoLote(e) {
    e.preventDefault();

    if (!productoSeleccionado) {
        alert('Debe seleccionar un producto');
        return;
    }

    const stockInicial = parseInt(document.getElementById('input-stock').value);
    const precioCompra = parseFloat(document.getElementById('input-precio-compra').value);
    const fechaEntrada = document.getElementById('input-fecha-entrada').value;
    const observaciones = document.getElementById('input-observaciones').value;

    const loteData = {
        productoId: productoSeleccionado.id,
        stockInicial: stockInicial,
        precioCompra: precioCompra,
        fechaEntrada: fechaEntrada ? new Date(fechaEntrada).toISOString() : null,
        observaciones: observaciones
    };

    try {
        const nuevoLote = await API.crearLote(loteData);
        
        alert(`✅ Nuevo lote registrado exitosamente!\n\nLote: ${nuevoLote.numeroLote}\nProducto: ${productoSeleccionado.nombre}\nStock: ${stockInicial} unidades`);
        
        cerrarModal();
        await cargarLotes();
        
    } catch (error) {
        alert('Error al registrar el lote: ' + error.message);
    }
}

// Obtener badge según tipo de producto
function obtenerBadgeTipo(tipo) {
    const badges = {
        'PARCHE': '<span class="badge badge-parche">PARCHE</span>',
        'MATERIAL': '<span class="badge badge-material">MATERIAL</span>',
        'ACCESORIO': '<span class="badge badge-accesorio">ACCESORIO</span>',
        'SERVICIO': '<span class="badge badge-servicio">SERVICIO</span>'
    };
    return badges[tipo] || `<span class="badge">${tipo}</span>`;
}

// Formatear fecha
function formatearFecha(fechaISO) {
    if (!fechaISO) return '-';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Formatear precio
function formatearPrecio(precio) {
    return parseFloat(precio || 0).toFixed(2);
}