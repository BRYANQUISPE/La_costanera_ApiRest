from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from config.conexionDB import get_conexion

router = APIRouter()

# ============================================
# REPORTES DE CLIENTES
# ============================================

@router.get("/clientes/vip")  # 👈 ESTA PRIMERO
async def clientes_vip(
    limite: int = 10,
    conn = Depends(get_conexion)
):
    """
    Top clientes con mayor gasto (clientes VIP)
    """
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT 
                c.cliente_id,
                c.nombres || ' ' || c.apellidos as cliente,
                COUNT(DISTINCT r.reserva_id) as reservas,
                COALESCE(SUM(p.monto), 0) as total_gastado,
                COUNT(DISTINCT p.pago_id) as pagos_realizados
            FROM cliente c
            JOIN reserva r ON c.cliente_id = r.cliente_id
            JOIN pago p ON r.reserva_id = p.reserva_id
            GROUP BY c.cliente_id, c.nombres, c.apellidos
            HAVING COALESCE(SUM(p.monto), 0) > 1000
            ORDER BY total_gastado DESC
            LIMIT %s
        """, (limite,))
        
        resultados = await cursor.fetchall()
        
        return [
            {
                "cliente_id": r["cliente_id"],
                "cliente": r["cliente"],
                "reservas": r["reservas"],
                "total_gastado": float(r["total_gastado"]),
                "pagos_realizados": r["pagos_realizados"]
            }
            for r in resultados
        ]



@router.get("/clientes/general")
async def reporte_clientes_general(conn = Depends(get_conexion)):
    """
    Reporte general de todos los clientes con sus estadísticas
    """
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT 
                c.cliente_id,
                c.nombres || ' ' || c.apellidos as nombre_completo,
                COUNT(DISTINCT r.reserva_id) as total_reservas,
                COALESCE(SUM(p.monto), 0) as total_pagado,
                COUNT(CASE WHEN r.estado = 'pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN r.estado = 'confirmada' THEN 1 END) as confirmadas,
                COUNT(CASE WHEN r.estado = 'cancelada' THEN 1 END) as canceladas,
                MAX(r.fecha_reserva) as ultima_reserva
            FROM cliente c
            LEFT JOIN reserva r ON c.cliente_id = r.cliente_id
            LEFT JOIN pago p ON r.reserva_id = p.reserva_id
            GROUP BY c.cliente_id, c.nombres, c.apellidos
            ORDER BY total_pagado DESC
        """)
        
        resultados = await cursor.fetchall()
        
        # ✅ CORREGIDO: Acceso por nombre de columna en lugar de índice
        return [
            {
                "cliente_id": r["cliente_id"],  
                "nombre_completo": r["nombre_completo"],  
                "total_reservas": r["total_reservas"],  
                "total_pagado": float(r["total_pagado"]),  
                "reservas_pendientes": r["pendientes"],  
                "reservas_confirmadas": r["confirmadas"],  
                "reservas_canceladas": r["canceladas"],  
                "ultima_reserva": r["ultima_reserva"],  
                "membresia": "VIP" if float(r["total_pagado"]) > 5000 else "Regular"
            }
            for r in resultados
        ]
@router.get("/clientes/{cliente_id}")
async def reporte_cliente_detallado(
    cliente_id: int, 
    conn = Depends(get_conexion)
):
    """
    Reporte detallado de un cliente específico con todas sus reservas y pagos
    """
    async with conn.cursor() as cursor:
        # ===== PARTE 1: DATOS GENERALES DEL CLIENTE =====
        await cursor.execute("""
            SELECT 
                c.cliente_id,
                c.nombres || ' ' || c.apellidos as nombre_completo,
                c.ci,
                c.telefono,
                c.email,
                COUNT(DISTINCT r.reserva_id) as total_reservas,
                COALESCE(SUM(p.monto), 0) as total_pagado,
                COUNT(CASE WHEN r.estado = 'pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN r.estado = 'confirmada' THEN 1 END) as confirmadas,
                COUNT(CASE WHEN r.estado = 'cancelada' THEN 1 END) as canceladas,
                MAX(r.fecha_reserva) as ultima_reserva
            FROM cliente c
            LEFT JOIN reserva r ON c.cliente_id = r.cliente_id
            LEFT JOIN pago p ON r.reserva_id = p.reserva_id
            WHERE c.cliente_id = %s
            GROUP BY c.cliente_id, c.nombres, c.apellidos, c.ci, c.telefono, c.email
        """, (cliente_id,))
        
        fila_cliente = await cursor.fetchone()
        if not fila_cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Convertir a diccionario para acceso por nombre
        cliente = {
            "cliente_id": fila_cliente["cliente_id"],
            "nombre_completo": fila_cliente["nombre_completo"],
            "ci": fila_cliente["ci"],
            "telefono": fila_cliente["telefono"],
            "email": fila_cliente["email"],
            "total_reservas": fila_cliente["total_reservas"],
            "total_pagado": float(fila_cliente["total_pagado"]),
            "pendientes": fila_cliente["pendientes"] or 0,
            "confirmadas": fila_cliente["confirmadas"] or 0,
            "canceladas": fila_cliente["canceladas"] or 0,
            "ultima_reserva": fila_cliente["ultima_reserva"]
        }
        
        # ===== PARTE 2: RESERVAS DEL CLIENTE =====
        await cursor.execute("""
            SELECT 
                r.reserva_id,
                r.fecha_reserva,
                r.estado,
                COUNT(ri.item_id) as cantidad_paquetes,
                COALESCE(SUM(p.monto), 0) as pagado
            FROM reserva r
            LEFT JOIN reserva_item ri ON r.reserva_id = ri.reserva_id
            LEFT JOIN pago p ON r.reserva_id = p.reserva_id
            WHERE r.cliente_id = %s
            GROUP BY r.reserva_id
            ORDER BY r.fecha_reserva DESC
        """, (cliente_id,))
        
        reservas_rows = await cursor.fetchall()
        
        # Procesar reservas
        reservas = []
        for fila in reservas_rows:
            reservas.append({
                "reserva_id": fila["reserva_id"],
                "fecha": fila["fecha_reserva"],
                "estado": fila["estado"],
                "paquetes": fila["cantidad_paquetes"] or 0,
                "pagado": float(fila["pagado"] or 0)
            })
        
        # ===== PARTE 3: CONSTRUIR RESPUESTA =====
        return {
            "cliente": {
                "id": cliente["cliente_id"],
                "nombre": cliente["nombre_completo"],
                "ci": cliente["ci"],
                "telefono": cliente["telefono"],
                "email": cliente["email"]
            },
            "estadisticas": {
                "total_reservas": cliente["total_reservas"],
                "total_pagado": cliente["total_pagado"],
                "reservas_pendientes": cliente["pendientes"],
                "reservas_confirmadas": cliente["confirmadas"],
                "reservas_canceladas": cliente["canceladas"],
                "ultima_reserva": cliente["ultima_reserva"],
                "membresia": "VIP" if cliente["total_pagado"] > 5000 else "Regular"
            },
            "reservas": reservas
        }

# ============================================
# REPORTES DE USUARIOS
# ============================================

@router.get("/usuarios/general")
async def reporte_usuarios_general(conn = Depends(get_conexion)):
    """
    Reporte general de todos los usuarios del sistema
    """
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT 
                u.usuario_id,
                u.nombre_usuario,
                STRING_AGG(DISTINCT r.nombre, ', ') as roles,
                CASE WHEN p.personal_id IS NOT NULL THEN true ELSE false END as es_personal,
                p.cargo,
                COUNT(DISTINCT res.reserva_id) as reservas_gestionadas,
                MAX(res.fecha_reserva) as ultima_actividad
            FROM usuario u
            LEFT JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
            LEFT JOIN rol r ON ur.rol_id = r.rol_id
            LEFT JOIN personal p ON u.usuario_id = p.usuario_id
            LEFT JOIN reserva res ON u.usuario_id = res.usuario_id
            GROUP BY u.usuario_id, u.nombre_usuario, p.personal_id, p.cargo
            ORDER BY u.usuario_id
        """)
        
        resultados = await cursor.fetchall()
        
        # Verificar que hay resultados
        if not resultados:
            return []
        
        # Construir la respuesta
        usuarios_report = []
        for fila in resultados:
            # Acceder por nombre de columna (no por índice)
            usuario = {
                "usuario_id": fila["usuario_id"],
                "nombre_usuario": fila["nombre_usuario"],
                "roles": fila["roles"].split(', ') if fila["roles"] else [],
                "es_personal": fila["es_personal"],
                "cargo": fila["cargo"],
                "reservas_gestionadas": fila["reservas_gestionadas"] or 0,
                "ultima_actividad": fila["ultima_actividad"]
            }
            usuarios_report.append(usuario)
        
        return usuarios_report
    
@router.get("/usuarios/{usuario_id}")
async def reporte_usuario_detallado(
    usuario_id: int,
    conn = Depends(get_conexion)
):
    """
    Reporte detallado de un usuario específico
    """
    async with conn.cursor() as cursor:
        # ===== PARTE 1: DATOS GENERALES DEL USUARIO =====
        await cursor.execute("""
            SELECT 
                u.usuario_id,
                u.nombre_usuario,
                STRING_AGG(DISTINCT r.nombre, ', ') as roles,
                p.personal_id,
                p.nombres,
                p.apellidos,
                p.cargo,
                p.telefono
            FROM usuario u
            LEFT JOIN usuario_rol ur ON u.usuario_id = ur.usuario_id
            LEFT JOIN rol r ON ur.rol_id = r.rol_id
            LEFT JOIN personal p ON u.usuario_id = p.usuario_id
            WHERE u.usuario_id = %s
            GROUP BY u.usuario_id, p.personal_id, p.nombres, p.apellidos, p.cargo, p.telefono
        """, (usuario_id,))
        
        fila_usuario = await cursor.fetchone()
        if not fila_usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Convertir a diccionario para acceso por nombre
        usuario = {
            "usuario_id": fila_usuario["usuario_id"],
            "nombre_usuario": fila_usuario["nombre_usuario"],
            "roles": fila_usuario["roles"].split(', ') if fila_usuario["roles"] else [],
            "personal_id": fila_usuario["personal_id"],
            "nombres": fila_usuario["nombres"],
            "apellidos": fila_usuario["apellidos"],
            "cargo": fila_usuario["cargo"],
            "telefono": fila_usuario["telefono"]
        }
        
        # ===== PARTE 2: RESERVAS GESTIONADAS POR EL USUARIO =====
        await cursor.execute("""
            SELECT 
                r.reserva_id,
                c.nombres || ' ' || c.apellidos as cliente,
                r.fecha_reserva,
                r.estado,
                COUNT(ri.item_id) as items
            FROM reserva r
            JOIN cliente c ON r.cliente_id = c.cliente_id
            LEFT JOIN reserva_item ri ON r.reserva_id = ri.reserva_id
            WHERE r.usuario_id = %s
            GROUP BY r.reserva_id, c.nombres, c.apellidos
            ORDER BY r.fecha_reserva DESC
            LIMIT 20
        """, (usuario_id,))
        
        reservas_rows = await cursor.fetchall()
        
        # Procesar reservas
        reservas = []
        for fila in reservas_rows:
            reservas.append({
                "reserva_id": fila["reserva_id"],
                "cliente": fila["cliente"],
                "fecha": fila["fecha_reserva"],
                "estado": fila["estado"],
                "items": fila["items"] or 0
            })
        
        # ===== PARTE 3: CONSTRUIR RESPUESTA =====
        return {
            "usuario": {
                "id": usuario["usuario_id"],
                "nombre_usuario": usuario["nombre_usuario"],
                "roles": usuario["roles"]
            },
            "personal": {
                "es_personal": usuario["personal_id"] is not None,
                "nombres": usuario["nombres"],
                "apellidos": usuario["apellidos"],
                "cargo": usuario["cargo"],
                "telefono": usuario["telefono"]
            } if usuario["personal_id"] else None,
            "actividad_reciente": reservas
        }    
    
@router.get("/proveedores/general")
async def reporte_proveedores_general(conn = Depends(get_conexion)):
    """
    Reporte general de todos los proveedores
    """
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT 
                p.proveedor_id,
                p.nombre,
                p.telefono,
                p.email,
                COUNT(DISTINCT h.hotel_id) as total_hoteles,
                COUNT(DISTINCT paq.paquete_id) as paquetes_asociados,
                STRING_AGG(DISTINCT h.nombre, ', ') as lista_hoteles
            FROM proveedor p
            LEFT JOIN hotel h ON p.proveedor_id = h.proveedor_id
            LEFT JOIN componente_paquete cp ON h.hotel_id = cp.hotel_id
            LEFT JOIN paquete paq ON cp.paquete_id = paq.paquete_id
            GROUP BY p.proveedor_id, p.nombre, p.telefono, p.email
            ORDER BY total_hoteles DESC
        """)
        
        resultados = await cursor.fetchall()
        
        # Si no hay resultados, devolver lista vacía
        if not resultados:
            return []
        
        # Construir respuesta
        proveedores = []
        for fila in resultados:
            proveedor = {
                "proveedor_id": fila["proveedor_id"],
                "nombre": fila["nombre"],
                "telefono": fila["telefono"],
                "email": fila["email"],
                "total_hoteles": fila["total_hoteles"] or 0,
                "paquetes_asociados": fila["paquetes_asociados"] or 0,
                "lista_hoteles": fila["lista_hoteles"].split(', ') if fila["lista_hoteles"] else []
            }
            proveedores.append(proveedor)
        
        return proveedores
    


@router.get("/proveedores/ranking")
async def ranking_proveedores(
    limite: int = 10,
    conn = Depends(get_conexion)
):
    """
    Ranking de proveedores por cantidad de hoteles
    """
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT 
                p.proveedor_id,
                p.nombre,
                p.telefono,
                p.email,
                COUNT(DISTINCT h.hotel_id) as total_hoteles,
                COUNT(DISTINCT d.destino_id) as destinos_cubiertos,
                STRING_AGG(DISTINCT d.nombre, ', ') as destinos,
                COUNT(DISTINCT paq.paquete_id) as total_paquetes
            FROM proveedor p
            LEFT JOIN hotel h ON p.proveedor_id = h.proveedor_id
            LEFT JOIN destino d ON h.destino_id = d.destino_id
            LEFT JOIN componente_paquete cp ON h.hotel_id = cp.hotel_id
            LEFT JOIN paquete paq ON cp.paquete_id = paq.paquete_id
            GROUP BY p.proveedor_id, p.nombre, p.telefono, p.email
            ORDER BY total_hoteles DESC, total_paquetes DESC
            LIMIT %s
        """, (limite,))
        
        resultados = await cursor.fetchall()
        
        # Si no hay resultados, devolver lista vacía
        if not resultados:
            return []
        
        # Construir ranking
        ranking = []
        posicion = 1
        for fila in resultados:
            proveedor = {
                "posicion": posicion,
                "proveedor_id": fila["proveedor_id"],
                "nombre": fila["nombre"],
                "telefono": fila["telefono"],
                "email": fila["email"],
                "total_hoteles": fila["total_hoteles"] or 0,
                "destinos_cubiertos": fila["destinos_cubiertos"] or 0,
                "total_paquetes": fila["total_paquetes"] or 0,
                "destinos": fila["destinos"].split(', ') if fila["destinos"] else []
            }
            ranking.append(proveedor)
            posicion += 1
        
        return ranking    

@router.get("/proveedores/{proveedor_id}")
async def reporte_proveedor_detallado(
    proveedor_id: int,
    conn = Depends(get_conexion)
):
    """
    Reporte detallado de un proveedor específico con todos sus hoteles
    """
    async with conn.cursor() as cursor:
        # ===== PARTE 1: DATOS GENERALES DEL PROVEEDOR =====
        await cursor.execute("""
            SELECT 
                proveedor_id,
                nombre,
                telefono,
                email
            FROM proveedor
            WHERE proveedor_id = %s
        """, (proveedor_id,))
        
        fila_proveedor = await cursor.fetchone()
        if not fila_proveedor:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        
        # Convertir a diccionario para acceso por nombre
        proveedor = {
            "proveedor_id": fila_proveedor["proveedor_id"],
            "nombre": fila_proveedor["nombre"],
            "telefono": fila_proveedor["telefono"],
            "email": fila_proveedor["email"]
        }
        
        # ===== PARTE 2: HOTELES DEL PROVEEDOR =====
        await cursor.execute("""
            SELECT 
                h.hotel_id,
                h.nombre as hotel,
                d.nombre as destino,
                COUNT(DISTINCT cp.paquete_id) as paquetes_incluidos
            FROM hotel h
            JOIN destino d ON h.destino_id = d.destino_id
            LEFT JOIN componente_paquete cp ON h.hotel_id = cp.hotel_id
            WHERE h.proveedor_id = %s
            GROUP BY h.hotel_id, h.nombre, d.nombre
            ORDER BY h.nombre
        """, (proveedor_id,))
        
        hoteles_rows = await cursor.fetchall()
        
        # Procesar hoteles
        hoteles = []
        for fila in hoteles_rows:
            hoteles.append({
                "id": fila["hotel_id"],
                "nombre": fila["hotel"],
                "destino": fila["destino"],
                "paquetes_asociados": fila["paquetes_incluidos"] or 0
            })
        
        # ===== PARTE 3: ESTADÍSTICAS =====
        total_hoteles = len(hoteles)
        hoteles_con_paquetes = sum(1 for h in hoteles if h["paquetes_asociados"] > 0)
        
        # ===== PARTE 4: CONSTRUIR RESPUESTA =====
        return {
            "proveedor": {
                "id": proveedor["proveedor_id"],
                "nombre": proveedor["nombre"],
                "telefono": proveedor["telefono"],
                "email": proveedor["email"]
            },
            "estadisticas": {
                "total_hoteles": total_hoteles,
                "hoteles_con_paquetes": hoteles_con_paquetes,
                "porcentaje_con_paquetes": round((hoteles_con_paquetes / total_hoteles * 100) if total_hoteles > 0 else 0, 2)
            },
            "hoteles": hoteles
        }


