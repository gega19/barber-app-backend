// Contenido HTML de los documentos legales para el seed

export const PRIVACY_POLICY_HTML = `<style>
    .politica-content h2 {
        color: #C9A961;
        margin-top: 30px;
        margin-bottom: 15px;
        font-size: 1.75em;
        font-weight: bold;
    }
    .politica-content h3 {
        color: #E8E8E8;
        margin-top: 20px;
        margin-bottom: 10px;
        font-size: 1.25em;
        font-weight: 600;
    }
    .politica-content p {
        margin-bottom: 15px;
        text-align: justify;
        color: #E8E8E8;
    }
    .politica-content ul,
    .politica-content ol {
        margin-bottom: 15px;
        padding-left: 30px;
        color: #E8E8E8;
    }
    .politica-content li {
        margin-bottom: 8px;
        color: #E8E8E8;
    }
    .politica-content strong {
        color: #C9A961;
        font-weight: 600;
    }
    .politica-content .contact-info {
        background-color: #0F0F0F;
        padding: 20px;
        border-left: 4px solid #C9A961;
        margin: 20px 0;
        border-radius: 8px;
    }
    .politica-content .contact-info p {
        color: #E8E8E8;
    }
    .politica-content .note {
        background-color: rgba(201, 169, 97, 0.1);
        padding: 15px;
        border-left: 4px solid #C9A961;
        margin-top: 30px;
        border-radius: 8px;
    }
    .politica-content .note p {
        color: #E8E8E8;
    }
    .politica-content a {
        color: #C9A961;
        text-decoration: none;
        transition: color 0.3s ease;
    }
    .politica-content a:hover {
        color: #B89851;
        text-decoration: underline;
    }
</style>

<div class="politica-content">
    <h2>1. INFORMACIÓN GENERAL</h2>
    <p>BarberTop ("nosotros", "nuestra aplicación" o "el servicio") se compromete a proteger la privacidad de sus usuarios. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos su información personal cuando utiliza nuestra aplicación móvil y servicios relacionados.</p>

    <h2>2. DATOS QUE RECOPILAMOS</h2>

    <h3>2.1. Información de Registro y Perfil</h3>
    <ul>
        <li><strong>Nombre completo</strong></li>
        <li><strong>Dirección de correo electrónico</strong> (requerido para la cuenta)</li>
        <li><strong>Contraseña</strong> (encriptada con hash)</li>
        <li><strong>Número de teléfono</strong> (opcional)</li>
        <li><strong>Ubicación geográfica</strong> (opcional)</li>
        <li><strong>País</strong> (opcional)</li>
        <li><strong>Género</strong> (opcional)</li>
        <li><strong>Foto de perfil o avatar</strong> (opcional)</li>
    </ul>

    <h3>2.2. Información de Citas y Reservas</h3>
    <ul>
        <li><strong>Historial de citas</strong> con barberos</li>
        <li><strong>Fechas y horarios</strong> de las citas</li>
        <li><strong>Servicios solicitados</strong></li>
        <li><strong>Notas adicionales</strong> que proporcione sobre sus citas</li>
        <li><strong>Estado de las citas</strong> (pendiente, confirmada, completada, cancelada)</li>
    </ul>

    <h3>2.3. Información de Pagos</h3>
    <ul>
        <li><strong>Método de pago</strong> seleccionado</li>
        <li><strong>Comprobantes de pago</strong> (imágenes) que suba</li>
        <li><strong>Estado de pago</strong> (pendiente, verificado, rechazado)</li>
    </ul>
    <p><strong>Nota:</strong> No almacenamos información de tarjetas de crédito ni datos bancarios sensibles. Los pagos se procesan a través de métodos externos (Pago Móvil, transferencias, efectivo, etc.)</p>

    <h3>2.4. Información de Ubicación</h3>
    <ul>
        <li><strong>Coordenadas GPS</strong> (latitud y longitud) cuando permite el acceso a la ubicación</li>
        <li><strong>Dirección</strong> de barberías y barberos</li>
    </ul>
    <p>Esta información se utiliza para mostrar barberías cercanas y calcular distancias.</p>

    <h3>2.5. Información de Dispositivo</h3>
    <ul>
        <li><strong>Tokens de notificación push</strong> (FCM tokens) para enviarle notificaciones</li>
        <li><strong>Tipo de dispositivo</strong> (Android/iOS)</li>
        <li><strong>Dirección IP</strong> (cuando descarga la aplicación o utiliza el servicio)</li>
        <li><strong>User Agent</strong> (información del navegador/dispositivo)</li>
    </ul>

    <h3>2.6. Contenido Generado por el Usuario</h3>
    <ul>
        <li><strong>Reseñas y calificaciones</strong> que publique sobre barberos y barberías</li>
        <li><strong>Comentarios</strong> en las reseñas</li>
        <li><strong>Imágenes o videos</strong> que suba como parte de su perfil o reseñas</li>
    </ul>

    <h3>2.7. Información de Uso</h3>
    <ul>
        <li><strong>Registro de descargas</strong> de la aplicación (fecha, IP, dispositivo)</li>
        <li><strong>Interacciones</strong> con la aplicación</li>
        <li><strong>Preferencias</strong> de búsqueda y filtros utilizados</li>
    </ul>

    <h2>3. CÓMO UTILIZAMOS SU INFORMACIÓN</h2>
    <p>Utilizamos la información recopilada para:</p>

    <h3>3.1. Prestación del Servicio</h3>
    <ul>
        <li><strong>Gestionar su cuenta</strong> y autenticación</li>
        <li><strong>Procesar y gestionar sus citas</strong> con barberos</li>
        <li><strong>Facilitar la comunicación</strong> entre usted y los barberos</li>
        <li><strong>Mostrar barberías y barberos</strong> cercanos a su ubicación</li>
        <li><strong>Procesar pagos</strong> y verificar comprobantes</li>
    </ul>

    <h3>3.2. Mejora del Servicio</h3>
    <ul>
        <li><strong>Analizar el uso</strong> de la aplicación para mejorar la experiencia</li>
        <li><strong>Desarrollar nuevas funcionalidades</strong></li>
        <li><strong>Personalizar contenido</strong> y recomendaciones</li>
        <li><strong>Optimizar la interfaz</strong> y rendimiento</li>
    </ul>

    <h3>3.3. Comunicaciones</h3>
    <ul>
        <li><strong>Enviar notificaciones push</strong> sobre:
            <ul>
                <li>Confirmaciones y recordatorios de citas</li>
                <li>Cambios en el estado de sus citas</li>
                <li>Promociones y ofertas especiales</li>
                <li>Actualizaciones importantes de la aplicación</li>
                <li>Campañas informativas (si se ha suscrito)</li>
            </ul>
        </li>
        <li><strong>Responder a sus consultas</strong> y solicitudes de soporte</li>
    </ul>

    <h3>3.4. Seguridad y Prevención de Fraudes</h3>
    <ul>
        <li><strong>Verificar su identidad</strong> y prevenir acceso no autorizado</li>
        <li><strong>Detectar y prevenir fraudes</strong> o actividades sospechosas</li>
        <li><strong>Proteger la seguridad</strong> de nuestros usuarios y servicios</li>
    </ul>

    <h2>4. COMPARTIR INFORMACIÓN</h2>

    <h3>4.1. Información Compartida con Barberos</h3>
    <p>Cuando reserva una cita, compartimos con el barbero:</p>
    <ul>
        <li>Su nombre</li>
        <li>Información de contacto (teléfono, email) si es necesario para la cita</li>
        <li>Detalles de la cita (fecha, hora, servicio)</li>
        <li>Notas adicionales que haya proporcionado</li>
    </ul>

    <h3>4.2. Proveedores de Servicios Terceros</h3>
    <p>Compartimos información con proveedores que nos ayudan a operar el servicio:</p>
    <ul>
        <li><strong>Cloudinary</strong>: Almacenamiento de imágenes y videos (fotos de perfil, comprobantes de pago, portafolios de barberos)</li>
        <li><strong>Firebase Cloud Messaging</strong>: Envío de notificaciones push</li>
        <li><strong>Render/Proveedores de hosting</strong>: Almacenamiento de datos en servidores seguros</li>
        <li><strong>PostgreSQL</strong>: Base de datos donde se almacena su información</li>
    </ul>
    <p>Estos proveedores están obligados contractualmente a proteger su información y solo pueden usarla para los fines especificados.</p>

    <h3>4.3. No Vendemos Sus Datos</h3>
    <p><strong>No vendemos, alquilamos ni compartimos su información personal con terceros para fines comerciales</strong> sin su consentimiento explícito.</p>

    <h3>4.4. Requerimientos Legales</h3>
    <p>Podemos divulgar su información si es requerido por ley, orden judicial, o proceso legal, o para:</p>
    <ul>
        <li>Cumplir con obligaciones legales</li>
        <li>Proteger nuestros derechos y propiedad</li>
        <li>Prevenir o investigar posibles delitos</li>
        <li>Proteger la seguridad de nuestros usuarios</li>
    </ul>

    <h2>5. SEGURIDAD DE LOS DATOS</h2>
    <p>Implementamos medidas de seguridad técnicas y organizativas:</p>
    <ul>
        <li><strong>Encriptación</strong>: Las contraseñas se almacenan con hash (bcrypt)</li>
        <li><strong>Autenticación segura</strong>: Uso de tokens JWT para sesiones</li>
        <li><strong>Conexiones seguras</strong>: HTTPS para todas las comunicaciones</li>
        <li><strong>Acceso restringido</strong>: Solo personal autorizado puede acceder a datos personales</li>
        <li><strong>Almacenamiento seguro</strong>: Datos almacenados en servidores con medidas de seguridad</li>
        <li><strong>Actualizaciones regulares</strong>: Mantenemos nuestros sistemas actualizados</li>
    </ul>
    <p>Sin embargo, ningún método de transmisión o almacenamiento es 100% seguro. No podemos garantizar seguridad absoluta.</p>

    <h2>6. RETENCIÓN DE DATOS</h2>
    <p>Conservamos su información personal mientras:</p>
    <ul>
        <li>Su cuenta esté activa</li>
        <li>Sea necesario para prestar el servicio</li>
        <li>Sea requerido por ley o para resolver disputas</li>
        <li>Sea necesario para nuestros intereses comerciales legítimos</li>
    </ul>
    <p>Puede solicitar la eliminación de su cuenta y datos en cualquier momento (ver sección 7).</p>

    <h2>7. SUS DERECHOS</h2>
    <p>Tiene derecho a:</p>
    <ul>
        <li><strong>Acceso</strong>: Solicitar una copia de sus datos personales</li>
        <li><strong>Rectificación</strong>: Corregir información inexacta o incompleta</li>
        <li><strong>Eliminación</strong>: Solicitar la eliminación de sus datos ("derecho al olvido")</li>
        <li><strong>Portabilidad</strong>: Recibir sus datos en formato estructurado</li>
        <li><strong>Oposición</strong>: Oponerse al procesamiento de sus datos para ciertos fines</li>
        <li><strong>Retirar consentimiento</strong>: Retirar el consentimiento para notificaciones push en cualquier momento desde la configuración del dispositivo</li>
        <li><strong>Cerrar cuenta</strong>: Eliminar su cuenta y todos los datos asociados</li>
    </ul>
    <p>Para ejercer estos derechos, contáctenos en: <a href="mailto:gega19s@gmail.com">gega19s@gmail.com</a></p>

    <h2>8. COOKIES Y TECNOLOGÍAS SIMILARES</h2>
    <p>La aplicación móvil puede utilizar:</p>
    <ul>
        <li><strong>Tokens de autenticación</strong> almacenados localmente para mantener su sesión</li>
        <li><strong>Preferencias de usuario</strong> almacenadas localmente en el dispositivo</li>
        <li><strong>Tokens de notificación push</strong> para enviarle notificaciones</li>
    </ul>
    <p>Puede gestionar estas configuraciones desde la aplicación o la configuración de su dispositivo.</p>

    <h2>9. MENORES DE EDAD</h2>
    <p>Nuestro servicio está dirigido a usuarios mayores de 18 años. No recopilamos intencionalmente información de menores de edad. Si descubrimos que hemos recopilado información de un menor, tomaremos medidas para eliminarla.</p>

    <h2>10. CAMBIOS A ESTA POLÍTICA</h2>
    <p>Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos de cambios importantes mediante:</p>
    <ul>
        <li>Notificación en la aplicación</li>
        <li>Correo electrónico (si está registrado)</li>
        <li>Publicación de la nueva política en nuestro sitio web</li>
    </ul>
    <p>La fecha de "Última actualización" al inicio de esta política indica cuándo se realizaron los últimos cambios.</p>

    <h2>11. TRANSFERENCIAS INTERNACIONALES</h2>
    <p>Sus datos pueden ser procesados y almacenados en servidores ubicados fuera de su país de residencia. Al usar nuestro servicio, consiente estas transferencias. Nos aseguramos de que se apliquen medidas de seguridad adecuadas.</p>

    <h2>12. CONTACTO</h2>
    <div class="contact-info">
        <p>Si tiene preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad o el tratamiento de sus datos personales, puede contactarnos en:</p>
        <p><strong>Email:</strong> <a href="mailto:gega19s@gmail.com">gega19s@gmail.com</a></p>
        <p><strong>País:</strong> Venezuela</p>
    </div>

    <h2>13. CONSENTIMIENTO</h2>
    <p>Al utilizar BarberTop, usted acepta esta Política de Privacidad y el procesamiento de su información personal según se describe aquí. Si no está de acuerdo con esta política, le recomendamos que no utilice nuestro servicio.</p>

    <div class="note">
        <p><strong>Nota:</strong> Esta política cumple con los principios del Reglamento General de Protección de Datos (RGPD) y otras regulaciones de privacidad aplicables. Si tiene dudas sobre el cumplimiento o sus derechos, no dude en contactarnos.</p>
    </div>
</div>`;

export const TERMS_OF_SERVICE_HTML = `<style>
    .terminos-content h2 {
        color: #C9A961;
        margin-top: 30px;
        margin-bottom: 15px;
        font-size: 1.75em;
        font-weight: bold;
    }
    .terminos-content h3 {
        color: #E8E8E8;
        margin-top: 20px;
        margin-bottom: 10px;
        font-size: 1.25em;
        font-weight: 600;
    }
    .terminos-content p {
        margin-bottom: 15px;
        text-align: justify;
        color: #E8E8E8;
    }
    .terminos-content ul,
    .terminos-content ol {
        margin-bottom: 15px;
        padding-left: 30px;
        color: #E8E8E8;
    }
    .terminos-content li {
        margin-bottom: 8px;
        color: #E8E8E8;
    }
    .terminos-content strong {
        color: #C9A961;
        font-weight: 600;
    }
    .terminos-content .contact-info {
        background-color: #0F0F0F;
        padding: 20px;
        border-left: 4px solid #C9A961;
        margin: 20px 0;
        border-radius: 8px;
    }
    .terminos-content .contact-info p {
        color: #E8E8E8;
    }
    .terminos-content .note {
        background-color: rgba(201, 169, 97, 0.1);
        padding: 15px;
        border-left: 4px solid #C9A961;
        margin-top: 30px;
        border-radius: 8px;
    }
    .terminos-content .note p {
        color: #E8E8E8;
    }
    .terminos-content a {
        color: #C9A961;
        text-decoration: none;
        transition: color 0.3s ease;
    }
    .terminos-content a:hover {
        color: #B89851;
        text-decoration: underline;
    }
</style>

<div class="terminos-content">
    <h2>1. ACEPTACIÓN DE LOS TÉRMINOS</h2>
    <p>Al acceder y utilizar BarberTop ("la aplicación", "el servicio" o "nosotros"), usted acepta estar sujeto a estos Términos de Servicio y a todas las leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos términos, tiene prohibido usar o acceder a este servicio.</p>

    <h2>2. DESCRIPCIÓN DEL SERVICIO</h2>
    <p>BarberTop es una plataforma móvil que conecta a usuarios con barberos y barberías, permitiendo:</p>
    <ul>
        <li><strong>Búsqueda y descubrimiento</strong> de barberos y barberías cercanas</li>
        <li><strong>Reserva de citas</strong> con barberos disponibles</li>
        <li><strong>Gestión de citas</strong> (ver, modificar, cancelar)</li>
        <li><strong>Revisión y calificación</strong> de servicios recibidos</li>
        <li><strong>Visualización de portafolios</strong> y trabajos de barberos</li>
        <li><strong>Promociones y ofertas</strong> especiales</li>
    </ul>

    <h2>3. REGISTRO Y CUENTA DE USUARIO</h2>

    <h3>3.1. Requisitos de Registro</h3>
    <p>Para utilizar ciertas funcionalidades del servicio, debe:</p>
    <ul>
        <li>Ser mayor de 18 años</li>
        <li>Proporcionar información precisa y completa</li>
        <li>Mantener y actualizar su información de cuenta</li>
        <li>Mantener la seguridad de su contraseña</li>
        <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
    </ul>

    <h3>3.2. Responsabilidad de la Cuenta</h3>
    <p>Usted es responsable de:</p>
    <ul>
        <li>Todas las actividades que ocurran bajo su cuenta</li>
        <li>Mantener la confidencialidad de su contraseña</li>
        <li>Notificar a BarberTop de cualquier violación de seguridad</li>
        <li>Asegurarse de cerrar sesión al finalizar cada sesión</li>
    </ul>

    <h2>4. RESERVA DE CITAS</h2>

    <h3>4.1. Proceso de Reserva</h3>
    <ul>
        <li>Las citas se reservan a través de la aplicación</li>
        <li>Debe seleccionar fecha, hora y servicio deseado</li>
        <li>La reserva está sujeta a disponibilidad del barbero</li>
        <li>Recibirá una confirmación de la cita</li>
    </ul>

    <h3>4.2. Cancelación de Citas</h3>
    <ul>
        <li>Puede cancelar su cita desde la aplicación</li>
        <li>Se recomienda cancelar con al menos 24 horas de anticipación</li>
        <li>Las cancelaciones tardías pueden estar sujetas a políticas específicas del barbero</li>
        <li>BarberTop no se hace responsable de políticas de cancelación individuales de barberos</li>
    </ul>

    <h3>4.3. No Presentación (No-Show)</h3>
    <p>Si no se presenta a una cita confirmada sin cancelar previamente, el barbero puede aplicar políticas específicas. BarberTop se reserva el derecho de tomar medidas, incluyendo la suspensión temporal o permanente de su cuenta en caso de múltiples no presentaciones.</p>

    <h2>5. PAGOS</h2>

    <h3>5.1. Métodos de Pago</h3>
    <p>Los pagos se realizan directamente con el barbero o barbería mediante:</p>
    <ul>
        <li>Pago Móvil</li>
        <li>Transferencias bancarias</li>
        <li>Efectivo</li>
        <li>Otros métodos acordados con el barbero</li>
    </ul>

    <h3>5.2. Comprobantes de Pago</h3>
    <p>Si el barbero requiere comprobante de pago, puede subirlo a través de la aplicación. BarberTop no procesa pagos directamente y no se hace responsable de transacciones entre usuarios y barberos.</p>

    <h3>5.3. Precios</h3>
    <p>Los precios mostrados en la aplicación son indicativos y pueden variar. El precio final será acordado directamente con el barbero. BarberTop no garantiza precios específicos.</p>

    <h2>6. RESEÑAS Y CALIFICACIONES</h2>

    <h3>6.1. Contenido de Reseñas</h3>
    <p>Al publicar una reseña, usted acepta:</p>
    <ul>
        <li>Proporcionar información veraz y precisa</li>
        <li>No publicar contenido difamatorio, ofensivo o ilegal</li>
        <li>No usar reseñas para fines comerciales o promocionales</li>
        <li>Respetar la privacidad de los barberos</li>
    </ul>

    <h3>6.2. Moderación</h3>
    <p>BarberTop se reserva el derecho de:</p>
    <ul>
        <li>Revisar, editar o eliminar reseñas que violen estos términos</li>
        <li>Eliminar contenido inapropiado o fraudulento</li>
        <li>Suspender o eliminar cuentas que publiquen contenido inapropiado</li>
    </ul>

    <h2>7. CONDUCTA DEL USUARIO</h2>
    <p>Usted se compromete a:</p>
    <ul>
        <li><strong>Usar el servicio legalmente</strong> y solo para fines permitidos</li>
        <li><strong>No interferir</strong> con el funcionamiento del servicio</li>
        <li><strong>No intentar acceder</strong> a áreas restringidas del servicio</li>
        <li><strong>No transmitir</strong> virus, malware o código malicioso</li>
        <li><strong>No suplantar</strong> la identidad de otra persona</li>
        <li><strong>Respetar</strong> los derechos de propiedad intelectual</li>
        <li><strong>No usar</strong> el servicio para actividades ilegales</li>
        <li><strong>Tratar con respeto</strong> a barberos y otros usuarios</li>
    </ul>

    <h2>8. PROPIEDAD INTELECTUAL</h2>

    <h3>8.1. Contenido de BarberTop</h3>
    <p>Todo el contenido de la aplicación, incluyendo pero no limitado a texto, gráficos, logos, iconos, imágenes, compilaciones de datos y software, es propiedad de BarberTop o sus proveedores de contenido y está protegido por leyes de propiedad intelectual.</p>

    <h3>8.2. Contenido del Usuario</h3>
    <p>Al subir contenido (fotos, reseñas, comentarios), usted otorga a BarberTop una licencia mundial, no exclusiva, libre de regalías para usar, reproducir, modificar y distribuir dicho contenido en relación con el servicio.</p>

    <h2>9. LIMITACIÓN DE RESPONSABILIDAD</h2>

    <h3>9.1. Servicio "Tal Cual"</h3>
    <p>BarberTop proporciona el servicio "tal cual" y "según disponibilidad". No garantizamos que:</p>
    <ul>
        <li>El servicio será ininterrumpido o libre de errores</li>
        <li>Los defectos serán corregidos</li>
        <li>El servicio estará libre de virus u otros componentes dañinos</li>
    </ul>

    <h3>9.2. Servicios de Terceros</h3>
    <p>BarberTop actúa como intermediario entre usuarios y barberos. No somos responsables de:</p>
    <ul>
        <li>La calidad de los servicios proporcionados por los barberos</li>
        <li>Disputas entre usuarios y barberos</li>
        <li>Pagos o transacciones entre usuarios y barberos</li>
        <li>Daños o lesiones resultantes de servicios de barbería</li>
    </ul>

    <h3>9.3. Limitación de Daños</h3>
    <p>En ningún caso BarberTop será responsable de daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo pero no limitado a pérdida de beneficios, datos o uso.</p>

    <h2>10. INDEMNIZACIÓN</h2>
    <p>Usted acepta indemnizar y eximir de responsabilidad a BarberTop, sus afiliados, directores, empleados y agentes de cualquier reclamo, daño, obligación, pérdida, responsabilidad, costo o deuda, y gastos (incluyendo honorarios de abogados) que surjan de:</p>
    <ul>
        <li>Su uso del servicio</li>
        <li>Su violación de estos términos</li>
        <li>Su violación de cualquier derecho de terceros</li>
        <li>Contenido que usted publique o transmita</li>
    </ul>

    <h2>11. TERMINACIÓN</h2>

    <h3>11.1. Terminación por el Usuario</h3>
    <p>Puede terminar su cuenta en cualquier momento eliminando su cuenta desde la aplicación o contactándonos.</p>

    <h3>11.2. Terminación por BarberTop</h3>
    <p>BarberTop se reserva el derecho de:</p>
    <ul>
        <li>Suspender o terminar su acceso al servicio sin previo aviso</li>
        <li>Eliminar su cuenta y contenido</li>
        <li>Tomar medidas legales si es necesario</li>
    </ul>
    <p>Esto puede ocurrir si viola estos términos, realiza actividades fraudulentas, o por cualquier otra razón a nuestra discreción.</p>

    <h2>12. MODIFICACIONES DEL SERVICIO</h2>
    <p>BarberTop se reserva el derecho de:</p>
    <ul>
        <li>Modificar o descontinuar el servicio en cualquier momento</li>
        <li>Cambiar características, funcionalidades o disponibilidad</li>
        <li>Actualizar o modificar estos términos</li>
    </ul>
    <p>Le notificaremos de cambios importantes mediante notificaciones en la aplicación o por correo electrónico.</p>

    <h2>13. PRIVACIDAD</h2>
    <p>Su uso del servicio también está regido por nuestra Política de Privacidad. Al usar el servicio, usted acepta la recopilación y uso de información según se describe en la Política de Privacidad.</p>

    <h2>14. LEY APLICABLE Y JURISDICCIÓN</h2>
    <p>Estos Términos de Servicio se regirán e interpretarán de acuerdo con las leyes de Venezuela, sin dar efecto a ningún principio de conflictos de leyes. Cualquier disputa relacionada con estos términos será resuelta en los tribunales competentes de Venezuela.</p>

    <h2>15. DISPOSICIONES GENERALES</h2>

    <h3>15.1. Acuerdo Completo</h3>
    <p>Estos términos constituyen el acuerdo completo entre usted y BarberTop respecto al uso del servicio.</p>

    <h3>15.2. Divisibilidad</h3>
    <p>Si alguna disposición de estos términos se considera inválida o inaplicable, las disposiciones restantes permanecerán en pleno vigor y efecto.</p>

    <h3>15.3. Renuncia</h3>
    <p>El hecho de que BarberTop no ejerza o haga cumplir cualquier derecho o disposición de estos términos no constituirá una renuncia a tal derecho o disposición.</p>

    <h3>15.4. Cesión</h3>
    <p>No puede ceder o transferir estos términos sin el consentimiento previo por escrito de BarberTop. BarberTop puede ceder estos términos sin restricción.</p>

    <h2>16. CONTACTO</h2>
    <div class="contact-info">
        <p>Si tiene preguntas sobre estos Términos de Servicio, puede contactarnos en:</p>
        <p><strong>Email:</strong> <a href="mailto:gega19s@gmail.com">gega19s@gmail.com</a></p>
        <p><strong>País:</strong> Venezuela</p>
    </div>

    <h2>17. ACEPTACIÓN</h2>
    <p>Al utilizar BarberTop, usted reconoce que ha leído, entendido y acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con estos términos, no debe usar el servicio.</p>

    <div class="note">
        <p><strong>Nota:</strong> Estos términos pueden actualizarse periódicamente. Le recomendamos revisar esta página regularmente para estar informado de cualquier cambio. El uso continuado del servicio después de cualquier modificación constituye su aceptación de los nuevos términos.</p>
    </div>
</div>`;

