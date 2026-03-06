# Ejemplo de procesos asincronicos
from typing import Optional, List

from fastapi import FastAPI, APIRouter, status, Depends, HTTPException
from pydantic import BaseModel
from datetime import date
from psycopg import errors as pg_errors
from config.conexionDB import get_conexion, app
from routes.paquete import PaqueteOut
from routes.paquete import PaqueteOut
from routes.proveedor import Proveedor

router=APIRouter()

# BaseModel clase fundamental para definir modelos
class Componente_paquete(BaseModel):
    
    paquete_id: int
    hotel_id: int
    descripcion:str
    
    
class Componente_paqueteOut(Componente_paquete):
    componente_id:int

@router.get("/", response_model=List[Componente_paqueteOut])    
async def listar_o_buscar(componente_id: Optional[int] = None, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        if componente_id is not None:
            await cursor.execute("SELECT * FROM componente_paquete WHERE componente_id = %s", (componente_id,))
            res = await cursor.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="No encontrado")
            return [res]
        await cursor.execute("SELECT * FROM componente_paquete")
        return await cursor.fetchall()

@router.get("/{componente_id}", response_model=Componente_paqueteOut)  
async def obtener_por_id(componente_id: int, conn=Depends(get_conexion)):
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT * FROM componente_paquete WHERE componente_id = %s", (componente_id,))
        res = await cursor.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="No encontrado")
        return res



from fastapi import HTTPException, status, Depends
from psycopg import errors as pg_errors


async def _existe_paquete(conn, paquete_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM paquete WHERE paquete_id=%s", (paquete_id,))
        return (await cur.fetchone()) is not None
    
async def _existe_hotel(conn, hotel_id: int) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1 FROM hotel WHERE hotel_id=%s", (hotel_id,))
        return (await cur.fetchone()) is not None    

@router.post("/", response_model=Componente_paqueteOut, status_code=status.HTTP_201_CREATED)
async def crear_componente_paquete(data: Componente_paquete, conn = Depends(get_conexion)):
    
    sql = """
    INSERT INTO componente_paquete (paquete_id, hotel_id, descripcion)
    VALUES (%s, %s, %s)
    RETURNING componente_id, paquete_id, hotel_id, descripcion
"""
    params = (data.paquete_id, data.hotel_id, data.descripcion)
    try:
        
# 1) Validar FKs
        
        if not await _existe_paquete(conn, data.paquete_id):
            raise HTTPException(status_code=404, detail="Paquete no existe")

        if not await _existe_hotel(conn, data.hotel_id):
            raise HTTPException(status_code=404, detail="Hotel no existe")

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
        
        

@router.put("/{componente_id}", response_model=Componente_paqueteOut, status_code=status.HTTP_200_OK)
async def actualizar_componente_paquete(componente_id: int, data: Componente_paquete, conn=Depends(get_conexion)):
    sql = """
        UPDATE componente_paquete
        SET paquete_id = %s, hotel_id = %s, descripcion = %s
        WHERE componente_id = %s
        RETURNING componente_id, paquete_id, hotel_id, descripcion
    """
    params = (data.paquete_id, data.hotel_id, data.descripcion, componente_id)

    try:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            row = await cur.fetchone()
            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Componente de paquete no encontrado")
            await conn.commit()
            return row
    except Exception:
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo actualizar el componente de paquete")



@router.delete("/{componente_id}", status_code=status.HTTP_200_OK)
async def eliminar_componente_paquete(
    componente_id: int,
    conn = Depends(get_conexion)
):
    consulta = """
        DELETE FROM componente_paquete
        WHERE componente_id = %s
        RETURNING componente_id
    """
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(consulta, (componente_id,))
            row = await cursor.fetchone()

            if not row:
                await conn.rollback()
                raise HTTPException(status_code=404, detail="Componente de paquete no encontrado")

            await conn.commit()
            return {"mensaje": f"Componente de paquete {componente_id} eliminado correctamente"}

    except Exception as e:
        print(f"Error al eliminar paquete: {e}")
        await conn.rollback()
        raise HTTPException(status_code=400, detail="No se pudo eliminar el paquete. Consulte con su Administrador.")                        