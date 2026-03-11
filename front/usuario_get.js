// usuario_get.js
const url = "http://127.0.0.1:8000/usuario/";
const urlPersonal = "http://127.0.0.1:8000/personal/";
const urlUsuarioRol = "http://127.0.0.1:8000/usuario_rol/";
const urlRoles = "http://127.0.0.1:8000/rol/";

let todosLosUsuarios = [];

document.addEventListener('DOMContentLoaded', function() {
    cargarUsuarios();
    
    // Evento para búsqueda con Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarUsuarios();
    });
});

function cargarUsuarios() {
    const contenedor = document.getElementById('data');
    contenedor.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Cargando usuarios...</p></div>';
    
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
        console.log("Usuarios cargados:", data);
        
        // Cargar información adicional para cada usuario
        for (let usuario of data) {
            // Verificar si tiene personal asociado
            try {
                const personalResponse = await fetch(`${urlPersonal}?usuario_id=${usuario.usuario_id}`);
                if (personalResponse.ok) {
                    const personalData = await personalResponse.json();
                    usuario.tienePersonal = personalData.length > 0;
                    if (usuario.tienePersonal) {
                        usuario.personal = personalData[0];
                    }
                }
            } catch (error) {
                usuario.tienePersonal = false;
            }
            
            // Cargar roles del usuario
            try {
                const rolesResponse = await fetch(`${urlUsuarioRol}?usuario_id=${usuario.usuario_id}`);
                if (rolesResponse.ok) {
                    const rolesData = await rolesResponse.json();
                    usuario.roles = rolesData;
                } else {
                    usuario.roles = [];
                }
            } catch (error) {
                usuario.roles = [];
            }
        }
        
        todosLosUsuarios = data;
        aplicarFiltros();
        actualizarResumen(data);
    })
    .catch(error => {
        console.error("Error:", error);
        contenedor.innerHTML = `<div class="alert-error">
            <i class="fas fa-exclamation-circle"></i> Error al cargar usuarios: ${error.message}
        </div>`;
    });
}

function aplicarFiltros() {
    let usuariosFiltrados = [...todosLosUsuarios];
    
    // Aplicar filtro de búsqueda por texto
    const termino = document.getElementById('searchInput').value.toLowerCase();
    const campo = document.getElementById('searchField').value;
    
    if (termino) {
        usuariosFiltrados = usuariosFiltrados.filter(usuario => {
            if (campo === 'todos' || campo === 'nombre_usuario') {
                return usuario.nombre_usuario.toLowerCase().includes(termino);
            }
            return false;
        });
    }
    
    mostrarUsuarios(usuariosFiltrados);
}

function mostrarUsuarios(usuarios) {
    const contenedor = document.getElementById('data');
    
    if (!usuarios || usuarios.length === 0) {
        contenedor.innerHTML = '<div class="alert-error">No hay usuarios para mostrar</div>';
        return;
    }
    
    let html = '';
    usuarios.forEach(usuario => {
        // Enmascarar contraseña
        const passwordMask = '••••••••';
        
        // Determinar si tiene personal asociado
        const personalInfo = usuario.tienePersonal 
            ? `<span class="personal-info"><i class="fas fa-check-circle"></i> ${usuario.personal?.nombres || 'Personal'}</span>`
            : `<span class="personal-info" style="color: #999;"><i class="fas fa-times-circle"></i> Sin personal</span>`;
        
        // Mostrar roles
        let rolesHtml = '';
        if (usuario.roles && usuario.roles.length > 0) {
            usuario.roles.forEach(rol => {
                let rolClass = 'rol-badge ';
                if (rol.nombre && rol.nombre.toLowerCase().includes('admin')) {
                    rolClass += 'rol-admin';
                } else if (rol.nombre && rol.nombre.toLowerCase().includes('vende')) {
                    rolClass += 'rol-vendedor';
                } else if (rol.nombre && rol.nombre.toLowerCase().includes('consulta')) {
                    rolClass += 'rol-consulta';
                }
                rolesHtml += `<span class="${rolClass}">${rol.nombre || 'Rol'}</span>`;
            });
        } else {
            rolesHtml = '<span class="rol-badge">Sin roles</span>';
        }
        
        html += `
            <li>
                <p><strong><i class="fas fa-id-card"></i> Usuario ID:</strong> <span>${usuario.usuario_id}</span></p>
                <p><strong><i class="fas fa-user"></i> Nombre Usuario:</strong> <span>${usuario.nombre_usuario}</span></p>
                <p><strong><i class="fas fa-lock"></i> Contraseña:</strong> 
                    <span class="password-hidden">${passwordMask}</span>
                </p>
                <p><strong><i class="fas fa-id-badge"></i> Personal:</strong> ${personalInfo}</p>
                <p><strong><i class="fas fa-tags"></i> Roles:</strong> 
                    <span class="roles-container">${rolesHtml}</span>
                </p>
                <div class="acciones-usuario">
                    <button class="btn-rol" onclick="verRoles(${usuario.usuario_id}, '${usuario.nombre_usuario}')">
                        <i class="fas fa-tag"></i> Ver Roles
                    </button>
                </div>
            </li>
        `;
    });
    
    contenedor.innerHTML = html;
}

function buscarUsuarios() {
    aplicarFiltros();
}

function limpiarBusqueda() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchField').value = 'todos';
    
    mostrarUsuarios(todosLosUsuarios);
    actualizarResumen(todosLosUsuarios);
}

function actualizarResumen(usuarios) {
    const total = usuarios.length;
    const conPersonal = usuarios.filter(u => u.tienePersonal).length;
    const sinPersonal = total - conPersonal;
    
    // Total de roles asignados (contar roles únicos)
    const rolesSet = new Set();
    usuarios.forEach(u => {
        if (u.roles) {
            u.roles.forEach(r => rolesSet.add(r.rol_id));
        }
    });
    
    document.getElementById('totalUsuarios').textContent = total;
    document.getElementById('conPersonal').textContent = conPersonal;
    document.getElementById('sinPersonal').textContent = sinPersonal;
    document.getElementById('totalRoles').textContent = rolesSet.size;
}

// Función para ver roles de un usuario (opcional)
async function verRoles(usuarioId, nombreUsuario) {
    try {
        const response = await fetch(`${urlUsuarioRol}?usuario_id=${usuarioId}`);
        if (response.ok) {
            const roles = await response.json();
            
            let contenido = `<p>Roles asignados a <strong>${nombreUsuario}</strong>:</p>`;
            contenido += '<ul>';
            
            if (roles.length > 0) {
                roles.forEach(r => {
                    contenido += `<li>Rol ID: ${r.rol_id}</li>`;
                });
            } else {
                contenido += '<li>No tiene roles asignados</li>';
            }
            
            contenido += '</ul>';
            
            document.getElementById('modalContenido').innerHTML = contenido;
            document.getElementById('modalRoles').style.display = 'block';
        }
    } catch (error) {
        console.error('Error al cargar roles:', error);
    }
}

function cerrarModal() {
    document.getElementById('modalRoles').style.display = 'none';
}