# Ejemplo de procesos asincronicos
from typing import Optional

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

@router.get("/")
async def listar_o_buscar(usuario_id: Optional[int] = None, conn = Depends(get_conexion)):
    try:
        async with conn.cursor() as cursor:
            if usuario_id:
                await cursor.execute("SELECT * FROM usuario WHERE usuario_id = %s", (usuario_id,))
                res = await cursor.fetchone()
                return res if res else HTTPException(status_code=404, detail="No encontrado")
            else:
                await cursor.execute("SELECT * FROM usuario")
                return await cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")


router.get("/usuario/{usuario_id}/")
async def obtener_por_id(usuario_id: int, conn = Depends(get_conexion)):
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT * FROM usuario WHERE usuario_id = %s", (usuario_id,))
            res = await cursor.fetchone()
            if res:
                return res
            else:
                raise HTTPException(status_code=404, detail="No encontrado")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")


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
