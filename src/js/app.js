// Estado de la aplicación
let allProducts = [];
let currentEditingId = null;

// Elementos del DOM
const modal = document.getElementById('modal');
const btnNewProduct = document.getElementById('btn-new-product');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel');
const btnRefresh = document.getElementById('btn-refresh');
const btnStockBajo = document.getElementById('btn-stock-bajo');
const productForm = document.getElementById('product-form');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const productsBody = document.getElementById('products-body');
const modalTitle = document.getElementById('modal-title');

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    await loadStatistics();
    await loadCategories();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    btnNewProduct.addEventListener('click', openModalForNew);
    btnCloseModal.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    btnRefresh.addEventListener('click', loadProducts);
    btnStockBajo.addEventListener('click', showLowStockProducts);
    productForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', handleSearch);
    categoryFilter.addEventListener('change', handleCategoryFilter);
}

// Cargar productos
async function loadProducts() {
    try {
        allProducts = await API.getAllProducts();
        renderProducts(allProducts);
        await loadStatistics();
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Cargar estadísticas
async function loadStatistics() {
    try {
        const stats = await API.getStatistics();
        document.getElementById('stat-total').textContent = stats.totalProductos || 0;
        document.getElementById('stat-bajo').textContent = stats.productosConStockBajo || 0;
        document.getElementById('stat-categorias').textContent = stats.totalCategorias || 0;
        document.getElementById('stat-valor').textContent = `$${(stats.valorTotalInventario || 0).toFixed(2)}`;
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Cargar categorías
async function loadCategories() {
    try {
        const categories = await API.getCategories();
        const categoryFilter = document.getElementById('category-filter');
        const categoriesList = document.getElementById('categorias-list');
        
        categoryFilter.innerHTML = '<option value="">Todas las Categorías</option>';
        categoriesList.innerHTML = '';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
            
            const dataOption = document.createElement('option');
            dataOption.value = category;
            categoriesList.appendChild(dataOption);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

// Renderizar productos en la tabla
function renderProducts(products) {
    if (products.length === 0) {
        productsBody.innerHTML = '<tr><td colspan="10" class="loading">No hay productos para mostrar</td></tr>';
        return;
    }

    productsBody.innerHTML = products.map(product => `
        <tr class="${product.stockBajo ? 'stock-bajo' : ''}">
            <td><strong>${product.codigo}</strong></td>
            <td>${product.nombre}</td>
            <td>${product.categoria || '-'}</td>
            <td>
                ${product.stockActual}
                ${product.stockBajo ? '<span class="badge badge-danger">BAJO</span>' : ''}
            </td>
            <td>${product.stockMinimo || 0}</td>
            <td>$${product.precioCompra?.toFixed(2) || '0.00'}</td>
            <td>$${product.precioVenta?.toFixed(2) || '0.00'}</td>
            <td>
                $${product.margenGanancia?.toFixed(2) || '0.00'}
                <small>(${product.porcentajeMargen?.toFixed(1) || '0.0'}%)</small>
            </td>
            <td>${product.proveedor || '-'}</td>
            <td>
                <button class="btn btn-info" onclick="editProduct(${product.id})">✏️</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id}, '${product.nombre}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Abrir modal para nuevo producto
function openModalForNew() {
    currentEditingId = null;
    modalTitle.textContent = 'Nuevo Producto';
    productForm.reset();
    modal.classList.remove('hidden');
}

// Editar producto
async function editProduct(id) {
    currentEditingId = id;
    const product = allProducts.find(p => p.id === id);
    
    if (!product) return;
    
    modalTitle.textContent = 'Editar Producto';
    document.getElementById('input-codigo').value = product.codigo;
    document.getElementById('input-nombre').value = product.nombre;
    document.getElementById('input-descripcion').value = product.descripcion || '';
    document.getElementById('input-categoria').value = product.categoria || '';
    document.getElementById('input-proveedor').value = product.proveedor || '';
    document.getElementById('input-precio-compra').value = product.precioCompra || 0;
    document.getElementById('input-precio-venta').value = product.precioVenta || 0;
    document.getElementById('input-stock-actual').value = product.stockActual;
    document.getElementById('input-stock-minimo').value = product.stockMinimo || 0;
    document.getElementById('input-ubicacion').value = product.ubicacion || '';
    
    modal.classList.remove('hidden');
}

// Eliminar producto
async function deleteProduct(id, nombre) {
    if (!confirm(`¿Está seguro de eliminar el producto "${nombre}"?`)) return;
    
    try {
        await API.deleteProduct(id);
        alert('Producto eliminado correctamente');
        await loadProducts();
    } catch (error) {
        alert('Error al eliminar producto: ' + error.message);
    }
}

// Cerrar modal
function closeModal() {
    modal.classList.add('hidden');
    productForm.reset();
    currentEditingId = null;
}

// Manejar envío del formulario
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const productData = {
        codigo: document.getElementById('input-codigo').value,
        nombre: document.getElementById('input-nombre').value,
        descripcion: document.getElementById('input-descripcion').value,
        categoria: document.getElementById('input-categoria').value,
        proveedor: document.getElementById('input-proveedor').value,
        precioCompra: parseFloat(document.getElementById('input-precio-compra').value) || 0,
        precioVenta: parseFloat(document.getElementById('input-precio-venta').value) || 0,
        stockActual: parseInt(document.getElementById('input-stock-actual').value) || 0,
        stockMinimo: parseInt(document.getElementById('input-stock-minimo').value) || 0,
        ubicacion: document.getElementById('input-ubicacion').value
    };
    
    try {
        if (currentEditingId) {
            await API.updateProduct(currentEditingId, productData);
            alert('Producto actualizado correctamente');
        } else {
            await API.createProduct(productData);
            alert('Producto creado correctamente');
        }
        closeModal();
        await loadProducts();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Buscar productos
async function handleSearch() {
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm.length === 0) {
        renderProducts(allProducts);
        return;
    }
    
    if (searchTerm.length < 2) return;
    
    try {
        const results = await API.searchProducts(searchTerm);
        renderProducts(results);
    } catch (error) {
        console.error('Error al buscar:', error);
    }
}

// Filtrar por categoría
function handleCategoryFilter() {
    const selectedCategory = categoryFilter.value;
    
    if (selectedCategory === '') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.categoria === selectedCategory);
        renderProducts(filtered);
    }
}

// Mostrar productos con stock bajo
async function showLowStockProducts() {
    try {
        const lowStockProducts = await API.getProductsLowStock();
        renderProducts(lowStockProducts);
        searchInput.value = '';
        categoryFilter.value = '';
    } catch (error) {
        console.error('Error:', error);
    }
}