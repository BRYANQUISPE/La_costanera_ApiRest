const url="http://127.0.0.1:8000/componente_paquete/"
const contenedor=document.getElementById('data')
const cargaData = (datos) => {
    let resultado = '';
    for (let i=0; i<datos.length; i++) {
       resultado += `<li>
    <p> componente_id: ${datos[i].componente_id} </p>
    <p> paquete_id: ${datos[i].paquete_id} </p>
    <p> hotel_id: ${datos[i].hotel_id} </p>
    <p> descripcion: ${datos[i].descripcion} </p>
    
    </li>`;
    }
    contenedor.innerHTML=resultado;
}
fetch(url, {method: 'GET', headers: {'Content-Type': 'application/json'}})
.then(response => response.json())
.then(data => {
    cargaData(data)
    console.log(data)
    console.log(response.status)})
.catch(error => {console.log(error.message)})
   

