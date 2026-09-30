# Tarjeta Joven · Demo municipal

Versión de demostración comercial basada en los recorridos del sistema entregado. No necesita Firebase, variables de entorno, cuentas ni instalación de dependencias para funcionar.

## Probar la demo

Abre `index.html` o ejecuta `npm run dev` y visita `http://localhost:3000`. Para probar la cámara, usa HTTPS o localhost. Toda la información es ficticia.

Desde el inicio puedes entrar como joven, negocio o administración. Usa el selector de perfil para probar diferentes tarjetas y aliados.

### Recorrido recomendado para una presentación

1. **Personalizar**: cambia municipio, nombre del programa, colores y logos.
2. **Registro joven**: crea una solicitud con datos ficticios. En administración, apruébala y abre la tarjeta. Su QR es único.
3. **Negocio**: publica una promoción. Se mostrará en la tarjeta del joven.
4. **Usar cupón**: consulta dirección, horario, vigencia, condiciones y pasos; después elige «Probar validación».
5. **Validación**: confirma el beneficio en el negocio. La visita actualiza historial, nivel y reportes.
6. **Empleos**: publica una vacante, envía interés desde la tarjeta y revisa interesados en el negocio.
7. **Administración**: prueba solicitudes, altas, edición, suspensión, moderación, avisos y exportación CSV para Excel.

Niveles: Clásica con 0–2 visitas, Plata con 3–5 y Oro con 6 o más. Los cupones verifican vigencia, días, nivel, estado de tarjeta y negocio y uso único. Abrir un cupón no registra una visita.

## Publicar en Vercel

Sube estos archivos a un repositorio independiente o a una rama exclusiva de demo. Importa ese repositorio como un proyecto **nuevo** de Vercel. La configuración `vercel.json` publica únicamente los archivos estáticos.

No necesita variables de entorno. No importes las credenciales del proyecto original.

Para compartirla con compradores, usa un proyecto de demo con acceso público. Los despliegues Preview de un proyecto existente pueden exigir iniciar sesión en Vercel.

## Personalización

El editor guarda los cambios y las imágenes en el navegador. El botón «Copiar enlace con nombre y colores» comparte esos datos en la URL; los logos no viajan en ese enlace.

«Exportar personalización» descarga un JSON con municipio, programa, colores y logos. «Importar personalización», en Identidad municipal, recupera esa configuración.

Para que todos los visitantes vean una misma marca, copia el objeto `brand` del JSON exportado al objeto `defaultBrand` de `demo-data.js` y publica esa demo. La imagen exportada está incluida como dato PNG; no hace falta subir un archivo separado.

## Alcance de la simulación

- Los cambios son locales a cada navegador. No se sincronizan entre dispositivos.
- Los perfiles iniciales y sus códigos funcionan en cualquier copia de la demo. Un perfil nuevo solo existe en el navegador que lo creó.
- Los QR son reales. El lector utiliza la cámara y procesa la imagen localmente.
- Las solicitudes y su revisión son simuladas. No se guardan documentos de identificación reales.
- Los avisos, cupones, vacantes y resultados se enlazan dentro de la misma demostración.
- Las vistas de correo y los envíos de interés no envían comunicaciones reales.
- Direcciones, ubicaciones, negocios, oportunidades y sueldos son ejemplos.
- Esta demo es una presentación funcional. No es una credencial válida ni una aplicación de producción con autenticación.

## Verificación

`npm run check` revisa la sintaxis; `npm run build` crea una copia estática en `dist/`.

La rama `demo-comercial` puede ejecutar la verificación de navegador incluida en `.github/workflows/verify-demo.yml`. Comprueba registro, aprobación, QR decodificable, uso único, niveles, vacantes, avisos, personalización, persistencia, CSV, reinicio y siete vistas móviles. Playwright se instala únicamente en el proceso de pruebas.

El código de la aplicación no hace solicitudes a Firebase ni a otros servicios. Dependencias de QR y lector incluidas con sus licencias en `vendor/`.
