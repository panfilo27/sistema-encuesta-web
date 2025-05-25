/**
 * Módulo 4.1: Institución - Encuesta de Química y Bioquímica
 * 
 * Este archivo maneja la lógica principal del módulo 4.1 de la encuesta especializada,
 * incluyendo la carga de datos, validación y almacenamiento de información sobre
 * la relación con la institución.
 */

// Referencia al formulario
const formulario = document.getElementById('form-modulo4-1');
const loadingModule = document.getElementById('loading-module');
const loadingOverlay = document.getElementById('loading-overlay');
const errorContainer = document.getElementById('error-container');
const btnGuardar = document.getElementById('btn-guardar-modulo4-1');
const formasParticipacionContainer = document.getElementById('formas_participacion_container');
const participacionError = document.getElementById('participacion-error');

// Variables globales
let currentUser = null;
let encuestaActual = null;
let moduloCompletado = false;
let respuestasAnteriores = null;

/**
 * Inicializa el módulo cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando Módulo 4.1: Institución - Química y Bioquímica');
    
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
            
            // Verificar que el usuario sea de la carrera de Química o Bioquímica directamente desde la sesión
            // Normalizar texto de carrera (quitar acentos y convertir a minúsculas)
            const carrera = userData.carrera ? userData.carrera.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") : '';
            
            // Verificar si contiene palabras clave de Química o Bioquímica
            const esQuimicaOBioquimica = [
                'ingenieria quimica',
                'quimica', 
                'ingenieria bioquimica',
                'bioquimica'
            ].some(keyword => carrera.includes(keyword));
            
            if (!esQuimicaOBioquimica) {
                alert('Esta encuesta es exclusiva para estudiantes de Química y Bioquímica.');
                window.location.href = '../../encuestas.html';
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
                // Verificar si los módulos anteriores fueron completados
                const verificacionPrevia = await verificarModulosAnteriores();
                
                if (!verificacionPrevia.modulosCompletados) {
                    alert('Debes completar los módulos anteriores antes de continuar. Serás redirigido.');
                    window.location.href = 'modulo3.1.html';
                    return;
                }
                
                // Cargar datos y verificar si el módulo ya fue completado
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
                console.error('Error al inicializar el módulo 4.1:', error);
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
 * Verifica si los módulos anteriores han sido completados
 * @returns {Promise<Object>} - Estado de los módulos anteriores
 */
async function verificarModulosAnteriores() {
    try {
        // 1. Obtener encuesta activa (general para todos los estudiantes)
        const fechaActual = new Date();
        
        // Recuperar la encuestaId del localStorage si está disponible
        const encuestaIdFromLocalStorage = localStorage.getItem('encuestaActualId');
        let encuestasSnapshot;
        
        if (encuestaIdFromLocalStorage) {
            // Si hay una encuesta específica en localStorage, buscarla por ID
            console.log('Buscando encuesta específica con ID:', encuestaIdFromLocalStorage);
            encuestasSnapshot = await firebase.firestore().collection('encuestas')
                .where(firebase.firestore.FieldPath.documentId(), '==', encuestaIdFromLocalStorage)
                .get();
        } else {
            // Si no hay encuesta específica, buscar todas las encuestas activas
            console.log('Buscando todas las encuestas activas');
            encuestasSnapshot = await firebase.firestore().collection('encuestas').get();
        }
        
        const encuestasEnRango = encuestasSnapshot.docs
            .map(doc => {
                const encuesta = { id: doc.id, ...doc.data() };
                
                // Convertir Timestamps a Date si existen
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
            throw new Error('No hay encuestas activas disponibles en este momento.');
        }
        
        encuestaActual = encuestasEnRango[0];
        
        console.log('Verificando si el usuario ha completado los módulos anteriores...');
        console.log('ID Usuario:', currentUser.id);
        console.log('ID Encuesta:', encuestaActual.id);
        
        // 2. Verificar si el usuario completó los módulos anteriores
        const historialEncuestaDoc = await firebase.firestore()
            .collection('usuario')
            .doc(currentUser.id)
            .collection('historial_encuestas')
            .doc(encuestaActual.id)
            .get();
        
        console.log('Documento encontrado:', historialEncuestaDoc.exists);
        
        if (historialEncuestaDoc.exists) {
            const datosEncuesta = historialEncuestaDoc.data();
            console.log('Datos de encuesta:', datosEncuesta);
            
            // Verificar si existen los módulos 1.1, 2.1 y 3.1 y están completados
            const modulo1_1Completado = datosEncuesta.modulo1_1 && datosEncuesta.modulo1_1.completado === true;
            const modulo2_1Completado = datosEncuesta.modulo2_1 && datosEncuesta.modulo2_1.completado === true;
            const modulo3_1Completado = datosEncuesta.modulo3_1 && datosEncuesta.modulo3_1.completado === true;
            
            console.log('Módulo 1.1 completado:', modulo1_1Completado);
            console.log('Módulo 2.1 completado:', modulo2_1Completado);
            console.log('Módulo 3.1 completado:', modulo3_1Completado);
            
            return {
                modulosCompletados: modulo1_1Completado && modulo2_1Completado && modulo3_1Completado
            };
        }
        
        console.log('No se encontró historial de esta encuesta para el usuario');
        return {
            modulosCompletados: false
        };
    } catch (error) {
        console.error('Error al verificar módulos anteriores:', error);
        throw error;
    }
}

/**
 * Carga los datos necesarios para el formulario
 */
async function cargarDatos() {
    try {
        // Verificar si el usuario ya completó este módulo para esta encuesta
        const historialEncuestaDoc = await firebase.firestore()
            .collection('usuario')
            .doc(currentUser.id)
            .collection('historial_encuestas')
            .doc(encuestaActual.id)
            .get();
        
        if (historialEncuestaDoc.exists) {
            const datosEncuesta = historialEncuestaDoc.data();
            
            // Verificar si existe el módulo 4.1 y está completado
            moduloCompletado = datosEncuesta.modulo4_1 && datosEncuesta.modulo4_1.completado === true;
            
            // Si hay respuestas anteriores, cargarlas
            if (moduloCompletado && datosEncuesta.modulo4_1.datos) {
                respuestasAnteriores = datosEncuesta.modulo4_1.datos;
                
                // Pre-llenar el formulario con las respuestas anteriores
                preLlenarFormulario();
            }
        } else {
            moduloCompletado = false;
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        throw error;
    }
}

/**
 * Pre-llena el formulario con las respuestas anteriores
 */
function preLlenarFormulario() {
    if (!respuestasAnteriores) return;
    
    // Contacto de la institución
    if (respuestasAnteriores.contacto_institucion) {
        const radioContacto = document.querySelector(`input[name="contacto_institucion"][value="${respuestasAnteriores.contacto_institucion}"]`);
        if (radioContacto) radioContacto.checked = true;
    }
    
    // Participación con la institución
    if (respuestasAnteriores.participacion_institucion) {
        const radioParticipacion = document.querySelector(`input[name="participacion_institucion"][value="${respuestasAnteriores.participacion_institucion}"]`);
        if (radioParticipacion) {
            radioParticipacion.checked = true;
            
            // Mostrar campo condicional si quiere participar
            if (respuestasAnteriores.participacion_institucion === 'si') {
                formasParticipacionContainer.style.display = 'block';
                
                // Marcar las formas de participación seleccionadas
                if (respuestasAnteriores.formas_participacion && Array.isArray(respuestasAnteriores.formas_participacion)) {
                    respuestasAnteriores.formas_participacion.forEach(forma => {
                        const checkboxForma = document.querySelector(`input[name="formas_participacion"][value="${forma}"]`);
                        if (checkboxForma) checkboxForma.checked = true;
                    });
                }
            }
        }
    }
}

/**
 * Configura los eventos del formulario
 */
function configurarEventos() {
    // Evento para mostrar/ocultar formas de participación
    const radiosParticipacion = document.querySelectorAll('input[name="participacion_institucion"]');
    radiosParticipacion.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'si') {
                formasParticipacionContainer.style.display = 'block';
                formasParticipacionContainer.classList.add('visible');
            } else {
                formasParticipacionContainer.style.display = 'none';
                
                // Desmarcar todos los checkboxes
                const checkboxes = document.querySelectorAll('input[name="formas_participacion"]');
                checkboxes.forEach(checkbox => checkbox.checked = false);
            }
        });
    });
    
    // Evento de guardar y continuar
    btnGuardar.addEventListener('click', async () => {
        // Si el módulo ya está completado, solo navegar al siguiente módulo
        if (moduloCompletado) {
            window.location.href = 'modulo5.1.html';
            return;
        }
        
        try {
            // Mostrar overlay de carga
            loadingOverlay.style.display = 'flex';
            
            // Validar el formulario
            const resultadoValidacion = validarFormulario();
            
            if (!resultadoValidacion.valido) {
                mostrarErrores(resultadoValidacion.errores);
                loadingOverlay.style.display = 'none';
                return;
            }
            
            // Obtener las formas de participación seleccionadas
            const formasSeleccionadas = Array.from(
                document.querySelectorAll('input[name="formas_participacion"]:checked')
            ).map(checkbox => checkbox.value);
            
            // Crear objeto con los datos del formulario
            const datosModulo4_1 = {
                // Relación con la institución
                contacto_institucion: document.querySelector('input[name="contacto_institucion"]:checked').value,
                participacion_institucion: document.querySelector('input[name="participacion_institucion"]:checked').value,
                formas_participacion: formulario.participacion_si.checked ? formasSeleccionadas : [],
                
                // Metadatos
                uid: currentUser.id,
                timestamp: new Date()
            };
            
            // Guardar en Firestore
            await guardarRespuestas(datosModulo4_1);
            
            // Redirigir al siguiente módulo
            window.location.href = 'modulo5.1.html';
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
    participacionError.style.display = 'none';
    
    const errores = [];
    
    // Validar contacto de la institución
    if (!document.querySelector('input[name="contacto_institucion"]:checked')) {
        errores.push('Debes indicar si la institución te ha contactado después de egresar');
    }
    
    // Validar participación con la institución
    if (!document.querySelector('input[name="participacion_institucion"]:checked')) {
        errores.push('Debes indicar si te gustaría participar con la institución');
    } else if (formulario.participacion_si.checked) {
        // Validar que se haya seleccionado al menos una forma de participación
        const formasSeleccionadas = document.querySelectorAll('input[name="formas_participacion"]:checked');
        
        if (formasSeleccionadas.length === 0) {
            errores.push('Debes seleccionar al menos una forma de participación');
            participacionError.style.display = 'block';
        }
    }
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

/**
 * Guarda las respuestas del módulo en Firestore
 * @param {Object} datos - Datos del módulo 4.1
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
            // La encuesta ya existe, actualizamos solo el módulo 4.1
            await encuestaRef.update({
                'modulo4_1': {
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
                titulo: encuestaActual.titulo || 'Encuesta especializada para Química/Bioquímica',
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp(),
                tipo: 'especializada',
                carrera: currentUser.carrera || 'No especificada',
                modulo4_1: {
                    datos: datos,
                    completado: true,
                    fechaCompletado: new Date()
                }
            });
        }
        
        // Actualizar variable global
        moduloCompletado = true;
        
        // Mostrar mensaje de éxito
        alert('¡Gracias! Tus respuestas han sido guardadas correctamente.');
    } catch (error) {
        console.error('Error al guardar respuestas:', error);
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
    errorContainer.style.display = 'block';
    
    // Hacer scroll al contenedor de errores
    errorContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Muestra un mensaje de error general
 * @param {string} mensaje - Mensaje de error
 */
function mostrarError(mensaje) {
    errorContainer.innerHTML = `<p class="error-message">${mensaje}</p>`;
    errorContainer.style.display = 'block';
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
    
    // Cambiar texto del botón
    btnGuardar.textContent = 'Continuar al siguiente módulo';
    
    // Mostrar mensaje informativo en consola
    console.log('Formulario en modo solo visualización - todos los campos bloqueados');
}
