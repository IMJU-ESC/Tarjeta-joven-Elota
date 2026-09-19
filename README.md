# Tarjeta Joven Elota

PWA de IMJU Elota para jóvenes, negocios aliados y administración.

## Incluido en esta versión

- Firebase Authentication para jóvenes, negocios y administradores.
- Contraseñas fuera de Firestore y sesiones administradas por Firebase.
- Registros y aprobaciones procesados desde el servidor con Firebase Admin.
- Activación y recuperación mediante enlaces personales por correo.
- QR único con una ficha mínima separada del expediente juvenil.
- Eliminación de documentos de validación al aprobar o rechazar.
- Reglas restrictivas de Firestore y Storage.
- Compresión de imágenes y límites de tamaño en servidor.
- Interfaz ligera con niveles, progreso, misiones y confirmaciones animadas.
- Misiones accionables que guían al usuario hacia cada módulo.
- Lector QR reforzado con cámara trasera, guía animada y permisos seguros.
- Consulta de visitas limitada al negocio autenticado, sin abrir las reglas.
- Tipografía juvenil y microanimaciones CSS optimizadas.
- Insignias, celebraciones y metas continuas basadas en visitas reales.
- Diseño adaptable con dos columnas en escritorio y una en celular.
- Página personalizada para crear contraseña y correos con logotipos oficiales.
- Misiones ocultas en paneles opcionales con un indicador compacto de progreso.
- Notificaciones breves de XP sin saturar la pantalla principal.
- Persistencia local de sesión al cerrar una pestaña.
- Respeto a la preferencia de movimiento reducido del dispositivo.
- Paneles de misiones con capa corregida para mostrarse sobre cualquier tarjeta.
- Identidad visual multicolor inspirada en los logotipos oficiales de Elota.
- Halos, marcas de agua y acentos animados mediante CSS ligero.
- Menos elementos decorativos repetidos para mantener rapidez en celulares.

## Primer inicio

1. Ejecuta `npm install`.
2. Copia `.env.example` como `.env.local`.
3. Completa Firebase Web, Firebase Admin y Gmail.
4. Publica `firestore.rules` y `storage.rules`.
5. Ejecuta `npm run build` y después `npm run dev`.

Consulta `INSTRUCCIONES-ACTUALIZACION.txt` para el proceso completo.

## Rutas

- `/login`: acceso y registro juvenil.
- `/tarjeta`: tarjeta, QR, beneficios, empleos y progreso.
- `/login-negocio`: acceso y solicitud de negocios.
- `/portal-negocios`: escáner, publicaciones y métricas.
- `/directorio`: directorio público de aliados.
- `/panel-imju-elota`: administración.

## Seguridad

Nunca publiques `.env.local`, el JSON de la cuenta de servicio ni la contraseña
de aplicación de Gmail. Las variables `FIREBASE_ADMIN_*` son privadas y jamás
deben llevar el prefijo `NEXT_PUBLIC_`.
