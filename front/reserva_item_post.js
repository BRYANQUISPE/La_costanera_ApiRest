// reserva_item_post.js
const url = "http://127.0.0.1:8000/reserva_item/";

document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('FormularioData');
    
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datos = {
                reserva_id: parseInt(document.getElementById('reserva_id').value),
                paquete_id: parseInt(document.getElementById('paquete_id').value),
                cantidad: parseInt(document.getElementById('cantidad').value)
            };
            
            // Validaciones
            if (!datos.reserva_id || !datos.paquete_id || !datos.cantidad) {
                mostrarMensaje('error', 'Todos los campos son obligatorios');
                return;
            }
            
            if (datos.cantidad < 1) {
                mostrarMensaje('error', 'La cantidad debe ser mayor a 0');
                return;
            }
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.detail || 'Error al guardar el ítem');
                }
                
                const data = await response.json();
                mostrarMensaje('success', 'Ítem guardado correctamente');
                formulario.reset();
                
                // Opcional: redirigir después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'reserva_item_get.html';
                }, 2000);
                
            } catch (error) {
                mostrarMensaje('error', error.message);
            }
        });
    }
    
    // Validar que cantidad sea positiva
    document.getElementById('cantidad').addEventListener('input', function() {
        if (this.value < 1) this.value = 1;
    });
});

function mostrarMensaje(tipo, texto) {
    // Eliminar mensaje anterior si existe
    const msgAnterior = document.querySelector('.alert-success, .alert-error');
    if (msgAnterior) msgAnterior.remove();
    
    const mensaje = document.createElement('div');
    mensaje.className = tipo === 'success' ? 'alert-success' : 'alert-error';
    mensaje.innerHTML = `<i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${texto}`;
    
    const formulario = document.getElementById('FormularioData');
    formulario.parentNode.insertBefore(mensaje, formulario);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => mensaje.remove(), 5000);
}