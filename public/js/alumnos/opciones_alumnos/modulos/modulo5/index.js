/**
 * Módulo 5: Desempeño Profesional - Controlador principal
 * 
 * Este archivo maneja la lógica principal del módulo 5 de la encuesta,
 * incluyendo la carga de datos, inicialización del formulario,
 * validación y almacenamiento de datos.
 */

// Referencias a elementos del DOM
const formulario = document.getElementById('form-modulo5');
const loadingModule = document.getElementById('loading-module');
const loadingOverlay = document.getElementById('loading-overlay');
const errorContainer = document.getElementById('error-container');
const btnGuardar = document.getElementById('btn-guardar-modulo5');

// Variables globales
let currentUser = null;
let encuestaActual = null;
let moduloCompletado = false;
let respuestasAnteriores = null;
let moduloAplicable = false;

/**
 * Inicializa el módulo cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando Módulo 5: Desempeño Profesional');
    
    // Verificar autenticación mediante localStorage
    const userSession = localStorage.getItem('userSession');
    
    if (userSession) {
        try {
            const userData = JSON.parse(userSession);
            
            // Verificar que la sesión sea de un alumno
            if (userData.rolUser !== 'alumno') {
                alert('No tienes permiso para acceder a esta sección.');
                window.location.href = '/public/auth/login.html';
                return;
            }
            
            currentUser = userData;
            
            // Actualizar nombre de usuario en la interfaz
            document.getElementById('nombre-usuario').textContent = userData.nombre || userData.usuario;
            
            // Evento de cierre de sesión
            document.getElementById('btn-cerrar-sesion').addEventListener('click', () => {
                localStorage.removeItem('userSession');
                window.location.href = '/public/auth/login.html';
            });
            
            try {
                // Verificar si los módulos anteriores fueron completados y si el módulo es aplicable
                const verificacionPrevia = await verificarModulosAnteriores();
                
                if (!verificacionPrevia.modulosCompletados) {
                    alert('Debes completar los módulos anteriores antes de continuar. Serás redirigido.');
                    window.location.href = '/public/alumnos/dashboard.html';
                    return;
                }
                
                moduloAplicable = verificacionPrevia.moduloAplicable;
                
                // Si no aplica el módulo, redirigir al dashboard
                if (!moduloAplicable) {
                    alert('Este módulo solo aplica para egresados que trabajan. Serás redirigido al dashboard.');
                    window.location.href = '/public/alumnos/dashboard.html';
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
                console.error('Error al inicializar el módulo 5:', error);
                mostrarError('Error al cargar el formulario. Por favor, recarga la página.');
            }
        } catch (error) {
            console.error('Error al procesar la sesión:', error);
            localStorage.removeItem('userSession');
            window.location.href = '/public/auth/login.html';
        }
    } else {
        // Usuario no autenticado, redirigir al login
        alert('Debes iniciar sesión para acceder a esta sección.');
        window.location.href = '/public/auth/login.html';
    }
});

/**
 * Verifica si los módulos anteriores han sido completados y si aplica el módulo 5
 * @returns {Promise<Object>} - Objeto con estado de módulos y si aplica el módulo
 */
async function verificarModulosAnteriores() {
    try {
        // 1. Obtener encuesta activa
        const fechaActual = new Date();
        
        const encuestasSnapshot = await firebase.firestore().collection('encuestas').get();
        
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
            throw new Error('No hay encuestas activas en este momento.');
        }
        
        encuestaActual = encuestasEnRango[0];
        // El ID ya está incluido en el objeto encuesta
        
        console.log('Verificando si el usuario ha completado los módulos anteriores...');
        console.log('ID Usuario:', currentUser.id);
        console.log('ID Encuesta:', encuestaActual.id);
        
        // 2. Verificar si el usuario completó los módulos anteriores usando la nueva estructura
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
            
            // Verificar si existen los módulos 1, 2, 3 y 4 (para los que trabajan) y están completados
            const modulo1Completado = datosEncuesta.modulo1 && datosEncuesta.modulo1.completado === true;
            const modulo2Completado = datosEncuesta.modulo2 && datosEncuesta.modulo2.completado === true;
            const modulo3Completado = datosEncuesta.modulo3 && datosEncuesta.modulo3.completado === true;
            
            console.log('Módulo 1 completado:', modulo1Completado);
            console.log('Módulo 2 completado:', modulo2Completado);
            console.log('Módulo 3 completado:', modulo3Completado);
            
            // Verificar si el usuario trabaja o estudia y trabaja (módulo 3)
            let moduloAplicable = false;
            
            if (modulo3Completado && datosEncuesta.modulo3.datos) {
                const actividadActual = datosEncuesta.modulo3.datos.actividad_actual;
                moduloAplicable = actividadActual === 'trabaja' || actividadActual === 'trabaja_estudia';
                console.log('Actividad actual del usuario:', actividadActual);
                console.log('Módulo de desempeño profesional aplicable:', moduloAplicable);
                
                // Si el usuario trabaja, también debe haber completado el módulo 4
                if (moduloAplicable) {
                    const modulo4Completado = datosEncuesta.modulo4 && datosEncuesta.modulo4.completado === true;
                    console.log('Módulo 4 completado:', modulo4Completado);
                    
                    return {
                        modulosCompletados: modulo1Completado && modulo2Completado && modulo3Completado && modulo4Completado,
                        moduloAplicable: moduloAplicable
                    };
                }
            }
            
            return {
                modulosCompletados: modulo1Completado && modulo2Completado && modulo3Completado,
                moduloAplicable: moduloAplicable
            };
        }
        
        console.log('No se encontró historial de esta encuesta para el usuario');
        return {
            modulosCompletados: false,
            moduloAplicable: false
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
            
            // Verificar si existe el módulo 5 y está completado
            moduloCompletado = datosEncuesta.modulo5 && datosEncuesta.modulo5.completado === true;
            
            // Si hay respuestas anteriores, cargarlas
            if (moduloCompletado && datosEncuesta.modulo5.datos) {
                respuestasAnteriores = datosEncuesta.modulo5.datos;
                
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
    
    // Eficiencia
    if (respuestasAnteriores.eficiencia) {
        document.querySelector(`input[name="eficiencia"][value="${respuestasAnteriores.eficiencia}"]`).checked = true;
    }
    
    // Formación académica
    if (respuestasAnteriores.formacionAcademica) {
        document.querySelector(`input[name="formacion"][value="${respuestasAnteriores.formacionAcademica}"]`).checked = true;
    }
    
    // Utilidad de residencias
    if (respuestasAnteriores.utilidadResidencias) {
        document.querySelector(`input[name="residencias"][value="${respuestasAnteriores.utilidadResidencias}"]`).checked = true;
    }
    
    // Aspectos de valoración
    if (respuestasAnteriores.aspectos) {
        if (respuestasAnteriores.aspectos.areaEstudio) {
            document.querySelector(`input[name="area_estudio"][value="${respuestasAnteriores.aspectos.areaEstudio}"]`).checked = true;
        }
        
        if (respuestasAnteriores.aspectos.titulacion) {
            document.querySelector(`input[name="titulacion"][value="${respuestasAnteriores.aspectos.titulacion}"]`).checked = true;
        }
        
        if (respuestasAnteriores.aspectos.experienciaPrevia) {
            document.querySelector(`input[name="experiencia"][value="${respuestasAnteriores.aspectos.experienciaPrevia}"]`).checked = true;
        }
        
        if (respuestasAnteriores.aspectos.competenciaLaboral) {
            document.querySelector(`input[name="competencia"][value="${respuestasAnteriores.aspectos.competenciaLaboral}"]`).checked = true;
        }
        
        if (respuestasAnteriores.aspectos.posicionamientoInstitucion) {
            document.querySelector(`input[name="posicionamiento"][value="${respuestasAnteriores.aspectos.posicionamientoInstitucion}"]`).checked = true;
        }
        
        if (respuestasAnteriores.aspectos.conocimientoIdiomas) {
            document.querySelector(`input[name="idiomas"][value="${respuestasAnteriores.aspectos.conocimientoIdiomas}"]`).checked = true;
        }
        
        if (respuestasAnteriores.aspectos.recomendaciones) {
            document.querySelector(`input[name="recomendaciones"][value="${respuestasAnteriores.aspectos.recomendaciones}"]`).checked = true;
        }
        
        if (respuestasAnteriores.aspectos.personalidad) {
            document.querySelector(`input[name="personalidad"][value="${respuestasAnteriores.aspectos.personalidad}"]`).checked = true;
        }
        
        if (respuestasAnteriores.aspectos.capacidadLiderazgo) {
            document.querySelector(`input[name="liderazgo"][value="${respuestasAnteriores.aspectos.capacidadLiderazgo}"]`).checked = true;
        }
        
        if (respuestasAnteriores.aspectos.otrosFactor) {
            document.getElementById('otros_factores').value = respuestasAnteriores.aspectos.otrosFactor;
        }
        
        if (respuestasAnteriores.aspectos.otrosValoracion) {
            document.querySelector(`input[name="otros"][value="${respuestasAnteriores.aspectos.otrosValoracion}"]`).checked = true;
        }
    }
}

/**
 * Configura los eventos del formulario
 */
function configurarEventos() {
    // Evento para activar/desactivar valoración de "Otros" cuando se escriba en el campo
    document.getElementById('otros_factores').addEventListener('input', function() {
        const otrosRadios = document.querySelectorAll('input[name="otros"]');
        const hayContenido = this.value.trim().length > 0;
        
        otrosRadios.forEach(radio => {
            radio.disabled = !hayContenido;
            if (!hayContenido) {
                radio.checked = false;
            }
        });
    });
    
    // Evento de envío del formulario
    btnGuardar.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Si el módulo ya está completado, solo navegar al siguiente módulo
        if (moduloCompletado) {
            window.location.href = '/public/alumnos/modulos/modulo6.html';
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
            const datosModulo5 = window.crearModulo5DesdeFormulario(formulario);
            
            // Guardar respuestas en Firestore
            await guardarRespuestas(datosModulo5);
            
            alert('Información guardada correctamente. Serás redirigido al siguiente módulo.');
            
            // Redirigir al siguiente módulo
            window.location.href = '/public/alumnos/modulos/modulo6.html';
        } catch (error) {
            console.error('Error al guardar el formulario:', error);
            mostrarError('Error al guardar la información. Por favor, intenta nuevamente.');
            loadingOverlay.style.display = 'none';
        }
    });
    
    // Si el módulo ya está completado, habilitar el modo solo visualización
    if (moduloCompletado) {
        habilitarModoSoloVisualizacion();
    }
}

/**
 * Valida el formulario antes de enviar
 * @returns {Object} Resultado de la validación {valido: boolean, errores: []}
 */
function validarFormulario() {
    // Reiniciar errores
    errorContainer.innerHTML = '';
    errorContainer.style.display = 'none';
    
    const errores = [];
    
    // Verificar campos obligatorios
    if (!getRadioValue('eficiencia')) {
        errores.push('Debe seleccionar el nivel de eficiencia para realizar actividades laborales');
    }
    
    if (!getRadioValue('formacion')) {
        errores.push('Debe calificar su formación académica con respecto a su desempeño laboral');
    }
    
    if (!getRadioValue('residencias')) {
        errores.push('Debe calificar la utilidad de las residencias/prácticas profesionales');
    }
    
    // Verificar valoraciones
    if (!getRadioValue('area_estudio')) {
        errores.push('Debe valorar el área o campo de estudio');
    }
    
    if (!getRadioValue('titulacion')) {
        errores.push('Debe valorar la titulación');
    }
    
    if (!getRadioValue('experiencia')) {
        errores.push('Debe valorar la experiencia laboral/práctica');
    }
    
    if (!getRadioValue('competencia')) {
        errores.push('Debe valorar la competencia laboral');
    }
    
    if (!getRadioValue('posicionamiento')) {
        errores.push('Debe valorar el posicionamiento de la institución');
    }
    
    if (!getRadioValue('idiomas')) {
        errores.push('Debe valorar el conocimiento de idiomas extranjeros');
    }
    
    if (!getRadioValue('recomendaciones')) {
        errores.push('Debe valorar las recomendaciones/referencias');
    }
    
    if (!getRadioValue('personalidad')) {
        errores.push('Debe valorar la personalidad/actitudes');
    }
    
    if (!getRadioValue('liderazgo')) {
        errores.push('Debe valorar la capacidad de liderazgo');
    }
    
    // Si hay otros factores especificados, verificar que se haya seleccionado una valoración
    const otrosFactor = document.getElementById('otros_factores').value.trim();
    if (otrosFactor.length > 0 && !getRadioValue('otros')) {
        errores.push('Debe valorar el factor adicional que ha especificado');
    }
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

/**
 * Obtiene el valor de un grupo de radio buttons
 * @param {string} name - Nombre del grupo de radio buttons
 * @returns {string|null} - Valor seleccionado o null si ninguno está seleccionado
 */
function getRadioValue(name) {
    const radioButtons = document.getElementsByName(name);
    for (let i = 0; i < radioButtons.length; i++) {
        if (radioButtons[i].checked) {
            return radioButtons[i].value;
        }
    }
    return null;
}

/**
 * Guarda las respuestas del módulo en Firestore
 * @param {Object} datos - Datos del módulo 5
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
            // La encuesta ya existe, actualizamos solo el módulo 5
            await encuestaRef.update({
                'modulo5': {
                    datos: datos,
                    completado: true,
                    fechaCompletado: new Date()
                },
                encuestaCompletada: true,
                ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Crear nuevo documento para esta encuesta
            await encuestaRef.set({
                encuestaId: encuestaActual.id,
                titulo: encuestaActual.titulo || 'Encuesta sin título',
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp(),
                encuestaCompletada: true,
                modulo5: {
                    datos: datos,
                    completado: true,
                    fechaCompletado: new Date()
                }
            });
        }
        
        // Actualizar variable global
        moduloCompletado = true;
        
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
    
    // Mostrar mensaje informativo en consola
    console.log('Formulario en modo solo visualización - todos los campos bloqueados');
}
