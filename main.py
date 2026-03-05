from fastapi import FastAPI, status, Depends, HTTPException
from routes import cliente, destino, proveedor, usuario, rol, hotel, paquete
from config.conexionDB import get_conexion, app
app.include_router(cliente.router, prefix="/cliente")
app.include_router(destino.router, prefix="/destino")
app.include_router(proveedor.router, prefix="/proveedor")
app.include_router(usuario.router, prefix="/usuario")
app.include_router(usuario.router, prefix="/usuario/{usuario_id}")
app.include_router(rol.router, prefix="/rol")
app.include_router(hotel.router, prefix="/hotel")
app.include_router(paquete.router, prefix="/paquete")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)