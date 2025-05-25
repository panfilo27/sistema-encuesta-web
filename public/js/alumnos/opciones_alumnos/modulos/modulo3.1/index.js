/**
 * Módulo 3.1: Plan de Estudios - Encuesta de Química y Bioquímica
 * 
 * Este archivo maneja la lógica principal del módulo 3.1 de la encuesta especializada,
 * incluyendo la carga de datos, validación y almacenamiento de información sobre
 * la evaluación del plan de estudios.
 */

// Referencia al formulario
const formulario = document.getElementById('form-modulo3-1');
const loadingModule = document.getElementById('loading-module');
const loadingOverlay = document.getElementById('loading-overlay');
const errorContainer = document.getElementById('error-container');
const btnGuardar = document.getElementById('btn-guardar-modulo3-1');
const otroAspectoContainer = document.getElementById('otro_aspecto_container');
const otroAspectoCheck = document.getElementById('otro_aspecto_check');
const aspectosError = document.getElementById('aspectos-error');

// Variables globales
let currentUser = null;
let encuestaActual = null;
let moduloCompletado = false;
let respuestasAnteriores = null;

/**
 * Inicializa el módulo cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando Módulo 3.1: Plan de Estudios - Química y Bioquímica');
    
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
                    window.location.href = 'modulo2.1.html';
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
                console.error('Error al inicializar el módulo 3.1:', error);
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
        // 1. Obtener encuesta activa para Química/Bioquímica
        const fechaActual = new Date();
        
        const encuestasSnapshot = await firebase.firestore().collection('encuestas')
            .where('carrera', 'array-contains-any', ['Química', 'Bioquímica'])
            .get();
        
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
            throw new Error('No hay encuestas activas para Química/Bioquímica en este momento.');
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
            
            // Verificar si existen los módulos 1.1 y 2.1 y están completados
            const modulo1_1Completado = datosEncuesta.modulo1_1 && datosEncuesta.modulo1_1.completado === true;
            const modulo2_1Completado = datosEncuesta.modulo2_1 && datosEncuesta.modulo2_1.completado === true;
            
            console.log('Módulo 1.1 completado:', modulo1_1Completado);
            console.log('Módulo 2.1 completado:', modulo2_1Completado);
            
            return {
                modulosCompletados: modulo1_1Completado && modulo2_1Completado
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
            
            // Verificar si existe el módulo 3.1 y está completado
            moduloCompletado = datosEncuesta.modulo3_1 && datosEncuesta.modulo3_1.completado === true;
            
            // Si hay respuestas anteriores, cargarlas
            if (moduloCompletado && datosEncuesta.modulo3_1.datos) {
                respuestasAnteriores = datosEncuesta.modulo3_1.datos;
                
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
    
    // Utilidad de competencias
    if (respuestasAnteriores.utilidad_competencias) {
        const radioUtilidad = document.querySelector(`input[name="utilidad_competencias"][value="${respuestasAnteriores.utilidad_competencias}"]`);
        if (radioUtilidad) radioUtilidad.checked = true;
    }
    
    // Satisfacción con la carrera
    if (respuestasAnteriores.satisfaccion_carrera) {
        const radioSatisfaccion = document.querySelector(`input[name="satisfaccion_carrera"][value="${respuestasAnteriores.satisfaccion_carrera}"]`);
        if (radioSatisfaccion) radioSatisfaccion.checked = true;
    }
    
    // Aspectos a reforzar (checkboxes)
    if (respuestasAnteriores.aspectos_reforzar && Array.isArray(respuestasAnteriores.aspectos_reforzar)) {
        respuestasAnteriores.aspectos_reforzar.forEach(aspecto => {
            const checkboxAspecto = document.querySelector(`input[name="aspectos_reforzar"][value="${aspecto}"]`);
            if (checkboxAspecto) checkboxAspecto.checked = true;
        });
    }
    
    // Otro aspecto (si existe)
    if (respuestasAnteriores.otro_aspecto) {
        otroAspectoCheck.checked = true;
        otroAspectoContainer.style.display = 'block';
        formulario.otro_aspecto.value = respuestasAnteriores.otro_aspecto;
    }
}

/**
 * Configura los eventos del formulario
 */
function configurarEventos() {
    // Evento para mostrar/ocultar campo de otro aspecto a reforzar
    otroAspectoCheck.addEventListener('change', () => {
        if (otroAspectoCheck.checked) {
            otroAspectoContainer.style.display = 'block';
            otroAspectoContainer.classList.add('visible');
            formulario.otro_aspecto.setAttribute('required', 'required');
        } else {
            otroAspectoContainer.style.display = 'none';
            formulario.otro_aspecto.removeAttribute('required');
        }
    });
    
    // Evento de guardar y continuar
    btnGuardar.addEventListener('click', async () => {
        // Si el módulo ya está completado, solo navegar al siguiente módulo
        if (moduloCompletado) {
            window.location.href = 'modulo4.1.html';
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
            
            // Obtener los aspectos a reforzar seleccionados
            const aspectosSeleccionados = Array.from(
                document.querySelectorAll('input[name="aspectos_reforzar"]:checked')
            ).map(checkbox => checkbox.value);
            
            // Añadir "otro aspecto" si está marcado
            if (otroAspectoCheck.checked && formulario.otro_aspecto.value.trim()) {
                aspectosSeleccionados.push('otro');
            }
            
            // Crear objeto con los datos del formulario
            const datosModulo3_1 = {
                // Evaluación del plan de estudios
                utilidad_competencias: document.querySelector('input[name="utilidad_competencias"]:checked').value,
                satisfaccion_carrera: document.querySelector('input[name="satisfaccion_carrera"]:checked').value,
                aspectos_reforzar: aspectosSeleccionados,
                otro_aspecto: otroAspectoCheck.checked ? formulario.otro_aspecto.value.trim() : null,
                
                // Metadatos
                uid: currentUser.id,
                timestamp: new Date()
            };
            
            // Guardar en Firestore
            await guardarRespuestas(datosModulo3_1);
            
            // Redirigir al siguiente módulo
            window.location.href = 'modulo4.1.html';
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
    aspectosError.style.display = 'none';
    
    const errores = [];
    
    // Validar utilidad de competencias
    if (!document.querySelector('input[name="utilidad_competencias"]:checked')) {
        errores.push('Debes indicar la utilidad de las competencias adquiridas');
    }
    
    // Validar satisfacción con la carrera
    if (!document.querySelector('input[name="satisfaccion_carrera"]:checked')) {
        errores.push('Debes indicar tu grado de satisfacción con la carrera');
    }
    
    // Validar aspectos a reforzar (al menos uno debe estar seleccionado)
    const aspectosSeleccionados = document.querySelectorAll('input[name="aspectos_reforzar"]:checked');
    const otroAspectoSeleccionado = otroAspectoCheck.checked;
    
    if (aspectosSeleccionados.length === 0 && !otroAspectoSeleccionado) {
        errores.push('Debes seleccionar al menos un aspecto a reforzar');
        aspectosError.style.display = 'block';
    }
    
    // Validar que se especifique el otro aspecto si está seleccionado
    if (otroAspectoSeleccionado && !formulario.otro_aspecto.value.trim()) {
        errores.push('Debes especificar el otro aspecto a reforzar');
    }
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

/**
 * Guarda las respuestas del módulo en Firestore
 * @param {Object} datos - Datos del módulo 3.1
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
            // La encuesta ya existe, actualizamos solo el módulo 3.1
            await encuestaRef.update({
                'modulo3_1': {
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
                modulo3_1: {
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
