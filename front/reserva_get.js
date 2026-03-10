// reserva_get.js
const url = "http://127.0.0.1:8000/reserva/";
let todasLasReservas = [];
let filtroEstado = 'todos';

document.addEventListener('DOMContentLoaded', function() {
    cargarReservas();
    
    // Evento para búsqueda con Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarReservas();
    });
});

function cargarReservas() {
    const contenedor = document.getElementById('data');
    contenedor.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Cargando reservas...</p></div>';
    
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
        console.log("Reservas cargadas:", data);
        todasLasReservas = data;
        aplicarFiltros();
        actualizarResumen(data);
    })
    .catch(error => {
        console.error("Error:", error);
        contenedor.innerHTML = `<div class="alert-error">
            <i class="fas fa-exclamation-circle"></i> Error al cargar reservas: ${error.message}
        </div>`;
    });
}

function aplicarFiltros() {
    let reservasFiltradas = [...todasLasReservas];
    
    // Aplicar filtro de búsqueda
    const termino = document.getElementById('searchInput').value.toLowerCase();
    const campo = document.getElementById('searchField').value;
    
    if (termino) {
        reservasFiltradas = reservasFiltradas.filter(reserva => {
            if (campo === 'todos') {
                return reserva.reserva_id.toString().includes(termino) ||
                       reserva.cliente_id.toString().includes(termino) ||
                       reserva.usuario_id.toString().includes(termino) ||
                       reserva.estado.toLowerCase().includes(termino);
            } else if (campo === 'reserva_id') {
                return reserva.reserva_id.toString().includes(termino);
            } else if (campo === 'cliente_id') {
                return reserva.cliente_id.toString().includes(termino);
            } else if (campo === 'usuario_id') {
                return reserva.usuario_id.toString().includes(termino);
            } else if (campo === 'estado') {
                return reserva.estado.toLowerCase().includes(termino);
            }
            return false;
        });
    }
    
    // Aplicar filtro por estado
    if (filtroEstado !== 'todos') {
        reservasFiltradas = reservasFiltradas.filter(reserva => 
            reserva.estado === filtroEstado
        );
    }
    
    // Aplicar filtro por fecha
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    
    if (fechaDesde) {
        reservasFiltradas = reservasFiltradas.filter(reserva => 
            new Date(reserva.fecha_reserva) >= new Date(fechaDesde)
        );
    }
    
    if (fechaHasta) {
        reservasFiltradas = reservasFiltradas.filter(reserva => 
            new Date(reserva.fecha_reserva) <= new Date(fechaHasta)
        );
    }
    
    mostrarReservas(reservasFiltradas);
}

function mostrarReservas(reservas) {
    const contenedor = document.getElementById('data');
    
    if (!reservas || reservas.length === 0) {
        contenedor.innerHTML = '<div class="alert-error">No hay reservas para mostrar</div>';
        return;
    }
    
    let html = '';
    reservas.forEach(reserva => {
        // Determinar clase según estado
        let estadoClass = 'estado-badge ';
        switch(reserva.estado) {
            case 'pendiente':
                estadoClass += 'estado-pendiente';
                break;
            case 'confirmada':
                estadoClass += 'estado-confirmada';
                break;
            case 'cancelada':
                estadoClass += 'estado-cancelada';
                break;
            case 'finalizada':
                estadoClass += 'estado-finalizada';
                break;
            default:
                estadoClass += 'estado-pendiente';
        }
        
        // Formatear fecha
        const fecha = new Date(reserva.fecha_reserva);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <li>
                <p><strong><i class="fas fa-hashtag"></i> Reserva ID:</strong> <span>${reserva.reserva_id}</span></p>
                <p><strong><i class="fas fa-user"></i> Cliente ID:</strong> <span>${reserva.cliente_id}</span></p>
                <p><strong><i class="fas fa-user-tie"></i> Usuario ID:</strong> <span>${reserva.usuario_id}</span></p>
                <p><strong><i class="fas fa-calendar"></i> Fecha:</strong> <span>${fechaFormateada}</span></p>
                <p><strong><i class="fas fa-tag"></i> Estado:</strong> 
                    <span class="${estadoClass}">${reserva.estado}</span>
                </p>
            </li>
        `;
    });
    
    contenedor.innerHTML = html;
}

function buscarReservas() {
    aplicarFiltros();
}

function limpiarBusqueda() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchField').value = 'todos';
    document.getElementById('fechaDesde').value = '';
    document.getElementById('fechaHasta').value = '';
    filtroEstado = 'todos';
    
    // Actualizar botones de filtro
    document.querySelectorAll('.estado-filtro').forEach(btn => {
        btn.classList.remove('activo');
        if (btn.textContent.includes('Todos')) {
            btn.classList.add('activo');
        }
    });
    
    mostrarReservas(todasLasReservas);
    actualizarResumen(todasLasReservas);
}

function filtrarPorEstado(estado) {
    filtroEstado = estado;
    
    // Actualizar botones
    document.querySelectorAll('.estado-filtro').forEach(btn => {
        btn.classList.remove('activo');
    });
    event.target.classList.add('activo');
    
    aplicarFiltros();
}

function filtrarPorFecha() {
    aplicarFiltros();
}

function actualizarResumen(reservas) {
    const total = reservas.length;
    const pendientes = reservas.filter(r => r.estado === 'pendiente').length;
    const confirmadas = reservas.filter(r => r.estado === 'confirmada').length;
    const canceladas = reservas.filter(r => r.estado === 'cancelada').length;
    const finalizadas = reservas.filter(r => r.estado === 'finalizada').length;
    
    document.getElementById('totalReservas').textContent = total;
    document.getElementById('pendientes').textContent = pendientes;
    document.getElementById('confirmadas').textContent = confirmadas;
    document.getElementById('canceladas').textContent = canceladas;
    document.getElementById('finalizadas').textContent = finalizadas;
}