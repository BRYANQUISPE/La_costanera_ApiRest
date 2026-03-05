# Ejemplo de procesos asincronicos
from typing import Optional, List

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

@router.get("/", response_model=List[HotelOut])    
async def listar_o_buscar(hotel_id: Optional[int] = None, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        if hotel_id is not None:
            await cursor.execute("SELECT * FROM hotel WHERE hotel_id = %s", (hotel_id,))
            res = await cursor.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="No encontrado")
            return [res]
        await cursor.execute("SELECT * FROM hotel")
        return await cursor.fetchall()

@router.get("/{hotel_id}", response_model=HotelOut)  
async def obtener_por_id(hotel_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT * FROM hotel WHERE hotel_id = %s", (hotel_id,))
        res = await cursor.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="No encontrado")
        return res


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


@router.put("/{hotel_id}", response_model=HotelOut, status_code=status.HTTP_200_OK)
async def actualizar_hotel(hotel_id: int, data: Hotel, conn=Depends(get_conexion)):
    sql = """
        UPDATE hotel
        SET proveedor_id = %s, destino_id = %s, nombre = %s
        WHERE hotel_id = %s
        RETURNING hotel_id, proveedor_id, destino_id, nombre
    """
    params = (data.proveedor_id, data.destino_id, data.nombre, hotel_id)

    try:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Hotel no encontrado")
            await conn.commit()
            return row
    except Exception:
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar el hotel")