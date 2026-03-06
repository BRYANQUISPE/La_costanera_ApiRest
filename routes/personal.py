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
class Personal(BaseModel):
    
    usuario_id:int
    nombres:str
    apellidos:str
    cargo:str
    telefono:int
    
    
    
  

class PersonalOut(Personal):
    personal_id:int

@router.get("/", response_model=List[PersonalOut])    
async def listar_o_buscar(personal_id: Optional[int] = None, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        if personal_id is not None:
            await cursor.execute("SELECT * FROM personal WHERE personal_id = %s", (personal_id,))
            res = await cursor.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="No encontrado")
            return [res]
        await cursor.execute("SELECT * FROM personal")
        return await cursor.fetchall()

@router.get("/{personal_id}", response_model=PersonalOut)  
async def obtener_por_id(personal_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT * FROM personal WHERE personal_id = %s", (personal_id,))
        res = await cursor.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="No encontrado")
        return res
    


from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors



async def _existe_usuario(conn, usuario_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM usuario WHERE usuario_id=%s", (usuario_id,))
        return (await cur.fetchone()) is not None



@router.post("/", response_model=PersonalOut, status_code=status.HTTP_201_CREATED)
async def crear_personal(data: Personal, conn = Depends(get_conexion)):
    
    sql = """
    INSERT INTO personal (usuario_id, nombres, apellidos, cargo, telefono)
    VALUES (%s, %s, %s, %s, %s)
    RETURNING personal_id, usuario_id, nombres, apellidos, cargo, telefono
"""
    params = (data.usuario_id, data.nombres, data.apellidos, data.cargo, data.telefono)
    try:
        
# 1) Validar FKs
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


@router.put("/{personal_id}", response_model=PersonalOut, status_code=status.HTTP_200_OK)
async def actualizar_personal(personal_id: int, data: Personal, conn=Depends(get_conexion)):
    sql = """
        UPDATE personal
        SET usuario_id = %s, nombres = %s, apellidos = %s, cargo = %s, telefono = %s
        WHERE personal_id = %s
        RETURNING personal_id, usuario_id, nombres, apellidos, cargo, telefono
    """
    params = (data.usuario_id, data.nombres, data.apellidos, data.cargo, data.telefono, personal_id)

    try:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Personal no encontrado")
            await conn.commit()
            return row
    except Exception:
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar el personal")



@router.delete("/{personal_id}", status_code=status.HTTP_200_OK)
async def eliminar_personal(
    personal_id: int,
    conn = Depends(get_conexion)
):
    consulta = """
        DELETE FROM personal
        WHERE personal_id = %s
        RETURNING personal_id
    """
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(consulta, (personal_id,))
            row = await cursor.fetchone()

            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Personal no encontrado")

            await conn.commit()
            return {"mensaje": f"Personal {personal_id} eliminado correctamente"}

    except Exception as e:
        print(f"Error al eliminar personal: {e}")
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo eliminar el personal. Consulte con su Administrador.")                