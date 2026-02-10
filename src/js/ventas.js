// Estado de la aplicación
let todosLosProductos = [];
let carrito = [];
let precioParchadoPendiente = false;

// Elementos del DOM
const btnVolver = document.getElementById('btn-volver');
const btnVerVentas = document.getElementById('btn-ver-ventas');
const btnLimpiar = document.getElementById('btn-limpiar');
const btnProcesarVenta = document.getElementById('btn-procesar-venta');

const searchProducto = document.getElementById('search-producto');
const filterTipoProducto = document.getElementById('filter-tipo-producto');
const productosGrid = document.getElementById('productos-grid');
const carritoItems = document.getElementById('carrito-items');
const totalVenta = document.getElementById('total-venta');

const modalBoleta = document.getElementById('modal-boleta');
const modalVentasDia = document.getElementById('modal-ventas-dia');
const modalPrecioParchado = document.getElementById('modal-precio-parchado');

const btnCloseBoleta = document.getElementById('btn-close-boleta');
const btnCloseVentas = document.getElementById('btn-close-ventas');
const btnNuevaVenta = document.getElementById('btn-nueva-venta');
const btnImprimir = document.getElementById('btn-imprimir');
const btnConfirmarParchado = document.getElementById('btn-confirmar-parchado');

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', async () => {
    await cargarProductos();
    await cargarTipos();
    configurarEventListeners();
});

// Configurar event listeners
function configurarEventListeners() {
    btnVolver.addEventListener('click', () => window.location.href = 'index.html');
    btnVerVentas.addEventListener('click', mostrarVentasDelDia);
    btnLimpiar.addEventListener('click', limpiarCarrito);
    btnProcesarVenta.addEventListener('click', iniciarProcesarVenta);
    
    searchProducto.addEventListener('input', filtrarProductos);
    filterTipoProducto.addEventListener('change', filtrarProductos);
    
    btnCloseBoleta.addEventListener('click', () => modalBoleta.classList.add('hidden'));
    btnCloseVentas.addEventListener('click', () => modalVentasDia.classList.add('hidden'));
    btnNuevaVenta.addEventListener('click', nuevaVenta);
    btnImprimir.addEventListener('click', imprimirBoleta);
    btnConfirmarParchado.addEventListener('click', confirmarPrecioParchado);
}

// Cargar productos
async function cargarProductos() {
    try {
        todosLosProductos = await API.obtenerProductos();
        renderizarProductos(todosLosProductos);
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Cargar tipos
async function cargarTipos() {
    try {
        const tipos = await API.obtenerTiposProductos();
        filterTipoProducto.innerHTML = '<option value="">Todos los Tipos</option>';
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            filterTipoProducto.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar tipos:', error);
    }
}

// Renderizar productos
function renderizarProductos(productos) {
    if (productos.length === 0) {
        productosGrid.innerHTML = '<div class="loading">No hay productos disponibles</div>';
        return;
    }

    productosGrid.innerHTML = productos.map(producto => {
        const sinStock = producto.tipo !== 'SERVICIO' && producto.stockTotalActivo <= 0;
        const stockClass = sinStock ? 'sin-stock' : '';
        const tipoBadge = obtenerBadgeTipo(producto.tipo);
        const stockInfo = producto.tipo === 'SERVICIO' 
            ? '' 
            : `<div class="producto-stock">Stock: ${producto.stockTotalActivo || 0}</div>`;
        const badgeStock = sinStock ? '<span class="badge badge-sin-stock">SIN STOCK</span>' : '';

        return `
            <div class="producto-card ${stockClass}" ${!sinStock ? `onclick="agregarAlCarrito(${producto.id})"` : ''}>
                <h3>${producto.nombre}</h3>
                <div class="producto-codigo">${producto.codigo}</div>
                ${tipoBadge}
                <div class="producto-precio">S/ ${formatearPrecio(producto.precioVenta)}</div>
                ${stockInfo}
                ${badgeStock}
            </div>
        `;
    }).join('');
}

// Filtrar productos
function filtrarProductos() {
    const termino = searchProducto.value.toLowerCase();
    const tipoSeleccionado = filterTipoProducto.value;

    let productosFiltrados = todosLosProductos;

    if (termino) {
        productosFiltrados = productosFiltrados.filter(p =>
            p.codigo.toLowerCase().includes(termino) ||
            p.nombre.toLowerCase().includes(termino)
        );
    }

    if (tipoSeleccionado) {
        productosFiltrados = productosFiltrados.filter(p => p.tipo === tipoSeleccionado);
    }

    renderizarProductos(productosFiltrados);
}

// Agregar al carrito
function agregarAlCarrito(productoId) {
    const producto = todosLosProductos.find(p => p.id === productoId);
    
    if (!producto) return;
    
    // Verificar stock si no es servicio
    if (producto.tipo !== 'SERVICIO' && producto.stockTotalActivo <= 0) {
        alert('Producto sin stock disponible');
        return;
    }

    // Verificar si ya está en el carrito
    const itemExistente = carrito.find(item => item.productoId === productoId);
    
    if (itemExistente) {
        // Verificar límite de stock
        if (producto.tipo !== 'SERVICIO' && itemExistente.cantidad + 1 > producto.stockTotalActivo) {
            alert(`Stock insuficiente. Disponible: ${producto.stockTotalActivo}`);
            return;
        }
        itemExistente.cantidad++;
    } else {
        carrito.push({
            productoId: producto.id,
            codigo: producto.codigo,
            nombre: producto.nombre,
            tipo: producto.tipo,
            precioUnitario: producto.precioVenta,
            cantidad: 1,
            esServicio: producto.tipo === 'SERVICIO',
            stockDisponible: producto.stockTotalActivo
        });
    }

    actualizarCarrito();
}

// Actualizar carrito
function actualizarCarrito() {
    if (carrito.length === 0) {
        carritoItems.innerHTML = `
            <div class="carrito-vacio">
                <p>El carrito está vacío</p>
                <p>Selecciona productos para comenzar</p>
            </div>
        `;
        btnProcesarVenta.disabled = true;
    } else {
        carritoItems.innerHTML = carrito.map((item, index) => {
            const subtotal = item.precioUnitario * item.cantidad;
            const tipoClass = item.tipo.toLowerCase();
            const tipoLabel = item.tipo;

            return `
                <div class="carrito-item">
                    <div class="item-info">
                        <div class="item-nombre">${item.nombre}</div>
                        <div class="item-codigo">${item.codigo}</div>
                        <span class="item-tipo ${tipoClass}">${tipoLabel}</span>
                    </div>
                    
                    <div class="item-cantidad">
                        <button class="btn-cantidad" onclick="cambiarCantidad(${index}, -1)">-</button>
                        <span class="cantidad-valor">${item.cantidad}</span>
                        <button class="btn-cantidad" onclick="cambiarCantidad(${index}, 1)">+</button>
                    </div>
                    
                    <div class="item-precio">
                        <div class="precio-unitario">S/ ${formatearPrecio(item.precioUnitario)} c/u</div>
                        <div class="precio-subtotal">S/ ${formatearPrecio(subtotal)}</div>
                    </div>
                    
                    <button class="btn-eliminar-item" onclick="eliminarDelCarrito(${index})">🗑️</button>
                </div>
            `;
        }).join('');
        
        btnProcesarVenta.disabled = false;
    }

    calcularTotal();
}

// Cambiar cantidad
function cambiarCantidad(index, cambio) {
    const item = carrito[index];
    const nuevaCantidad = item.cantidad + cambio;

    if (nuevaCantidad < 1) {
        eliminarDelCarrito(index);
        return;
    }

    // Verificar stock si no es servicio
    if (!item.esServicio && nuevaCantidad > item.stockDisponible) {
        alert(`Stock insuficiente. Disponible: ${item.stockDisponible}`);
        return;
    }

    item.cantidad = nuevaCantidad;
    actualizarCarrito();
}

// Eliminar del carrito
function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

// Limpiar carrito
function limpiarCarrito() {
    if (carrito.length === 0) return;
    
    if (confirm('¿Desea limpiar todo el carrito?')) {
        carrito = [];
        document.getElementById('input-cliente').value = '';
        document.getElementById('input-observaciones').value = '';
        actualizarCarrito();
    }
}

// Calcular total
function calcularTotal() {
    const total = carrito.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    totalVenta.textContent = `S/ ${formatearPrecio(total)}`;
}

// Iniciar proceso de venta
function iniciarProcesarVenta() {
    if (carrito.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    // Verificar si hay parches y NO hay servicio de parchado
    const hayParches = carrito.some(item => item.tipo === 'PARCHE');
    const hayParchado = carrito.some(item => item.codigo === 'SERV-PARCHADO');

    if (hayParches && !hayParchado) {
        // Mostrar modal para precio de parchado
        precioParchadoPendiente = true;
        document.getElementById('input-precio-parchado').value = '';
        modalPrecioParchado.classList.remove('hidden');
    } else {
        // Procesar venta directamente
        procesarVenta();
    }
}

// Confirmar precio de parchado
function confirmarPrecioParchado() {
    const precio = parseFloat(document.getElementById('input-precio-parchado').value);
    
    if (!precio || precio <= 0) {
        alert('Debe ingresar un precio válido para el parchado');
        return;
    }

    // Agregar servicio de parchado al carrito
    const servicioParchado = todosLosProductos.find(p => p.codigo === 'SERV-PARCHADO');
    
    if (servicioParchado) {
        carrito.push({
            productoId: servicioParchado.id,
            codigo: servicioParchado.codigo,
            nombre: servicioParchado.nombre,
            tipo: 'SERVICIO',
            precioUnitario: precio,
            cantidad: 1,
            esServicio: true,
            precioManual: precio
        });
        
        actualizarCarrito();
    }

    modalPrecioParchado.classList.add('hidden');
    precioParchadoPendiente = false;
    
    // Procesar venta
    procesarVenta();
}

// Procesar venta
async function procesarVenta() {
    const cliente = document.getElementById('input-cliente').value.trim() || 'Cliente General';
    const observaciones = document.getElementById('input-observaciones').value.trim();

    const ventaData = {
        cliente: cliente,
        observaciones: observaciones,
        detalles: carrito.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            esServicio: item.esServicio,
            precioManual: item.precioManual || null
        }))
    };

    try {
        btnProcesarVenta.disabled = true;
        btnProcesarVenta.textContent = 'Procesando...';

        const venta = await API.registrarVenta(ventaData);
        
        mostrarBoleta(venta);
        
    } catch (error) {
        alert('Error al procesar la venta: ' + error.message);
        btnProcesarVenta.disabled = false;
        btnProcesarVenta.textContent = '💰 Procesar Venta';
    }
}

// Mostrar boleta
function mostrarBoleta(venta) {
    const boletaContent = document.getElementById('boleta-content');
    
    const fecha = new Date(venta.fechaVenta);
    const fechaFormateada = fecha.toLocaleString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    boletaContent.innerHTML = `
        <div class="boleta-info">
            <p><strong>Número de Boleta:</strong> ${venta.numeroBoleta}</p>
            <p><strong>Fecha:</strong> ${fechaFormateada}</p>
            <p><strong>Cliente:</strong> ${venta.cliente}</p>
        </div>

        <div class="boleta-detalles">
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>P. Unit.</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${venta.detalles.map(detalle => `
                        <tr>
                            <td>${detalle.productoNombre}</td>
                            <td>${detalle.cantidad}</td>
                            <td>S/ ${formatearPrecio(detalle.precioUnitario)}</td>
                            <td>S/ ${formatearPrecio(detalle.subtotal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="boleta-total">
            <div class="total-row">
                <span>TOTAL:</span>
                <span>S/ ${formatearPrecio(venta.total)}</span>
            </div>
        </div>

        ${venta.observaciones ? `
            <div class="boleta-info" style="margin-top: 15px;">
                <p><strong>Observaciones:</strong> ${venta.observaciones}</p>
            </div>
        ` : ''}
    `;

    modalBoleta.classList.remove('hidden');
}

// Nueva venta
function nuevaVenta() {
    modalBoleta.classList.add('hidden');
    carrito = [];
    document.getElementById('input-cliente').value = '';
    document.getElementById('input-observaciones').value = '';
    actualizarCarrito();
    btnProcesarVenta.disabled = false;
    btnProcesarVenta.textContent = '💰 Procesar Venta';
    
    // Recargar productos para actualizar stock
    cargarProductos();
}

// Imprimir boleta
function imprimirBoleta() {
    const contenido = document.getElementById('boleta-content').innerHTML;
    const ventanaImpresion = window.open('', '', 'width=800,height=600');
    
    ventanaImpresion.document.write(`
        <html>
        <head>
            <title>Boleta de Venta</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; color: #667eea; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background: #667eea; color: white; }
                .boleta-info { background: #f8f9ff; padding: 15px; border-radius: 8px; margin: 10px 0; }
                .boleta-total { background: #f8f9ff; padding: 15px; border-radius: 8px; margin-top: 15px; }
                .total-row { display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>🛞 Llantería - Boleta de Venta</h1>
            ${contenido}
            <script>
                window.onload = function() {
                    window.print();
                    window.close();
                }
            </script>
        </body>
        </html>
    `);
}

// Mostrar ventas del día
async function mostrarVentasDelDia() {
    const ventasLista = document.getElementById('ventas-lista');
    ventasLista.innerHTML = '<div class="loading">Cargando ventas...</div>';
    
    modalVentasDia.classList.remove('hidden');

    try {
        const ventas = await API.obtenerVentasDelDia();
        
        if (ventas.length === 0) {
            ventasLista.innerHTML = '<div class="loading">No hay ventas registradas hoy</div>';
            document.getElementById('stat-cantidad').textContent = '0';
            document.getElementById('stat-monto').textContent = 'S/ 0.00';
            return;
        }

        const montoTotal = ventas.reduce((sum, v) => sum + v.total, 0);
        
        document.getElementById('stat-cantidad').textContent = ventas.length;
        document.getElementById('stat-monto').textContent = `S/ ${formatearPrecio(montoTotal)}`;

        ventasLista.innerHTML = ventas.map(venta => {
            const fecha = new Date(venta.fechaVenta);
            const hora = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="venta-item">
                    <div class="venta-header">
                        <div>
                            <div class="venta-numero">${venta.numeroBoleta}</div>
                            <div class="venta-info">${hora} - ${venta.cliente}</div>
                        </div>
                        <div class="venta-total">S/ ${formatearPrecio(venta.total)}</div>
                    </div>
                    <div class="venta-info">${venta.detalles.length} producto(s)</div>
                </div>
            `;
        }).join('');

    } catch (error) {
        ventasLista.innerHTML = '<div class="loading">Error al cargar ventas</div>';
        console.error('Error:', error);
    }
}

// Obtener badge según tipo
function obtenerBadgeTipo(tipo) {
    const badges = {
        'PARCHE': '<span class="badge badge-parche">PARCHE</span>',
        'MATERIAL': '<span class="badge badge-material">MATERIAL</span>',
        'ACCESORIO': '<span class="badge badge-accesorio">ACCESORIO</span>',
        'SERVICIO': '<span class="badge badge-servicio">SERVICIO</span>'
    };
    return badges[tipo] || `<span class="badge">${tipo}</span>`;
}

// Formatear precio
function formatearPrecio(precio) {
    return parseFloat(precio || 0).toFixed(2);
}