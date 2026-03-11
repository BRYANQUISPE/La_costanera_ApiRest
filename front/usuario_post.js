// usuario_post.js
const url = "http://127.0.0.1:8000/usuario/";
const urlRoles = "http://127.0.0.1:8000/rol/";
const urlUsuarioRol = "http://127.0.0.1:8000/usuario_rol/";

let rolesDisponibles = [];

document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('FormularioData');
    
    // Cargar roles disponibles
    cargarRoles();
    
    // Evento para medir fortaleza de contraseña
    document.getElementById('hash_password').addEventListener('input', function() {
        medirFortalezaPassword(this.value);
    });
    
    // Evento para sugerir nombre de usuario
    document.getElementById('nombre_usuario').addEventListener('blur', function() {
        sugerirPersonal(this.value);
    });
    
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datos = {
                nombre_usuario: document.getElementById('nombre_usuario').value,
                hash_password: document.getElementById('hash_password').value
            };
            
            console.log('📤 Enviando datos:', datos);
            
            // Validaciones
            if (!datos.nombre_usuario || !datos.hash_password) {
                mostrarMensaje('error', 'Todos los campos son obligatorios');
                return;
            }
            
            if (datos.nombre_usuario.length < 3) {
                mostrarMensaje('error', 'El nombre de usuario debe tener al menos 3 caracteres');
                return;
            }
            
            // Validar fortaleza de contraseña
            const fortaleza = medirFortalezaPassword(datos.hash_password, true);
            if (fortaleza < 2) {
                mostrarMensaje('error', 'La contraseña no cumple con los requisitos mínimos de seguridad');
                return;
            }
            
            try {
                // Crear usuario
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
                    
                    let mensajeError = 'Error al crear usuario';
                    
                    if (responseData.detail) {
                        mensajeError = responseData.detail;
                    } else if (responseData.message) {
                        mensajeError = responseData.message;
                    }
                    
                    if (response.status === 409) {
                        mensajeError = '❌ El nombre de usuario ya existe';
                    } else if (response.status === 422) {
                        mensajeError = '❌ Datos inválidos. Verifique los campos';
                    }
                    
                    throw new Error(mensajeError);
                }
                
                const usuarioId = responseData.usuario_id;
                console.log('✅ Usuario creado:', responseData);
                
                // Asignar roles seleccionados
                const rolesSeleccionados = [];
                document.querySelectorAll('input[name="rol"]:checked').forEach(checkbox => {
                    rolesSeleccionados.push(parseInt(checkbox.value));
                });
                
                if (rolesSeleccionados.length > 0) {
                    console.log('Asignando roles:', rolesSeleccionados);
                    
                    // Asignar cada rol
                    for (const rolId of rolesSeleccionados) {
                        await fetch(urlUsuarioRol, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                usuario_id: usuarioId,
                                rol_id: rolId
                            })
                        });
                    }
                }
                
                mostrarMensaje('success', 'Usuario creado correctamente');
                formulario.reset();
                document.getElementById('strengthBar').style.width = '0%';
                
                // Redirigir después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'usuario_get.html';
                }, 2000);
                
            } catch (error) {
                console.error('❌ Error completo:', error);
                mostrarMensaje('error', error.message);
            }
        });
    }
});

async function cargarRoles() {
    try {
        const response = await fetch(urlRoles);
        if (response.ok) {
            rolesDisponibles = await response.json();
            mostrarRoles();
        }
    } catch (error) {
        console.error('Error al cargar roles:', error);
        document.getElementById('rolesContainer').innerHTML = '<p>Error al cargar roles</p>';
    }
}

function mostrarRoles() {
    const container = document.getElementById('rolesContainer');
    
    if (rolesDisponibles.length === 0) {
        container.innerHTML = '<p>No hay roles disponibles</p>';
        return;
    }
    
    let html = '<div style="display: grid; gap: 10px;">';
    
    rolesDisponibles.forEach(rol => {
        html += `
            <div class="rol-checkbox">
                <input type="checkbox" name="rol" value="${rol.rol_id}" id="rol_${rol.rol_id}">
                <label for="rol_${rol.rol_id}">
                    <strong>${rol.nombre}</strong>
                </label>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function medirFortalezaPassword(password, returnScore = false) {
    const bar = document.getElementById('strengthBar');
    const text = document.getElementById('strengthText');
    
    if (!password) {
        bar.style.width = '0%';
        bar.style.backgroundColor = '#e0e0e0';
        text.textContent = 'Ingrese una contraseña';
        return 0;
    }
    
    let score = 0;
    
    // Criterios de fortaleza
    if (password.length >= 6) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (password.length >= 10) score += 1;
    
    // Actualizar barra
    const percentage = (score / 5) * 100;
    bar.style.width = percentage + '%';
    
    // Cambiar color según fortaleza
    if (score <= 2) {
        bar.style.backgroundColor = '#ef4444';
        text.textContent = 'Contraseña débil';
        text.style.color = '#ef4444';
    } else if (score <= 3) {
        bar.style.backgroundColor = '#f59e0b';
        text.textContent = 'Contraseña media';
        text.style.color = '#f59e0b';
    } else {
        bar.style.backgroundColor = '#10b981';
        text.textContent = 'Contraseña fuerte';
        text.style.color = '#10b981';
    }
    
    return returnScore ? score : null;
}

function sugerirPersonal(nombreUsuario) {
    // Esta función podría buscar si existe personal con ese nombre
    // Por ahora es solo un ejemplo
    const sugerencia = document.getElementById('personalSugerencia');
    const texto = document.getElementById('sugerenciaTexto');
    
    if (nombreUsuario.length > 3) {
        sugerencia.style.display = 'block';
        texto.innerHTML = `¿El usuario <strong>${nombreUsuario}</strong> corresponde a algún personal existente? Puede asociarlo después en la sección de Personal.`;
    } else {
        sugerencia.style.display = 'none';
    }
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