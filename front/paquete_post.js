const url = "http://127.0.0.1:8000/paquete/";

FormularioData.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            destino_id: destino_id.value,
            nombre: nombre.value,
            precio: precio.value
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Paquete creado:", data);
    })
    .catch(error => console.error("Error:", error));
});
