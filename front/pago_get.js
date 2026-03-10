// pago_get.js
const url = "http://127.0.0.1:8000/pago/";
let todosLosPagos = [];

document.addEventListener('DOMContentLoaded', function() {
    cargarPagos();
    
    // Evento para búsqueda con Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarPagos();
    });
});

function cargarPagos() {
    const contenedor = document.getElementById('data');
    contenedor.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Cargando pagos...</p></div>';
    
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
        console.log("Pagos cargados:", data);
        todosLosPagos = data;
        aplicarFiltros();
        actualizarResumen(data);
    })
    .catch(error => {
        console.error("Error:", error);
        contenedor.innerHTML = `<div class="alert-error">
            <i class="fas fa-exclamation-circle"></i> Error al cargar pagos: ${error.message}
        </div>`;
    });
}

function aplicarFiltros() {
    let pagosFiltrados = [...todosLosPagos];
    
    // Aplicar filtro de búsqueda por texto
    const termino = document.getElementById('searchInput').value.toLowerCase();
    const campo = document.getElementById('searchField').value;
    
    if (termino) {
        pagosFiltrados = pagosFiltrados.filter(pago => {
            if (campo === 'todos') {
                return pago.pago_id.toString().includes(termino) ||
                       pago.reserva_id.toString().includes(termino) ||
                       pago.monto.toString().includes(termino);
            } else if (campo === 'pago_id') {
                return pago.pago_id.toString().includes(termino);
            } else if (campo === 'reserva_id') {
                return pago.reserva_id.toString().includes(termino);
            } else if (campo === 'monto') {
                return pago.monto.toString().includes(termino);
            }
            return false;
        });
    }
    
    // Aplicar filtros avanzados
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    const montoMin = document.getElementById('montoMin').value;
    const montoMax = document.getElementById('montoMax').value;
    
    if (fechaDesde) {
        pagosFiltrados = pagosFiltrados.filter(pago => 
            pago.fecha_pago >= fechaDesde
        );
    }
    
    if (fechaHasta) {
        pagosFiltrados = pagosFiltrados.filter(pago => 
            pago.fecha_pago <= fechaHasta
        );
    }
    
    if (montoMin) {
        pagosFiltrados = pagosFiltrados.filter(pago => 
            pago.monto >= parseInt(montoMin)
        );
    }
    
    if (montoMax) {
        pagosFiltrados = pagosFiltrados.filter(pago => 
            pago.monto <= parseInt(montoMax)
        );
    }
    
    mostrarPagos(pagosFiltrados);
}

function mostrarPagos(pagos) {
    const contenedor = document.getElementById('data');
    
    if (!pagos || pagos.length === 0) {
        contenedor.innerHTML = '<div class="alert-error">No hay pagos para mostrar</div>';
        return;
    }
    
    let html = '';
    pagos.forEach(pago => {
        // Formatear fecha
        const fecha = new Date(pago.fecha_pago + 'T00:00:00');
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Formatear monto
        const montoFormateado = new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 0
        }).format(pago.monto);
        
        html += `
            <li>
                <p><strong><i class="fas fa-hashtag"></i> Pago ID:</strong> <span>${pago.pago_id}</span></p>
                <p><strong><i class="fas fa-calendar-check"></i> Reserva ID:</strong> <span>${pago.reserva_id}</span></p>
                <p><strong><i class="fas fa-calendar"></i> Fecha:</strong> <span>${fechaFormateada}</span></p>
                <p><strong><i class="fas fa-money-bill-wave"></i> Monto:</strong> 
                    <span class="monto-badge">${montoFormateado}</span>
                </p>
            </li>
        `;
    });
    
    contenedor.innerHTML = html;
}

function buscarPagos() {
    aplicarFiltros();
}

function limpiarBusqueda() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchField').value = 'todos';
    document.getElementById('fechaDesde').value = '';
    document.getElementById('fechaHasta').value = '';
    document.getElementById('montoMin').value = '';
    document.getElementById('montoMax').value = '';
    
    mostrarPagos(todosLosPagos);
    actualizarResumen(todosLosPagos);
}

function aplicarFiltrosAvanzados() {
    aplicarFiltros();
}

function actualizarResumen(pagos) {
    const total = pagos.length;
    const sumaMontos = pagos.reduce((sum, pago) => sum + pago.monto, 0);
    const promedio = total > 0 ? Math.round(sumaMontos / total) : 0;
    const maximo = pagos.length > 0 ? Math.max(...pagos.map(p => p.monto)) : 0;
    
    document.getElementById('totalPagos').textContent = total;
    document.getElementById('totalMonto').textContent = `Bs ${sumaMontos.toLocaleString()}`;
    document.getElementById('montoPromedio').textContent = `Bs ${promedio.toLocaleString()}`;
    document.getElementById('pagoMaximo').textContent = `Bs ${maximo.toLocaleString()}`;
}