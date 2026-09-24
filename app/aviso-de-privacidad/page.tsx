"use client";
import React from "react";
import Link from "next/link";

export default function AvisoDePrivacidad() {
  return (
    <main className="min-h-screen bg-[#F3F5F9] font-sans selection:bg-[#0F766E] selection:text-white py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* ENCABEZADO INSTITUCIONAL */}
        <div className="flex flex-col items-center mb-10 text-center animate-fade-in">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center mb-6 p-2">
            <img src="/imju-elota.webp" alt="IMJU Elota" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Términos, Condiciones y Aviso de Privacidad Integral</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Instituto Municipal de la Juventud de Elota</p>
          <p className="text-xs text-slate-400 mt-2">Última actualización: {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
        </div>

        {/* CONTENIDO LEGAL */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-12 space-y-8 text-slate-700 leading-relaxed text-[15px] animate-slide-up">
          
          <section>
            <h2 className="text-xl font-black text-[#0F766E] mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">1. Identidad, Domicilio y Declaración General</h2>
            <p className="mb-4">
              El <strong>Instituto Municipal de la Juventud (IMJU) de Elota, Sinaloa</strong>, con domicilio en <strong>Av. Gabriel Leyva S/N, Centro, C.P. 82700, La Cruz, Sinaloa</strong>, es el Sujeto Obligado y responsable del uso, protección y tratamiento de los datos personales recabados a través de la plataforma digital "Tarjeta Joven Elota".
            </p>
            <p>
              El objetivo rector de esta plataforma gubernamental es fomentar la participación juvenil, el desarrollo económico local y la integración social. La plataforma opera <strong>estrictamente como un canal de intermediación y difusión digital gratuita</strong> entre las juventudes de Elota y el sector comercial privado (negocios aliados).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#0F766E] mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">2. Fundamento Legal</h2>
            <p>
              El tratamiento de los datos personales, así como el marco de operación de este programa, se realiza con estricto apego y fundamento en los artículos 16, 17, 18, 21, 22, 25, 26 y 65 de la <strong>Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados</strong>, la Ley de Protección de Datos Personales del Estado de Sinaloa, y las facultades inherentes al Instituto Municipal de la Juventud para la ejecución de políticas públicas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#0F766E] mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">3. Datos Recabados y Finalidad (Jóvenes Beneficiarios)</h2>
            <p className="mb-4">Para la inscripción al padrón del programa Tarjeta Joven, el IMJU solicitará y someterá a tratamiento los siguientes datos:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2 font-medium">
              <li>Nombre completo.</li>
              <li>Fecha de nacimiento y edad exacta.</li>
              <li>Género y ocupación actual.</li>
              <li>Localidad o colonia de residencia.</li>
              <li>Correo electrónico de contacto.</li>
            </ul>
            <div className="bg-stone-50 border-l-4 border-stone-500 p-4 rounded-r-xl mb-4 text-slate-800 text-sm font-medium">
              <strong>Tratamiento de Fotografía e Identificación:</strong> Se recabará una fotografía del rostro del solicitante y una captura de un documento de identidad oficial (INE, Credencial Escolar, etc.). Estos datos son considerados de carácter sensible y su uso es <strong>estrictamente restrictivo</strong> para corroborar la edad legal de elegibilidad (12 a 29 años), prevenir el fraude por suplantación y emitir la credencial digital personalizada. <u>Bajo ninguna circunstancia</u> se utilizarán para sistemas de reconocimiento facial masivo ni se expondrán en directorios públicos.
            </div>
            <p>
              La información recabada servirá para generar un expediente electrónico, llevar un control estadístico (disociado) de impacto demográfico municipal y mantener comunicación sobre convocatorias. No será comercializada, alquilada ni compartida con el sector privado.
            </p>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 md:p-8">
            <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-black uppercase tracking-widest text-[#0F766E]">4. Conservación y Eliminación de Evidencias de Validación</h2>
            <p className="mb-4">
              Los documentos de identidad enviados por jóvenes y las fotografías de fachada proporcionadas por los negocios se utilizarán <strong>únicamente para revisar y resolver la solicitud de registro</strong>. Permanecerán en almacenamiento restringido mientras la solicitud tenga el estado de pendiente.
            </p>
            <ul className="list-disc space-y-3 pl-6 font-medium">
              <li>Al aprobar una solicitud, el sistema elimina del almacenamiento operativo el documento de identidad o la evidencia de fachada y retira sus enlaces del expediente activo.</li>
              <li>Al rechazar una solicitud, se elimina la evidencia de validación y también los archivos asociados a la solicitud rechazada, incluyendo fotografía de perfil o logotipo, al no existir una cuenta activa que justifique su conservación.</li>
              <li>La fotografía de perfil del joven y el logotipo del negocio sólo se conservan cuando la solicitud es aprobada, pues son necesarios para identificar la tarjeta digital y el perfil público del comercio.</li>
              <li>Las evidencias de validación no se utilizarán con fines publicitarios, comerciales, de reconocimiento facial ni para finalidades distintas a comprobar los requisitos del programa.</li>
            </ul>
          </section>

          <section className="bg-teal-50/70 p-6 md:p-8 rounded-[2rem] border border-teal-200 shadow-sm">
            <h2 className="text-xl font-black text-[#0F766E] mb-4 uppercase tracking-widest border-b border-teal-200 pb-2">5. Blindaje Legal y Deslinde de Responsabilidad (Negocios Aliados)</h2>
            <p className="mb-4 font-bold text-teal-950">
              Al registrarse y hacer uso del "Portal de Negocios", el propietario, administrador o representante legal del establecimiento declara aceptar incondicionalmente las siguientes cláusulas de exención de responsabilidad institucional:
            </p>
            <ul className="list-disc pl-6 space-y-3 font-medium text-teal-900 leading-relaxed">
              <li>
                <strong>Ausencia de Vínculo Comercial:</strong> La plataforma funciona exclusivamente como una cartelera digital. El IMJU y el H. Ayuntamiento de Elota <strong>NO son socios, intermediarios mercantiles, fiadores ni representantes</strong> de las marcas, productos o servicios anunciados.
              </li>
              <li>
                <strong>Responsabilidad Única frente al Consumidor:</strong> El Negocio Aliado asume la <strong>responsabilidad absoluta, civil, penal y administrativa (incluyendo PROFECO)</strong> de honrar y cumplir cabalmente con los descuentos, vigencias, condiciones y "letras chiquitas" que publique en su perfil. El IMJU se exime de cualquier litigio derivado de publicidad engañosa, mala calidad del servicio o negativa de aplicación de beneficios por parte del comercio.
              </li>
              <li>
                <strong>Deslinde Laboral (Bolsa de Trabajo):</strong> Toda vacante publicada es gestionada directamente por el empleador privado. El IMJU no funge como agencia de colocación ni asume figura patronal o solidaria. Cualquier conflicto por salarios, seguridad social (IMSS), riesgos de trabajo o demandas obrero-patronales deberá resolverse exclusivamente entre el joven solicitante y la empresa contratante.
              </li>
              <li>
                <strong>Derecho de Revocación:</strong> Ante el incumplimiento de estas normas, reportes fundamentados por parte de los jóvenes, o conductas que atenten contra la moral pública, la Dirección del IMJU se reserva el derecho unilateral e inapelable de suspender, bloquear o eliminar definitivamente el acceso del negocio a la plataforma.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#0F766E] mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">6. Transferencia de Datos Personales</h2>
            <p className="mb-4">
              Para aplicar un beneficio, un Negocio Aliado con sesión activa podrá escanear el QR y visualizar temporalmente sólo la información mínima necesaria para confirmar la identidad y vigencia de la tarjeta: <strong>nombre, fotografía, nivel y, en su caso, un indicador de cumpleaños</strong>. El negocio no recibe correo, domicilio, género, fecha completa de nacimiento ni documentos de validación.
            </p>
            <p>
              El historial comercial utiliza un identificador interno y conserva únicamente el negocio, la fecha y el beneficio aplicado; los reportes del negocio no muestran el nombre ni datos demográficos del joven. No se autoriza al negocio a copiar, reutilizar o transferir la información mostrada. Fuera de esta validación limitada, no se compartirán datos con empresas privadas, salvo requerimiento debidamente fundado de una autoridad competente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#0F766E] mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">7. Ejercicio de Derechos ARCO</h2>
            <p className="mb-4">
              Usted tiene derecho inalienable a conocer qué datos personales tenemos registrados (Acceso); solicitar la corrección de su información en caso de ser inexacta o desactualizada (Rectificación); exigir la eliminación total de su perfil y datos de nuestros servidores (Cancelación); así como oponerse al uso de sus datos para fines específicos (Oposición).
            </p>
            <p>
              Para ejercer cualquiera de los derechos ARCO, el titular podrá presentar su solicitud por escrito en las oficinas del Instituto Municipal de la Juventud de Elota, ubicadas en Av. Gabriel Leyva S/N, Centro, C.P. 82700, La Cruz, Sinaloa, o enviarla al correo <strong>tarjetaimjuelota@gmail.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#0F766E] mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">8. Aceptación Informada</h2>
            <p>
              La creación de una cuenta, la navegación en el sistema y/o el uso de la credencial digital (tanto en su versión para beneficiarios como en el panel administrativo para comercios) constituye la aceptación expresa, consciente, libre de coacción y con pleno conocimiento legal de los presentes Términos, Condiciones y de este Aviso de Privacidad Integral.
            </p>
          </section>

        </div>

        {/* BOTÓN VOLVER */}
        <div className="mt-10 text-center pb-8">
          <Link href="/">
            <button className="bg-slate-900 hover:bg-[#0F766E] text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all active:scale-95 border border-transparent hover:border-teal-900/50">
              ← Volver al Inicio
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
