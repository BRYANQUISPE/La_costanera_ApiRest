// reserva_item_get.js
const url = "http://127.0.0.1:8000/reserva_item/";
let todosLosItems = [];
let filtroActivo = 'todos';

document.addEventListener('DOMContentLoaded', function() {
    cargarItems();
    
    // Evento para búsqueda con Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarItems();
    });
});

function cargarItems() {
    const contenedor = document.getElementById('data');
    contenedor.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Cargando ítems...</p></div>';
    
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
        console.log("Ítems cargados:", data);
        todosLosItems = data;
        aplicarFiltros();
        actualizarResumen(data);
    })
    .catch(error => {
        console.error("Error:", error);
        contenedor.innerHTML = `<div class="alert-error">
            <i class="fas fa-exclamation-circle"></i> Error al cargar ítems: ${error.message}
        </div>`;
    });
}

function aplicarFiltros() {
    let itemsFiltrados = [...todosLosItems];
    
    // Aplicar filtro de búsqueda
    const termino = document.getElementById('searchInput').value.toLowerCase();
    const campo = document.getElementById('searchField').value;
    
    if (termino) {
        itemsFiltrados = itemsFiltrados.filter(item => {
            if (campo === 'todos') {
                return item.item_id.toString().includes(termino) ||
                       item.reserva_id.toString().includes(termino) ||
                       item.paquete_id.toString().includes(termino) ||
                       item.cantidad.toString().includes(termino);
            } else if (campo === 'reserva_id') {
                return item.reserva_id.toString().includes(termino);
            } else if (campo === 'paquete_id') {
                return item.paquete_id.toString().includes(termino);
            } else if (campo === 'cantidad') {
                return item.cantidad.toString().includes(termino);
            }
            return false;
        });
    }
    
    // Aplicar filtro por cantidad
    if (filtroActivo !== 'todos') {
        itemsFiltrados = itemsFiltrados.filter(item => {
            if (filtroActivo === '1') return item.cantidad === 1;
            if (filtroActivo === '2-3') return item.cantidad >= 2 && item.cantidad <= 3;
            if (filtroActivo === '4+') return item.cantidad >= 4;
            return true;
        });
    }
    
    mostrarItems(itemsFiltrados);
}

function mostrarItems(items) {
    const contenedor = document.getElementById('data');
    
    if (!items || items.length === 0) {
        contenedor.innerHTML = '<div class="alert-error">No hay ítems para mostrar</div>';
        return;
    }
    
    let html = '';
    items.forEach(item => {
        // Determinar clase según cantidad
        let cantidadClass = '';
        if (item.cantidad >= 4) cantidadClass = 'badge-cantidad';
        
        html += `
            <li>
                <p><strong><i class="fas fa-hashtag"></i> Item ID:</strong> <span>${item.item_id}</span></p>
                <p><strong><i class="fas fa-calendar-check"></i> Reserva ID:</strong> <span>${item.reserva_id}</span></p>
                <p><strong><i class="fas fa-box"></i> Paquete ID:</strong> <span>${item.paquete_id}</span></p>
                <p><strong><i class="fas fa-sort-numeric-up"></i> Cantidad:</strong> 
                    <span class="${cantidadClass}">${item.cantidad} ${item.cantidad === 1 ? 'unidad' : 'unidades'}</span>
                </p>
            </li>
        `;
    });
    
    contenedor.innerHTML = html;
}

function buscarItems() {
    aplicarFiltros();
}

function limpiarBusqueda() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchField').value = 'todos';
    filtroActivo = 'todos';
    
    // Actualizar botones de filtro
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('activo');
        if (btn.textContent.includes('Todos')) {
            btn.classList.add('activo');
        }
    });
    
    mostrarItems(todosLosItems);
    actualizarResumen(todosLosItems);
}

function filtrarPorCantidad(tipo) {
    filtroActivo = tipo;
    
    // Actualizar botones
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('activo');
    });
    event.target.classList.add('activo');
    
    aplicarFiltros();
}

function actualizarResumen(items) {
    const totalItems = items.length;
    const totalUnidades = items.reduce((sum, item) => sum + item.cantidad, 0);
    const promedio = totalItems > 0 ? (totalUnidades / totalItems).toFixed(1) : 0;
    const itemsUnicos = new Set(items.map(item => item.paquete_id)).size;
    
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalUnidades').textContent = totalUnidades;
    document.getElementById('promedioItems').textContent = promedio;
    document.getElementById('itemsUnicos').textContent = itemsUnicos;
}