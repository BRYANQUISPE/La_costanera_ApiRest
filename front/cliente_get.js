// cliente_get.js
const url = "http://127.0.0.1:8000/cliente/";
let todosLosClientes = [];

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarClientes();
});

function cargarClientes() {
    const contenedor = document.getElementById('data');
    contenedor.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Cargando clientes...</p></div>';
    
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
        console.log("Clientes cargados:", data);
        todosLosClientes = data;
        mostrarClientes(data);
        actualizarEstadisticas(data);
    })
    .catch(error => {
        console.error("Error:", error);
        contenedor.innerHTML = `<div class="alert-error">
            <i class="fas fa-exclamation-circle"></i> Error al cargar clientes: ${error.message}
        </div>`;
    });
}

function mostrarClientes(clientes) {
    const contenedor = document.getElementById('data');
    
    if (!clientes || clientes.length === 0) {
        contenedor.innerHTML = '<div class="alert-error">No hay clientes para mostrar</div>';
        return;
    }
    
    let html = '';
    clientes.forEach(cliente => {
        html += `
            <li>
                <p><strong><i class="fas fa-id-card"></i> ID:</strong> <span>${cliente.cliente_id}</span></p>
                <p><strong><i class="fas fa-user"></i> Nombre:</strong> <span>${cliente.nombres} ${cliente.apellidos}</span></p>
                <p><strong><i class="fas fa-id-card"></i> CI:</strong> <span>${cliente.ci}</span></p>
                <p><strong><i class="fas fa-phone"></i> Teléfono:</strong> <span>${cliente.telefono || 'N/A'}</span></p>
                <p><strong><i class="fas fa-envelope"></i> Email:</strong> <span>${cliente.email || 'N/A'}</span></p>
            </li>
        `;
    });
    
    contenedor.innerHTML = html;
}

function buscarClientes() {
    const termino = document.getElementById('searchInput').value.toLowerCase();
    const campo = document.getElementById('searchField').value;
    
    if (!termino) {
        mostrarClientes(todosLosClientes);
        return;
    }
    
    const filtrados = todosLosClientes.filter(cliente => {
        if (campo === 'todos') {
            return cliente.nombres.toLowerCase().includes(termino) ||
                   cliente.apellidos.toLowerCase().includes(termino) ||
                   cliente.ci.toString().includes(termino) ||
                   (cliente.email && cliente.email.toLowerCase().includes(termino));
        } else if (campo === 'nombre') {
            return cliente.nombres.toLowerCase().includes(termino) ||
                   cliente.apellidos.toLowerCase().includes(termino);
        } else if (campo === 'ci') {
            return cliente.ci.toString().includes(termino);
        } else if (campo === 'email') {
            return cliente.email && cliente.email.toLowerCase().includes(termino);
        }
        return false;
    });
    
    mostrarClientes(filtrados);
    
    // Mostrar resultado de búsqueda
    const contenedor = document.getElementById('data');
    if (filtrados.length === 0) {
        contenedor.innerHTML = '<div class="alert-error">No se encontraron clientes</div>';
    }
}

function limpiarBusqueda() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchField').value = 'todos';
    mostrarClientes(todosLosClientes);
}

function actualizarEstadisticas(clientes) {
    document.getElementById('totalClientes').textContent = clientes.length;
    
    // Clientes con reservas (esto necesitaría otra API)
    // Por ahora es un ejemplo
    document.getElementById('clientesActivos').textContent = 
        clientes.filter(c => c.email).length; // Ejemplo simple
    
    // Clientes VIP (ejemplo)
    document.getElementById('clientesVIP').textContent = 
        Math.floor(clientes.length * 0.2); // 20% son VIP (ejemplo)
}