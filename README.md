# Tarjeta Joven Elota

PWA de IMJU Elota para jóvenes, negocios aliados y administración.

## Incluido en esta versión

- Firebase Authentication para jóvenes, negocios y administradores.
- Contraseñas fuera de Firestore y sesiones administradas por Firebase.
- Registros y aprobaciones procesados desde el servidor con Firebase Admin.
- Activación y recuperación mediante enlaces personales por correo.
- QR único con una ficha mínima separada del expediente juvenil.
- Eliminación automática de documentos y evidencias de validación al aprobar o
  rechazar, informada expresamente en el aviso de privacidad y los formularios.
- Reglas restrictivas de Firestore y Storage.
- Compresión inteligente WebP, redimensionamiento por tipo de imagen, eliminación
  de metadatos y límites de tamaño tanto en cliente como en servidor.
- Limpieza de fotografías y logotipos sustituidos o asociados a registros
  eliminados, para evitar archivos huérfanos en Storage.
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
- Identidad visual neutra con gris pizarra, verde petróleo e índigo tenue.
- Logotipos oficiales conservados como marcas de agua discretas.
- Menos elementos decorativos repetidos para mantener rapidez en celulares.
- Estilos críticos integrados para conservar tamaños y animaciones en Vercel.
- Control preventivo del límite de carga de Vercel y PDFs de hasta 1.5 MB.
- Diagnóstico claro de configuración de Firebase Admin durante el registro.

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

Los documentos de identidad y las fotografías de fachada sólo se usan mientras
se valida una solicitud y se eliminan al aprobarla o rechazarla. Las fotografías
de perfil y los logotipos se conservan únicamente para los registros aprobados,
porque son necesarios para la tarjeta digital y el directorio de negocios.
