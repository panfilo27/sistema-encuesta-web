/**
 * Módulo 4: Datos de Empleo - Controlador principal
 * 
 * Este archivo maneja la lógica principal del módulo 4 de la encuesta,
 * incluyendo la carga de datos, inicialización del formulario,
 * validación y almacenamiento de datos.
 */

// Referencia al formulario
const formulario = document.getElementById('form-modulo4');
const loadingModule = document.getElementById('loading-module');
const loadingOverlay = document.getElementById('loading-overlay');
const errorContainer = document.getElementById('error-container');
const btnGuardar = document.getElementById('btn-guardar-modulo4');

// Variables globales
let currentUser = null;
let encuestaActual = null;
let moduloCompletado = false;
let respuestasAnteriores = null;
let moduloEmpleoAplicable = false;

/**
 * Inicializa el módulo cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando Módulo 4: Datos de Empleo');
    
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
                // Verificar si los módulos anteriores fueron completados
                const verificacionPrevia = await verificarModulosAnteriores();
                
                if (!verificacionPrevia.modulosCompletados) {
                    alert('Debes completar los módulos anteriores antes de continuar. Serás redirigido.');
                    window.location.href = '../../encuestas.html';
                    return;
                }
                
                moduloEmpleoAplicable = verificacionPrevia.empleoAplicable;
                
                // Si no aplica el módulo de empleo, redirigir al módulo 6
                if (!moduloEmpleoAplicable) {
                    alert('Este módulo solo aplica para egresados que trabajan. Serás redirigido al módulo 6.');
                    window.location.href = 'modulo6.html';
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
                console.error('Error al inicializar el módulo 4:', error);
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
 * Verifica si los módulos anteriores han sido completados y si aplica el módulo de empleo
 * @returns {Promise<Object>} - Objeto con estado de módulos y si aplica el módulo de empleo
 */
async function verificarModulosAnteriores() {
    try {
        // 1. Obtener encuesta activa
        // Como no podemos usar operadores de desigualdad en dos campos diferentes,
        // primero obtenemos las encuestas activas y luego filtramos manualmente
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
            
            // Verificar si existen los módulos 1, 2 y 3 y están completados
            const modulo1Completado = datosEncuesta.modulo1 && datosEncuesta.modulo1.completado === true;
            const modulo2Completado = datosEncuesta.modulo2 && datosEncuesta.modulo2.completado === true;
            const modulo3Completado = datosEncuesta.modulo3 && datosEncuesta.modulo3.completado === true;
            
            console.log('Módulo 1 completado:', modulo1Completado);
            console.log('Módulo 2 completado:', modulo2Completado);
            console.log('Módulo 3 completado:', modulo3Completado);
            
            // Verificar si el usuario trabaja o estudia y trabaja (módulo 3)
            let empleoAplicable = false;
            
            if (modulo3Completado && datosEncuesta.modulo3.datos) {
                const actividadActual = datosEncuesta.modulo3.datos.actividad_actual;
                empleoAplicable = actividadActual === 'trabaja' || actividadActual === 'trabaja_estudia';
                console.log('Actividad actual del usuario:', actividadActual);
                console.log('Módulo de empleo aplicable:', empleoAplicable);
            }
            
            return {
                modulosCompletados: modulo1Completado && modulo2Completado && modulo3Completado,
                empleoAplicable: empleoAplicable
            };
        }
        
        console.log('No se encontró historial de esta encuesta para el usuario');
        return {
            modulosCompletados: false,
            empleoAplicable: false
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
        // Verificar si el usuario ya completó este módulo para esta encuesta usando la nueva estructura
        const historialEncuestaDoc = await firebase.firestore()
            .collection('usuario')
            .doc(currentUser.id)
            .collection('historial_encuestas')
            .doc(encuestaActual.id)
            .get();
        
        if (historialEncuestaDoc.exists) {
            const datosEncuesta = historialEncuestaDoc.data();
            
            // Verificar si existe el módulo 4 y está completado
            moduloCompletado = datosEncuesta.modulo4 && datosEncuesta.modulo4.completado === true;
            
            // Si hay respuestas anteriores, cargarlas
            if (moduloCompletado && datosEncuesta.modulo4.datos) {
                respuestasAnteriores = datosEncuesta.modulo4.datos;
                
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
    
    // Tiempo para obtener empleo
    if (respuestasAnteriores.tiempo_primer_empleo) {
        document.querySelector(`input[name="tiempo_primer_empleo"][value="${respuestasAnteriores.tiempo_primer_empleo}"]`).checked = true;
    }
    
    // Medio para obtener empleo
    if (respuestasAnteriores.medio_obtener_empleo) {
        document.querySelector(`input[name="medio_obtener_empleo"][value="${respuestasAnteriores.medio_obtener_empleo}"]`).checked = true;
        if (respuestasAnteriores.medio_obtener_empleo === 'otro' && respuestasAnteriores.medio_otro) {
            document.getElementById('medio_otro_texto').value = respuestasAnteriores.medio_otro;
        }
    }
    
    // Requisitos de contratación
    if (Array.isArray(respuestasAnteriores.requisitos_contratacion)) {
        respuestasAnteriores.requisitos_contratacion.forEach(requisito => {
            switch (requisito) {
                case 'competencias_laborales':
                    document.getElementById('requisito_competencias').checked = true;
                    break;
                case 'titulo_profesional':
                    document.getElementById('requisito_titulo').checked = true;
                    break;
                case 'examen_seleccion':
                    document.getElementById('requisito_examen').checked = true;
                    break;
                case 'idioma_extranjero':
                    document.getElementById('requisito_idioma').checked = true;
                    break;
                case 'actitudes_habilidades':
                    document.getElementById('requisito_actitudes').checked = true;
                    break;
                case 'ninguno':
                    document.getElementById('requisito_ninguno').checked = true;
                    break;
                case 'otro':
                    document.getElementById('requisito_otro').checked = true;
                    if (respuestasAnteriores.requisito_otro) {
                        document.getElementById('requisito_otro_texto').value = respuestasAnteriores.requisito_otro;
                    }
                    break;
            }
        });
    }
    
    // Idioma
    if (respuestasAnteriores.idioma) {
        document.querySelector(`input[name="idioma"][value="${respuestasAnteriores.idioma}"]`).checked = true;
        if (respuestasAnteriores.idioma === 'otro' && respuestasAnteriores.idioma_otro) {
            document.getElementById('idioma_otro_texto').value = respuestasAnteriores.idioma_otro;
        }
    }
    
    // Habilidades del idioma
    if (respuestasAnteriores.habilidad_hablar !== undefined) {
        document.getElementById('habilidad_hablar').value = respuestasAnteriores.habilidad_hablar;
    }
    if (respuestasAnteriores.habilidad_escribir !== undefined) {
        document.getElementById('habilidad_escribir').value = respuestasAnteriores.habilidad_escribir;
    }
    if (respuestasAnteriores.habilidad_leer !== undefined) {
        document.getElementById('habilidad_leer').value = respuestasAnteriores.habilidad_leer;
    }
    if (respuestasAnteriores.habilidad_escuchar !== undefined) {
        document.getElementById('habilidad_escuchar').value = respuestasAnteriores.habilidad_escuchar;
    }
    
    // Antigüedad
    if (respuestasAnteriores.antiguedad) {
        document.querySelector(`input[name="antiguedad"][value="${respuestasAnteriores.antiguedad}"]`).checked = true;
    }
    if (respuestasAnteriores.anio_ingreso) {
        document.getElementById('anio_ingreso').value = respuestasAnteriores.anio_ingreso;
    }
    
    // Ingreso
    if (respuestasAnteriores.ingreso) {
        document.querySelector(`input[name="ingreso"][value="${respuestasAnteriores.ingreso}"]`).checked = true;
    }
    
    // Nivel jerárquico
    if (respuestasAnteriores.nivel_jerarquico) {
        document.querySelector(`input[name="nivel_jerarquico"][value="${respuestasAnteriores.nivel_jerarquico}"]`).checked = true;
    }
    
    // Condición de trabajo
    if (respuestasAnteriores.condicion_trabajo) {
        document.querySelector(`input[name="condicion_trabajo"][value="${respuestasAnteriores.condicion_trabajo}"]`).checked = true;
        if (respuestasAnteriores.condicion_trabajo === 'otro' && respuestasAnteriores.condicion_otro) {
            document.getElementById('condicion_otro_texto').value = respuestasAnteriores.condicion_otro;
        }
    }
}

/**
 * Configura los eventos del formulario
 */
function configurarEventos() {
    // Evento para mostrar/ocultar campo de otro medio de obtener empleo
    document.querySelectorAll('input[name="medio_obtener_empleo"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const medioOtroTexto = document.getElementById('medio_otro_texto');
            medioOtroTexto.disabled = this.value !== 'otro';
            if (this.value !== 'otro') {
                medioOtroTexto.value = '';
            }
        });
    });
    
    // Evento para mostrar/ocultar campo de otro requisito
    document.getElementById('requisito_otro').addEventListener('change', function() {
        const requisitoOtroTexto = document.getElementById('requisito_otro_texto');
        requisitoOtroTexto.disabled = !this.checked;
        if (!this.checked) {
            requisitoOtroTexto.value = '';
        }
    });
    
    // Evento para mostrar/ocultar campo de otro idioma
    document.querySelectorAll('input[name="idioma"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const idiomaOtroTexto = document.getElementById('idioma_otro_texto');
            idiomaOtroTexto.disabled = this.value !== 'otro';
            if (this.value !== 'otro') {
                idiomaOtroTexto.value = '';
            }
        });
    });

    // Evento para mostrar/ocultar campo de otra condición de trabajo
    document.querySelectorAll('input[name="condicion_trabajo"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const condicionOtroTexto = document.getElementById('condicion_otro_texto');
            condicionOtroTexto.disabled = this.value !== 'otro';
            if (this.value !== 'otro') {
                condicionOtroTexto.value = '';
            }
        });
    });

    // Evento de envío del formulario
    btnGuardar.addEventListener('click', async (e) => {
        e.preventDefault();

        // Si el módulo ya está completado, solo navegar al siguiente módulo
        if (moduloCompletado) {
            window.location.href = 'modulo5.html';
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
            const datosModulo4 = window.crearModulo4DesdeFormulario(formulario);

            // Guardar respuestas en Firestore
            await guardarRespuestas(datosModulo4);

            alert('Información guardada correctamente. Serás redirigido al siguiente módulo.');

            // Redirigir al siguiente módulo
            window.location.href = 'modulo5.html';
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
    if (!getRadioValue('tiempo_primer_empleo')) {
        errores.push('Debe seleccionar el tiempo transcurrido para obtener el primer empleo');
    }
    
    if (!getRadioValue('medio_obtener_empleo')) {
        errores.push('Debe seleccionar el medio para obtener el empleo');
    } else if (getRadioValue('medio_obtener_empleo') === 'otro' && !document.getElementById('medio_otro_texto').value.trim()) {
        errores.push('Debe especificar cuál fue el otro medio para obtener el empleo');
    }
    
    // Verificar que al menos un requisito esté seleccionado
    const algunRequisitoSeleccionado = document.getElementById('requisito_competencias').checked ||
                                     document.getElementById('requisito_titulo').checked ||
                                     document.getElementById('requisito_examen').checked ||
                                     document.getElementById('requisito_idioma').checked ||
                                     document.getElementById('requisito_actitudes').checked ||
                                     document.getElementById('requisito_ninguno').checked ||
                                     document.getElementById('requisito_otro').checked;
    
    if (!algunRequisitoSeleccionado) {
        errores.push('Debe seleccionar al menos un requisito de contratación');
    } else if (document.getElementById('requisito_otro').checked && !document.getElementById('requisito_otro_texto').value.trim()) {
        errores.push('Debe especificar cuál fue el otro requisito de contratación');
    }
    
    if (!getRadioValue('idioma')) {
        errores.push('Debe seleccionar el idioma que utiliza en su trabajo');
    } else if (getRadioValue('idioma') === 'otro' && !document.getElementById('idioma_otro_texto').value.trim()) {
        errores.push('Debe especificar cuál es el otro idioma que utiliza');
    }
    
    // Verificar que los porcentajes de habilidades sumen 100%
    const habilidadHablar = parseInt(document.getElementById('habilidad_hablar').value) || 0;
    const habilidadEscribir = parseInt(document.getElementById('habilidad_escribir').value) || 0;
    const habilidadLeer = parseInt(document.getElementById('habilidad_leer').value) || 0;
    const habilidadEscuchar = parseInt(document.getElementById('habilidad_escuchar').value) || 0;
    
    if (habilidadHablar < 0 || habilidadEscribir < 0 || habilidadLeer < 0 || habilidadEscuchar < 0) {
        errores.push('Los porcentajes de habilidades del idioma no pueden ser negativos');
    }
    
    const sumaHabilidades = habilidadHablar + habilidadEscribir + habilidadLeer + habilidadEscuchar;
    if (sumaHabilidades !== 100) {
        errores.push(`Los porcentajes de habilidades del idioma deben sumar 100%. Suma actual: ${sumaHabilidades}%`);
    }
    
    if (!getRadioValue('antiguedad')) {
        errores.push('Debe seleccionar la antigüedad en el empleo');
    }
    
    const anioIngreso = document.getElementById('anio_ingreso').value.trim();
    if (!anioIngreso) {
        errores.push('Debe ingresar el año de ingreso');
    } else {
        const anio = parseInt(anioIngreso);
        const anioActual = new Date().getFullYear();
        if (isNaN(anio) || anio < 1990 || anio > anioActual) {
            errores.push(`El año de ingreso debe estar entre 1990 y ${anioActual}`);
        }
    }
    
    if (!getRadioValue('ingreso')) {
        errores.push('Debe seleccionar el ingreso (salario mínimo mensual)');
    }
    
    if (!getRadioValue('nivel_jerarquico')) {
        errores.push('Debe seleccionar el nivel jerárquico en el trabajo');
    }
    
    if (!getRadioValue('condicion_trabajo')) {
        errores.push('Debe seleccionar la condición de trabajo');
    } else if (getRadioValue('condicion_trabajo') === 'otro' && !document.getElementById('condicion_otro_texto').value.trim()) {
        errores.push('Debe especificar cuál es la otra condición de trabajo');
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
 * @param {Object} datos - Datos del módulo 4
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
            // La encuesta ya existe, actualizamos solo el módulo 4
            await encuestaRef.update({
                'modulo4': {
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
                modulo4: {
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
