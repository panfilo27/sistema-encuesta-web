/**
 * Módulo 5.1: Desempeño Laboral - Encuesta de Química y Bioquímica
 * 
 * Este archivo maneja la lógica principal del módulo 5.1 de la encuesta especializada,
 * incluyendo la carga de datos, validación y almacenamiento de información sobre
 * el desempeño laboral del egresado.
 */

// Referencia al formulario
const formulario = document.getElementById('form-modulo5-1');
const loadingModule = document.getElementById('loading-module');
const loadingOverlay = document.getElementById('loading-overlay');
const errorContainer = document.getElementById('error-container');
const btnGuardar = document.getElementById('btn-guardar-modulo5-1');

// Referencias a secciones condicionales
const tipoInvestigacionContainer = document.getElementById('tipo_investigacion_container');
const detalleCertificacionesContainer = document.getElementById('detalle_certificaciones_container');
const detallePublicacionesContainer = document.getElementById('detalle_publicaciones_container');
const nombreAsociacionContainer = document.getElementById('nombre_asociacion_container');

// Referencias a mensajes de error específicos
const herramientasError = document.getElementById('herramientas-error');
const investigacionError = document.getElementById('investigacion-error');
const serviciosError = document.getElementById('servicios-error');
const lenguasError = document.getElementById('lenguas-error');
const documentosError = document.getElementById('documentos-error');

// Variables globales
let currentUser = null;
let encuestaActual = null;
let moduloCompletado = false;
let respuestasAnteriores = null;

/**
 * Inicializa el módulo cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando Módulo 5.1: Desempeño Laboral - Química y Bioquímica');
    
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
            
            // Verificar que el usuario sea de la carrera de Química o Bioquímica
            const userDoc = await firebase.firestore().collection('usuario').doc(userData.id).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.carrera !== 'Química' && userData.carrera !== 'Bioquímica') {
                    alert('Esta encuesta es exclusiva para estudiantes de Química y Bioquímica.');
                    window.location.href = '../../encuestas.html';
                    return;
                }
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
                    window.location.href = 'modulo4.1.html';
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
                        btnGuardar.textContent = 'Volver al inicio';
                    }
                }
                
                // Configurar eventos del formulario
                configurarEventos();
                
                // Mostrar formulario
                loadingModule.style.display = 'none';
                formulario.style.display = 'block';
            } catch (error) {
                console.error('Error al inicializar el módulo 5.1:', error);
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
            
            // Verificar si existen los módulos 1.1, 2.1, 3.1 y 4.1 y están completados
            const modulo1_1Completado = datosEncuesta.modulo1_1 && datosEncuesta.modulo1_1.completado === true;
            const modulo2_1Completado = datosEncuesta.modulo2_1 && datosEncuesta.modulo2_1.completado === true;
            const modulo3_1Completado = datosEncuesta.modulo3_1 && datosEncuesta.modulo3_1.completado === true;
            const modulo4_1Completado = datosEncuesta.modulo4_1 && datosEncuesta.modulo4_1.completado === true;
            
            console.log('Módulo 1.1 completado:', modulo1_1Completado);
            console.log('Módulo 2.1 completado:', modulo2_1Completado);
            console.log('Módulo 3.1 completado:', modulo3_1Completado);
            console.log('Módulo 4.1 completado:', modulo4_1Completado);
            
            return {
                modulosCompletados: modulo1_1Completado && modulo2_1Completado && modulo3_1Completado && modulo4_1Completado
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
            
            // Verificar si existe el módulo 5.1 y está completado
            moduloCompletado = datosEncuesta.modulo5_1 && datosEncuesta.modulo5_1.completado === true;
            
            // Si hay respuestas anteriores, cargarlas
            if (moduloCompletado && datosEncuesta.modulo5_1.datos) {
                respuestasAnteriores = datosEncuesta.modulo5_1.datos;
                
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
    
    // Herramientas utilizadas
    if (respuestasAnteriores.herramientas && Array.isArray(respuestasAnteriores.herramientas)) {
        respuestasAnteriores.herramientas.forEach(herramienta => {
            const checkboxHerramienta = document.querySelector(`input[name="herramientas"][value="${herramienta}"]`);
            if (checkboxHerramienta) checkboxHerramienta.checked = true;
        });
    }
    
    // Colaboración en investigación
    if (respuestasAnteriores.colabora_investigacion) {
        const radioColabora = document.querySelector(`input[name="colabora_investigacion"][value="${respuestasAnteriores.colabora_investigacion}"]`);
        if (radioColabora) {
            radioColabora.checked = true;
            
            // Mostrar campo condicional si colabora en investigación
            if (respuestasAnteriores.colabora_investigacion === 'si') {
                tipoInvestigacionContainer.style.display = 'block';
                
                // Marcar los tipos de investigación seleccionados
                if (respuestasAnteriores.tipo_investigacion && Array.isArray(respuestasAnteriores.tipo_investigacion)) {
                    respuestasAnteriores.tipo_investigacion.forEach(tipo => {
                        const checkboxTipo = document.querySelector(`input[name="tipo_investigacion"][value="${tipo}"]`);
                        if (checkboxTipo) checkboxTipo.checked = true;
                    });
                }
            }
        }
    }
    
    // Redes de colaboración
    if (respuestasAnteriores.redes_colaboracion) {
        const radioRedes = document.querySelector(`input[name="redes_colaboracion"][value="${respuestasAnteriores.redes_colaboracion}"]`);
        if (radioRedes) radioRedes.checked = true;
    }
    
    // Certificaciones vigentes
    if (respuestasAnteriores.certificaciones) {
        const radioCert = document.querySelector(`input[name="certificaciones"][value="${respuestasAnteriores.certificaciones}"]`);
        if (radioCert) {
            radioCert.checked = true;
            
            // Mostrar campo condicional si tiene certificaciones
            if (respuestasAnteriores.certificaciones === 'si') {
                detalleCertificacionesContainer.style.display = 'block';
                formulario.detalle_certificaciones.value = respuestasAnteriores.detalle_certificaciones || '';
            }
        }
    }
    
    // Servicios ofrecidos
    if (respuestasAnteriores.servicios && Array.isArray(respuestasAnteriores.servicios)) {
        respuestasAnteriores.servicios.forEach(servicio => {
            const checkboxServicio = document.querySelector(`input[name="servicios"][value="${servicio}"]`);
            if (checkboxServicio) checkboxServicio.checked = true;
        });
    }
    
    // Lenguas extranjeras
    if (respuestasAnteriores.lenguas && Array.isArray(respuestasAnteriores.lenguas)) {
        respuestasAnteriores.lenguas.forEach(lengua => {
            const checkboxLengua = document.querySelector(`input[name="lenguas"][value="${lengua}"]`);
            if (checkboxLengua) checkboxLengua.checked = true;
        });
    }
    
    // Publicaciones
    if (respuestasAnteriores.publicaciones) {
        const radioPub = document.querySelector(`input[name="publicaciones"][value="${respuestasAnteriores.publicaciones}"]`);
        if (radioPub) {
            radioPub.checked = true;
            
            // Mostrar campo condicional si ha publicado
            if (respuestasAnteriores.publicaciones === 'si') {
                detallePublicacionesContainer.style.display = 'block';
                formulario.detalle_publicaciones.value = respuestasAnteriores.detalle_publicaciones || '';
            }
        }
    }
    
    // Documentos en los que ha participado
    if (respuestasAnteriores.documentos && Array.isArray(respuestasAnteriores.documentos)) {
        respuestasAnteriores.documentos.forEach(documento => {
            const checkboxDocumento = document.querySelector(`input[name="documentos"][value="${documento}"]`);
            if (checkboxDocumento) checkboxDocumento.checked = true;
        });
    }
    
    // Sistema de gestión de calidad
    if (respuestasAnteriores.sistema_gestion) {
        formulario.sistema_gestion.value = respuestasAnteriores.sistema_gestion;
    }
    
    // Asociación profesional
    if (respuestasAnteriores.asociacion_profesional) {
        const radioAsoc = document.querySelector(`input[name="asociacion_profesional"][value="${respuestasAnteriores.asociacion_profesional}"]`);
        if (radioAsoc) {
            radioAsoc.checked = true;
            
            // Mostrar campo condicional si pertenece a asociación
            if (respuestasAnteriores.asociacion_profesional === 'si') {
                nombreAsociacionContainer.style.display = 'block';
                formulario.nombre_asociacion.value = respuestasAnteriores.nombre_asociacion || '';
            }
        }
    }
    
    // Aporte de la ética
    if (respuestasAnteriores.aporte_etica) {
        formulario.aporte_etica.value = respuestasAnteriores.aporte_etica;
    }
}

/**
 * Configura los eventos del formulario
 */
function configurarEventos() {
    // Eventos para mostrar/ocultar campos condicionales
    
    // 1. Colaboración en investigación
    document.querySelectorAll('input[name="colabora_investigacion"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'si') {
                tipoInvestigacionContainer.style.display = 'block';
            } else {
                tipoInvestigacionContainer.style.display = 'none';
                // Desmarcar todas las opciones del tipo de investigación
                document.querySelectorAll('input[name="tipo_investigacion"]').forEach(check => {
                    check.checked = false;
                });
            }
        });
    });
    
    // 2. Certificaciones
    document.querySelectorAll('input[name="certificaciones"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'si') {
                detalleCertificacionesContainer.style.display = 'block';
            } else {
                detalleCertificacionesContainer.style.display = 'none';
                formulario.detalle_certificaciones.value = '';
            }
        });
    });
    
    // 3. Publicaciones
    document.querySelectorAll('input[name="publicaciones"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'si') {
                detallePublicacionesContainer.style.display = 'block';
            } else {
                detallePublicacionesContainer.style.display = 'none';
                formulario.detalle_publicaciones.value = '';
            }
        });
    });
    
    // 4. Asociación profesional
    document.querySelectorAll('input[name="asociacion_profesional"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'si') {
                nombreAsociacionContainer.style.display = 'block';
            } else {
                nombreAsociacionContainer.style.display = 'none';
                formulario.nombre_asociacion.value = '';
            }
        });
    });
    
    // Gestión de opciones mutuamente excluyentes en checkboxes
    
    // 1. Herramientas utilizadas
    document.querySelectorAll('input[name="herramientas"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            handleCheckboxExclusion('herramientas', 'ninguna');
        });
    });
    
    // 2. Tipo de investigación
    document.querySelectorAll('input[name="tipo_investigacion"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            handleCheckboxExclusion('tipo_investigacion', 'ninguna');
        });
    });
    
    // 3. Servicios ofrecidos
    document.querySelectorAll('input[name="servicios"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            handleCheckboxExclusion('servicios', 'ninguno');
        });
    });
    
    // 4. Lenguas extranjeras
    document.querySelectorAll('input[name="lenguas"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            handleCheckboxExclusion('lenguas', 'ninguna');
        });
    });
    
    // 5. Documentos
    document.querySelectorAll('input[name="documentos"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            handleCheckboxExclusion('documentos', 'ninguno');
        });
    });
    
    // Evento de envío del formulario
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Si el módulo ya está completado, volver al inicio
            if (moduloCompletado) {
                window.location.href = '../../encuestas.html';
                return;
            }
            
            // Validar formulario
            if (validarFormulario()) {
                // Mostrar overlay de carga
                loadingOverlay.style.display = 'flex';
                
                try {
                    // Guardar datos
                    await guardarDatos();
                    
                    // Redirigir a página de encuestas completadas
                    alert('¡Módulo completado con éxito! Has finalizado la encuesta especializada para Química y Bioquímica.');
                    window.location.href = '../../encuestas.html';
                } catch (error) {
                    console.error('Error al guardar datos:', error);
                    mostrarError('Error al guardar los datos. Inténtalo de nuevo más tarde.');
                    loadingOverlay.style.display = 'none';
                }
            }
        });
    }
}

/**
 * Habilita el modo de solo visualización para el formulario
 */
function habilitarModoSoloVisualizacion() {
    // Deshabilitar todos los inputs del formulario
    const inputs = formulario.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // Agregar clase visual para indicar modo solo lectura
    formulario.classList.add('modo-solo-lectura');
    
    // Mostrar mensaje informativo
    const mensajeInfo = document.createElement('div');
    mensajeInfo.className = 'alert alert-info mt-3';
    mensajeInfo.innerHTML = '<i class="fas fa-info-circle me-2"></i> Este módulo ya ha sido completado. Estás viendo la información en modo de solo lectura.';
    
    // Insertar mensaje antes del formulario
    formulario.parentNode.insertBefore(mensajeInfo, formulario);
}

/**
 * Maneja la exclusión mutua entre checkboxes (por ejemplo, opción "Ninguna" con otras opciones)
 * @param {string} name - Nombre del grupo de checkboxes
 * @param {string} exclusiveValue - Valor del checkbox exclusivo (ej. "ninguna")
 */
function handleCheckboxExclusion(name, exclusiveValue) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
    const ningunaCheckbox = document.querySelector(`input[name="${name}"][value="${exclusiveValue}"]`);
    const otrosCheckboxes = Array.from(checkboxes).filter(cb => cb.value !== exclusiveValue);
    
    if (!ningunaCheckbox) return;
    
    // Si se marcó "ninguna", desmarcar y deshabilitar las demás opciones
    if (ningunaCheckbox.checked) {
        otrosCheckboxes.forEach(cb => {
            cb.checked = false;
            cb.disabled = true;
        });
    } else {
        // Si se desmarcó "ninguna", habilitar las demás opciones
        otrosCheckboxes.forEach(cb => {
            cb.disabled = false;
        });
        
        // Si se marcó alguna otra opción, desmarcar y deshabilitar "ninguna"
        const algunaOtraMarcada = otrosCheckboxes.some(cb => cb.checked);
        if (algunaOtraMarcada) {
            ningunaCheckbox.checked = false;
            ningunaCheckbox.disabled = true;
        } else {
            ningunaCheckbox.disabled = false;
        }
    }
}

/**
 * Valida el formulario antes de enviar
 * @returns {boolean} - Indica si el formulario es válido
 */
function validarFormulario() {
    let esValido = true;
    let primerErrorEncontrado = null;
    
    // Reiniciar mensajes de error
    herramientasError.textContent = '';
    investigacionError.textContent = '';
    serviciosError.textContent = '';
    lenguasError.textContent = '';
    documentosError.textContent = '';
    
    // 1. Validar herramientas utilizadas (al menos una seleccionada)
    const herramientasSeleccionadas = Array.from(document.querySelectorAll('input[name="herramientas"]:checked')).map(input => input.value);
    if (herramientasSeleccionadas.length === 0) {
        herramientasError.textContent = 'Debes seleccionar al menos una opción';
        esValido = false;
        if (!primerErrorEncontrado) primerErrorEncontrado = document.querySelector('#herramientas-container');
    }
    
    // 2. Validar colaboración en investigación (opción requerida)
    const colaboraInvestigacion = document.querySelector('input[name="colabora_investigacion"]:checked');
    if (!colaboraInvestigacion) {
        investigacionError.textContent = 'Debes seleccionar una opción';
        esValido = false;
        if (!primerErrorEncontrado) primerErrorEncontrado = document.querySelector('#colaboracion-investigacion-container');
    } else if (colaboraInvestigacion.value === 'si') {
        // Si colabora en investigación, validar tipo de investigación (al menos uno seleccionado)
        const tiposSeleccionados = Array.from(document.querySelectorAll('input[name="tipo_investigacion"]:checked')).map(input => input.value);
        if (tiposSeleccionados.length === 0) {
            investigacionError.textContent = 'Debes seleccionar al menos un tipo de investigación';
            esValido = false;
            if (!primerErrorEncontrado) primerErrorEncontrado = tipoInvestigacionContainer;
        }
    }
    
    // 3. Validar redes de colaboración (opción requerida)
    const redesColaboracion = document.querySelector('input[name="redes_colaboracion"]:checked');
    if (!redesColaboracion) {
        document.getElementById('redes-error').textContent = 'Debes seleccionar una opción';
        esValido = false;
        if (!primerErrorEncontrado) primerErrorEncontrado = document.querySelector('#redes-colaboracion-container');
    }
    
    // 4. Validar certificaciones (opción requerida)
    const certificaciones = document.querySelector('input[name="certificaciones"]:checked');
    if (!certificaciones) {
        document.getElementById('certificaciones-error').textContent = 'Debes seleccionar una opción';
        esValido = false;
        if (!primerErrorEncontrado) primerErrorEncontrado = document.querySelector('#certificaciones-container');
    } else if (certificaciones.value === 'si') {
        // Si tiene certificaciones, validar detalle (campo requerido)
        if (!formulario.detalle_certificaciones.value.trim()) {
            document.getElementById('detalle-certificaciones-error').textContent = 'Debes proporcionar información sobre tus certificaciones';
            esValido = false;
            if (!primerErrorEncontrado) primerErrorEncontrado = detalleCertificacionesContainer;
        }
    }
    
    // 5. Validar servicios (al menos uno seleccionado)
    const serviciosSeleccionados = Array.from(document.querySelectorAll('input[name="servicios"]:checked')).map(input => input.value);
    if (serviciosSeleccionados.length === 0) {
        serviciosError.textContent = 'Debes seleccionar al menos una opción';
        esValido = false;
        if (!primerErrorEncontrado) primerErrorEncontrado = document.querySelector('#servicios-container');
    }
    
    // 6. Validar lenguas extranjeras (al menos una seleccionada)
    const lenguasSeleccionadas = Array.from(document.querySelectorAll('input[name="lenguas"]:checked')).map(input => input.value);
    if (lenguasSeleccionadas.length === 0) {
        lenguasError.textContent = 'Debes seleccionar al menos una opción';
        esValido = false;
        if (!primerErrorEncontrado) primerErrorEncontrado = document.querySelector('#lenguas-container');
    }
    
    // 7. Validar publicaciones (opción requerida)
    const publicaciones = document.querySelector('input[name="publicaciones"]:checked');
    if (!publicaciones) {
        document.getElementById('publicaciones-error').textContent = 'Debes seleccionar una opción';
        esValido = false;
        if (!primerErrorEncontrado) primerErrorEncontrado = document.querySelector('#publicaciones-container');
    } else if (publicaciones.value === 'si') {
        // Si tiene publicaciones, validar detalle (campo requerido)
        if (!formulario.detalle_publicaciones.value.trim()) {
            document.getElementById('detalle-publicaciones-error').textContent = 'Debes proporcionar información sobre tus publicaciones';
            esValido = false;
            if (!primerErrorEncontrado) primerErrorEncontrado = detallePublicacionesContainer;
        }
    }
    
    // 8. Validar documentos (al menos uno seleccionado)
    const documentosSeleccionados = Array.from(document.querySelectorAll('input[name="documentos"]:checked')).map(input => input.value);
    if (documentosSeleccionados.length === 0) {
        documentosError.textContent = 'Debes seleccionar al menos una opción';
        esValido = false;
        if (!primerErrorEncontrado) primerErrorEncontrado = document.querySelector('#documentos-container');
    }
    
    // 9. Validar sistema de gestión de calidad (campo requerido)
    if (!formulario.sistema_gestion.value.trim()) {
        document.getElementById('sistema-gestion-error').textContent = 'Este campo es requerido';
        esValido = false;
        if (!primerErrorEncontrado) primerErrorEncontrado = document.querySelector('#sistema-gestion-container');
    }
    
    // 10. Validar asociación profesional (opción requerida)
    const asociacionProfesional = document.querySelector('input[name="asociacion_profesional"]:checked');
    if (!asociacionProfesional) {
        document.getElementById('asociacion-error').textContent = 'Debes seleccionar una opción';
        esValido = false;
        if (!primerErrorEncontrado) primerErrorEncontrado = document.querySelector('#asociacion-profesional-container');
    } else if (asociacionProfesional.value === 'si') {
        // Si pertenece a asociación, validar nombre (campo requerido)
        if (!formulario.nombre_asociacion.value.trim()) {
            document.getElementById('nombre-asociacion-error').textContent = 'Debes proporcionar el nombre de la asociación';
            esValido = false;
            if (!primerErrorEncontrado) primerErrorEncontrado = nombreAsociacionContainer;
        }
    }
    
    // 11. Validar aporte de la ética (campo requerido)
    if (!formulario.aporte_etica.value.trim()) {
        document.getElementById('aporte-etica-error').textContent = 'Este campo es requerido';
        esValido = false;
        if (!primerErrorEncontrado) primerErrorEncontrado = document.querySelector('#aporte-etica-container');
    }
    
    // Si hay errores, hacer scroll al primer error
    if (primerErrorEncontrado) {
        primerErrorEncontrado.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return esValido;
}

/**
 * Guarda los datos del formulario en la base de datos
 * @returns {Promise<void>}
 */
async function guardarDatos() {
    try {
        // 1. Obtener todos los valores del formulario
        
        // Herramientas utilizadas (checkboxes)
        const herramientas = Array.from(document.querySelectorAll('input[name="herramientas"]:checked'))
            .map(input => input.value);
        
        // Colaboración en investigación (radio)
        const colaboraInvestigacion = document.querySelector('input[name="colabora_investigacion"]:checked').value;
        
        // Tipo de investigación (checkboxes condicionales)
        let tipoInvestigacion = [];
        if (colaboraInvestigacion === 'si') {
            tipoInvestigacion = Array.from(document.querySelectorAll('input[name="tipo_investigacion"]:checked'))
                .map(input => input.value);
        }
        
        // Redes de colaboración (radio)
        const redesColaboracion = document.querySelector('input[name="redes_colaboracion"]:checked').value;
        
        // Certificaciones (radio)
        const certificaciones = document.querySelector('input[name="certificaciones"]:checked').value;
        
        // Detalle de certificaciones (texto condicional)
        let detalleCertificaciones = '';
        if (certificaciones === 'si') {
            detalleCertificaciones = formulario.detalle_certificaciones.value.trim();
        }
        
        // Servicios ofrecidos (checkboxes)
        const servicios = Array.from(document.querySelectorAll('input[name="servicios"]:checked'))
            .map(input => input.value);
        
        // Lenguas extranjeras (checkboxes)
        const lenguas = Array.from(document.querySelectorAll('input[name="lenguas"]:checked'))
            .map(input => input.value);
        
        // Publicaciones (radio)
        const publicaciones = document.querySelector('input[name="publicaciones"]:checked').value;
        
        // Detalle de publicaciones (texto condicional)
        let detallePublicaciones = '';
        if (publicaciones === 'si') {
            detallePublicaciones = formulario.detalle_publicaciones.value.trim();
        }
        
        // Documentos (checkboxes)
        const documentos = Array.from(document.querySelectorAll('input[name="documentos"]:checked'))
            .map(input => input.value);
        
        // Sistema de gestión de calidad (textarea)
        const sistemaGestion = formulario.sistema_gestion.value.trim();
        
        // Asociación profesional (radio)
        const asociacionProfesional = document.querySelector('input[name="asociacion_profesional"]:checked').value;
        
        // Nombre de la asociación (texto condicional)
        let nombreAsociacion = '';
        if (asociacionProfesional === 'si') {
            nombreAsociacion = formulario.nombre_asociacion.value.trim();
        }
        
        // Aporte de la ética (textarea)
        const aporteEtica = formulario.aporte_etica.value.trim();
        
        // 2. Crear objeto con todos los datos recolectados
        const datosModulo = {
            herramientas,
            colabora_investigacion: colaboraInvestigacion,
            tipo_investigacion: tipoInvestigacion,
            redes_colaboracion: redesColaboracion,
            certificaciones,
            detalle_certificaciones: detalleCertificaciones,
            servicios,
            lenguas,
            publicaciones,
            detalle_publicaciones: detallePublicaciones,
            documentos,
            sistema_gestion: sistemaGestion,
            asociacion_profesional: asociacionProfesional,
            nombre_asociacion: nombreAsociacion,
            aporte_etica: aporteEtica,
            fecha_completado: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log('Datos a guardar:', datosModulo);
        
        // 3. Guardar en Firestore, en la colección de historial de encuestas del usuario
        await firebase.firestore()
            .collection('usuario')
            .doc(currentUser.id)
            .collection('historial_encuestas')
            .doc(encuestaActual.id)
            .set({
                modulo5_1: {
                    completado: true,
                    datos: datosModulo,
                    fecha_completado: firebase.firestore.FieldValue.serverTimestamp()
                }
            }, { merge: true });
        
        console.log('Datos guardados correctamente');
        
        // 4. También actualizamos el documento de encuesta para registrar completitud
        await firebase.firestore()
            .collection('encuestas')
            .doc(encuestaActual.id)
            .update({
                [`completadas.${currentUser.id}.modulo5_1`]: true,
                [`completadas.${currentUser.id}.fecha_actualizacion`]: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        console.log('Estado de completitud actualizado en la encuesta');
        
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        throw error;
    }
}

/**
 * Muestra un mensaje de error en el contenedor designado
 * @param {string} mensaje - Mensaje de error a mostrar
 */
function mostrarError(mensaje) {
    errorContainer.textContent = mensaje;
    errorContainer.style.display = 'block';
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}
