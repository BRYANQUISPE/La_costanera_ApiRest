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
class Comprobante(BaseModel):
    
    pago_id: int
    fecha_emision: date
    
    
    
    
  

class ComprobanteOut(Comprobante):
    comprobante_id:int

@router.get("/", response_model=List[ComprobanteOut])    
async def listar_o_buscar(comprobante_id: Optional[int] = None, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        if comprobante_id is not None:
            await cursor.execute("SELECT * FROM comprobante WHERE comprobante_id = %s", (comprobante_id,))
            res = await cursor.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="No encontrado")
            return [res]
        await cursor.execute("SELECT * FROM comprobante")
        return await cursor.fetchall()

@router.get("/{comprobante_id}", response_model=ComprobanteOut)  
async def obtener_por_id(comprobante_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT * FROM comprobante WHERE comprobante_id = %s", (comprobante_id,))
        res = await cursor.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="No encontrado")
        return res
    


from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors



async def _existe_pago(conn, pago_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM pago WHERE pago_id=%s", (pago_id,))
        return (await cur.fetchone()) is not None


@router.post("/", response_model=ComprobanteOut, status_code=status.HTTP_201_CREATED)
async def crear_comprobante(data: Comprobante, conn = Depends(get_conexion)):
    
    sql = """
    INSERT INTO comprobante (pago_id, fecha_emision)
    VALUES (%s, %s)
    RETURNING comprobante_id, pago_id, fecha_emision
"""
    params = (data.pago_id, data.fecha_emision)
    try:
        
# 1) Validar FKs
        if not await _existe_pago(conn, data.pago_id):
            raise HTTPException(status_code=404, detail="Pago no existe")

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


@router.put("/{comprobante_id}", response_model=ComprobanteOut, status_code=status.HTTP_200_OK)
async def actualizar_comprobante(comprobante_id: int, data: Comprobante, conn=Depends(get_conexion)):
    sql = """
        UPDATE comprobante
        SET pago_id = %s, fecha_emision = %s
        WHERE comprobante_id = %s
        RETURNING comprobante_id, pago_id, fecha_emision
    """
    params = (data.pago_id, data.fecha_emision, comprobante_id)

    try:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Comprobante no encontrado")
            await conn.commit()
            return row
    except Exception:
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar el comprobante")



@router.delete("/{comprobante_id}", status_code=status.HTTP_200_OK)
async def eliminar_comprobante(
    comprobante_id: int,
    conn = Depends(get_conexion)
):
    consulta = """
        DELETE FROM comprobante
        WHERE comprobante_id = %s
        RETURNING comprobante_id
    """
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(consulta, (comprobante_id,))
            row = await cursor.fetchone()

            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Comprobante no encontrado")

            await conn.commit()
            return {"mensaje": f"Comprobante {comprobante_id} eliminado correctamente"}

    except Exception as e:
        print(f"Error al eliminar comprobante: {e}")
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo eliminar el comprobante. Consulte con su Administrador.")                