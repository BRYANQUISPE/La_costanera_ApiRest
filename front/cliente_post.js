const url = "http://127.0.0.1:8000/cliente/";

FormularioData.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombres: nombres.value,
            apellidos: apellidos.value,
            ci: ci.value,
            telefono: telefono.value,
            email: email.value
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Cliente creado:", data);
    })
    .catch(error => console.error("Error:", error));
});
