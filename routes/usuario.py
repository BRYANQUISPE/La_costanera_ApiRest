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
class Usuario(BaseModel):
    nombre_usuario:str
    hash_password:str
    
    
  

class UsuarioOut(Usuario):
    usuario_id:int

@router.get("/", response_model=List[UsuarioOut])    
async def listar_o_buscar(usuario_id: Optional[int] = None, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        if usuario_id is not None:
            await cursor.execute("SELECT * FROM usuario WHERE usuario_id = %s", (usuario_id,))
            res = await cursor.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="No encontrado")
            return [res]
        await cursor.execute("SELECT * FROM usuario")
        return await cursor.fetchall()

@router.get("/{usuario_id}", response_model=UsuarioOut)  
async def obtener_por_id(usuario_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT * FROM usuario WHERE usuario_id = %s", (usuario_id,))
        res = await cursor.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="No encontrado")
        return res

from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors


@router.post("/", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
async def crear_usuario(data: Usuario, conn = Depends(get_conexion)):
    
    sql = """
        INSERT INTO usuario (nombre_usuario, hash_password)
        VALUES (%s, %s)
        RETURNING usuario_id, nombre_usuario, hash_password
    """
    params = (data.nombre_usuario, data.hash_password)
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
    


@router.put("/{usuario_id}", response_model=UsuarioOut, status_code=status.HTTP_200_OK)
async def actualizar_rol(usuario_id: int, data: Usuario, conn=Depends(get_conexion)):
    sql = """
        UPDATE usuario
        SET nombre_usuario = %s, hash_password = %s
        WHERE usuario_id = %s
        RETURNING usuario_id, nombre_usuario, hash_password
    """
    params = (data.nombre_usuario, data.hash_password, usuario_id)

    try:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            await conn.commit()
            return row
    except Exception:
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar el Usuario")

