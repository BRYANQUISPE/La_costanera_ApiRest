const url = "http://127.0.0.1:8000/hotel/";

FormularioData.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            proveedor_id: proveedor_id.value,
            destino_id: destino_id.value,
            nombre: nombre.value
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Hotel creado:", data);
    })
    .catch(error => console.error("Error:", error));
});
