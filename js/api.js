const API_BASE = 'http://localhost:8087/api';

const api = {
    llantas: {
        listar: () => fetchJSON(`${API_BASE}/llantas`),
        obtener: (id) => fetchJSON(`${API_BASE}/llantas/${id}`),
        buscar: (filtro) => fetchJSON(`${API_BASE}/llantas/buscar?filtro=${encodeURIComponent(filtro)}`),
        crear: (data) => fetchJSON(`${API_BASE}/llantas`, 'POST', data),
        actualizar: (id, data) => fetchJSON(`${API_BASE}/llantas/${id}`, 'PUT', data),
        eliminar: (id) => fetchJSON(`${API_BASE}/llantas/${id}`, 'DELETE'),
    },
    servicios: {
        listar: () => fetchJSON(`${API_BASE}/servicios`),
        obtener: (id) => fetchJSON(`${API_BASE}/servicios/${id}`),
        buscar: (filtro) => fetchJSON(`${API_BASE}/servicios/buscar?filtro=${encodeURIComponent(filtro)}`),
        crear: (data) => fetchJSON(`${API_BASE}/servicios`, 'POST', data),
        actualizar: (id, data) => fetchJSON(`${API_BASE}/servicios/${id}`, 'PUT', data),
        eliminar: (id) => fetchJSON(`${API_BASE}/servicios/${id}`, 'DELETE'),
    },
    entradasLlantas: {
        listar: () => fetchJSON(`${API_BASE}/entradas/llantas`),
        obtener: (id) => fetchJSON(`${API_BASE}/entradas/llantas/${id}`),
        registrar: (data) => fetchJSON(`${API_BASE}/entradas/llantas`, 'POST', data),
        eliminar: (id) => fetchJSON(`${API_BASE}/entradas/llantas/${id}`, 'DELETE'),
    },
    entradasServicios: {
        listar: () => fetchJSON(`${API_BASE}/entradas/servicios`),
        obtener: (id) => fetchJSON(`${API_BASE}/entradas/servicios/${id}`),
        registrar: (data) => fetchJSON(`${API_BASE}/entradas/servicios`, 'POST', data),
        eliminar: (id) => fetchJSON(`${API_BASE}/entradas/servicios/${id}`, 'DELETE'),
    },
    ordenes: {
        listar: () => fetchJSON(`${API_BASE}/ordenes`),
        obtener: (id) => fetchJSON(`${API_BASE}/ordenes/${id}`),
        buscarCliente: (cliente) => fetchJSON(`${API_BASE}/ordenes/buscar/cliente?cliente=${encodeURIComponent(cliente)}`),
        buscarPlaca: (placa) => fetchJSON(`${API_BASE}/ordenes/buscar/placa?placa=${encodeURIComponent(placa)}`),
        registrar: (data) => fetchJSON(`${API_BASE}/ordenes`, 'POST', data),
        eliminar: (id) => fetchJSON(`${API_BASE}/ordenes/${id}`, 'DELETE'),
    },
};

async function fetchJSON(url, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    if (method === 'DELETE' && response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || 'Error en la solicitud');
    return data;
}

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    var p = dateStr.split('-');
    return p[2] + '-' + p[1] + '-' + p[0];
}

function formatMoney(amount) {
    if (amount == null) return '0.00';
    return parseFloat(amount).toFixed(2);
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function formatFormaPago(fp) {
    var map = {
        'EFECTIVO': 'EFECTIVO',
        'TRANSFERENCIA_BANCARIA': 'TRANSFERENCIA BANCARIA',
        'YAPE': 'YAPE',
        'PLIN': 'PLIN',
        'TARJETA': 'TARJETA'
    };
    return map[fp] || fp || '';
}