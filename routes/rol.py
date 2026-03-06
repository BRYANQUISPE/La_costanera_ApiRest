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
class Rol(BaseModel):
    nombre:str
    
    
  

class RolOut(Rol):
    rol_id:int

@router.get("/", response_model=List[RolOut])    
async def listar_o_buscar(rol_id: Optional[int] = None, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        if rol_id is not None:
            await cursor.execute("SELECT * FROM rol WHERE rol_id = %s", (rol_id,))
            res = await cursor.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="No encontrado")
            return [res]
        await cursor.execute("SELECT * FROM rol")
        return await cursor.fetchall()

@router.get("/{rol_id}", response_model=RolOut)  
async def obtener_por_id(rol_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT * FROM rol WHERE rol_id = %s", (rol_id,))
        res = await cursor.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="No encontrado")
        return res

from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors


@router.post("/", response_model=RolOut, status_code=status.HTTP_201_CREATED)
async def crear_rol(data: Rol, conn = Depends(get_conexion)):
    
    sql = """
        INSERT INTO rol (nombre)
        VALUES (%s)
        RETURNING rol_id, nombre
    """
    params = (data.nombre,)
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
    

@router.put("/{rol_id}", response_model=RolOut, status_code=status.HTTP_200_OK)
async def actualizar_rol(rol_id: int, data: Rol, conn=Depends(get_conexion)):
    sql = """
        UPDATE rol
        SET nombre = %s
        WHERE rol_id = %s
        RETURNING rol_id, nombre
    """
    params = (data.nombre, rol_id)

    try:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Rol no encontrado")
            await conn.commit()
            return row
    except Exception:
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar el rol")



@router.delete("/{rol_id}", status_code=status.HTTP_200_OK)
async def eliminar_rol(
    rol_id: int,
    conn = Depends(get_conexion)
):
    consulta = """
        DELETE FROM rol
        WHERE rol_id = %s
        RETURNING rol_id
    """
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(consulta, (rol_id,))
            row = await cursor.fetchone()

            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Rol no encontrado")

            await conn.commit()
            return {"mensaje": f"Rol {rol_id} eliminado correctamente"}

    except Exception as e:
        print(f"Error al eliminar rol: {e}")
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo eliminar el rol. Consulte con su Administrador.")    