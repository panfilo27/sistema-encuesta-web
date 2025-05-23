/**
 * Módulo 2: Evaluación de la Formación Académica - Controlador principal
 * 
 * Este archivo maneja la lógica principal del módulo 2 de la encuesta,
 * incluyendo la carga de datos, inicialización del formulario,
 * y la coordinación entre validación y almacenamiento de datos.
 */

// Referencia al formulario
const formulario = document.getElementById('form-modulo2');
const loadingModule = document.getElementById('loading-module');
const loadingOverlay = document.getElementById('loading-overlay');
const errorContainer = document.getElementById('error-container');
const btnGuardar = document.getElementById('btn-guardar-modulo2');

// Variables globales
let currentUser = null;
let encuestaActual = null;
let moduloCompletado = false;
let respuestasAnteriores = null;

/**
 * Inicializa el módulo cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando Módulo 2: Evaluación de la Formación Académica');
    
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
                // Verificar si el módulo 1 fue completado
                const modulo1Completado = await verificarModuloAnterior();
                
                if (!modulo1Completado) {
                    alert('Debes completar el Módulo 1 antes de continuar. Serás redirigido.');
                    window.location.href = '../modulo1/index.html';
                    return;
                }
                
                console.log('Módulo 1 completado verificado correctamente. Continuando con módulo 2...');
                
                // Cargar datos y verificar si el módulo ya fue completado
                await cargarDatos();
                
                // Configurar eventos del formulario
                configurarEventos();
                
                // Mostrar formulario
                loadingModule.style.display = 'none';
                formulario.style.display = 'block';
            } catch (error) {
                console.error('Error al inicializar el módulo 2:', error);
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
 * Verifica si el módulo anterior (Módulo 1) fue completado
 * @returns {Promise<boolean>} True si el módulo 1 fue completado
 */
async function verificarModuloAnterior() {
    try {
        // 1. Cargar encuesta activa
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
        
        console.log('Verificando si el usuario ha completado el módulo 1...');
        console.log('ID Usuario:', currentUser.id);
        console.log('ID Encuesta:', encuestaActual.id);
        
        // 2. Verificar si el usuario completó el módulo 1 para esta encuesta usando la nueva estructura
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
            
            // Verificar si existe el módulo 1 y está completado
            const moduloCompletado = datosEncuesta.modulo1 && datosEncuesta.modulo1.completado === true;
            console.log('Módulo 1 completado:', moduloCompletado);
            console.log('Datos del módulo 1:', datosEncuesta.modulo1 || 'No existe');
            
            return moduloCompletado;
        }
        
        console.log('No se encontró historial de esta encuesta para el usuario');
        return false;
    } catch (error) {
        console.error('Error al verificar módulo anterior:', error);
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
            
            // Verificar si existe el módulo 2 y está completado
            moduloCompletado = datosEncuesta.modulo2 && datosEncuesta.modulo2.completado === true;
            
            // Si hay respuestas anteriores, cargarlas
            if (moduloCompletado && datosEncuesta.modulo2.datos) {
                respuestasAnteriores = datosEncuesta.modulo2.datos;
                
                // Pre-llenar el formulario con las respuestas anteriores
                preLlenarFormulario();
            }
            
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
    
    // Calificaciones
    const campos = [
        'calidad_docentes',
        'plan_estudios',
        'oportunidad_proyectos',
        'enfasis_investigacion',
        'satisfaccion_infraestructura',
        'experiencia_residencia'
    ];
    
    campos.forEach(campo => {
        if (respuestasAnteriores[campo]) {
            const radioBtn = document.getElementById(`${campo}_${respuestasAnteriores[campo]}`);
            if (radioBtn) {
                radioBtn.checked = true;
            }
        }
    });
    
    // Comentario
    if (respuestasAnteriores.comentario_formacion) {
        formulario.comentario_formacion.value = respuestasAnteriores.comentario_formacion;
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
            window.location.href = '/public/alumnos/modulos/modulo3.html';
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
            const datosModulo2 = window.crearModulo2DesdeFormulario(formulario);
            
            // Guardar respuestas en Firestore
            await guardarRespuestas(datosModulo2);
            
            alert('Información guardada correctamente. Serás redirigido al siguiente módulo.');
            
            // Redirigir al siguiente módulo
            window.location.href = '/public/alumnos/modulos/modulo3.html';
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
    
    // Verificar que todas las preguntas tengan respuesta
    const camposObligatorios = [
        'calidad_docentes',
        'plan_estudios',
        'oportunidad_proyectos',
        'enfasis_investigacion',
        'satisfaccion_infraestructura',
        'experiencia_residencia'
    ];
    
    camposObligatorios.forEach(campo => {
        const seleccionado = document.querySelector(`input[name="${campo}"]:checked`);
        if (!seleccionado) {
            const etiqueta = document.querySelector(`label[for="${campo}_1"]`).parentNode.querySelector('label').textContent.replace(':', '');
            errores.push(`Debe evaluar "${etiqueta}"`);
        }
    });
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

/**
 * Guarda las respuestas del módulo en Firestore
 * @param {Object} datos - Datos del módulo 2
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
            // La encuesta ya existe, actualizamos solo el módulo 2
            await encuestaRef.update({
                'modulo2': {
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
                modulo2: {
                    datos: datos,
                    completado: true,
                    fechaCompletado: new Date()
                }
            });
        }
        
        console.log('Respuestas del Módulo 2 guardadas correctamente en historial de usuario');
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
