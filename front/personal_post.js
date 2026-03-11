// personal_post.js
const url = "http://127.0.0.1:8000/personal/";

document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('FormularioData');
    
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Construir objeto con los datos
            const datos = {
                nombres: document.getElementById('nombres').value,
                apellidos: document.getElementById('apellidos').value,
                cargo: document.getElementById('cargo').value,
                telefono: parseInt(document.getElementById('telefono').value)
            };
            
            // Agregar usuario_id solo si tiene valor
            const usuarioId = document.getElementById('usuario_id').value;
            if (usuarioId) {
                datos.usuario_id = parseInt(usuarioId);
            }
            
            console.log('📤 Enviando datos:', datos);
            
            // Validaciones
            if (!datos.nombres || !datos.apellidos || !datos.cargo || !datos.telefono) {
                mostrarMensaje('error', 'Todos los campos son obligatorios');
                return;
            }
            
            if (datos.telefono < 1000000) {
                mostrarMensaje('error', 'El teléfono debe ser válido (mínimo 7 dígitos)');
                return;
            }
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
                
                // Intentar obtener la respuesta como JSON
                let responseData;
                try {
                    responseData = await response.json();
                } catch (e) {
                    responseData = { error: 'No se pudo parsear respuesta' };
                }
                
                if (!response.ok) {
                    console.error('❌ Error del servidor:', response.status, responseData);
                    
                    let mensajeError = 'Error al registrar personal';
                    
                    if (responseData.detail) {
                        mensajeError = responseData.detail;
                    } else if (responseData.message) {
                        mensajeError = responseData.message;
                    }
                    
                    // Errores específicos
                    if (response.status === 409) {
                        mensajeError = '❌ El usuario ya está asociado a otro personal';
                    } else if (response.status === 404) {
                        mensajeError = '❌ El usuario especificado no existe';
                    } else if (response.status === 422) {
                        mensajeError = '❌ Datos inválidos. Verifique los campos';
                    }
                    
                    throw new Error(mensajeError);
                }
                
                console.log('✅ Personal registrado:', responseData);
                mostrarMensaje('success', 'Personal registrado correctamente');
                formulario.reset();
                
                // Redirigir después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'personal_get.html';
                }, 2000);
                
            } catch (error) {
                console.error('❌ Error completo:', error);
                mostrarMensaje('error', error.message);
            }
        });
    }
    
    // Validar teléfono (solo números)
    document.getElementById('telefono').addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
});

// Función para seleccionar cargo rápido
function seleccionarCargo(cargo) {
    document.getElementById('cargo').value = cargo;
    
    // Resaltar botón seleccionado
    document.querySelectorAll('.cargo-btn').forEach(btn => {
        btn.classList.remove('seleccionado');
    });
    event.target.classList.add('seleccionado');
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

// Hacer la función seleccionarCargo global
window.seleccionarCargo = seleccionarCargo;