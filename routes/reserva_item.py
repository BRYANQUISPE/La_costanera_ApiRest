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
class Reserva_item(BaseModel):
    
    reserva_id: int
    paquete_id: int
    cantidad:int
    
    
  

class Reserva_itemOut(Reserva_item):
    item_id:int

@router.get("/", response_model=List[Reserva_itemOut])    
async def listar_o_buscar(item_id: Optional[int] = None, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        if item_id is not None:
            await cursor.execute("SELECT * FROM reserva_item WHERE item_id = %s", (item_id,))
            res = await cursor.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="No encontrado")
            return [res]
        await cursor.execute("SELECT * FROM reserva_item")
        return await cursor.fetchall()

@router.get("/{item_id}", response_model=Reserva_itemOut)  
async def obtener_por_id(item_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT * FROM reserva_item WHERE item_id = %s", (item_id,))
        res = await cursor.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="No encontrado")
        return res
    



from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors



async def _existe_reserva(conn, reserva_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM reserva WHERE reserva_id=%s", (reserva_id,))
        return (await cur.fetchone()) is not None

async def _existe_paquete(conn, paquete_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM paquete WHERE paquete_id=%s", (paquete_id,))
        return (await cur.fetchone()) is not None

@router.post("/", response_model=Reserva_itemOut, status_code=status.HTTP_201_CREATED)
async def crear_reserva(data: Reserva_item, conn = Depends(get_conexion)):
    
    sql = """
    INSERT INTO reserva_item (reserva_id, paquete_id, cantidad)
    VALUES (%s, %s, %s)
    RETURNING item_id, reserva_id, paquete_id, cantidad
"""
    params = (data.reserva_id, data.paquete_id, data.cantidad)
    try:
        
# 1) Validar FKs
        if not await _existe_reserva(conn, data.reserva_id):
            raise HTTPException(status_code=404, detail="Reserva no existe")
        if not await _existe_paquete(conn, data.paquete_id):
            raise HTTPException(status_code=404, detail="Paquete no existe")

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


@router.put("/{item_id}", response_model=Reserva_itemOut, status_code=status.HTTP_200_OK)
async def actualizar_reserva(item_id: int, data: Reserva_item, conn=Depends(get_conexion)):
    sql = """
        UPDATE reserva_item
        SET reserva_id = %s, paquete_id = %s, cantidad = %s
        WHERE item_id = %s
        RETURNING item_id, reserva_id, paquete_id, cantidad
    """
    params = (data.reserva_id, data.paquete_id, data.cantidad, item_id)

    try:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Reserva no encontrada")
            await conn.commit()
            return row
    except Exception:
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar la reserva")



@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
async def eliminar_reserva(
    item_id: int,
    conn = Depends(get_conexion)
):
    consulta = """
        DELETE FROM reserva_item
        WHERE item_id = %s
        RETURNING item_id
    """
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(consulta, (item_id,))
            row = await cursor.fetchone()

            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Reserva no encontrada")

            await conn.commit()
            return {"mensaje": f"Reserva {item_id} eliminada correctamente"}

    except Exception as e:
        print(f"Error al eliminar reserva: {e}")
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo eliminar la reserva. Consulte con su Administrador.")                