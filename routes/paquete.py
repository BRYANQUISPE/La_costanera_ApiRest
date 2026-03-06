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
class Paquete(BaseModel):
    
    destino_id: int
    nombre:str
    precio:float
    
    
class PaqueteOut(Paquete):
    paquete_id:int

@router.get("/", response_model=List[PaqueteOut])    
async def listar_o_buscar(paquete_id: Optional[int] = None, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        if paquete_id is not None:
            await cursor.execute("SELECT * FROM paquete WHERE paquete_id = %s", (paquete_id,))
            res = await cursor.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="No encontrado")
            return [res]
        await cursor.execute("SELECT * FROM paquete")
        return await cursor.fetchall()

@router.get("/{paquete_id}", response_model=PaqueteOut)  
async def obtener_por_id(paquete_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT * FROM paquete WHERE paquete_id = %s", (paquete_id,))
        res = await cursor.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="No encontrado")
        return res


@router.get("/por-destino/{destino_id}")
async def paquetes_por_destino(destino_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cur:
        await cur.execute("SELECT * FROM paquete WHERE destino_id=%s ORDER BY paquete_id", (destino_id,))
        return await cur.fetchall()


from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors


async def _existe_destino(conn, destino_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM destino WHERE destino_id=%s", (destino_id,))
        return (await cur.fetchone()) is not None

@router.post("/", response_model=PaqueteOut, status_code=status.HTTP_201_CREATED)
async def crear_paquete(data: Paquete, conn = Depends(get_conexion)):
    
    sql = """
    INSERT INTO paquete (destino_id, nombre, precio)
    VALUES (%s, %s, %s)
    RETURNING paquete_id, destino_id, nombre, precio
"""
    params = (data.destino_id, data.nombre, data.precio)
    try:
        
# 1) Validar FKs
        
        if not await _existe_destino(conn, data.destino_id):
            raise HTTPException(status_code=404, detail="Destino no existe")

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
    


@router.put("/{paquete_id}", response_model=PaqueteOut, status_code=status.HTTP_200_OK)
async def actualizar_paquete(paquete_id: int, data: Paquete, conn=Depends(get_conexion)):
    print(f"Intentando actualizar paquete {paquete_id} con datos: {data}")
    sql = """
        UPDATE paquete
        SET destino_id = %s, nombre = %s, precio = %s
        WHERE paquete_id = %s
        RETURNING paquete_id, destino_id, nombre, precio
    """
    params = (data.destino_id, data.nombre, data.precio, paquete_id)

    try:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Hotel no encontrado")
            await conn.commit()
            return row
    except Exception:
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar el hotel")



@router.delete("/{paquete_id}", status_code=status.HTTP_200_OK)
async def eliminar_paquete(
    paquete_id: int,
    conn = Depends(get_conexion)
):
    consulta = """
        DELETE FROM paquete
        WHERE paquete_id = %s
        RETURNING paquete_id
    """
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(consulta, (paquete_id,))
            row = await cursor.fetchone()

            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Paquete no encontrado")

            await conn.commit()
            return {"mensaje": f"Paquete {paquete_id} eliminado correctamente"}

    except Exception as e:
        print(f"Error al eliminar paquete: {e}")
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo eliminar el paquete. Consulte con su Administrador.")                        