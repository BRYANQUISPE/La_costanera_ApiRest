// comprobante_post.js
const url = "http://127.0.0.1:8000/comprobante/";
const urlPago = "http://127.0.0.1:8000/pago/";

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
    const fechaInput = document.getElementById('fecha_emision');
    fechaInput.value = `${año}-${mes}-${dia}`;
    
    // Actualizar preview
    actualizarPreview();
    
    // Evento para cargar información del pago
    document.getElementById('pago_id').addEventListener('blur', function() {
        const pagoId = this.value;
        if (pagoId) {
            cargarInfoPago(pagoId);
        }
    });
    
    // Eventos para actualizar preview
    document.getElementById('pago_id').addEventListener('input', actualizarPreview);
    document.getElementById('fecha_emision').addEventListener('input', actualizarPreview);
    
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datos = {
                pago_id: parseInt(document.getElementById('pago_id').value),
                fecha_emision: document.getElementById('fecha_emision').value
            };
            
            console.log('📤 Enviando datos:', datos);
            
            // Validaciones
            if (!datos.pago_id || !datos.fecha_emision) {
                mostrarMensaje('error', 'Todos los campos son obligatorios');
                return;
            }
            
            if (datos.pago_id < 1) {
                mostrarMensaje('error', 'El ID de pago debe ser un número positivo');
                return;
            }
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
                
                // Intentar obtener el cuerpo de la respuesta como JSON
                let errorData = null;
                try {
                    errorData = await response.json();
                } catch (e) {
                    console.log('No se pudo parsear respuesta JSON');
                }
                
                if (!response.ok) {
                    console.error('❌ Error del servidor:', response.status, errorData);
                    
                    // Mostrar mensaje de error detallado
                    let mensajeError = 'Error al generar el comprobante';
                    
                    if (errorData) {
                        if (errorData.detail) {
                            mensajeError = errorData.detail;
                        } else if (errorData.message) {
                            mensajeError = errorData.message;
                        } else if (typeof errorData === 'string') {
                            mensajeError = errorData;
                        }
                    }
                    
                    // Errores comunes
                    if (response.status === 409) {
                        mensajeError = '❌ Ya existe un comprobante para este pago';
                    } else if (response.status === 404) {
                        mensajeError = '❌ El pago especificado no existe';
                    } else if (response.status === 422) {
                        mensajeError = '❌ Datos inválidos. Verifique el formato de la fecha';
                    }
                    
                    throw new Error(mensajeError);
                }
                
                console.log('✅ Comprobante generado:', errorData);
                mostrarMensaje('success', 'Comprobante generado correctamente');
                formulario.reset();
                
                // Restaurar fecha actual
                const ahora = new Date();
                const año = ahora.getFullYear();
                const mes = String(ahora.getMonth() + 1).padStart(2, '0');
                const dia = String(ahora.getDate()).padStart(2, '0');
                document.getElementById('fecha_emision').value = `${año}-${mes}-${dia}`;
                
                // Ocultar información del pago
                document.getElementById('pagoInfo').style.display = 'none';
                
                // Actualizar preview
                actualizarPreview();
                
                // Redirigir después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'comprobante_get.html';
                }, 2000);
                
            } catch (error) {
                console.error('❌ Error completo:', error);
                mostrarMensaje('error', error.message);
            }
        });
    }
});

async function cargarInfoPago(pagoId) {
    try {
        const response = await fetch(`${urlPago}${pagoId}`);
        if (response.ok) {
            const pago = await response.json();
            
            document.getElementById('infoPagoId').textContent = pago.pago_id;
            document.getElementById('infoMonto').textContent = `Bs ${pago.monto}`;
            
            // Formatear fecha del pago
            const fecha = new Date(pago.fecha_pago + 'T00:00:00');
            document.getElementById('infoFechaPago').textContent = 
                fecha.toLocaleDateString('es-ES');
            
            document.getElementById('pagoInfo').style.display = 'flex';
        } else {
            document.getElementById('pagoInfo').style.display = 'none';
            
            if (response.status === 404) {
                mostrarMensaje('error', 'El pago especificado no existe');
            }
        }
    } catch (error) {
        console.log('No se pudo obtener información del pago');
        document.getElementById('pagoInfo').style.display = 'none';
    }
}

function actualizarPreview() {
    const pagoId = document.getElementById('pago_id').value || '---';
    const fecha = document.getElementById('fecha_emision').value;
    
    document.getElementById('previewPagoId').textContent = pagoId;
    
    if (fecha) {
        const [año, mes, dia] = fecha.split('-');
        document.getElementById('previewFecha').textContent = `${dia}/${mes}/${año}`;
    } else {
        document.getElementById('previewFecha').textContent = '---';
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