# Tarjeta Joven Elota

Portal web del Instituto Municipal de la Juventud de Elota para jóvenes, negocios aliados y personal administrador.

## Estado de esta copia

- Identidad institucional adaptada a Elota.
- Logotipos de IMJU Elota y H. Ayuntamiento de Elota incorporados.
- Mapa centrado en La Cruz, Elota.
- Facebook, domicilio y correo institucional actualizados.
- Firebase anterior desconectado y sustituido por variables de entorno.
- Correo SMTP trasladado a variables de entorno.
- Dependencia de cámara incompatible sustituida por la cámara nativa del navegador.

Esta copia no está conectada todavía a un Firebase real. Es intencional para evitar cualquier comunicación con el portal original.

## Inicio local

1. Instala Node.js 20 o superior.
2. Ejecuta `npm install` dentro de esta carpeta.
3. Copia `.env.example` como `.env.local`.
4. Completa las variables del nuevo proyecto Firebase.
5. Ejecuta `npm run dev`.
6. Abre `http://localhost:3000`.

## Variables necesarias

Consulta `.env.example`. Nunca publiques `.env.local` ni una contraseña de aplicación de Google en GitHub.

## Rutas principales

- `/`: página inicial.
- `/login`: registro e ingreso de jóvenes.
- `/tarjeta`: tarjeta digital, beneficios y empleos.
- `/directorio`: directorio público de negocios.
- `/login-negocio`: registro e ingreso de comercios.
- `/portal-negocios`: panel para comercios aliados.
- `/panel-imju-elota`: panel administrativo.
- `/aviso-de-privacidad`: aviso de privacidad.

## Datos institucionales

- Nombre: Tarjeta Joven Elota.
- Instituto: Instituto Municipal de la Juventud de Elota.
- Dirección: Av. Gabriel Leyva S/N, Centro, C.P. 82700, La Cruz, Sinaloa.
- Correo: tarjetaimjuelota@gmail.com.
- Facebook: https://www.facebook.com/profile.php?id=100075974077385

## Antes de publicar

El sistema heredado utiliza un acceso propio para jóvenes y negocios. Antes de recibir registros reales se debe completar una segunda etapa de seguridad: migrar esos accesos a Firebase Authentication, crear reglas restrictivas de Firestore y Storage y proteger la ruta de envío de correos con validación administrativa. No uses Firebase en modo de prueba para producción.
