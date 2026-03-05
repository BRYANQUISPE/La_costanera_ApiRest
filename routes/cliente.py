# Ejemplo de procesos asincronicos
from typing import List, Optional

from fastapi import FastAPI, APIRouter, status, Depends, HTTPException
from pydantic import BaseModel
from datetime import date
from psycopg import errors as pg_errors
from config.conexionDB import get_conexion, app

router=APIRouter()

# BaseModel clase fundamental para definir modelos
class Cliente(BaseModel):
    nombres:str
    apellidos:str
    ci:int
    telefono:int
    email:str
  

class ClienteOut(Cliente):
    cliente_id:int


@router.get("/", response_model=List[ClienteOut])    
async def listar_o_buscar(cliente_id: Optional[int] = None, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        if cliente_id is not None:
            await cursor.execute("SELECT * FROM cliente WHERE cliente_id = %s", (cliente_id,))
            res = await cursor.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="No encontrado")
            return [res]
        await cursor.execute("SELECT * FROM cliente")
        return await cursor.fetchall()

@router.get("/{cliente_id}", response_model=ClienteOut)  
async def obtener_por_id(cliente_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT * FROM cliente WHERE cliente_id = %s", (cliente_id,))
        res = await cursor.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="No encontrado")
        return res



from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors


@router.post("/", response_model=ClienteOut, status_code=status.HTTP_201_CREATED)
async def crear_cliente(data: Cliente, conn = Depends(get_conexion)):
    sql = """
        INSERT INTO cliente (nombres, apellidos, ci, telefono, email)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING cliente_id, nombres, apellidos, ci, telefono, email
    """
    params = (data.nombres, data.apellidos, data.ci, data.telefono, data.email)
    try:
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


@router.put("/{cliente_id}", response_model=ClienteOut, status_code=status.HTTP_200_OK)
async def actualizar_cliente(cliente_id: int, data: Cliente, conn=Depends(get_conexion)):
    sql = """
        UPDATE cliente
        SET nombres = %s,
            apellidos = %s,
            ci = %s,
            telefono = %s,
            email = %s
        WHERE cliente_id = %s
        RETURNING cliente_id, nombres, apellidos, ci, telefono, email
    """
    params = (data.nombres, data.apellidos, data.ci, data.telefono, data.email, cliente_id)

    try:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Cliente no encontrado")
            await conn.commit()
            return row
    except Exception:
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar el cliente")




@router.delete("/{cliente_id}", status_code=status.HTTP_200_OK)
async def eliminar_cliente(
    cliente_id: int,
    conn = Depends(get_conexion)
):
    consulta = """
        DELETE FROM cliente
        WHERE cliente_id = %s
        RETURNING cliente_id
    """
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(consulta, (cliente_id,))
            row = await cursor.fetchone()

            # Si no existe el cliente_id
            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Cliente no encontrado")

            await conn.commit()
            return {"mensaje": f"Cliente {cliente_id} eliminado correctamente"}

    except Exception as e:
        print(f"Error al eliminar cliente: {e}")
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo eliminar el cliente. Consulte con su Administrador.")
