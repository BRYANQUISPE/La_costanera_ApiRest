const url = "http://127.0.0.1:8000/componente_paquete/";

FormularioData.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            paquete_id: paquete_id.value,
            hotel_id: hotel_id.value,
            descripcion: descripcion.value
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Componente de paquete creado:", data);
    })
    .catch(error => console.error("Error:", error));
});
