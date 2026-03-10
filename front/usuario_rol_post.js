const url = "http://127.0.0.1:8000/usuario_rol/";

FormularioData.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            usuario_id: usuario_id.value,
            rol_id: rol_id.value
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Usuario y rol creado:", data);
    })
    .catch(error => console.error("Error:", error));
});
