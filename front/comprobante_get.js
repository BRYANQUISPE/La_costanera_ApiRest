// comprobante_get.js
const url = "http://127.0.0.1:8000/comprobante/";
let todosLosComprobantes = [];

document.addEventListener('DOMContentLoaded', function() {
    cargarComprobantes();
    
    // Evento para búsqueda con Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarComprobantes();
    });
});

function cargarComprobantes() {
    const contenedor = document.getElementById('data');
    contenedor.innerHTML = '<div style="text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Cargando comprobantes...</p></div>';
    
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
        console.log("Comprobantes cargados:", data);
        todosLosComprobantes = data;
        aplicarFiltros();
        actualizarResumen(data);
    })
    .catch(error => {
        console.error("Error:", error);
        contenedor.innerHTML = `<div class="alert-error">
            <i class="fas fa-exclamation-circle"></i> Error al cargar comprobantes: ${error.message}
        </div>`;
    });
}

function aplicarFiltros() {
    let comprobantesFiltrados = [...todosLosComprobantes];
    
    // Aplicar filtro de búsqueda por texto
    const termino = document.getElementById('searchInput').value.toLowerCase();
    const campo = document.getElementById('searchField').value;
    
    if (termino) {
        comprobantesFiltrados = comprobantesFiltrados.filter(comp => {
            if (campo === 'todos') {
                return comp.comprobante_id.toString().includes(termino) ||
                       comp.pago_id.toString().includes(termino);
            } else if (campo === 'comprobante_id') {
                return comp.comprobante_id.toString().includes(termino);
            } else if (campo === 'pago_id') {
                return comp.pago_id.toString().includes(termino);
            }
            return false;
        });
    }
    
    // Aplicar filtros de fecha
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    
    if (fechaDesde) {
        comprobantesFiltrados = comprobantesFiltrados.filter(comp => 
            comp.fecha_emision >= fechaDesde
        );
    }
    
    if (fechaHasta) {
        comprobantesFiltrados = comprobantesFiltrados.filter(comp => 
            comp.fecha_emision <= fechaHasta
        );
    }
    
    mostrarComprobantes(comprobantesFiltrados);
}

function mostrarComprobantes(comprobantes) {
    const contenedor = document.getElementById('data');
    
    if (!comprobantes || comprobantes.length === 0) {
        contenedor.innerHTML = '<div class="alert-error">No hay comprobantes para mostrar</div>';
        return;
    }
    
    let html = '';
    comprobantes.forEach(comp => {
        // Formatear fecha
        const fecha = new Date(comp.fecha_emision + 'T00:00:00');
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Determinar si es de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const esHoy = comp.fecha_emision === hoy;
        
        html += `
            <li>
                <p><strong><i class="fas fa-hashtag"></i> Comprobante ID:</strong> 
                    <span class="comprobante-badge">#${comp.comprobante_id}</span>
                </p>
                <p><strong><i class="fas fa-credit-card"></i> Pago ID:</strong> 
                    <span>${comp.pago_id}</span>
                </p>
                <p><strong><i class="fas fa-calendar"></i> Fecha Emisión:</strong> 
                    <span class="fecha-emision">
                        <i class="fas ${esHoy ? 'fa-sun' : 'fa-calendar-alt'}"></i>
                        ${fechaFormateada} ${esHoy ? '(Hoy)' : ''}
                    </span>
                </p>
                <div class="info-pago">
                    <i class="fas fa-info-circle"></i>
                    Comprobante asociado al pago #${comp.pago_id}
                </div>
            </li>
        `;
    });
    
    contenedor.innerHTML = html;
}

function buscarComprobantes() {
    aplicarFiltros();
}

function limpiarBusqueda() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchField').value = 'todos';
    document.getElementById('fechaDesde').value = '';
    document.getElementById('fechaHasta').value = '';
    
    // Desactivar filtros rápidos
    document.querySelectorAll('.filtro-rapido-btn').forEach(btn => {
        btn.classList.remove('activo');
        if (btn.textContent.includes('Todos')) {
            btn.classList.add('activo');
        }
    });
    
    mostrarComprobantes(todosLosComprobantes);
    actualizarResumen(todosLosComprobantes);
}

function aplicarFiltrosFecha() {
    aplicarFiltros();
}

function filtrarRapido(tipo) {
    // Actualizar botones
    document.querySelectorAll('.filtro-rapido-btn').forEach(btn => {
        btn.classList.remove('activo');
    });
    event.target.classList.add('activo');
    
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];
    
    let filtrados = [...todosLosComprobantes];
    
    if (tipo === 'hoy') {
        filtrados = todosLosComprobantes.filter(comp => comp.fecha_emision === hoyStr);
    } else if (tipo === 'ayer') {
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        const ayerStr = ayer.toISOString().split('T')[0];
        filtrados = todosLosComprobantes.filter(comp => comp.fecha_emision === ayerStr);
    } else if (tipo === 'semana') {
        const semanaPasada = new Date(hoy);
        semanaPasada.setDate(semanaPasada.getDate() - 7);
        filtrados = todosLosComprobantes.filter(comp => {
            return comp.fecha_emision >= semanaPasada.toISOString().split('T')[0];
        });
    } else if (tipo === 'mes') {
        const mesPasado = new Date(hoy);
        mesPasado.setMonth(mesPasado.getMonth() - 1);
        filtrados = todosLosComprobantes.filter(comp => {
            return comp.fecha_emision >= mesPasado.toISOString().split('T')[0];
        });
    }
    
    mostrarComprobantes(filtrados);
}

function actualizarResumen(comprobantes) {
    const total = comprobantes.length;
    
    const hoy = new Date().toISOString().split('T')[0];
    const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const comprobantesHoy = comprobantes.filter(comp => comp.fecha_emision === hoy).length;
    const comprobantesAyer = comprobantes.filter(comp => comp.fecha_emision === ayer).length;
    
    // Comprobantes este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const inicioMesStr = inicioMes.toISOString().split('T')[0];
    const comprobantesMes = comprobantes.filter(comp => comp.fecha_emision >= inicioMesStr).length;
    
    document.getElementById('totalComprobantes').textContent = total;
    document.getElementById('comprobantesHoy').textContent = comprobantesHoy;
    document.getElementById('comprobantesAyer').textContent = comprobantesAyer;
    document.getElementById('comprobantesMes').textContent = comprobantesMes;
}