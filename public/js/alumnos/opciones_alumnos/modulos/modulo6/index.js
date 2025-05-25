/**
 * Módulo 6: Expectativas y Participación Social - Controlador principal
 * 
 * Este archivo maneja la lógica principal del módulo 6 de la encuesta,
 * incluyendo la carga de datos, inicialización del formulario,
 * validación y almacenamiento de datos.
 */

// Referencias a elementos del DOM
const formulario = document.getElementById('form-modulo6');
const loadingModule = document.getElementById('loading-module');
const loadingOverlay = document.getElementById('loading-overlay');
const errorContainer = document.getElementById('error-container');
const btnGuardar = document.getElementById('btn-guardar-modulo6');

// Campos condicionales
const cursosField = document.getElementById('cursos_field');
const posgradoField = document.getElementById('posgrado_field');
const organizacionesField = document.getElementById('organizaciones_field');
const organismosField = document.getElementById('organismos_field');

// Variables globales
let currentUser = null;
let encuestaActual = null;
let moduloCompletado = false;
let respuestasAnteriores = null;

/**
 * Inicializa el módulo cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando Módulo 6: Expectativas y Participación Social');
    
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
                    // Redirigir según la situación
                    if (verificacionPrevia.usuarioTrabaja) {
                        // Si trabaja, debe completar todos los módulos anteriores
                        // Obtener información sobre qué módulos faltan
                        const historialEncuestaDoc = await firebase.firestore()
                            .collection('usuario')
                            .doc(currentUser.id)
                            .collection('historial_encuestas')
                            .doc(encuestaActual.id)
                            .get();
                        
                        if (historialEncuestaDoc.exists) {
                            const datosEncuesta = historialEncuestaDoc.data();
                            
                            // Verificar qué módulo falta completar
                            if (!datosEncuesta.modulo1 || !datosEncuesta.modulo1.completado) {
                                alert('Debes completar el módulo 1 antes de continuar. Serás redirigido.');
                                window.location.href = '../../encuestas.html';
                            } else if (!datosEncuesta.modulo2 || !datosEncuesta.modulo2.completado) {
                                alert('Debes completar el módulo 2 antes de continuar. Serás redirigido.');
                                window.location.href = '../../encuestas.html';
                            } else if (!datosEncuesta.modulo3 || !datosEncuesta.modulo3.completado) {
                                alert('Debes completar el módulo 3 antes de continuar. Serás redirigido.');
                                window.location.href = '../../encuestas.html';
                            } else if (!datosEncuesta.modulo4 || !datosEncuesta.modulo4.completado) {
                                alert('Debes completar el módulo 4 antes de continuar. Serás redirigido.');
                                window.location.href = 'modulo4.html';
                            } else if (!datosEncuesta.modulo5 || !datosEncuesta.modulo5.completado) {
                                alert('Debes completar el módulo 5 antes de continuar. Serás redirigido.');
                                window.location.href = 'modulo5.html';
                            }
                        } else {
                            alert('No se encontró historial de encuestas. Serás redirigido.');
                            window.location.href = '../../encuestas.html';
                        }
                    } else {
                        // Si no trabaja, verificar si completó al menos los módulos 1, 2 y 3
                        const historialEncuestaDoc = await firebase.firestore()
                            .collection('usuario')
                            .doc(currentUser.id)
                            .collection('historial_encuestas')
                            .doc(encuestaActual.id)
                            .get();
                        
                        if (historialEncuestaDoc.exists) {
                            const datosEncuesta = historialEncuestaDoc.data();
                            const modulo1Completado = datosEncuesta.modulo1 && datosEncuesta.modulo1.completado === true;
                            const modulo2Completado = datosEncuesta.modulo2 && datosEncuesta.modulo2.completado === true;
                            const modulo3Completado = datosEncuesta.modulo3 && datosEncuesta.modulo3.completado === true;
                            
                            // Verificar qué módulo falta completar
                            if (!modulo1Completado) {
                                alert('Debes completar el módulo 1 antes de continuar. Serás redirigido.');
                                window.location.href = '../../encuestas.html';
                            } else if (!modulo2Completado) {
                                alert('Debes completar el módulo 2 antes de continuar. Serás redirigido.');
                                window.location.href = '../../encuestas.html';
                            } else if (!modulo3Completado) {
                                alert('Debes completar el módulo 3 antes de continuar. Serás redirigido.');
                                window.location.href = '../../encuestas.html';
                            } else {
                                // Esta condición no debería ocurrir porque verificacionPrevia.modulosCompletados sería true
                                console.log('Estado inesperado: usuario no trabaja, módulos 1-3 completos, pero verificacionPrevia.modulosCompletados es false');
                            }
                        } else {
                            alert('No se encontró historial de encuestas. Serás redirigido.');
                            window.location.href = '../../encuestas.html';
                        }
                    }
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
                console.error('Error al inicializar el módulo 6:', error);
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
 * @returns {Promise<Object>} - Objeto con estado de módulos
 */
async function verificarModulosAnteriores() {
    try {
        // 1. Obtener encuesta activa
        const fechaActual = new Date();
        
        const encuestasSnapshot = await firebase.firestore().collection('encuestas')
            .where('activa', '==', true)
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
            throw new Error('No hay encuestas activas en este momento.');
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
            
            // Verificar si el usuario completó los módulos 1, 2, y 3
            const modulo1Completado = datosEncuesta.modulo1 && datosEncuesta.modulo1.completado === true;
            const modulo2Completado = datosEncuesta.modulo2 && datosEncuesta.modulo2.completado === true;
            const modulo3Completado = datosEncuesta.modulo3 && datosEncuesta.modulo3.completado === true;
            
            // Verificar si el usuario trabaja (para determinar si módulos 4 y 5 son obligatorios)
            const usuarioTrabaja = datosEncuesta.modulo3 && 
                datosEncuesta.modulo3.datos && 
                (datosEncuesta.modulo3.datos.actividad_actual === 'trabaja' || 
                 datosEncuesta.modulo3.datos.actividad_actual === 'trabaja_estudia');
            
            console.log('Estado de módulos:');
            console.log('Módulo 1 completado:', modulo1Completado);
            console.log('Módulo 2 completado:', modulo2Completado);
            console.log('Módulo 3 completado:', modulo3Completado);
            console.log('Usuario trabaja:', usuarioTrabaja);
            
            // Si el usuario trabaja, verificar también módulos 4 y 5
            if (usuarioTrabaja) {
                const modulo4Completado = datosEncuesta.modulo4 && datosEncuesta.modulo4.completado === true;
                const modulo5Completado = datosEncuesta.modulo5 && datosEncuesta.modulo5.completado === true;
                
                console.log('Módulo 4 completado:', modulo4Completado);
                console.log('Módulo 5 completado:', modulo5Completado);
                
                return {
                    modulosCompletados: modulo1Completado && modulo2Completado && modulo3Completado && 
                                        modulo4Completado && modulo5Completado,
                    usuarioTrabaja: usuarioTrabaja
                };
            } else {
                // Si el usuario NO trabaja, solo verificar módulos 1, 2 y 3
                return {
                    modulosCompletados: modulo1Completado && modulo2Completado && modulo3Completado,
                    usuarioTrabaja: usuarioTrabaja
                };
            }
        }
        
        // Si no existe historial, ningún módulo está completo
        return {
            modulosCompletados: false,
            usuarioTrabaja: false
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
            
            // Verificar si existe el módulo 6 y está completado
            moduloCompletado = datosEncuesta.modulo6 && datosEncuesta.modulo6.completado === true;
            
            // Si hay respuestas anteriores, cargarlas
            if (moduloCompletado && datosEncuesta.modulo6.datos) {
                respuestasAnteriores = datosEncuesta.modulo6.datos;
                
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
    
    // Sección de Expectativas
    if (respuestasAnteriores.expectativas) {
        // Cursos de actualización
        if (respuestasAnteriores.expectativas.cursos_actualizacion) {
            document.querySelector(`input[name="cursos_actualizacion"][value="${respuestasAnteriores.expectativas.cursos_actualizacion}"]`).checked = true;
            
            if (respuestasAnteriores.expectativas.cursos_actualizacion === 'si') {
                cursosField.classList.add('visible');
                document.getElementById('cuales_cursos').value = respuestasAnteriores.expectativas.cuales_cursos || '';
            }
        }
        
        // Posgrado
        if (respuestasAnteriores.expectativas.tomar_posgrado) {
            document.querySelector(`input[name="tomar_posgrado"][value="${respuestasAnteriores.expectativas.tomar_posgrado}"]`).checked = true;
            
            if (respuestasAnteriores.expectativas.tomar_posgrado === 'si') {
                posgradoField.classList.add('visible');
                document.getElementById('cual_posgrado').value = respuestasAnteriores.expectativas.cual_posgrado || '';
            }
        }
    }
    
    // Sección de Participación Social
    if (respuestasAnteriores.participacion) {
        // Organizaciones sociales
        if (respuestasAnteriores.participacion.organizaciones_sociales) {
            document.querySelector(`input[name="organizaciones_sociales"][value="${respuestasAnteriores.participacion.organizaciones_sociales}"]`).checked = true;
            
            if (respuestasAnteriores.participacion.organizaciones_sociales === 'si') {
                organizacionesField.classList.add('visible');
                document.getElementById('cuales_organizaciones').value = respuestasAnteriores.participacion.cuales_organizaciones || '';
            }
        }
        
        // Organismos profesionales
        if (respuestasAnteriores.participacion.organismos_profesionales) {
            document.querySelector(`input[name="organismos_profesionales"][value="${respuestasAnteriores.participacion.organismos_profesionales}"]`).checked = true;
            
            if (respuestasAnteriores.participacion.organismos_profesionales === 'si') {
                organismosField.classList.add('visible');
                document.getElementById('cual_organismo').value = respuestasAnteriores.participacion.cual_organismo || '';
            }
        }
        
        // Asociación de egresados
        if (respuestasAnteriores.participacion.asociacion_egresados) {
            document.querySelector(`input[name="asociacion_egresados"][value="${respuestasAnteriores.participacion.asociacion_egresados}"]`).checked = true;
        }
    }
}

/**
 * Configura los eventos del formulario
 */
function configurarEventos() {
    // Eventos para mostrar/ocultar campos condicionales
    
    // 1. Cursos de actualización
    document.querySelectorAll('input[name="cursos_actualizacion"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'si' && this.checked) {
                cursosField.classList.add('visible');
            } else {
                cursosField.classList.remove('visible');
                document.getElementById('cuales_cursos').value = '';
            }
        });
    });
    
    // 2. Posgrado
    document.querySelectorAll('input[name="tomar_posgrado"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'si' && this.checked) {
                posgradoField.classList.add('visible');
            } else {
                posgradoField.classList.remove('visible');
                document.getElementById('cual_posgrado').value = '';
            }
        });
    });
    
    // 3. Organizaciones sociales
    document.querySelectorAll('input[name="organizaciones_sociales"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'si' && this.checked) {
                organizacionesField.classList.add('visible');
            } else {
                organizacionesField.classList.remove('visible');
                document.getElementById('cuales_organizaciones').value = '';
            }
        });
    });
    
    // 4. Organismos profesionales
    document.querySelectorAll('input[name="organismos_profesionales"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'si' && this.checked) {
                organismosField.classList.add('visible');
            } else {
                organismosField.classList.remove('visible');
                document.getElementById('cual_organismo').value = '';
            }
        });
    });
    
    // Evento de envío del formulario
    btnGuardar.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Si el módulo ya está completado, solo navegar al siguiente módulo
        if (moduloCompletado) {
            window.location.href = 'modulo7.html';
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
            const datosModulo6 = window.crearModulo6DesdeFormulario(formulario);
            
            // Guardar respuestas en Firestore
            await guardarRespuestas(datosModulo6);
            
            alert('Información guardada correctamente. Serás redirigido al siguiente módulo.');
            
            // Redirigir al siguiente módulo
            window.location.href = 'modulo7.html';
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
    errorContainer.style.display = 'none';
    
    const errores = [];
    
    // Verificar sección de Expectativas
    if (!getRadioValue('cursos_actualizacion')) {
        errores.push('Debe indicar si le gustaría tomar cursos de actualización');
    } else if (getRadioValue('cursos_actualizacion') === 'si' && !document.getElementById('cuales_cursos').value.trim()) {
        errores.push('Debe especificar cuáles cursos le gustaría tomar');
    }
    
    if (!getRadioValue('tomar_posgrado')) {
        errores.push('Debe indicar si le gustaría tomar algún posgrado');
    } else if (getRadioValue('tomar_posgrado') === 'si' && !document.getElementById('cual_posgrado').value.trim()) {
        errores.push('Debe especificar cuál posgrado le gustaría tomar');
    }
    
    // Verificar sección de Participación Social
    if (!getRadioValue('organizaciones_sociales')) {
        errores.push('Debe indicar si pertenece a organizaciones sociales');
    } else if (getRadioValue('organizaciones_sociales') === 'si' && !document.getElementById('cuales_organizaciones').value.trim()) {
        errores.push('Debe especificar a cuáles organizaciones sociales pertenece');
    }
    
    if (!getRadioValue('organismos_profesionales')) {
        errores.push('Debe indicar si pertenece a organismos de profesionistas');
    } else if (getRadioValue('organismos_profesionales') === 'si' && !document.getElementById('cual_organismo').value.trim()) {
        errores.push('Debe especificar a cuál organismo de profesionistas pertenece');
    }
    
    if (!getRadioValue('asociacion_egresados')) {
        errores.push('Debe indicar si pertenece a la asociación de egresados');
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
 * @param {Object} datos - Datos del módulo 6
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
            // La encuesta ya existe, actualizamos solo el módulo 6
            await encuestaRef.update({
                'modulo6': {
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
                modulo6: {
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
