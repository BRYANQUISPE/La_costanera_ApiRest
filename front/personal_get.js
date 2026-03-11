// personal_get.js
const url = "http://127.0.0.1:8000/personal/";
let todoElPersonal = [];
let filtroCargo = 'todos';

document.addEventListener('DOMContentLoaded', function() {
    cargarPersonal();
    
    // Evento para búsqueda con Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarPersonal();
    });
});

function cargarPersonal() {
    const contenedor = document.getElementById('data');
    contenedor.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Cargando personal...</p></div>';
    
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
    .then(data => {
        console.log("Personal cargado:", data);
        todoElPersonal = data;
        aplicarFiltros();
        actualizarResumen(data);
    })
    .catch(error => {
        console.error("Error:", error);
        contenedor.innerHTML = `<div class="alert-error">
            <i class="fas fa-exclamation-circle"></i> Error al cargar personal: ${error.message}
        </div>`;
    });
}

function aplicarFiltros() {
    let personalFiltrado = [...todoElPersonal];
    
    // Aplicar filtro de búsqueda por texto
    const termino = document.getElementById('searchInput').value.toLowerCase();
    const campo = document.getElementById('searchField').value;
    
    if (termino) {
        personalFiltrado = personalFiltrado.filter(persona => {
            if (campo === 'todos') {
                return persona.nombres.toLowerCase().includes(termino) ||
                       persona.apellidos.toLowerCase().includes(termino) ||
                       (persona.cargo && persona.cargo.toLowerCase().includes(termino)) ||
                       (persona.telefono && persona.telefono.toString().includes(termino));
            } else if (campo === 'nombres') {
                return persona.nombres.toLowerCase().includes(termino);
            } else if (campo === 'apellidos') {
                return persona.apellidos.toLowerCase().includes(termino);
            } else if (campo === 'cargo') {
                return persona.cargo && persona.cargo.toLowerCase().includes(termino);
            } else if (campo === 'telefono') {
                return persona.telefono && persona.telefono.toString().includes(termino);
            }
            return false;
        });
    }
    
    // Aplicar filtro por cargo
    if (filtroCargo !== 'todos') {
        personalFiltrado = personalFiltrado.filter(persona => {
            if (filtroCargo === 'admin') {
                return persona.cargo && persona.cargo.toLowerCase().includes('admin');
            } else if (filtroCargo === 'vendedor') {
                return persona.cargo && persona.cargo.toLowerCase().includes('vende');
            } else if (filtroCargo === 'gerente') {
                return persona.cargo && persona.cargo.toLowerCase().includes('gerente');
            } else if (filtroCargo === 'otro') {
                return persona.cargo && 
                       !persona.cargo.toLowerCase().includes('admin') &&
                       !persona.cargo.toLowerCase().includes('vende') &&
                       !persona.cargo.toLowerCase().includes('gerente');
            }
            return true;
        });
    }
    
    mostrarPersonal(personalFiltrado);
}

function mostrarPersonal(personal) {
    const contenedor = document.getElementById('data');
    
    if (!personal || personal.length === 0) {
        contenedor.innerHTML = '<div class="alert-error">No hay personal para mostrar</div>';
        return;
    }
    
    let html = '';
    personal.forEach(persona => {
        // Determinar clase para el cargo
        let cargoClass = 'cargo-badge ';
        if (persona.cargo) {
            const cargoLower = persona.cargo.toLowerCase();
            if (cargoLower.includes('admin')) {
                cargoClass += 'cargo-admin';
            } else if (cargoLower.includes('vende')) {
                cargoClass += 'cargo-vendedor';
            } else if (cargoLower.includes('gerente')) {
                cargoClass += 'cargo-gerente';
            } else {
                cargoClass += 'cargo-otro';
            }
        } else {
            cargoClass += 'cargo-otro';
        }
        
        html += `
            <li>
                <p><strong><i class="fas fa-id-card"></i> Personal ID:</strong> <span>${persona.personal_id}</span></p>
                <p><strong><i class="fas fa-user"></i> Nombres:</strong> <span>${persona.nombres} ${persona.apellidos}</span></p>
                <p><strong><i class="fas fa-briefcase"></i> Cargo:</strong> 
                    <span class="${cargoClass}">${persona.cargo || 'No especificado'}</span>
                </p>
                <p><strong><i class="fas fa-phone"></i> Teléfono:</strong> 
                    <span><i class="fas fa-phone-alt telefono-icon"></i> ${persona.telefono || 'No registrado'}</span>
                </p>
                <p><strong><i class="fas fa-user-circle"></i> Usuario Asociado:</strong> 
                    <span class="usuario-info">
                        <i class="fas ${persona.usuario_id ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${persona.usuario_id ? `ID: ${persona.usuario_id}` : 'Sin usuario'}
                    </span>
                </p>
            </li>
        `;
    });
    
    contenedor.innerHTML = html;
}

function buscarPersonal() {
    aplicarFiltros();
}

function limpiarBusqueda() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchField').value = 'todos';
    filtroCargo = 'todos';
    
    // Actualizar botones de filtro
    document.querySelectorAll('.cargo-filtro').forEach(btn => {
        btn.classList.remove('activo');
        if (btn.textContent.includes('Todos')) {
            btn.classList.add('activo');
        }
    });
    
    mostrarPersonal(todoElPersonal);
    actualizarResumen(todoElPersonal);
}

function filtrarPorCargo(cargo) {
    filtroCargo = cargo;
    
    // Actualizar botones
    document.querySelectorAll('.cargo-filtro').forEach(btn => {
        btn.classList.remove('activo');
    });
    event.target.classList.add('activo');
    
    aplicarFiltros();
}

function actualizarResumen(personal) {
    const total = personal.length;
    const conUsuario = personal.filter(p => p.usuario_id).length;
    const sinUsuario = total - conUsuario;
    
    // Cargos distintos
    const cargosSet = new Set(personal.map(p => p.cargo).filter(c => c));
    const cargosDistintos = cargosSet.size;
    
    document.getElementById('totalPersonal').textContent = total;
    document.getElementById('conUsuario').textContent = conUsuario;
    document.getElementById('sinUsuario').textContent = sinUsuario;
    document.getElementById('cargosDistintos').textContent = cargosDistintos;
}