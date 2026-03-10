const url = "http://127.0.0.1:8000/rol/";

FormularioData.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            
            nombre: nombre.value
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Rol creado:", data);
    })
    .catch(error => console.error("Error:", error));
});
