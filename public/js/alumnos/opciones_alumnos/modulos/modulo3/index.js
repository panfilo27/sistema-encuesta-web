/**
 * Módulo 3: Ubicación Laboral - Controlador principal
 * 
 * Este archivo maneja la lógica principal del módulo 3 de la encuesta,
 * incluyendo la carga de datos, inicialización del formulario,
 * y la coordinación entre validación y almacenamiento de datos.
 */

// Referencia al formulario
const formulario = document.getElementById('form-modulo3');
const loadingModule = document.getElementById('loading-module');
const loadingOverlay = document.getElementById('loading-overlay');
const errorContainer = document.getElementById('error-container');
const btnGuardar = document.getElementById('btn-guardar-modulo3');

// Referencias a secciones condicionales
const seccionEstudios = document.getElementById('seccion-estudios');
const seccionTrabajo = document.getElementById('seccion-trabajo');
const seccionBusqueda = document.getElementById('seccion-busqueda');
const otroEstudioContainer = document.getElementById('otro-estudio-container');

// Variables globales
let currentUser = null;
let encuestaActual = null;
let moduloCompletado = false;
let respuestasAnteriores = null;

/**
 * Inicializa el módulo cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando Módulo 3: Ubicación Laboral');
    
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
                const modulosAnterioresCompletados = await verificarModulosAnteriores();
                
                if (!modulosAnterioresCompletados) {
                    alert('Debes completar los módulos anteriores antes de continuar. Serás redirigido.');
                    window.location.href = '../../encuestas.html';
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
                        btnGuardar.textContent = 'Continuar al módulo correspondiente';
                    }
                }
                
                // Configurar eventos del formulario
                configurarEventos();
                
                // Mostrar formulario
                loadingModule.style.display = 'none';
                formulario.style.display = 'block';
            } catch (error) {
                console.error('Error al inicializar el módulo 3:', error);
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
 * @returns {Promise<boolean>} - True si los módulos anteriores están completados
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
            
            // Verificar si existen los módulos 1 y 2 y están completados
            const modulo1Completado = datosEncuesta.modulo1 && datosEncuesta.modulo1.completado === true;
            const modulo2Completado = datosEncuesta.modulo2 && datosEncuesta.modulo2.completado === true;
            
            console.log('Módulo 1 completado:', modulo1Completado);
            console.log('Módulo 2 completado:', modulo2Completado);
            
            return modulo1Completado && modulo2Completado;
        }
        
        console.log('No se encontró historial de esta encuesta para el usuario');
        return false;
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
            
            // Verificar si existe el módulo 3 y está completado
            moduloCompletado = datosEncuesta.modulo3 && datosEncuesta.modulo3.completado === true;
            
            // Si hay respuestas anteriores, cargarlas
            if (moduloCompletado && datosEncuesta.modulo3.datos) {
                respuestasAnteriores = datosEncuesta.modulo3.datos;
                
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
    
    // Actividad actual
    if (respuestasAnteriores.actividad_actual) {
        formulario.actividad_actual.value = respuestasAnteriores.actividad_actual;
        mostrarSeccionesSegunActividad(respuestasAnteriores.actividad_actual);
    }
    
    // Estudios
    if (respuestasAnteriores.tipo_estudio) {
        formulario.tipo_estudio.value = respuestasAnteriores.tipo_estudio;
        if (respuestasAnteriores.tipo_estudio === 'otra') {
            otroEstudioContainer.classList.remove('oculto');
        }
    }
    
    formulario.otro_estudio.value = respuestasAnteriores.otro_estudio || '';
    formulario.institucion_educativa.value = respuestasAnteriores.institucion_educativa || '';
    formulario.especialidad_posgrado.value = respuestasAnteriores.especialidad_posgrado || '';
    
    // Trabajo
    formulario.nombre_empresa.value = respuestasAnteriores.nombre_empresa || '';
    formulario.puesto.value = respuestasAnteriores.puesto || '';
    
    if (respuestasAnteriores.sector_empresa) {
        formulario.sector_empresa.value = respuestasAnteriores.sector_empresa;
    }
    
    if (respuestasAnteriores.tipo_contratacion) {
        formulario.tipo_contratacion.value = respuestasAnteriores.tipo_contratacion;
    }
    
    if (respuestasAnteriores.antiguedad) {
        formulario.antiguedad.value = respuestasAnteriores.antiguedad;
    }
    
    if (respuestasAnteriores.nivel_jerarquico) {
        formulario.nivel_jerarquico.value = respuestasAnteriores.nivel_jerarquico;
    }
    
    if (respuestasAnteriores.relacion_estudios) {
        formulario.relacion_estudios.value = respuestasAnteriores.relacion_estudios;
    }
    
    if (respuestasAnteriores.satisfaccion_trabajo) {
        formulario.satisfaccion_trabajo.value = respuestasAnteriores.satisfaccion_trabajo;
    }
    
    if (respuestasAnteriores.rango_salario) {
        formulario.rango_salario.value = respuestasAnteriores.rango_salario;
    }
    
    // Búsqueda de empleo
    if (respuestasAnteriores.tiempo_sin_empleo) {
        formulario.tiempo_sin_empleo.value = respuestasAnteriores.tiempo_sin_empleo;
    }
    
    if (respuestasAnteriores.motivo_desempleo) {
        formulario.motivo_desempleo.value = respuestasAnteriores.motivo_desempleo;
    }
    
    if (respuestasAnteriores.dificultades_empleo) {
        formulario.dificultades_empleo.value = respuestasAnteriores.dificultades_empleo;
    }
    
    // Comentario
    formulario.comentario_laboral.value = respuestasAnteriores.comentario_laboral || '';
}

/**
 * Configura los eventos del formulario
 */
function configurarEventos() {
    // Evento para mostrar/ocultar secciones según la actividad seleccionada
    formulario.actividad_actual.addEventListener('change', (e) => {
        const actividad = e.target.value;
        mostrarSeccionesSegunActividad(actividad);
    });
    
    // Evento para mostrar/ocultar campo de otro tipo de estudio
    formulario.tipo_estudio.addEventListener('change', (e) => {
        if (e.target.value === 'otra') {
            otroEstudioContainer.classList.remove('oculto');
        } else {
            otroEstudioContainer.classList.add('oculto');
        }
    });
    
    // Evento de guardar y continuar
    btnGuardar.addEventListener('click', async () => {
        // Si el módulo ya está completado, determinar a dónde navegar
        if (moduloCompletado) {
            // Obtener la actividad seleccionada
            const actividad = formulario.actividad_actual.value;
            
            // Si trabaja o trabaja y estudia, ir al módulo 4
            // Si no, saltar directamente al módulo 6
            if (actividad === 'trabaja' || actividad === 'trabaja_estudia') {
                window.location.href = 'modulo4.html';
            } else {
                window.location.href = 'modulo6.html';
            }
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
            
            // Crear objeto del módulo 3
            const datosModulo3 = window.crearModulo3DesdeFormulario(formulario, {
                uid: currentUser.uid
            });
            
            // Guardar en Firestore
            await guardarRespuestas(datosModulo3);
            
            // Determinar a qué módulo redirigir según la actividad seleccionada
            const actividad = formulario.actividad_actual.value;
            
            // Si trabaja o trabaja y estudia, ir al módulo 4 (sobre empleo)
            // Si no, saltar directamente al módulo 6 (expectativas)
            if (actividad === 'trabaja' || actividad === 'trabaja_estudia') {
                window.location.href = 'modulo4.html';
            } else {
                // Saltar los módulos 4 y 5 (relacionados con empleo) e ir al módulo 6
                window.location.href = 'modulo6.html';
            }
        } catch (error) {
            console.error('Error al guardar el formulario:', error);
            mostrarError('Error al guardar la información. Por favor, intenta nuevamente.');
            loadingOverlay.style.display = 'none';
        }
    });
}

/**
 * Muestra u oculta secciones según la actividad seleccionada
 * @param {string} actividad - Actividad seleccionada 
 */
function mostrarSeccionesSegunActividad(actividad) {
    // Ocultar todas las secciones
    seccionEstudios.classList.remove('visible');
    seccionTrabajo.classList.remove('visible');
    seccionBusqueda.classList.remove('visible');
    
    // Mostrar secciones según la actividad
    if (actividad === 'estudia' || actividad === 'trabaja_estudia') {
        seccionEstudios.classList.add('visible');
    }
    
    if (actividad === 'trabaja' || actividad === 'trabaja_estudia') {
        seccionTrabajo.classList.add('visible');
    }
    
    if (actividad === 'ninguna') {
        seccionBusqueda.classList.add('visible');
    }
}

/**
 * Valida el formulario antes de enviar
 * @returns {Object} Resultado de la validación {valido: boolean, errores: []}
 */
function validarFormulario() {
    // Reiniciar errores
    errorContainer.innerHTML = '';
    
    const errores = [];
    
    // Verificar campos obligatorios
    if (!formulario.actividad_actual.value) {
        errores.push('Debe seleccionar su actividad actual');
    }
    
    // Validar campos obligatorios según la actividad seleccionada
    const actividad = formulario.actividad_actual.value;
    
    if (actividad === 'estudia' || actividad === 'trabaja_estudia') {
        if (!formulario.tipo_estudio.value) {
            errores.push('Debe seleccionar el tipo de estudio');
        }
        
        if (formulario.tipo_estudio.value === 'otra' && !formulario.otro_estudio.value.trim()) {
            errores.push('Debe especificar el otro tipo de estudio');
        }
    }
    
    if (actividad === 'trabaja' || actividad === 'trabaja_estudia') {
        if (!formulario.nombre_empresa.value.trim()) {
            errores.push('Debe ingresar el nombre de la empresa/institución');
        }
        
        if (!formulario.puesto.value.trim()) {
            errores.push('Debe ingresar el puesto que ocupa');
        }
        
        if (!formulario.sector_empresa.value) {
            errores.push('Debe seleccionar el sector de la empresa');
        }
    }
    
    if (actividad === 'ninguna') {
        if (!formulario.tiempo_sin_empleo.value) {
            errores.push('Debe seleccionar el tiempo sin empleo');
        }
    }
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

/**
 * Guarda las respuestas del módulo en Firestore
 * @param {Object} datos - Datos del módulo 3
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
            // La encuesta ya existe, actualizamos solo el módulo 3
            await encuestaRef.update({
                'modulo3': {
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
                modulo3: {
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
    
    // Mostrar mensaje informativo en consola
    console.log('Formulario en modo solo visualización - todos los campos bloqueados');
}
