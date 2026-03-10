from fastapi import FastAPI, status, Depends, HTTPException
from routes import cliente, destino, proveedor, usuario, rol, hotel, paquete, usuario_rol, personal, reserva, reserva_item, componente_paquete, pago, comprobante, reportes
from config.conexionDB import get_conexion, app
app.include_router(cliente.router, prefix="/cliente")
app.include_router(destino.router, prefix="/destino")
app.include_router(proveedor.router, prefix="/proveedor")
app.include_router(usuario.router, prefix="/usuario")
app.include_router(rol.router, prefix="/rol")
app.include_router(hotel.router, prefix="/hotel")
app.include_router(paquete.router, prefix="/paquete")
app.include_router(usuario_rol.router, prefix="/usuario_rol")
app.include_router(personal.router, prefix="/personal")
app.include_router(reserva.router, prefix="/reserva")
app.include_router(reserva_item.router, prefix="/reserva_item")
app.include_router(componente_paquete.router, prefix="/componente_paquete")
app.include_router(pago.router, prefix="/pago")
app.include_router(comprobante.router, prefix="/comprobante")
app.include_router(reportes.router, prefix="/reportes")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)