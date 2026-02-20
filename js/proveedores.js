/* ====== AUTOCOMPLETADO RUC -> PROVEEDOR ====== */

document.addEventListener('DOMContentLoaded', function () {
    // Pares de [inputRUC, inputProveedor]
    var pares = [
        ['entLlantaRuc', 'entLlantaProveedor'],
        ['entServicioRuc', 'entServicioProveedor'],
    ];

    pares.forEach(function (par) {
        var rucInput = document.getElementById(par[0]);
        var provInput = document.getElementById(par[1]);
        if (!rucInput || !provInput) return;

        rucInput.addEventListener('input', function () {
            var valor = rucInput.value.trim();
            // RUC peruano = 11 digitos
            if (valor.length === 11) {
                buscarProveedorPorRUC(valor, provInput);
            }
        });
    });
});

async function buscarProveedorPorRUC(ruc, inputDestino) {
    try {
        var response = await fetch(API_BASE + '/proveedores/ruc/' + ruc);
        if (response.ok) {
            var proveedor = await response.json();
            inputDestino.value = proveedor.nombre;
            // Flash verde para indicar que se encontro
            inputDestino.style.borderColor = '#2ecc71';
            inputDestino.style.transition = 'border-color 0.3s';
            setTimeout(function () { inputDestino.style.borderColor = ''; }, 1500);
        }
    } catch (err) {
        // RUC no encontrado, el usuario puede escribir manualmente
    }
}