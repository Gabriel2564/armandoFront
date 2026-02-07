const API_BASE_URL = 'http://localhost:8087/api';
const API_PRODUCTOS_URL = `${API_BASE_URL}/productos`;
const API_VENTAS_URL = `${API_BASE_URL}/ventas`;

const API_VENTAS = {
    // ========== PRODUCTOS ==========
    
    async getAllProducts() {
        try {
            const response = await fetch(API_PRODUCTOS_URL);
            if (!response.ok) throw new Error('Error al obtener productos');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor. Verifica que el backend esté corriendo.');
            return [];
        }
    },

    async searchProducts(term) {
        try {
            const response = await fetch(`${API_PRODUCTOS_URL}/buscar?q=${encodeURIComponent(term)}`);
            if (!response.ok) throw new Error('Error al buscar productos');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    async getCategories() {
        try {
            const response = await fetch(`${API_PRODUCTOS_URL}/categorias/todas`);
            if (!response.ok) throw new Error('Error al obtener categorías');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    // ========== VENTAS ==========
    
    async registrarVenta(ventaData) {
        try {
            const response = await fetch(API_VENTAS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ventaData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al registrar venta');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    async getVentasDelDia() {
        try {
            const response = await fetch(`${API_VENTAS_URL}/hoy`);
            if (!response.ok) throw new Error('Error al obtener ventas del día');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    async getVentaPorId(id) {
        try {
            const response = await fetch(`${API_VENTAS_URL}/${id}`);
            if (!response.ok) throw new Error('Error al obtener venta');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
};