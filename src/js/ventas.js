// Estado de la aplicación
let todosLosProductos = [];
let carrito = [];
let serviciosDisponibles = [
    { nombre: 'Alineación', precio: 50, codigo: 'SERV-ALINEACION' },
    { nombre: 'Balanceo', precio: 40, codigo: 'SERV-BALANCEO' },
    { nombre: 'Rotación de Llantas', precio: 30, codigo: 'SERV-ROTACION' },
    { nombre: 'Parchado', precio: 25, codigo: 'SERV-PARCHADO' },
    { nombre: 'Cambio de Válvula', precio: 15, codigo: 'SERV-VALVULA' },
    { nombre: 'Inspección Completa', precio: 20, codigo: 'SERV-INSPECCION' }
];

// Elementos del DOM
const tabButtons = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const productosGrid = document.getElementById('productos-grid');
const carritoItems = document.getElementById('carrito-items');
const searchProducto = document.getElementById('search-producto');
const categoriaFilter = document.getElementById('categoria-filter');
const btnLimpiar = document.getElementById('btn-limpiar');
const btnVender = document.getElementById('btn-vender');
const btnBack = document.getElementById('btn-back');
const btnVerVentas = document.getElementById('btn-ver-ventas');

const totalSubtotal = document.getElementById('total-subtotal');
const totalIgv = document.getElementById('total-igv');
const totalFinal = document.getElementById('total-final');

const modalBoleta = document.getElementById('modal-boleta');
const modalVentasDia = document.getElementById('modal-ventas-dia');
const btnCloseBoleta = document.getElementById('btn-close-boleta');
const btnCloseVentas = document.getElementById('btn-close-ventas');
const btnNuevaVenta = document.getElementById('btn-nueva-venta');
const btnImprimir = document.getElementById('btn-imprimir');

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', async () => {
    await cargarProductos();
    await cargarCategorias();
    configurarEventListeners();
});

// Configurar event listeners
function configurarEventListeners() {
    // Tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => cambiarTab(button.dataset.tab));
    });

    // Búsqueda y filtros
    searchProducto.addEventListener('input', filtrarProductos);
    categoriaFilter.addEventListener('change', filtrarProductos);

    // Botones principales
    btnLimpiar.addEventListener('click', limpiarCarrito);
    btnVender.addEventListener('click', procesarVenta);
    btnBack.addEventListener('click', () => window.location.href = 'index.html');
    btnVerVentas.addEventListener('click', mostrarVentasDelDia);

    // Servicios
    document.querySelectorAll('.btn-agregar-servicio').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.servicio-card');
            const servicio = card.dataset.servicio;
            const precio = parseFloat(card.dataset.precio);
            const nombre = card.querySelector('h3').textContent;
            agregarServicioAlCarrito(servicio, nombre, precio);
        });
    });

    // Modales
    btnCloseBoleta.addEventListener('click', () => modalBoleta.classList.add('hidden'));
    btnCloseVentas.addEventListener('click', () => modalVentasDia.classList.add('hidden'));
    btnNuevaVenta.addEventListener('click', nuevaVenta);
    btnImprimir.addEventListener('click', imprimirBoleta);
}

// Cambiar tabs
function cambiarTab(tabName) {
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
}

// Cargar productos
async function cargarProductos() {
    try {
        todosLosProductos = await API_VENTAS.getAllProducts();
        renderizarProductos(todosLosProductos);
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Cargar categorías
async function cargarCategorias() {
    try {
        const categorias = await API_VENTAS.getCategories();
        categoriaFilter.innerHTML = '<option value="">Todas las Categorías</option>';
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriaFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

// Filtrar productos
function filtrarProductos() {
    const searchTerm = searchProducto.value.toLowerCase();
    const categoriaSeleccionada = categoriaFilter.value;

    let productosFiltrados = todosLosProductos;

    if (searchTerm) {
        productosFiltrados = productosFiltrados.filter(p => 
            p.codigo.toLowerCase().includes(searchTerm) ||
            p.nombre.toLowerCase().includes(searchTerm)
        );
    }

    if (categoriaSeleccionada) {
        productosFiltrados = productosFiltrados.filter(p => p.categoria === categoriaSeleccionada);
    }

    renderizarProductos(productosFiltrados);
}

// Renderizar productos
function renderizarProductos(productos) {
    if (productos.length === 0) {
        productosGrid.innerHTML = '<div class="loading">No hay productos disponibles</div>';
        return;
    }

    productosGrid.innerHTML = productos.map(producto => {
        const sinStock = producto.stockActual <= 0;
        const stockClass = sinStock ? 'sin-stock' : '';
        const badgeStock = sinStock 
            ? '<span class="badge badge-danger">SIN STOCK</span>'
            : producto.stockBajo 
                ? '<span class="badge badge-warning">STOCK BAJO</span>'
                : '<span class="badge badge-success">DISPONIBLE</span>';

        return `
            <div class="producto-card ${stockClass}" ${!sinStock ? `onclick="agregarProductoAlCarrito(${producto.id})"` : ''}>
                <h3>${producto.nombre}</h3>
                <p class="producto-codigo">${producto.codigo}</p>
                <p class="producto-precio">S/ ${producto.precioVenta.toFixed(2)}</p>
                <p class="producto-stock">Stock: ${producto.stockActual}</p>
                ${badgeStock}
            </div>
        `;
    }).join('');
}

// Agregar producto al carrito
function agregarProductoAlCarrito(productoId) {
    const producto = todosLosProductos.find(p => p.id === productoId);
    
    if (!producto || producto.stockActual <= 0) {
        alert('Producto sin stock');
        return;
    }

    // Verificar si ya está en el carrito
    const itemExistente = carrito.find(item => item.productoId === productoId && !item.esServicio);
    
    if (itemExistente) {
        // Verificar que no exceda el stock
        if (itemExistente.cantidad + 1 > producto.stockActual) {
            alert(`Stock insuficiente. Disponible: ${producto.stockActual}`);
            return;
        }
        itemExistente.cantidad++;
    } else {
        carrito.push({
            productoId: producto.id,
            nombre: producto.nombre,
            codigo: producto.codigo,
            precioUnitario: producto.precioVenta,
            cantidad: 1,
            esServicio: false,
            stockDisponible: producto.stockActual
        });
    }

    actualizarCarrito();
}

// Agregar servicio al carrito
function agregarServicioAlCarrito(codigo, nombre, precio) {
    // Verificar si ya está en el carrito
    const itemExistente = carrito.find(item => item.codigo === codigo && item.esServicio);
    
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        // Crear un ID temporal para servicios (negativo para diferenciar)
        const servicioId = -carrito.filter(i => i.esServicio).length - 1;
        
        carrito.push({
            productoId: servicioId,
            nombre: nombre,
            codigo: codigo,
            precioUnitario: precio,
            cantidad: 1,
            esServicio: true,
            descripcion: nombre
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
                <p>Agrega productos o servicios para comenzar</p>
            </div>
        `;
        btnVender.disabled = true;
    } else {
        carritoItems.innerHTML = carrito.map((item, index) => {
            const subtotal = item.precioUnitario * item.cantidad;
            const tipoClass = item.esServicio ? 'servicio' : 'producto';
            const tipoLabel = item.esServicio ? 'Servicio' : 'Producto';

            return `
                <div class="carrito-item">
                    <div class="item-info">
                        <div class="item-nombre">${item.nombre}</div>
                        <div class="item-codigo">${item.codigo}</div>
                        <span class="item-tipo ${tipoClass}">${tipoLabel}</span>
                        ${!item.esServicio ? `<div style="font-size: 11px; color: #999; margin-top: 3px;">Stock disponible: ${item.stockDisponible}</div>` : ''}
                    </div>
                    
                    <div class="item-cantidad">
                        <button class="btn-cantidad" onclick="cambiarCantidad(${index}, -1)">-</button>
                        <input type="number" class="cantidad-input" value="${item.cantidad}" 
                               onchange="actualizarCantidadDirecta(${index}, this.value)" min="1"
                               ${!item.esServicio ? `max="${item.stockDisponible}"` : ''}>
                        <button class="btn-cantidad" onclick="cambiarCantidad(${index}, 1)">+</button>
                    </div>
                    
                    <div class="item-precio">
                        <div class="precio-unitario">S/ ${item.precioUnitario.toFixed(2)} c/u</div>
                        <div class="precio-subtotal">S/ ${subtotal.toFixed(2)}</div>
                    </div>
                    
                    <button class="btn-eliminar" onclick="eliminarDelCarrito(${index})">🗑️</button>
                </div>
            `;
        }).join('');
        
        btnVender.disabled = false;
    }

    calcularTotales();
}

// Cambiar cantidad
function cambiarCantidad(index, cambio) {
    const item = carrito[index];
    const nuevaCantidad = item.cantidad + cambio;

    if (nuevaCantidad < 1) {
        eliminarDelCarrito(index);
        return;
    }

    // Verificar stock si es producto
    if (!item.esServicio && nuevaCantidad > item.stockDisponible) {
        alert(`Stock insuficiente. Disponible: ${item.stockDisponible}`);
        return;
    }

    item.cantidad = nuevaCantidad;
    actualizarCarrito();
}

// Actualizar cantidad directamente
function actualizarCantidadDirecta(index, valor) {
    const cantidad = parseInt(valor);
    const item = carrito[index];

    if (isNaN(cantidad) || cantidad < 1) {
        item.cantidad = 1;
    } else if (!item.esServicio && cantidad > item.stockDisponible) {
        alert(`Stock insuficiente. Disponible: ${item.stockDisponible}`);
        item.cantidad = item.stockDisponible;
    } else {
        item.cantidad = cantidad;
    }

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
    
    if (confirm('¿Estás seguro de limpiar todo el carrito?')) {
        carrito = [];
        document.getElementById('input-cliente').value = '';
        document.getElementById('input-documento').value = '';
        document.getElementById('input-observaciones').value = '';
        actualizarCarrito();
    }
}

// Calcular totales
function calcularTotales() {
    const subtotal = carrito.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    totalSubtotal.textContent = `S/ ${subtotal.toFixed(2)}`;
    totalIgv.textContent = `S/ ${igv.toFixed(2)}`;
    totalFinal.textContent = `S/ ${total.toFixed(2)}`;
}

// Procesar venta
async function procesarVenta() {
    if (carrito.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    const cliente = document.getElementById('input-cliente').value.trim();
    const documento = document.getElementById('input-documento').value.trim();
    const observaciones = document.getElementById('input-observaciones').value.trim();

    // Preparar datos para la venta
    const ventaData = {
        cliente: cliente || 'Cliente General',
        documento: documento || '',
        observaciones: observaciones || '',
        detalles: carrito.map(item => ({
            productoId: item.esServicio ? 
                // Para servicios, crear un producto temporal o usar uno existente
                // Aquí asumimos que tienes productos de servicios en la BD
                todosLosProductos[0].id : // NOTA: Deberías crear productos para servicios
                item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            esServicio: item.esServicio,
            descripcion: item.esServicio ? item.nombre : null
        }))
    };

    try {
        btnVender.disabled = true;
        btnVender.textContent = 'Procesando...';

        const venta = await API_VENTAS.registrarVenta(ventaData);
        
        mostrarBoleta(venta);
        
    } catch (error) {
        alert('Error al procesar la venta: ' + error.message);
        btnVender.disabled = false;
        btnVender.textContent = '💰 Procesar Venta';
    }
}

// Mostrar boleta
function mostrarBoleta(venta) {
    const boletaContent = document.getElementById('boleta-content');
    
    const fecha = new Date(venta.fechaVenta);
    const fechaFormateada = fecha.toLocaleDateString('es-PE', {
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
            ${venta.documento ? `<p><strong>Documento:</strong> ${venta.documento}</p>` : ''}
        </div>

        <div class="boleta-detalles">
            <h3>Detalle de la Venta</h3>
            <table>
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th>Cant.</th>
                        <th>P. Unit.</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${venta.detalles.map(detalle => `
                        <tr>
                            <td>
                                ${detalle.productoNombre}
                                ${detalle.esServicio ? '<span class="badge badge-warning" style="margin-left: 5px;">Servicio</span>' : ''}
                            </td>
                            <td>${detalle.cantidad}</td>
                            <td>S/ ${detalle.precioUnitario.toFixed(2)}</td>
                            <td>S/ ${detalle.subtotal.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="boleta-totales">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>S/ ${venta.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
                <span>IGV (18%):</span>
                <span>S/ ${venta.igv.toFixed(2)}</span>
            </div>
            <div class="total-row total-final">
                <span>TOTAL:</span>
                <span>S/ ${venta.total.toFixed(2)}</span>
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
    document.getElementById('input-documento').value = '';
    document.getElementById('input-observaciones').value = '';
    actualizarCarrito();
    btnVender.disabled = false;
    btnVender.textContent = '💰 Procesar Venta';
    
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
                h3 { color: #667eea; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background: #667eea; color: white; }
                .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
                .total-final { border-top: 2px solid #667eea; margin-top: 10px; padding-top: 10px; font-size: 18px; font-weight: bold; }
                .boleta-info { background: #f8f9ff; padding: 15px; border-radius: 8px; margin: 10px 0; }
                @media print {
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <h1 style="text-align: center; color: #667eea;">🛞 Llantería - Boleta de Venta</h1>
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
        const ventas = await API_VENTAS.getVentasDelDia();
        
        if (ventas.length === 0) {
            ventasLista.innerHTML = '<div class="loading">No hay ventas registradas hoy</div>';
            document.getElementById('stat-cantidad-ventas').textContent = '0';
            document.getElementById('stat-monto-total').textContent = 'S/ 0.00';
            return;
        }

        const montoTotal = ventas.reduce((sum, v) => sum + v.total, 0);
        
        document.getElementById('stat-cantidad-ventas').textContent = ventas.length;
        document.getElementById('stat-monto-total').textContent = `S/ ${montoTotal.toFixed(2)}`;

        ventasLista.innerHTML = ventas.map(venta => {
            const fecha = new Date(venta.fechaVenta);
            const fechaFormateada = fecha.toLocaleString('es-PE', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="venta-item">
                    <div class="venta-header">
                        <div>
                            <div class="venta-numero">${venta.numeroBoleta}</div>
                            <div class="venta-fecha">${fechaFormateada} - ${venta.cliente}</div>
                        </div>
                        <div class="venta-total">S/ ${venta.total.toFixed(2)}</div>
                    </div>
                    <div class="venta-detalles">
                        ${venta.detalles.length} producto(s)/servicio(s)
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        ventasLista.innerHTML = '<div class="loading">Error al cargar ventas</div>';
        console.error('Error:', error);
    }
}