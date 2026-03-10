// pago_post.js
const url = "http://127.0.0.1:8000/pago/";
const urlReserva = "http://127.0.0.1:8000/reserva/"; // Para obtener información de la reserva

document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('FormularioData');
    
    // Mostrar fecha actual
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    
    document.getElementById('fechaActual').textContent = 
        `${dia}/${mes}/${año}`;
    
    // Establecer fecha actual por defecto
    const fechaInput = document.getElementById('fecha_pago');
    fechaInput.value = `${año}-${mes}-${dia}`;
    
    // Evento para cuando cambia el ID de reserva (opcional, para sugerir monto)
    document.getElementById('reserva_id').addEventListener('blur', function() {
        const reservaId = this.value;
        if (reservaId) {
            sugerirMonto(reservaId);
        }
    });
    
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datos = {
                reserva_id: parseInt(document.getElementById('reserva_id').value),
                monto: parseInt(document.getElementById('monto').value),
                fecha_pago: document.getElementById('fecha_pago').value
            };
            
            console.log('Datos a enviar:', datos);
            
            // Validaciones
            if (!datos.reserva_id || !datos.monto || !datos.fecha_pago) {
                mostrarMensaje('error', 'Todos los campos son obligatorios');
                return;
            }
            
            if (datos.reserva_id < 1) {
                mostrarMensaje('error', 'El ID de reserva debe ser un número positivo');
                return;
            }
            
            if (datos.monto < 1) {
                mostrarMensaje('error', 'El monto debe ser mayor a 0');
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
                    throw new Error(error.detail || 'Error al registrar el pago');
                }
                
                const data = await response.json();
                mostrarMensaje('success', 'Pago registrado correctamente');
                formulario.reset();
                
                // Restaurar fecha actual
                const ahora = new Date();
                const año = ahora.getFullYear();
                const mes = String(ahora.getMonth() + 1).padStart(2, '0');
                const dia = String(ahora.getDate()).padStart(2, '0');
                document.getElementById('fecha_pago').value = `${año}-${mes}-${dia}`;
                
                // Ocultar sugerencia
                document.getElementById('sugerenciaMonto').style.display = 'none';
                
                // Redirigir después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'pago_get.html';
                }, 2000);
                
            } catch (error) {
                console.error('Error completo:', error);
                mostrarMensaje('error', error.message);
            }
        });
    }
    
    // Validar monto positivo
    document.getElementById('monto').addEventListener('input', function() {
        if (this.value < 1) this.value = 1;
    });
});

// Función opcional para sugerir monto basado en la reserva
async function sugerirMonto(reservaId) {
    try {
        const response = await fetch(`${urlReserva}${reservaId}`);
        if (response.ok) {
            const reserva = await response.json();
            // Aquí puedes calcular el monto sugerido
            // Por ahora es un ejemplo
            document.getElementById('montoSugerido').textContent = `Bs 500`;
            document.getElementById('sugerenciaMonto').style.display = 'flex';
        }
    } catch (error) {
        console.log('No se pudo obtener información de la reserva');
    }
}

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