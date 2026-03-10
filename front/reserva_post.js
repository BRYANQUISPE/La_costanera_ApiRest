// reserva_post.js - Versión para DATE (solo fecha)
const url = "http://127.0.0.1:8000/reserva/";

document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('FormularioData');
    
    // Mostrar fecha actual
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    
    document.getElementById('fechaActual').textContent = 
        `${dia}/${mes}/${año}`;
    
    // Cambiar input de datetime-local a date
    const fechaInput = document.getElementById('fecha_reserva');
    fechaInput.type = 'date';  // Cambiar a solo fecha
    fechaInput.value = `${año}-${mes}-${dia}`;  // Formato YYYY-MM-DD
    
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Obtener la fecha del input (ya viene en formato YYYY-MM-DD)
            const fechaValue = document.getElementById('fecha_reserva').value;
            
            const datos = {
                cliente_id: parseInt(document.getElementById('cliente_id').value),
                usuario_id: parseInt(document.getElementById('usuario_id').value),
                fecha_reserva: fechaValue,  // Solo YYYY-MM-DD
                estado: document.getElementById('estado').value
            };
            
            console.log('Datos a enviar:', datos);  // Para debug
            
            // Validaciones
            if (!datos.cliente_id || !datos.usuario_id || !datos.fecha_reserva || !datos.estado) {
                mostrarMensaje('error', 'Todos los campos son obligatorios');
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
                    console.error('Error del servidor:', error);
                    throw new Error(error.detail || 'Error al guardar la reserva');
                }
                
                const data = await response.json();
                mostrarMensaje('success', 'Reserva guardada correctamente');
                formulario.reset();
                
                // Restaurar fecha actual
                const ahora = new Date();
                const año = ahora.getFullYear();
                const mes = String(ahora.getMonth() + 1).padStart(2, '0');
                const dia = String(ahora.getDate()).padStart(2, '0');
                document.getElementById('fecha_reserva').value = `${año}-${mes}-${dia}`;
                
                // Opcional: redirigir después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'reserva_get.html';
                }, 2000);
                
            } catch (error) {
                console.error('Error completo:', error);
                mostrarMensaje('error', error.message);
            }
        });
    }
    
    // Validar IDs positivos
    document.getElementById('cliente_id').addEventListener('input', function() {
        if (this.value < 1) this.value = 1;
    });
    
    document.getElementById('usuario_id').addEventListener('input', function() {
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