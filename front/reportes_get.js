const url = "http://127.0.0.1:8000/reportes/clientes/general";  
const contenedor = document.getElementById('data');

const cargaData = (datos) => {
    
    if (Array.isArray(datos)) {
        
        let resultado = '';
        for (let i = 0; i < datos.length; i++) {
            resultado += `
                <li>
                    <h3>Cliente: ${datos[i].nombre_completo}</h3>
                    <p><strong>ID:</strong> ${datos[i].cliente_id}</p>
                    <p><strong>Total Reservas:</strong> ${datos[i].total_reservas}</p>
                    <p><strong>Total Pagado:</strong> $${datos[i].total_pagado}</p>
                    <p><strong>Pendientes:</strong> ${datos[i].reservas_pendientes}</p>
                    <p><strong>Confirmadas:</strong> ${datos[i].reservas_confirmadas}</p>
                    <p><strong>Canceladas:</strong> ${datos[i].reservas_canceladas}</p>
                    <p><strong>Membresía:</strong> ${datos[i].membresia}</p>
                    <p><strong>Última Reserva:</strong> ${datos[i].ultima_reserva ? new Date(datos[i].ultima_reserva).toLocaleDateString() : 'N/A'}</p>
                </li>
            `;
        }
        contenedor.innerHTML = resultado;
    } else {
        // Si es un objeto único (como el reporte general que esperabas)
        let resultado = `
            <li>
                <h3>Reporte General del Sistema</h3>
                <p><strong>Total Clientes:</strong> ${datos.total_clientes || 0}</p>
                <p><strong>Total Proveedores:</strong> ${datos.total_proveedores || 0}</p>
                <p><strong>Total Destinos:</strong> ${datos.total_destinos || 0}</p>
                <p><strong>Total Hoteles:</strong> ${datos.total_hoteles || 0}</p>
                <p><strong>Total Paquetes:</strong> ${datos.total_paquetes || 0}</p>
                <p><strong>Total Usuarios:</strong> ${datos.total_usuarios || 0}</p>
                <p><strong>Total Personal:</strong> ${datos.total_personal || 0}</p>
            </li>
        `;
        contenedor.innerHTML = resultado;
    }
}

fetch(url, {
    method: 'GET',
    headers: {'Content-Type': 'application/json'}
})
.then(response => {
    console.log('Status:', response.status);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
})
.then(data => {
    console.log('Data recibida:', data);
    cargaData(data);
})
.catch(error => {
    console.log('Error:', error.message);
    contenedor.innerHTML = `<li style="color: red;">Error al cargar datos: ${error.message}</li>`;
});