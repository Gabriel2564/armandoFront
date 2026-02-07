const API_BASE_URL = 'http://localhost:8087/api/productos';

const API = {
    // Obtener todos los productos
    async getAllProducts() {
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) throw new Error('Error al obtener productos');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor. Verifica que el backend esté corriendo.');
            return [];
        }
    },

    // Crear producto
    async createProduct(productData) {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al crear producto');
            }
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Actualizar producto
    async updateProduct(id, productData) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            if (!response.ok) throw new Error('Error al actualizar producto');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Eliminar producto
    async deleteProduct(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Error al eliminar producto');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // Buscar productos
    async searchProducts(term) {
        try {
            const response = await fetch(`${API_BASE_URL}/buscar?q=${encodeURIComponent(term)}`);
            if (!response.ok) throw new Error('Error al buscar productos');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    // Obtener productos con stock bajo
    async getProductsLowStock() {
        try {
            const response = await fetch(`${API_BASE_URL}/stock-bajo`);
            if (!response.ok) throw new Error('Error al obtener productos con stock bajo');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    // Obtener estadísticas
    async getStatistics() {
        try {
            const response = await fetch(`${API_BASE_URL}/estadisticas`);
            if (!response.ok) throw new Error('Error al obtener estadísticas');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return {
                totalProductos: 0,
                productosConStockBajo: 0,
                totalCategorias: 0,
                valorTotalInventario: 0
            };
        }
    },

    // Obtener categorías
    async getCategories() {
        try {
            const response = await fetch(`${API_BASE_URL}/categorias/todas`);
            if (!response.ok) throw new Error('Error al obtener categorías');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    }
};