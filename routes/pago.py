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
class Pago(BaseModel):
    
    reserva_id: int
    monto: int
    fecha_pago: date
    
    
    
    
  

class PagoOut(Pago):
    pago_id:int

@router.get("/", response_model=List[PagoOut])    
async def listar_o_buscar(pago_id: Optional[int] = None, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        if pago_id is not None:
            await cursor.execute("SELECT * FROM pago WHERE pago_id = %s", (pago_id,))
            res = await cursor.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="No encontrado")
            return [res]
        await cursor.execute("SELECT * FROM pago")
        return await cursor.fetchall()

@router.get("/{pago_id}", response_model=PagoOut)  
async def obtener_por_id(pago_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT * FROM pago WHERE pago_id = %s", (pago_id,))
        res = await cursor.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="No encontrado")
        return res
    


from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors



async def _existe_reserva_id(conn, reserva_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM reserva WHERE reserva_id=%s", (reserva_id,))
        return (await cur.fetchone()) is not None



@router.post("/", response_model=PagoOut, status_code=status.HTTP_201_CREATED)
async def crear_pago(data: Pago, conn = Depends(get_conexion)):
    
    sql = """
    INSERT INTO pago (reserva_id, monto, fecha_pago)
    VALUES (%s, %s, %s)
    RETURNING pago_id, reserva_id, monto, fecha_pago
"""
    params = (data.reserva_id, data.monto, data.fecha_pago)
    try:
        
# 1) Validar FKs
        if not await _existe_reserva_id(conn, data.reserva_id):
            raise HTTPException(status_code=404, detail="Reserva no existe")
        
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


@router.put("/{pago_id}", response_model=PagoOut, status_code=status.HTTP_200_OK)
async def actualizar_pago(pago_id: int, data: Pago, conn=Depends(get_conexion)):
    sql = """
        UPDATE pago
        SET reserva_id = %s, monto = %s, fecha_pago = %s
        WHERE pago_id = %s
        RETURNING pago_id, reserva_id, monto, fecha_pago
    """
    params = (data.reserva_id, data.monto, data.fecha_pago, pago_id)

    try:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Pago no encontrado")
            await conn.commit()
            return row
    except Exception:
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar el pago")



@router.delete("/{pago_id}", status_code=status.HTTP_200_OK)
async def eliminar_pago(
    pago_id: int,
    conn = Depends(get_conexion)
):
    consulta = """
        DELETE FROM pago
        WHERE pago_id = %s
        RETURNING pago_id
    """
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(consulta, (pago_id,))
            row = await cursor.fetchone()

            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Pago no encontrado")

            await conn.commit()
            return {"mensaje": f"Pago {pago_id} eliminado correctamente"}

    except Exception as e:
        print(f"Error al eliminar pago: {e}")
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo eliminar el pago. Consulte con su Administrador.")                