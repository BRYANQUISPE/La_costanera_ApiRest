// rol_post.js
const url = "http://127.0.0.1:8000/rol/";

document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('FormularioData');
    
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datos = {
                nombre: document.getElementById('nombre').value
            };
            
            console.log('📤 Enviando datos:', datos);
            
            // Validaciones
            if (!datos.nombre) {
                mostrarMensaje('error', 'El nombre del rol es obligatorio');
                return;
            }
            
            if (datos.nombre.length < 3) {
                mostrarMensaje('error', 'El nombre debe tener al menos 3 caracteres');
                return;
            }
            
            if (datos.nombre.length > 60) {
                mostrarMensaje('error', 'El nombre no puede exceder los 60 caracteres');
                return;
            }
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
                
                let responseData;
                try {
                    responseData = await response.json();
                } catch (e) {
                    responseData = { error: 'No se pudo parsear respuesta' };
                }
                
                if (!response.ok) {
                    console.error('❌ Error del servidor:', response.status, responseData);
                    
                    let mensajeError = 'Error al crear rol';
                    
                    if (responseData.detail) {
                        mensajeError = responseData.detail;
                    }
                    
                    if (response.status === 409) {
                        mensajeError = '❌ Ya existe un rol con ese nombre';
                    } else if (response.status === 422) {
                        mensajeError = '❌ Datos inválidos. El nombre debe ser texto';
                    }
                    
                    throw new Error(mensajeError);
                }
                
                console.log('✅ Rol creado:', responseData);
                mostrarMensaje('success', 'Rol creado correctamente');
                formulario.reset();
                
                // Redirigir después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'rol_get.html';
                }, 2000);
                
            } catch (error) {
                console.error('❌ Error completo:', error);
                mostrarMensaje('error', error.message);
            }
        });
    }
});

// Función para seleccionar rol sugerido
function seleccionarRol(nombre) {
    document.getElementById('nombre').value = nombre;
    
    // Cambiar preview de permisos según el rol
    const preview = document.getElementById('permisosPreview');
    let permisosHtml = '';
    
    switch(nombre) {
        case 'Administrador':
            permisosHtml = `
                <strong><i class="fas fa-crown"></i> Permisos de Administrador:</strong>
                <div style="margin-top: 10px;">
                    <span class="permiso-item"><i class="fas fa-check"></i> Acceso total</span>
                    <span class="permiso-item"><i class="fas fa-check"></i> Gestionar usuarios</span>
                    <span class="permiso-item"><i class="fas fa-check"></i> Configuración</span>
                    <span class="permiso-item"><i class="fas fa-check"></i> Todos los reportes</span>
                </div>
            `;
            break;
        case 'Vendedor':
            permisosHtml = `
                <strong><i class="fas fa-shopping-cart"></i> Permisos de Vendedor:</strong>
                <div style="margin-top: 10px;">
                    <span class="permiso-item"><i class="fas fa-check"></i> Ver clientes</span>
                    <span class="permiso-item"><i class="fas fa-check"></i> Crear/editar clientes</span>
                    <span class="permiso-item"><i class="fas fa-check"></i> Crear reservas</span>
                    <span class="permiso-item"><i class="fas fa-check"></i> Ver reportes de ventas</span>
                </div>
            `;
            break;
        case 'Consulta':
            permisosHtml = `
                <strong><i class="fas fa-eye"></i> Permisos de Solo Consulta:</strong>
                <div style="margin-top: 10px;">
                    <span class="permiso-item"><i class="fas fa-check"></i> Ver clientes</span>
                    <span class="permiso-item"><i class="fas fa-check"></i> Ver reservas</span>
                    <span class="permiso-item"><i class="fas fa-check"></i> Ver reportes</span>
                    <span class="permiso-item"><i class="fas fa-ban" style="color:#e74c3c;"></i> Sin permisos de edición</span>
                </div>
            `;
            break;
        case 'Cajero':
            permisosHtml = `
                <strong><i class="fas fa-cash-register"></i> Permisos de Cajero:</strong>
                <div style="margin-top: 10px;">
                    <span class="permiso-item"><i class="fas fa-check"></i> Ver pagos</span>
                    <span class="permiso-item"><i class="fas fa-check"></i> Registrar pagos</span>
                    <span class="permiso-item"><i class="fas fa-check"></i> Generar comprobantes</span>
                    <span class="permiso-item"><i class="fas fa-check"></i> Ver reportes de caja</span>
                </div>
            `;
            break;
        default:
            permisosHtml = `
                <strong><i class="fas fa-shield-alt"></i> Permisos personalizables:</strong>
                <div style="margin-top: 10px;">
                    <span class="permiso-item"><i class="fas fa-check"></i> Según configuración</span>
                </div>
            `;
    }
    
    preview.innerHTML = permisosHtml + `
        <p style="font-size: 0.85em; color: #666; margin-top: 10px;">
            <i class="fas fa-info-circle"></i> Los permisos específicos se asignan en la configuración del sistema
        </p>
    `;
}

function mostrarMensaje(tipo, texto) {
    const msgAnterior = document.querySelector('.alert-success, .alert-error');
    if (msgAnterior) msgAnterior.remove();
    
    const mensaje = document.createElement('div');
    mensaje.className = tipo === 'success' ? 'alert-success' : 'alert-error';
    mensaje.innerHTML = `<i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${texto}`;
    
    const formulario = document.getElementById('FormularioData');
    formulario.parentNode.insertBefore(mensaje, formulario);
    
    setTimeout(() => mensaje.remove(), 5000);
}

// Hacer la función seleccionarRol global
window.seleccionarRol = seleccionarRol;