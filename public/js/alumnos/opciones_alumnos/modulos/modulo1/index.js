/**
 * Módulo 1: Datos Personales - Controlador principal
 * 
 * Este archivo maneja la lógica principal del módulo 1 de la encuesta,
 * incluyendo la carga de datos del usuario, inicialización del formulario,
 * y la coordinación entre validación y almacenamiento de datos.
 */

// Referencia al formulario
const formulario = document.getElementById('form-modulo1');
const loadingModule = document.getElementById('loading-module');
const loadingOverlay = document.getElementById('loading-overlay');
const errorContainer = document.getElementById('error-container');
const btnGuardar = document.getElementById('btn-guardar-modulo1');

// Variables globales
let currentUser = null;
let datosUsuario = null;
let carreras = [];
let encuestaActual = null;
let moduloCompletado = false;
let respuestasAnteriores = null;

/**
 * Inicializa el módulo cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando Módulo 1: Datos Personales');
    
    // Añadir estilos para campos bloqueados
    const style = document.createElement('style');
    style.textContent = `
        .campo-bloqueado small {
            display: block;
            margin-top: 5px;
            color: #666;
            font-style: italic;
        }
        .campo-bloqueado i {
            color: #888;
            margin-right: 5px;
        }
        select:disabled {
            background-color: #f8f8f8;
            border-color: #ddd;
            color: #555;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
    
    // Verificar autenticación mediante localStorage
    const userSession = localStorage.getItem('userSession');
    
    if (userSession) {
        try {
            const userData = JSON.parse(userSession);
            
            // Verificar que la sesión sea de un alumno
            if (userData.rolUser !== 'alumno') {
                alert('No tienes permiso para acceder a esta sección.');
                window.location.href = '../../../../../auth/login.html';
                return;
            }
            
            currentUser = userData;
            
            // Actualizar nombre de usuario en la interfaz
            document.getElementById('nombre-usuario').textContent = userData.nombre || userData.usuario;
            
            // Evento de cierre de sesión
            document.getElementById('btn-cerrar-sesion').addEventListener('click', () => {
                localStorage.removeItem('userSession');
                window.location.href = '../../../../../auth/login.html';
            });
            
            try {
                // Cargar datos del usuario y verificar si el módulo ya fue completado
                await cargarDatos();
                
                // Si el módulo ya fue completado, habilitar modo solo visualización
                if (moduloCompletado) {
                    console.log('Este módulo ya fue completado anteriormente');
                    // Bloquear todos los campos del formulario
                    habilitarModoSoloVisualizacion();
                    // Cambiar el texto del botón
                    if (btnGuardar) {
                        btnGuardar.textContent = 'Continuar al siguiente módulo';
                    }
                }
                
                // Configurar eventos del formulario
                configurarEventos();
                
                // Mostrar formulario
                loadingModule.style.display = 'none';
                formulario.style.display = 'block';
            } catch (error) {
                console.error('Error al inicializar el módulo 1:', error);
                mostrarError('Error al cargar el formulario. Por favor, recarga la página.');
            }
        } catch (error) {
            console.error('Error al procesar la sesión:', error);
            localStorage.removeItem('userSession');
            window.location.href = '../../../../../auth/login.html';
        }
    } else {
        // Usuario no autenticado, redirigir al login
        alert('Debes iniciar sesión para acceder a esta sección.');
        window.location.href = '../../../../../auth/login.html';
    }
});

/**
 * Carga los datos necesarios para el formulario
 */
async function cargarDatos() {
    try {
        // 1. Cargar datos del usuario desde Firestore
        const userDoc = await firebase.firestore().collection('usuario').doc(currentUser.id).get();
        if (userDoc.exists) {
            datosUsuario = window.parseUsuarioFirestore(userDoc.data());
        }
        
        // 2. Cargar encuesta activa
        // Como no podemos usar operadores de desigualdad en dos campos diferentes,
        // primero obtenemos las encuestas activas y luego filtramos manualmente
        const fechaActual = new Date();
        const encuestasActivas = await firebase.firestore()
            .collection('encuestas')
            .where('activa', '==', true)
            .get();
        
        if (encuestasActivas.empty) {
            throw new Error('No hay encuestas activas en este momento.');
        }
        
        // Filtrar manualmente por fechas
        const encuestasEnRango = encuestasActivas.docs
            .map(doc => {
                const encuesta = { id: doc.id, ...doc.data() };
                
                // Convertir fechas de Firestore a objetos Date
                if (encuesta.fechaInicio && typeof encuesta.fechaInicio.toDate === 'function') {
                    encuesta.fechaInicio = encuesta.fechaInicio.toDate();
                }
                if (encuesta.fechaFin && typeof encuesta.fechaFin.toDate === 'function') {
                    encuesta.fechaFin = encuesta.fechaFin.toDate();
                }
                
                return encuesta;
            })
            .filter(encuesta => {
                // Verificar que la encuesta está en el rango de fechas válido
                const fechaInicioValida = !encuesta.fechaInicio || encuesta.fechaInicio <= fechaActual;
                const fechaFinValida = !encuesta.fechaFin || encuesta.fechaFin >= fechaActual;
                return fechaInicioValida && fechaFinValida;
            });
        
        if (encuestasEnRango.length === 0) {
            throw new Error('No hay encuestas activas en este momento.');
        }
        
        encuestaActual = encuestasEnRango[0];
        // El ID ya está incluido en el objeto encuesta
        
        // 3. Verificar si el usuario ya completó este módulo para esta encuesta usando la nueva estructura
        const historialEncuestaDoc = await firebase.firestore()
            .collection('usuario')
            .doc(currentUser.id)
            .collection('historial_encuestas')
            .doc(encuestaActual.id)
            .get();
        
        if (historialEncuestaDoc.exists) {
            const datosEncuesta = historialEncuestaDoc.data();
            // Verificar si existe el módulo 1 y está completado
            moduloCompletado = datosEncuesta.modulo1 && datosEncuesta.modulo1.completado === true;
            console.log('Estado del módulo 1:', moduloCompletado ? 'Completado' : 'No completado');
            
            // Si hay respuestas anteriores, cargarlas para pre-llenar el formulario
            if (moduloCompletado && datosEncuesta.modulo1.datos) {
                respuestasAnteriores = datosEncuesta.modulo1.datos;
                console.log('Respuestas anteriores cargadas para módulo 1:', respuestasAnteriores);
                // Pre-llenar formulario con respuestas anteriores
                if (respuestasAnteriores) {
                    preLlenarFormulario();
                }
            }
        } else {
            moduloCompletado = false;
            console.log('No se encontró historial de esta encuesta para el usuario');
        }
        
        // 4. Cargar lista de carreras
        const carrerasSnapshot = await firebase.firestore().collection('carreras').get();
        carreras = carrerasSnapshot.docs.map(doc => {
            return { id: doc.id, ...doc.data() };
        });
        
        // Llenar el select de carreras
        const selectCarrera = document.getElementById('carrera');
        selectCarrera.innerHTML = '<option value="">Seleccione una opción</option>';
        
        carreras.forEach(carrera => {
            const option = document.createElement('option');
            option.value = carrera.id;
            option.textContent = carrera.nombre;
            selectCarrera.appendChild(option);
        });
        
        // Si el usuario tiene datos, pre-llenar el formulario
        if (datosUsuario) {
            preLlenarFormulario();
        }
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        throw error;
    }
}

/**
 * Pre-llena el formulario con los datos existentes del usuario y respuestas anteriores
 */
function preLlenarFormulario() {
    // Primero usamos los datos básicos del usuario
    if (datosUsuario) {
        // Datos personales
        formulario.nombre.value = datosUsuario.nombre || '';
        formulario.apellidoPaterno.value = datosUsuario.apellidoPaterno || '';
        formulario.apellidoMaterno.value = datosUsuario.apellidoMaterno || '';
        formulario.noControl.value = datosUsuario.noControl || '';
        formulario.fechaNacimiento.value = datosUsuario.fechaNacimiento || '';
        formulario.curp.value = datosUsuario.curp || '';
        
        if (datosUsuario.sexo) {
            formulario.sexo.value = datosUsuario.sexo;
        }
        
        if (datosUsuario.estadoCivil) {
            formulario.estadoCivil.value = datosUsuario.estadoCivil;
        }
        
        // Domicilio
        formulario.domicilio.value = datosUsuario.domicilio || '';
        formulario.ciudad.value = datosUsuario.ciudad || '';
        formulario.municipio.value = datosUsuario.municipio || '';
        formulario.estado.value = datosUsuario.estado || '';
        
        // Contacto
        formulario.telefono.value = datosUsuario.telefono || '';
        formulario.telCasa.value = datosUsuario.telCasa || '';
        formulario.email.value = datosUsuario.email || currentUser.email || '';
        
        // Académico
        if (datosUsuario.carrera) {
            // Buscar el ID de la carrera basado en el nombre
            const carreraEncontrada = carreras.find(c => c.nombre === datosUsuario.carrera);
            if (carreraEncontrada) {
                // Establecer el valor usando el ID de la carrera
                formulario.carrera.value = carreraEncontrada.id;
                // Bloquear el campo para que no pueda ser modificado
                formulario.carrera.disabled = true;
                // Añadir un mensaje visual para indicar que está bloqueado
                const carreraContainer = formulario.carrera.parentElement;
                if (!carreraContainer.querySelector('.campo-bloqueado')) {
                    const infoElement = document.createElement('div');
                    infoElement.className = 'campo-bloqueado';
                    infoElement.innerHTML = '<small><i class="fas fa-lock"></i> Campo bloqueado: información del perfil</small>';
                    carreraContainer.appendChild(infoElement);
                }
            } else {
                console.log('No se pudo encontrar la carrera:', datosUsuario.carrera);
            }
        }
        
        if (datosUsuario.titulado !== undefined) {
            formulario.titulado.value = datosUsuario.titulado ? 'Si' : 'No';
        }
        
        formulario.mesEgreso.value = datosUsuario.mesEgreso || '';
        formulario.trabaja.checked = datosUsuario.trabaja || false;
        formulario.estudia.checked = datosUsuario.estudia || false;
        
        // Idiomas
        if (Array.isArray(datosUsuario.idiomas)) {
            formulario.idiomaIngles.checked = datosUsuario.idiomas.includes('Inglés');
            formulario.idiomaFrances.checked = datosUsuario.idiomas.includes('Francés');
            formulario.idiomaAleman.checked = datosUsuario.idiomas.includes('Alemán');
            formulario.idiomaJapones.checked = datosUsuario.idiomas.includes('Japonés');
            formulario.idiomaItaliano.checked = datosUsuario.idiomas.includes('Italiano');
            formulario.idiomaChino.checked = datosUsuario.idiomas.includes('Chino');
            
            // Detectar otros idiomas
            const idiomasEstándar = ['Inglés', 'Francés', 'Alemán', 'Japonés', 'Italiano', 'Chino'];
            const otrosIdiomas = datosUsuario.idiomas.filter(i => !idiomasEstándar.includes(i));
            
            if (otrosIdiomas.length > 0) {
                formulario.otroIdioma.value = otrosIdiomas.join(', ');
            }
        }
        
        // Paquetes
        if (Array.isArray(datosUsuario.paquetes)) {
            formulario.paqueteWord.checked = datosUsuario.paquetes.includes('Word');
            formulario.paqueteExcel.checked = datosUsuario.paquetes.includes('Excel');
            formulario.paquetePowerPoint.checked = datosUsuario.paquetes.includes('PowerPoint');
            formulario.paqueteAccess.checked = datosUsuario.paquetes.includes('Access');
            formulario.paqueteCAD.checked = datosUsuario.paquetes.includes('AutoCAD');
            formulario.paqueteSolidWorks.checked = datosUsuario.paquetes.includes('SolidWorks');
            formulario.paquetePhotoshop.checked = datosUsuario.paquetes.includes('Photoshop');
            formulario.paqueteIllustrator.checked = datosUsuario.paquetes.includes('Illustrator');
            formulario.paqueteAdobePremiere.checked = datosUsuario.paquetes.includes('Adobe Premiere');
            
            // Detectar otros paquetes
            const paquetesEstándar = ['Word', 'Excel', 'PowerPoint', 'Access', 'AutoCAD', 'SolidWorks', 'Photoshop', 'Illustrator', 'Adobe Premiere'];
            const otrosPaquetes = datosUsuario.paquetes.filter(p => !paquetesEstándar.includes(p));
            
            if (otrosPaquetes.length > 0) {
                formulario.otrosPaquetes.value = otrosPaquetes.join(', ');
            }
        }
    }
    
    // Luego, si hay respuestas anteriores, estas tienen prioridad y sobrescriben los datos del usuario
    if (respuestasAnteriores) {
        console.log('Usando respuestas anteriores para pre-llenar el formulario:', respuestasAnteriores);
        
        // Datos personales
        if (respuestasAnteriores.nombre) formulario.nombre.value = respuestasAnteriores.nombre;
        if (respuestasAnteriores.apellidoPaterno) formulario.apellidoPaterno.value = respuestasAnteriores.apellidoPaterno;
        if (respuestasAnteriores.apellidoMaterno) formulario.apellidoMaterno.value = respuestasAnteriores.apellidoMaterno;
        if (respuestasAnteriores.noControl) formulario.noControl.value = respuestasAnteriores.noControl;
        if (respuestasAnteriores.fechaNacimiento) formulario.fechaNacimiento.value = respuestasAnteriores.fechaNacimiento;
        if (respuestasAnteriores.curp) formulario.curp.value = respuestasAnteriores.curp;
        
        if (respuestasAnteriores.sexo) {
            formulario.sexo.value = respuestasAnteriores.sexo;
        }
        
        if (respuestasAnteriores.estadoCivil) {
            formulario.estadoCivil.value = respuestasAnteriores.estadoCivil;
        }
        
        // Domicilio
        if (respuestasAnteriores.domicilio) formulario.domicilio.value = respuestasAnteriores.domicilio;
        if (respuestasAnteriores.ciudad) formulario.ciudad.value = respuestasAnteriores.ciudad;
        if (respuestasAnteriores.municipio) formulario.municipio.value = respuestasAnteriores.municipio;
        if (respuestasAnteriores.estado) formulario.estado.value = respuestasAnteriores.estado;
        
        // Contacto
        if (respuestasAnteriores.telefono) formulario.telefono.value = respuestasAnteriores.telefono;
        if (respuestasAnteriores.telCasa) formulario.telCasa.value = respuestasAnteriores.telCasa;
        if (respuestasAnteriores.email) formulario.email.value = respuestasAnteriores.email;
        
        // Académico
        // Solo actualizar la carrera si el campo no está ya bloqueado
        if (respuestasAnteriores.carrera && !formulario.carrera.disabled) {
            formulario.carrera.value = respuestasAnteriores.carrera;
        }
        
        if (respuestasAnteriores.titulado !== undefined) {
            formulario.titulado.value = respuestasAnteriores.titulado ? 'Si' : 'No';
        }
        
        if (respuestasAnteriores.mesEgreso) formulario.mesEgreso.value = respuestasAnteriores.mesEgreso;
        
        if (respuestasAnteriores.trabaja !== undefined) formulario.trabaja.checked = respuestasAnteriores.trabaja;
        if (respuestasAnteriores.estudia !== undefined) formulario.estudia.checked = respuestasAnteriores.estudia;
        
        // Idiomas
        if (Array.isArray(respuestasAnteriores.idiomas)) {
            formulario.idiomaIngles.checked = respuestasAnteriores.idiomas.includes('Inglés');
            formulario.idiomaFrances.checked = respuestasAnteriores.idiomas.includes('Francés');
            formulario.idiomaAleman.checked = respuestasAnteriores.idiomas.includes('Alemán');
            formulario.idiomaJapones.checked = respuestasAnteriores.idiomas.includes('Japonés');
            formulario.idiomaItaliano.checked = respuestasAnteriores.idiomas.includes('Italiano');
            formulario.idiomaChino.checked = respuestasAnteriores.idiomas.includes('Chino');
            
            // Otros idiomas
            const idiomasEstándar = ['Inglés', 'Francés', 'Alemán', 'Japonés', 'Italiano', 'Chino'];
            const otrosIdiomas = respuestasAnteriores.idiomas.filter(i => !idiomasEstándar.includes(i));
            
            if (otrosIdiomas.length > 0) {
                formulario.otroIdioma.value = otrosIdiomas.join(', ');
            }
        }
        
        // Paquetes
        if (Array.isArray(respuestasAnteriores.paquetes)) {
            formulario.paqueteWord.checked = respuestasAnteriores.paquetes.includes('Word');
            formulario.paqueteExcel.checked = respuestasAnteriores.paquetes.includes('Excel');
            formulario.paquetePowerPoint.checked = respuestasAnteriores.paquetes.includes('PowerPoint');
            formulario.paqueteAccess.checked = respuestasAnteriores.paquetes.includes('Access');
            formulario.paqueteCAD.checked = respuestasAnteriores.paquetes.includes('AutoCAD');
            formulario.paqueteSolidWorks.checked = respuestasAnteriores.paquetes.includes('SolidWorks');
            formulario.paquetePhotoshop.checked = respuestasAnteriores.paquetes.includes('Photoshop');
            formulario.paqueteIllustrator.checked = respuestasAnteriores.paquetes.includes('Illustrator');
            formulario.paqueteAdobePremiere.checked = respuestasAnteriores.paquetes.includes('Adobe Premiere');
            
            // Otros paquetes
            const paquetesEstándar = ['Word', 'Excel', 'PowerPoint', 'Access', 'AutoCAD', 'SolidWorks', 'Photoshop', 'Illustrator', 'Adobe Premiere'];
            const otrosPaquetes = respuestasAnteriores.paquetes.filter(p => !paquetesEstándar.includes(p));
            
            if (otrosPaquetes.length > 0) {
                formulario.otrosPaquetes.value = otrosPaquetes.join(', ');
            }
        }
    }
}

/**
 * Configura los eventos del formulario
 */
function configurarEventos() {
    // Evento de envío del formulario
    btnGuardar.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Si el módulo ya está completado, solo navegar al siguiente módulo
        if (moduloCompletado) {
            window.location.href = 'modulo2.html';
            return;
        }
        
        // Validar el formulario
        const validacion = validarFormulario();
        
        if (!validacion.valido) {
            mostrarErrores(validacion.errores);
            return;
        }
        
        // Mostrar overlay de carga
        loadingOverlay.style.display = 'flex';
        
        try {
            // Crear objeto con los datos del formulario
            const datosModulo1 = window.crearModulo1DesdeFormulario(formulario);
            
            // Guardar respuestas (solo en historial_encuestas, sin modificar documento principal)
            await guardarRespuestas(datosModulo1);
            
            alert('Información guardada correctamente. Serás redirigido al siguiente módulo.');
            
            // Redirigir al siguiente módulo
            window.location.href = 'modulo2.html';
        } catch (error) {
            console.error('Error al guardar el formulario:', error);
            mostrarError('Error al guardar la información. Por favor, intenta nuevamente.');
            loadingOverlay.style.display = 'none';
        }
    });
}

/**
 * Valida el formulario antes de enviar
 * @returns {Object} Resultado de la validación {valido: boolean, errores: []}
 */
function validarFormulario() {
    // Reiniciar errores
    errorContainer.innerHTML = '';
    
    const errores = [];
    
    // Verificar campos requeridos
    const camposRequeridos = [
        { id: 'nombre', mensaje: 'El nombre es obligatorio' },
        { id: 'apellidoPaterno', mensaje: 'El apellido paterno es obligatorio' },
        { id: 'noControl', mensaje: 'El número de control es obligatorio' },
        { id: 'fechaNacimiento', mensaje: 'La fecha de nacimiento es obligatoria' },
        { id: 'curp', mensaje: 'La CURP es obligatoria' },
        { id: 'sexo', mensaje: 'Debe seleccionar su sexo' },
        { id: 'estadoCivil', mensaje: 'Debe seleccionar su estado civil' },
        { id: 'domicilio', mensaje: 'El domicilio es obligatorio' },
        { id: 'ciudad', mensaje: 'La ciudad es obligatoria' },
        { id: 'municipio', mensaje: 'El municipio es obligatorio' },
        { id: 'estado', mensaje: 'El estado es obligatorio' },
        { id: 'telefono', mensaje: 'El teléfono es obligatorio' },
        { id: 'carrera', mensaje: 'Debe seleccionar una carrera' },
        { id: 'titulado', mensaje: 'Debe indicar si está titulado' },
        { id: 'mesEgreso', mensaje: 'El mes de egreso es obligatorio' }
    ];
    
    camposRequeridos.forEach(campo => {
        const elemento = formulario[campo.id];
        if (!elemento.value.trim()) {
            errores.push(campo.mensaje);
            elemento.classList.add('error');
        } else {
            elemento.classList.remove('error');
        }
    });
    
    // Validar formato CURP
    const curpRegex = /^[A-Z]{4}[0-9]{6}[H,M][A-Z]{5}[0-9A-Z]{2}$/;
    if (formulario.curp.value.trim() && !curpRegex.test(formulario.curp.value.trim())) {
        errores.push('La CURP no tiene un formato válido');
        formulario.curp.classList.add('error');
    }
    
    // Validar número de control (10 dígitos)
    const noControlRegex = /^[0-9]{8,10}$/;
    if (formulario.noControl.value.trim() && !noControlRegex.test(formulario.noControl.value.trim())) {
        errores.push('El número de control debe tener entre 8 y 10 dígitos');
        formulario.noControl.classList.add('error');
    }
    
    // Validar teléfono (10 dígitos)
    const telefonoRegex = /^[0-9]{10}$/;
    if (formulario.telefono.value.trim() && !telefonoRegex.test(formulario.telefono.value.trim())) {
        errores.push('El teléfono debe tener 10 dígitos');
        formulario.telefono.classList.add('error');
    }
    
    if (formulario.telCasa.value.trim() && !telefonoRegex.test(formulario.telCasa.value.trim())) {
        errores.push('El teléfono de casa debe tener 10 dígitos');
        formulario.telCasa.classList.add('error');
    }
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

/**
 * Guarda las respuestas del módulo en Firestore
 * @param {Object} datos - Datos del módulo 1
 */
async function guardarRespuestas(datos) {
    try {
        const db = firebase.firestore();
        const usuarioRef = db.collection('usuario').doc(currentUser.id);
        
        // Referencia al documento de la encuesta en la subcolección historial_encuestas
        const encuestaRef = usuarioRef.collection('historial_encuestas').doc(encuestaActual.id);
        
        // Obtener el documento para ver si ya existe
        const encuestaDoc = await encuestaRef.get();
        
        if (encuestaDoc.exists) {
            // La encuesta ya existe, actualizamos solo el módulo 1
            await encuestaRef.update({
                'modulo1': {
                    datos: datos,
                    completado: true,
                    fechaCompletado: new Date()
                },
                ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Crear nuevo documento para esta encuesta
            await encuestaRef.set({
                encuestaId: encuestaActual.id,
                titulo: encuestaActual.titulo || 'Encuesta sin título',
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp(),
                modulo1: {
                    datos: datos,
                    completado: true,
                    fechaCompletado: new Date()
                }
            });
        }
        
        console.log('Respuestas del Módulo 1 guardadas correctamente en historial de usuario');
    } catch (error) {
        console.error('Error al guardar respuestas:', error);
        throw error;
    }
}

/**
 * Actualiza los datos del usuario en Firestore
 * @param {Object} datos - Datos del módulo 1
 */
async function actualizarDatosUsuario(datos) {
    try {
        // Eliminar campos que no queremos actualizar
        const { uid, email, completado, fechaCompletado, moduloId, ...datosUsuario } = datos;
        
        // Actualizar documento del usuario
        await firebase.firestore().collection('usuario').doc(currentUser.id).update({
            ...datosUsuario,
            ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Datos de usuario actualizados correctamente');
    } catch (error) {
        console.error('Error al actualizar datos de usuario:', error);
        throw error;
    }
}

/**
 * Muestra mensajes de error en el contenedor
 * @param {Array} errores - Lista de mensajes de error
 */
function mostrarErrores(errores) {
    errorContainer.innerHTML = '';
    
    if (errores.length === 0) return;
    
    const ul = document.createElement('ul');
    ul.className = 'error-list';
    
    errores.forEach(error => {
        const li = document.createElement('li');
        li.textContent = error;
        ul.appendChild(li);
    });
    
    errorContainer.appendChild(ul);
    
    // Hacer scroll al contenedor de errores
    errorContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Muestra un mensaje de error general
 * @param {string} mensaje - Mensaje de error
 */
function mostrarError(mensaje) {
    errorContainer.innerHTML = `<p class="error-message">${mensaje}</p>`;
    errorContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Habilita el modo solo visualización bloqueando todos los campos del formulario
 */
function habilitarModoSoloVisualizacion() {
    console.log('Habilitando modo solo visualización');
    
    // Añadir un aviso en la parte superior del formulario
    const avisoElement = document.createElement('div');
    avisoElement.className = 'aviso-solo-visualizacion';
    avisoElement.innerHTML = `
        <div class="aviso-icono"><i class="fas fa-info-circle"></i></div>
        <div class="aviso-texto">
            <h4>Modo solo visualización</h4>
            <p>Esta encuesta ya ha sido completada. Los campos no pueden ser editados.</p>
        </div>
    `;
    
    // Insertar el aviso al inicio del formulario
    formulario.insertBefore(avisoElement, formulario.firstChild);
    
    // Seleccionar todos los elementos de entrada en el formulario
    const inputs = formulario.querySelectorAll('input, select, textarea');
    
    // Desactivar cada elemento
    inputs.forEach(input => {
        input.disabled = true;
        input.classList.add('disabled');
    });
    
    // Cambiar estilo del formulario para indicar modo visualización
    formulario.classList.add('form-readonly');
    
    // Mostrar mensaje informativo en consola
    console.log('Formulario en modo solo visualización - todos los campos bloqueados');
}
