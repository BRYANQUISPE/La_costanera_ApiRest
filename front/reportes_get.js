const url = "http://127.0.0.1:8000/reportes/general";  // ← Cambia aquí
const contenedor = document.getElementById('data');

const cargaData = (datos) => {
    // Como es un objeto único, no necesitas un bucle for
    let resultado = `
        <li>
            <p>total_clientes: ${datos.total_clientes}</p>
            <p>total_proveedores: ${datos.total_proveedores}</p>
            <p>total_destinos: ${datos.total_destinos}</p>
            <p>total_hoteles: ${datos.total_hoteles}</p>
            <p>total_paquetes: ${datos.total_paquetes}</p>
            <p>total_usuarios: ${datos.total_usuarios}</p>
            <p>total_personal: ${datos.total_personal}</p>
        </li>
    `;
    contenedor.innerHTML = resultado;
}

fetch(url, {method: 'GET', headers: {'Content-Type': 'application/json'}})
    .then(response => {
        console.log('Status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Data recibida:', data);
        cargaData(data);
    })
    .catch(error => console.log('Error:', error.message));