from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import date, datetime, timedelta
from pydantic import BaseModel
from config.conexionDB import get_conexion

router = APIRouter()

# Modelos de respuesta
class ReporteGeneral(BaseModel):
    total_clientes: int
    total_proveedores: int
    total_destinos: int
    total_hoteles: int
    total_paquetes: int
    total_usuarios: int
    total_personal: int

class TopDestino(BaseModel):
    destino_id: int
    nombre: str
    total_hoteles: int
    total_paquetes: int

class ReporteProveedor(BaseModel):
    proveedor_id: int
    nombre: str
    telefono: int
    email: str
    total_hoteles: int
    hoteles: List[str]



@router.get("/general", response_model=ReporteGeneral)
async def reporte_general_sistema(conn = Depends(get_conexion)):
    """
    Reporte general del sistema con conteos de todas las tablas principales
    """
    async with conn.cursor() as cursor:
        # Conteo de clientes
        await cursor.execute("SELECT COUNT(*) as total FROM cliente")
        result = await cursor.fetchone()
        total_clientes = result["total"]  # Acceso por nombre de columna
        
        # Conteo de proveedores
        await cursor.execute("SELECT COUNT(*) as total FROM proveedor")
        result = await cursor.fetchone()
        total_proveedores = result["total"]
        
        # Conteo de destinos
        await cursor.execute("SELECT COUNT(*) as total FROM destino")
        result = await cursor.fetchone()
        total_destinos = result["total"]
        
        # Conteo de hoteles
        await cursor.execute("SELECT COUNT(*) as total FROM hotel")
        result = await cursor.fetchone()
        total_hoteles = result["total"]
        
        # Conteo de paquetes
        await cursor.execute("SELECT COUNT(*) as total FROM paquete")
        result = await cursor.fetchone()
        total_paquetes = result["total"]
        
        # Conteo de usuarios
        await cursor.execute("SELECT COUNT(*) as total FROM usuario")
        result = await cursor.fetchone()
        total_usuarios = result["total"]
        
        # Conteo de personal
        await cursor.execute("SELECT COUNT(*) as total FROM personal")
        result = await cursor.fetchone()
        total_personal = result["total"]
        
        return {
            "total_clientes": total_clientes,
            "total_proveedores": total_proveedores,
            "total_destinos": total_destinos,
            "total_hoteles": total_hoteles,
            "total_paquetes": total_paquetes,
            "total_usuarios": total_usuarios,
            "total_personal": total_personal
        }