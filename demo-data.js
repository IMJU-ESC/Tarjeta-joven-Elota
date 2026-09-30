/* Datos ficticios: no contienen registros del sistema municipal original. */
(function () {
  'use strict';
  const day = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const youth = (id, name, birth, locality, gender, occupation, status = 'Activa') => ({id, name, birth, locality, gender, occupation, status, email:`joven${id}@example.test`, code:`DEMO-${String(id).padStart(4,'0')}`, photo:'', requested:day(-2)});
  const business = (id, name, category, initials, color, address, schedule) => ({id,name,category,initials,color,address,schedule,status:'Activo',email:`aliado${id}@example.test`,description:'Negocio ficticio para explorar los beneficios de la tarjeta.',phone:'Contacto de ejemplo',logo:'',mapX:20+id*10,mapY:25+(id%3)*20});
  const defaultBrand = {municipio:'Tu municipio',program:'Tarjeta Joven',institute:'Instituto Municipal de la Juventud',primary:'#6640df',accent:'#d6f461',governmentLogo:'',instituteLogo:''};
  window.TJ_DEMO = {
    day,
    defaultBrand,
    createState() {
      return {
        version:1,
        brand:{...defaultBrand},
        currentYouth:1,currentBusiness:1,
        youths:[
          youth(1,'Valeria Ruiz',`${new Date().getFullYear()-22}-04-18`,'Centro','Mujer','Estudiante'),
          youth(2,'Diego Torres',`${new Date().getFullYear()-25}-02-10`,'Las Palmas','Hombre','Empleado'),
          youth(3,'Camila López',`${new Date().getFullYear()-19}-06-03`,'Centro','Mujer','Estudiante'),
          youth(4,'Alex Mendoza',`${new Date().getFullYear()-23}-01-15`,'La Rivera','Prefiero no decirlo','Emprendedor'),
          youth(5,'Sofía García',`${new Date().getFullYear()-21}-08-24`,'Las Palmas','Mujer','Estudiante','Pendiente'),
          youth(6,'Luis Navarro',`${new Date().getFullYear()-27}-03-01`,'La Rivera','Hombre','Empleado','Pendiente'),
          youth(7,'Mariana Ríos',`${new Date().getFullYear()-24}-02-11`,'Centro','Mujer','Empleado'),
          youth(8,'Jorge Luna',`${new Date().getFullYear()-20}-07-08`,'Centro','Hombre','Estudiante','Suspendida')
        ],
        businesses:[
          business(1,'Café Brisa','Alimentos','CB','#e2ad73','Calle Primavera 24, Centro','Lun a sáb · 8:00 a 20:00'),
          business(2,'Óptica Prisma','Salud','OP','#7b9ed8','Av. Juventud 18, Centro','Lun a vie · 9:00 a 18:00'),
          business(3,'Impulso Gym','Deporte','IG','#9ec8ac','Calle del Parque 65, Las Palmas','Lun a sáb · 6:00 a 22:00'),
          business(4,'Librería Punto','Educación','LP','#b2a3d1','Av. Cultura 32, Centro','Lun a sáb · 10:00 a 19:00'),
          business(5,'Cinema Local','Entretenimiento','CL','#d28aa2','Calle del Sol 8, La Rivera','Todos los días · 14:00 a 22:00'),
          {...business(6,'Estudio Norte','Servicios','EN','#6ac4c2','Av. Creativa 41, Centro','Lun a vie · 10:00 a 18:00'),status:'Pendiente'}
        ],
        coupons:[
          {id:'p1',businessId:1,title:'Un café para tu siguiente idea',benefit:'20% OFF',description:'20% de descuento en tu bebida favorita. Un buen pretexto para hacer una pausa.',category:'Alimentos',end:day(45),days:'Lunes a sábado',conditions:'Una bebida por visita. No acumulable con otras promociones.',level:'Clásica',unique:false,status:'Activa'},
          {id:'p2',businessId:2,title:'Ve tus planes con más claridad',benefit:'15% OFF',description:'Descuento en armazones y lentes de la línea participante.',category:'Salud',end:day(60),days:'Lunes a viernes',conditions:'Presenta tu tarjeta antes de solicitar la cotización.',level:'Clásica',unique:true,status:'Activa'},
          {id:'p3',businessId:3,title:'Tu primer mes empieza aquí',benefit:'INSCRIPCIÓN $0',description:'Entrena con una comunidad que comparte tus ganas de avanzar.',category:'Deporte',end:day(30),days:'Lunes a sábado',conditions:'Aplicable a nuevas inscripciones. Una vez por tarjeta.',level:'Clásica',unique:true,status:'Activa'},
          {id:'p4',businessId:1,title:'Comparte una tarde con alguien',benefit:'2 × 1',description:'Dos bebidas de la línea clásica por el precio de una.',category:'Alimentos',end:day(30),days:'Todos los días',conditions:'Válido en bebidas del mismo tamaño. Requiere nivel Plata.',level:'Plata',unique:false,status:'Activa'},
          {id:'p5',businessId:4,title:'Una historia nueva te espera',benefit:'10% OFF',description:'Elige tu próxima lectura y aprovecha el beneficio.',category:'Educación',end:day(90),days:'Lunes a sábado',conditions:'Sobre precio regular. Excluye material escolar.',level:'Clásica',unique:false,status:'Activa'},
          {id:'p6',businessId:5,title:'Un plan de película',benefit:'COMBO GRATIS',description:'Combo pequeño al comprar una entrada de precio regular.',category:'Entretenimiento',end:day(40),days:'Todos los días',conditions:'Una vez por tarjeta. Disponible para nivel Oro.',level:'Oro',unique:true,status:'Activa'}
        ],
        jobs:[
          {id:'e1',businessId:1,title:'Auxiliar de cafetería',salary:'$8,500 mensuales',type:'Medio tiempo',description:'Atención a clientes, preparación de bebidas y apoyo en caja. No se requiere experiencia previa.',status:'Activa'},
          {id:'e2',businessId:4,title:'Asesor de librería',salary:'$9,000 mensuales',type:'Tiempo completo',description:'Orientación a lectores, organización de inventario y atención en mostrador.',status:'Activa'},
          {id:'e3',businessId:3,title:'Asistente de recepción',salary:'$8,000 mensuales',type:'Medio tiempo',description:'Registro de socios, atención a visitantes y apoyo en la agenda de entrenamientos.',status:'Activa'}
        ],
        visits:[
          {id:'v1',youthId:1,businessId:1,couponId:'p1',couponTitle:'Un café para tu siguiente idea',date:day(-5)+'T11:20:00'},
          {id:'v2',youthId:1,businessId:4,couponId:'p5',couponTitle:'Una historia nueva te espera',date:day(-2)+'T16:40:00'},
          {id:'v3',youthId:2,businessId:2,couponId:'p2',couponTitle:'Ve tus planes con más claridad',date:day(-6)+'T10:15:00'},
          {id:'v4',youthId:2,businessId:1,couponId:'p1',couponTitle:'Un café para tu siguiente idea',date:day(-3)+'T09:30:00'},
          {id:'v5',youthId:3,businessId:3,couponId:'p3',couponTitle:'Tu primer mes empieza aquí',date:day(-1)+'T17:10:00'},
          {id:'v6',youthId:4,businessId:1,couponId:'p1',couponTitle:'Un café para tu siguiente idea',date:day(0)+'T10:40:00'},
          {id:'v7',youthId:7,businessId:5,couponId:'',couponTitle:'Validación de tarjeta',date:day(-4)+'T19:20:00'},
          {id:'v8',youthId:7,businessId:1,couponId:'p1',couponTitle:'Un café para tu siguiente idea',date:day(-1)+'T13:20:00'}
        ],
        announcements:[
          {id:'a1',title:'Tu tarjeta, tu comunidad',message:'Explora negocios aliados, usa un beneficio y descubre cómo crece tu nivel con cada visita.',audience:'Todos',date:day(-1)},
          {id:'a2',title:'Taller para emprender',message:'Actividad de muestra: conoce cómo aparecerían las convocatorias y actividades de tu instituto.',audience:'Jóvenes',date:day(0)}
        ],
        applications:[],explored:[],readAnnouncements:[],
        audit:[{id:'audit1',date:new Date().toISOString(),text:'Sesión de demostración iniciada con datos ficticios.'}]
      };
    }
  };
})();
