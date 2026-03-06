const url = "http://127.0.0.1:8000/usuario/";

FormularioData.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre_usuario: nombre_usuario.value,
            hash_password: hash_password.value
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Usuario creado:", data);
    })
    .catch(error => console.error("Error:", error));
});
