const url="http://127.0.0.1:8000/cliente/"
const contenedor=document.getElementById('data')
const cargaData = (datos) => {
    let resultado = '';
    for (let i=0; i<datos.length; i++) {
       resultado += `<li>
    <p> cliente_id: ${datos[i].cliente_id} </p>
    <p> nombres: ${datos[i].nombres} </p>
    <p> apellidos: ${datos[i].apellidos} </p>
    <p> ci: ${datos[i].ci} </p>
    <p> telefono: ${datos[i].telefono} </p>
    <p> email: ${datos[i].email} </p>
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
   

