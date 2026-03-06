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
class Reserva(BaseModel):
    
    cliente_id: int
    usuario_id: int
    fecha_reserva: date
    estado:str
    
    
  

class ReservaOut(Reserva):
    reserva_id:int

@router.get("/", response_model=List[ReservaOut])    
async def listar_o_buscar(reserva_id: Optional[int] = None, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        if reserva_id is not None:
            await cursor.execute("SELECT * FROM reserva WHERE reserva_id = %s", (reserva_id,))
            res = await cursor.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="No encontrado")
            return [res]
        await cursor.execute("SELECT * FROM reserva")
        return await cursor.fetchall()

@router.get("/{reserva_id}", response_model=ReservaOut)  
async def obtener_por_id(reserva_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT * FROM reserva WHERE reserva_id = %s", (reserva_id,))
        res = await cursor.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="No encontrado")
        return res
    



from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors



async def _existe_cliente(conn, cliente_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM cliente WHERE cliente_id=%s", (cliente_id,))
        return (await cur.fetchone()) is not None

async def _existe_usuario(conn, usuario_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM usuario WHERE usuario_id=%s", (usuario_id,))
        return (await cur.fetchone()) is not None

@router.post("/", response_model=ReservaOut, status_code=status.HTTP_201_CREATED)
async def crear_reserva(data: Reserva, conn = Depends(get_conexion)):
    
    sql = """
    INSERT INTO reserva (cliente_id, usuario_id, fecha_reserva, estado)
    VALUES (%s, %s, %s, %s)
    RETURNING reserva_id, cliente_id, usuario_id, fecha_reserva, estado
"""
    params = (data.cliente_id, data.usuario_id, data.fecha_reserva, data.estado)
    try:
        
# 1) Validar FKs
        if not await _existe_cliente(conn, data.cliente_id):
            raise HTTPException(status_code=404, detail="Cliente no existe")
        if not await _existe_usuario(conn, data.usuario_id):
            raise HTTPException(status_code=404, detail="Usuario no existe")

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


@router.put("/{reserva_id}", response_model=ReservaOut, status_code=status.HTTP_200_OK)
async def actualizar_reserva(reserva_id: int, data: Reserva, conn=Depends(get_conexion)):
    sql = """
        UPDATE reserva
        SET cliente_id = %s, usuario_id = %s, fecha_reserva = %s, estado = %s
        WHERE reserva_id = %s
        RETURNING reserva_id, cliente_id, usuario_id, fecha_reserva, estado
    """
    params = (data.cliente_id, data.usuario_id, data.fecha_reserva, data.estado, reserva_id)

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



@router.delete("/{reserva_id}", status_code=status.HTTP_200_OK)
async def eliminar_reserva(
    reserva_id: int,
    conn = Depends(get_conexion)
):
    consulta = """
        DELETE FROM reserva
        WHERE reserva_id = %s
        RETURNING reserva_id
    """
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(consulta, (reserva_id,))
            row = await cursor.fetchone()

            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Reserva no encontrada")

            await conn.commit()
            return {"mensaje": f"Reserva {reserva_id} eliminada correctamente"}

    except Exception as e:
        print(f"Error al eliminar reserva: {e}")
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo eliminar la reserva. Consulte con su Administrador.")                