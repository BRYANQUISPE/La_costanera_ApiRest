const url="http://127.0.0.1:8000/destino/"
const contenedor=document.getElementById('data')
const cargaData = (datos) => {
    let resultado = '';
    for (let i=0; i<datos.length; i++) {
       resultado += `<li>
    <p> destino_id: ${datos[i].destino_id} </p>
    <p> nombre: ${datos[i].nombre} </p>
    
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
   

