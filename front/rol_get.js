// rol_get.js
const url = "http://127.0.0.1:8000/rol/";
const urlUsuarioRol = "http://127.0.0.1:8000/usuario_rol/";

let todosLosRoles = [];

document.addEventListener('DOMContentLoaded', function() {
    cargarRoles();
    
    // Evento para búsqueda con Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarRoles();
    });
});

function cargarRoles() {
    const contenedor = document.getElementById('data');
    contenedor.innerHTML = '<div style="text-align: center; padding: 50px; grid-column: 1/-1;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Cargando roles...</p></div>';
    
    fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(async data => {
        console.log("Roles cargados:", data);
        
        // Cargar información de usuarios para cada rol
        for (let rol of data) {
            try {
                const response = await fetch(`${urlUsuarioRol}?rol_id=${rol.rol_id}`);
                if (response.ok) {
                    const usuarios = await response.json();
                    rol.usuarios = usuarios;
                    rol.totalUsuarios = usuarios.length;
                } else {
                    rol.usuarios = [];
                    rol.totalUsuarios = 0;
                }
            } catch (error) {
                rol.usuarios = [];
                rol.totalUsuarios = 0;
            }
        }
        
        todosLosRoles = data;
        aplicarFiltros();
        actualizarResumen(data);
    })
    .catch(error => {
        console.error("Error:", error);
        contenedor.innerHTML = `<div class="alert-error" style="grid-column: 1/-1;">
            <i class="fas fa-exclamation-circle"></i> Error al cargar roles: ${error.message}
        </div>`;
    });
}

function aplicarFiltros() {
    let rolesFiltrados = [...todosLosRoles];
    
    // Aplicar filtro de búsqueda por texto
    const termino = document.getElementById('searchInput').value.toLowerCase();
    
    if (termino) {
        rolesFiltrados = rolesFiltrados.filter(rol => 
            rol.nombre.toLowerCase().includes(termino)
        );
    }
    
    mostrarRoles(rolesFiltrados);
}

function mostrarRoles(roles) {
    const contenedor = document.getElementById('data');
    
    if (!roles || roles.length === 0) {
        contenedor.innerHTML = '<div class="alert-error" style="grid-column: 1/-1;">No hay roles para mostrar</div>';
        return;
    }
    
    let html = '';
    roles.forEach(rol => {
        // Determinar icono según el nombre del rol
        let icono = '🔑';
        const nombreLower = rol.nombre.toLowerCase();
        if (nombreLower.includes('admin')) icono = '👑';
        else if (nombreLower.includes('vende')) icono = '💼';
        else if (nombreLower.includes('consulta')) icono = '👁️';
        else if (nombreLower.includes('cajero')) icono = '💰';
        
        // Mostrar usuarios asociados (máximo 3)
        let usuariosHtml = '';
        if (rol.usuarios && rol.usuarios.length > 0) {
            const usuariosMostrar = rol.usuarios.slice(0, 3);
            usuariosMostrar.forEach(u => {
                usuariosHtml += `<span class="usuario-tag">Usuario #${u.usuario_id}</span>`;
            });
            if (rol.usuarios.length > 3) {
                usuariosHtml += `<span class="usuario-tag">+${rol.usuarios.length - 3} más</span>`;
            }
        } else {
            usuariosHtml = '<span class="usuario-tag">Sin usuarios</span>';
        }
        
        html += `
            <div class="rol-card">
                <div class="rol-nombre">
                    <i>${icono}</i> ${rol.nombre}
                </div>
                
                <div class="rol-stats">
                    <div class="stat-item">
                        <div class="stat-number">${rol.totalUsuarios}</div>
                        <div class="stat-label">Usuarios</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${rol.rol_id}</div>
                        <div class="stat-label">ID</div>
                    </div>
                </div>
                
                <div class="usuarios-lista">
                    <strong><i class="fas fa-users"></i> Usuarios con este rol:</strong>
                    <div style="margin-top: 8px;">
                        ${usuariosHtml}
                    </div>
                </div>
                
                <div class="acciones-rol">
                    <button class="btn-editar" onclick="editarRol(${rol.rol_id}, '${rol.nombre}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-eliminar" onclick="eliminarRol(${rol.rol_id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

function buscarRoles() {
    aplicarFiltros();
}

function limpiarBusqueda() {
    document.getElementById('searchInput').value = '';
    mostrarRoles(todosLosRoles);
    actualizarResumen(todosLosRoles);
}

function actualizarResumen(roles) {
    const total = roles.length;
    
    // Total de usuarios con roles (contar usuarios únicos)
    const usuariosSet = new Set();
    roles.forEach(rol => {
        if (rol.usuarios) {
            rol.usuarios.forEach(u => usuariosSet.add(u.usuario_id));
        }
    });
    const totalUsuarios = usuariosSet.size;
    
    // Promedio de usuarios por rol
    const promedio = total > 0 ? (totalUsuarios / total).toFixed(1) : 0;
    
    // Rol más usado
    let rolMasUsado = { nombre: 'N/A', count: 0 };
    roles.forEach(rol => {
        if (rol.totalUsuarios > rolMasUsado.count) {
            rolMasUsado = { nombre: rol.nombre, count: rol.totalUsuarios };
        }
    });
    
    document.getElementById('totalRoles').textContent = total;
    document.getElementById('totalUsuarios').textContent = totalUsuarios;
    document.getElementById('promedioUsuarios').textContent = promedio;
    document.getElementById('rolMasUsado').textContent = rolMasUsado.nombre;
}

// Funciones para editar rol
function editarRol(id, nombre) {
    document.getElementById('edit_rol_id').value = id;
    document.getElementById('edit_nombre').value = nombre;
    document.getElementById('modalEditar').style.display = 'block';
}

async function guardarRol(event) {
    event.preventDefault();
    
    const id = document.getElementById('edit_rol_id').value;
    const nombre = document.getElementById('edit_nombre').value;
    
    try {
        const response = await fetch(`${url}${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombre })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al actualizar');
        }
        
        mostrarMensaje('success', 'Rol actualizado correctamente');
        cerrarModal();
        cargarRoles(); // Recargar lista
        
    } catch (error) {
        mostrarMensaje('error', error.message);
    }
}

// Función para eliminar rol
async function eliminarRol(id) {
    if (!confirm('¿Está seguro de eliminar este rol? Los usuarios perderán este permiso.')) {
        return;
    }
    
    try {
        const response = await fetch(`${url}${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al eliminar');
        }
        
        mostrarMensaje('success', 'Rol eliminado correctamente');
        cargarRoles(); // Recargar lista
        
    } catch (error) {
        mostrarMensaje('error', error.message);
    }
}

function cerrarModal() {
    document.getElementById('modalEditar').style.display = 'none';
}

function mostrarMensaje(tipo, texto) {
    const msgAnterior = document.querySelector('.alert-success, .alert-error');
    if (msgAnterior) msgAnterior.remove();
    
    const mensaje = document.createElement('div');
    mensaje.className = tipo === 'success' ? 'alert-success' : 'alert-error';
    mensaje.innerHTML = `<i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${texto}`;
    
    const contenedor = document.getElementById('data');
    contenedor.parentNode.insertBefore(mensaje, contenedor);
    
    setTimeout(() => mensaje.remove(), 3000);
}