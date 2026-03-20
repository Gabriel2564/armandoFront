/* ====================================================
   PROVEEDORES — Autocompletado bidireccional RUC <-> Nombre
   ==================================================== */

var proveedoresCache = [];

/* Carga todos los proveedores al inicio */
async function cargarProveedoresCache() {
    try {
        var resp = await fetch(API_BASE + '/proveedores');
        if (resp.ok) proveedoresCache = await resp.json();
    } catch (err) { console.error('Error cargando proveedores', err); }
}

/* Flash verde en un input para confirmar autocompletado */
function flashInput(input) {
    input.style.borderColor = '#2ecc71';
    input.style.transition = 'border-color 0.3s';
    setTimeout(function () { input.style.borderColor = ''; }, 1500);
}

/* ====================================================
   REGISTRO DE PARES RUC <-> PROVEEDOR
   Cada par: [idInputRUC, idInputProveedor]
   ==================================================== */
var paresRucProveedor = [
    ['entLlantaRuc',    'entLlantaProveedor'],
    ['entServicioRuc',  'entServicioProveedor'],
];

document.addEventListener('DOMContentLoaded', function () {

    // Cargar cache de proveedores
    cargarProveedoresCache();

    // ---- Registrar listeners para cada par ----
    paresRucProveedor.forEach(function (par) {
        var rucInput  = document.getElementById(par[0]);
        var provInput = document.getElementById(par[1]);
        if (!rucInput || !provInput) return;

        // RUC -> Nombre (cuando RUC tiene 11 dígitos)
        rucInput.addEventListener('input', function () {
            var ruc = rucInput.value.trim();
            if (ruc.length === 11) {
                var prov = proveedoresCache.find(function (p) { return p.ruc === ruc; });
                if (prov) {
                    provInput.value = prov.nombre.toUpperCase();
                    flashInput(provInput);
                }
            }
        });

        // Nombre -> RUC (búsqueda por nombre mientras escribe)
        provInput.addEventListener('input', function () {
            var nombre = provInput.value.trim().toUpperCase();
            if (nombre.length < 3) return;
            var prov = proveedoresCache.find(function (p) {
                return p.nombre.toUpperCase().includes(nombre);
            });
            if (prov) {
                rucInput.value = prov.ruc;
                flashInput(rucInput);
            }
        });
    });

    // ---- Mayúsculas automáticas en todos los inputs de texto de formularios ----
    // Se aplica de forma global con un listener en el documento
    document.addEventListener('input', function (e) {
        var el = e.target;
        // Solo inputs tipo text, number no procesados como text, search, etc.
        // Excluir: passwords, emails, urls, fecha, búsquedas internas de dropdown de llantas
        if (el.tagName !== 'INPUT') return;
        var tipo = (el.type || 'text').toLowerCase();
        var excluidos = ['password', 'email', 'url', 'date', 'time', 'datetime-local', 'color', 'range', 'file', 'hidden', 'checkbox', 'radio'];
        if (excluidos.includes(tipo)) return;
        var pos = el.selectionStart;
        var val = el.value.toUpperCase();
        if (el.value !== val) {
            el.value = val;
            // Restaurar posición del cursor
            try { el.setSelectionRange(pos, pos); } catch(e) {}
        }
    });
});