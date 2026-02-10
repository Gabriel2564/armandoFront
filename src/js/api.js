const API_BASE_URL = 'http://localhost:8087/api';

const API = {
    // ========== PRODUCTOS ==========
    
    async obtenerProductos() {
        try {
            const response = await fetch(`${API_BASE_URL}/productos`);
            if (!response.ok) throw new Error('Error al obtener productos');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor. Verifica que el backend esté corriendo en el puerto 8087.');
            return [];
        }
    },

    async obtenerProductoPorCodigo(codigo) {
        try {
            const response = await fetch(`${API_BASE_URL}/productos/codigo/${codigo}`);
            if (!response.ok) throw new Error('Error al obtener producto');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    async obtenerTiposProductos() {
        try {
            const response = await fetch(`${API_BASE_URL}/productos/tipos`);
            if (!response.ok) throw new Error('Error al obtener tipos');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    async buscarProductos(termino) {
        try {
            const response = await fetch(`${API_BASE_URL}/productos/buscar?q=${encodeURIComponent(termino)}`);
            if (!response.ok) throw new Error('Error al buscar productos');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    // ========== LOTES ==========
    
    async obtenerLotes() {
        try {
            const response = await fetch(`${API_BASE_URL}/lotes`);
            if (!response.ok) throw new Error('Error al obtener lotes');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    async obtenerLotesActivos() {
        try {
            const response = await fetch(`${API_BASE_URL}/lotes/activos`);
            if (!response.ok) throw new Error('Error al obtener lotes activos');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    async obtenerLotesPorTipo(tipo) {
        try {
            const response = await fetch(`${API_BASE_URL}/lotes/tipo/${tipo}`);
            if (!response.ok) throw new Error('Error al obtener lotes por tipo');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    async crearLote(loteData) {
        try {
            const response = await fetch(`${API_BASE_URL}/lotes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loteData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al crear lote');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    // ========== VENTAS ==========
    
    async registrarVenta(ventaData) {
        try {
            const response = await fetch(`${API_BASE_URL}/ventas`, {
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

    async obtenerVentasDelDia() {
        try {
            const response = await fetch(`${API_BASE_URL}/ventas/hoy`);
            if (!response.ok) throw new Error('Error al obtener ventas del día');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    },

    async obtenerVentaPorId(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/ventas/${id}`);
            if (!response.ok) throw new Error('Error al obtener venta');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
};