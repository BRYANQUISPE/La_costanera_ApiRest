const url="http://127.0.0.1:8000/usuario/"
const contenedor=document.getElementById('data')
const cargaData = (datos) => {
    let resultado = '';
    for (let i=0; i<datos.length; i++) {
       resultado += `<li>
    <p> usuario_id: ${datos[i].usuario_id} </p>   
    <p> nombre_usuario: ${datos[i].nombre_usuario} </p>
    <p> hash_password: ${datos[i].hash_password} </p>
    

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
   

