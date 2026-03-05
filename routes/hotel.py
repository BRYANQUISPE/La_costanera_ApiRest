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
class Hotel(BaseModel):
    
    proveedor_id: int
    destino_id: int
    nombre:str
    
    
    
  

class HotelOut(Hotel):
    hotel_id:int

@router.get("/")
async def listar_o_buscar(hotel_id: Optional[int] = None, conn = Depends(get_conexion)):
    try:
        async with conn.cursor() as cursor:
            if hotel_id:
                await cursor.execute("SELECT * FROM hotel WHERE hotel_id = %s", (hotel_id,))
                res = await cursor.fetchone()
                return res if res else HTTPException(status_code=404, detail="No encontrado")
            else:
                await cursor.execute("SELECT * FROM hotel")
                return await cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")



router.get("/hotel/{hotel_id}/")
async def obtener_por_id(hotel_id: int, conn = Depends(get_conexion)):
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT * FROM hotel WHERE hotel_id = %s", (hotel_id,))
            res = await cursor.fetchone()
            if res:
                return res
            else:
                raise HTTPException(status_code=404, detail="No encontrado")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")

from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors



async def _existe_proveedor(conn, proveedor_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM proveedor WHERE proveedor_id=%s", (proveedor_id,))
        return (await cur.fetchone()) is not None

async def _existe_destino(conn, destino_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM destino WHERE destino_id=%s", (destino_id,))
        return (await cur.fetchone()) is not None

@router.post("/", response_model=HotelOut, status_code=status.HTTP_201_CREATED)
async def crear_hotel(data: Hotel, conn = Depends(get_conexion)):
    
    sql = """
    INSERT INTO hotel (proveedor_id, destino_id, nombre)
    VALUES (%s, %s, %s)
    RETURNING hotel_id, proveedor_id, destino_id, nombre
"""
    params = (data.proveedor_id, data.destino_id, data.nombre)
    try:
        
# 1) Validar FKs
        if not await _existe_proveedor(conn, data.proveedor_id):
            raise HTTPException(status_code=404, detail="Proveedor no existe")
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
