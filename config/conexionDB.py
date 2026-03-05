from fastapi import FastAPI
from psycopg_pool import AsyncConnectionPool
from psycopg.rows import dict_row

from contextlib import asynccontextmanager
# prodPSYN3Pool
# DB_URL = "postgresql://usuario:password@host:puerto/nameBD"
DB_URL = "postgresql://postgres:1234@localhost:5432/la_costanera_DB"
# 1. Gestionamos el ciclo de vida del Pool
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Se crea el pool al iniciar la app
    app.async_pool = AsyncConnectionPool(conninfo=DB_URL, open=False)
    try:
        await app.async_pool.open()
        print("✅ Pool de conexiones abierto exitosamente")
        yield
    finally:
        # Esto asegura que se cierre el pool al apagar la app, incluso  si la app falla al arrancar
        await app.async_pool.close() 
        print("🛑 Pool de conexiones cerrado")

app = FastAPI(lifespan=lifespan)

# 2. Dependencia para inyectar la conexión en las rutas
async def get_conexion():
    async with app.async_pool.connection() as conn:
        # Configuramos dict_row para recibir diccionarios en lugar de tuplas
        conn.row_factory = dict_row
        yield conn
