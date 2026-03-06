# Ejemplo de procesos asincronicos
from typing import Optional, List

from fastapi import FastAPI, APIRouter, status, Depends, HTTPException
from pydantic import BaseModel
from datetime import date
from psycopg import errors as pg_errors
from config.conexionDB import get_conexion, app

router=APIRouter()

# BaseModel clase fundamental para definir modelos
class Proveedor(BaseModel):
    nombre:str
    telefono:int
    email:str
    
  

class ProveedorOut(Proveedor):
    proveedor_id:int

@router.get("/", response_model=List[ProveedorOut])    
async def listar_o_buscar(proveedor_id: Optional[int] = None, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        if proveedor_id is not None:
            await cursor.execute("SELECT * FROM proveedor WHERE proveedor_id = %s", (proveedor_id,))
            res = await cursor.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="No encontrado")
            return [res]
        await cursor.execute("SELECT * FROM proveedor")
        return await cursor.fetchall()

@router.get("/{proveedor_id}", response_model=ProveedorOut)  
async def obtener_por_id(proveedor_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT * FROM proveedor WHERE proveedor_id = %s", (proveedor_id,))
        res = await cursor.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="No encontrado")
        return res
        


from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors


@router.post("/", response_model=ProveedorOut, status_code=status.HTTP_201_CREATED)
async def crear_proveedor(data: Proveedor, conn = Depends(get_conexion)):
    sql = """
        INSERT INTO proveedor (nombre, telefono, email)
        VALUES (%s, %s, %s)
        RETURNING proveedor_id, nombre, telefono, email
    """
    params = (data.nombre, data.telefono, data.email)
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
    


@router.put("/{proveedor_id}", response_model=ProveedorOut, status_code=status.HTTP_200_OK)
async def actualizar_proveedor(proveedor_id: int, data: Proveedor, conn=Depends(get_conexion)):
    sql = """
        UPDATE proveedor
        SET nombre = %s, telefono = %s, email = %s
        WHERE proveedor_id = %s
        RETURNING proveedor_id, nombre, telefono, email
    """
    params = (data.nombre, data.telefono, data.email, proveedor_id)

    try:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Proveedor no encontrado")
            await conn.commit()
            return row
    except Exception:
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar el proveedor")
    


@router.delete("/{proveedor_id}", status_code=status.HTTP_200_OK)
async def eliminar_proveedor(
    proveedor_id: int,
    conn = Depends(get_conexion)
):
    consulta = """
        DELETE FROM proveedor
        WHERE proveedor_id = %s
        RETURNING proveedor_id
    """
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(consulta, (proveedor_id,))
            row = await cursor.fetchone()

            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Proveedor no encontrado")

            await conn.commit()
            return {"mensaje": f"Proveedor {proveedor_id} eliminado correctamente"}

    except Exception as e:
        print(f"Error al eliminar proveedor: {e}")
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo eliminar el proveedor. Consulte con su Administrador.")    