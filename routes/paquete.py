# Ejemplo de procesos asincronicos
from typing import Optional

from fastapi import FastAPI, APIRouter, status, Depends, HTTPException
from pydantic import BaseModel
from datetime import date
from psycopg import errors as pg_errors
from config.conexionDB import get_conexion, app
from routes.proveedor import Proveedor

router=APIRouter()

# BaseModel clase fundamental para definir modelos
class Paquete(BaseModel):
    
    destino_id: int
    nombre:str
    precio:float
    
    
class PaqueteOut(Paquete):
    paquete_id:int

@router.get("/")
async def listar_o_buscar(paquete_id: Optional[int] = None, conn = Depends(get_conexion)):
    try:
        async with conn.cursor() as cursor:
            if paquete_id:
                await cursor.execute("SELECT * FROM paquete WHERE paquete_id = %s", (paquete_id,))
                res = await cursor.fetchone()
                return res if res else HTTPException(status_code=404, detail="No encontrado")
            else:
                await cursor.execute("SELECT * FROM paquete")
                return await cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")



router.get("/paquete/{paquete_id}/")
async def obtener_por_id(paquete_id: int, conn = Depends(get_conexion)):
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT * FROM paquete WHERE paquete_id = %s", (paquete_id,))
            res = await cursor.fetchone()
            if res:
                return res
            else:
                raise HTTPException(status_code=404, detail="No encontrado")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")

from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors


async def _existe_destino(conn, destino_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM destino WHERE destino_id=%s", (destino_id,))
        return (await cur.fetchone()) is not None

@router.post("/", response_model=PaqueteOut, status_code=status.HTTP_201_CREATED)
async def crear_paquete(data: Paquete, conn = Depends(get_conexion)):
    
    sql = """
    INSERT INTO paquete (destino_id, nombre, precio)
    VALUES (%s, %s, %s)
    RETURNING paquete_id, destino_id, nombre, precio
"""
    params = (data.destino_id, data.nombre, data.precio)
    try:
        
# 1) Validar FKs
        
        if not await _existe_destino(conn, data.destino_id):
            raise HTTPException(status_code=404, detail="Destino no existe")

        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            await conn.commit()
            return row  
    except pg_errors.UniqueViolation:
        await conn.rollback()
        raise HTTPException(status_code=409, detail="Conflicto: violación de unicidad.")
    except Exception as e:
        print(f"Error imprevisto al crear: {e}")
        await conn.rollback()
        raise HTTPException(status_code=400, detail="La creación no se efectuó; consulte con su Administrador.")
