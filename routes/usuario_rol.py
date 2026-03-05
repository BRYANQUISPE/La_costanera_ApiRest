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
class Usuario_rol(BaseModel):
    
    usuario_id: int
    rol_id: int
    
    
    
  

class Usuario_rolOut(Usuario_rol):
    pass

@router.get("/", response_model=List[Usuario_rolOut])
async def listar_asignaciones(conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT usuario_id, rol_id FROM usuario_rol")
        return await cursor.fetchall()
    
@router.get("/{usuario_id}/{rol_id}", response_model=Usuario_rolOut)
async def obtener_por_id_compuesto(
    usuario_id: int, 
    rol_id: int, 
    conn=Depends(get_conexion)
):
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT usuario_id, rol_id 
            FROM usuario_rol 
            WHERE usuario_id = %s AND rol_id = %s
        """, (usuario_id, rol_id))
        
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Asignación no encontrada")
        
        return {
            "usuario_id": row["usuario_id"],  # Acceso por nombre
            "rol_id": row["rol_id"]            # Acceso por nombre
        }
    



from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors



async def _existe_usuario(conn, usuario_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM usuario WHERE usuario_id=%s", (usuario_id,))
        return (await cur.fetchone()) is not None

async def _existe_rol(conn, rol_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM rol WHERE rol_id=%s", (rol_id,))
        return (await cur.fetchone()) is not None
    

@router.post("/", response_model=Usuario_rolOut, status_code=status.HTTP_201_CREATED)
async def asignar_rol_a_usuario(
    data: Usuario_rol,  
    conn = Depends(get_conexion)
):
    sql = """
        INSERT INTO usuario_rol (usuario_id, rol_id)
        VALUES (%s, %s)
        RETURNING usuario_id, rol_id
    """
    params = (data.usuario_id, data.rol_id)
    
    try:
        # Validar que el usuario existe
        if not await _existe_usuario(conn, data.usuario_id):
            raise HTTPException(status_code=404, detail="Usuario no existe")
        
        # Validar que el rol existe
        if not await _existe_rol(conn, data.rol_id):
            raise HTTPException(status_code=404, detail="Rol no existe")

        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            await conn.commit()
            
            return {
                "usuario_id": row["usuario_id"],  # Acceso por nombre
                "rol_id": row["rol_id"]            # Acceso por nombre
            }
            
    except pg_errors.UniqueViolation:
        await conn.rollback()
        raise HTTPException(
            status_code=409, 
            detail=f"El usuario {data.usuario_id} ya tiene asignado el rol {data.rol_id}"
        )
    except Exception as e:
        print(f"Error imprevisto al asignar rol: {e}")
        await conn.rollback()
        raise HTTPException(
            status_code=400, 
            detail="No se pudo asignar el rol. Consulte con su Administrador."
        )

async def _existe_usuario(conn, usuario_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM usuario WHERE usuario_id = %s", (usuario_id,))
        return await cur.fetchone() is not None

async def _existe_rol(conn, rol_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM rol WHERE rol_id = %s", (rol_id,))
        return await cur.fetchone() is not None
    

    

@router.delete("/{usuario_id}/{rol_id}", status_code=status.HTTP_200_OK)
async def eliminar_asignacion(
    usuario_id: int,
    rol_id: int,
    conn = Depends(get_conexion)
):
    consulta = """
        DELETE FROM usuario_rol
        WHERE usuario_id = %s AND rol_id = %s
        RETURNING usuario_id, rol_id
    """
    
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(consulta, (usuario_id, rol_id))
            row = await cursor.fetchone()

            if not row:
                await conn.rollback()
                raise HTTPException(
                    status_code=404, 
                    detail=f"No existe la asignación: usuario {usuario_id} con rol {rol_id}"
                )

            await conn.commit()
            return {
                "mensaje": f"Asignación eliminada: usuario {usuario_id} ya no tiene el rol {rol_id}",
                "usuario_id": row["usuario_id"],  
                "rol_id": row["rol_id"]  
            }

    except Exception as e:
        print(f"Error al eliminar asignación: {e}")
        await conn.rollback()
        raise HTTPException(
            status_code=400, 
            detail="No se pudo eliminar la asignación. Consulte con su Administrador."
        )