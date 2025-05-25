/**
 * Creación de Encuestas - Módulo principal
 * 
 * Este archivo maneja la coordinación entre los diferentes módulos del sistema
 * de creación de encuestas y se encarga de guardar la encuesta completa en Firestore.
 */

// Verificar que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema de creación de encuestas...');
    
    // Detectar cuando se carga la página
    window.addEventListener('load', function() {
        // Ocultar indicador de carga
        const cargando = document.getElementById('cargando');
        if (cargando) {
            cargando.style.display = 'none';
        }
    });
});

/**
 * Guarda la encuesta completa en Firestore
 */
function guardarEncuesta() {
    // Mostrar indicador de carga
    mostrarCargando();
    
    try {
        // Obtener datos básicos de la encuesta
        const nombreEncuesta = document.getElementById('nombre-encuesta').value.trim();
        const descripcionEncuesta = document.getElementById('descripcion-encuesta').value.trim();
        const carrerasIds = document.getElementById('carreras-encuesta').value;
        
        // Validaciones básicas
        if (!nombreEncuesta) {
            mostrarAlerta('El nombre de la encuesta es obligatorio', 'error');
            ocultarCargando();
            return;
        }
        
        if (!carrerasIds) {
            mostrarAlerta('Debes seleccionar al menos una carrera', 'error');
            ocultarCargando();
            return;
        }
        
        if (!window.modulosEncuesta || window.modulosEncuesta.length === 0) {
            mostrarAlerta('Debes agregar al menos un módulo', 'error');
            ocultarCargando();
            return;
        }
        
        // Verificar que cada módulo tenga al menos una pregunta
        let moduloSinPreguntas = false;
        window.modulosEncuesta.forEach(modulo => {
            if (!modulo.preguntas || modulo.preguntas.length === 0) {
                mostrarAlerta(`El módulo "${modulo.nombre}" no tiene preguntas`, 'error');
                moduloSinPreguntas = true;
            }
        });
        
        if (moduloSinPreguntas) {
            ocultarCargando();
            return;
        }
        
        // Preparar datos de la encuesta
        const encuestaData = {
            nombre: nombreEncuesta,
            descripcion: descripcionEncuesta,
            carreras: carrerasIds.split(','),
            modulos: [],
            fecha_creacion: new Date(),
            activa: true
        };
        
        // Procesar módulos y preguntas
        window.modulosEncuesta.forEach(modulo => {
            const moduloData = {
                id: modulo.id,
                nombre: modulo.nombre,
                descripcion: modulo.descripcion,
                preguntas: []
            };
            
            // Procesar preguntas
            if (modulo.preguntas) {
                modulo.preguntas.forEach(pregunta => {
                    const preguntaData = {
                        id: pregunta.id,
                        texto: pregunta.texto,
                        tipo: pregunta.tipo,
                        obligatoria: pregunta.obligatoria
                    };
                    
                    // Agregar opciones si es de opción múltiple
                    if (pregunta.tipo === 'opcion_multiple' && pregunta.opciones) {
                        preguntaData.opciones = pregunta.opciones;
                        
                        // Agregar preguntas condicionales si existen
                        const preguntasCondicionales = obtenerPreguntasCondicionales(pregunta.id);
                        if (preguntasCondicionales) {
                            preguntaData.preguntasCondicionales = preguntasCondicionales;
                        }
                    }
                    
                    moduloData.preguntas.push(preguntaData);
                });
            }
            
            encuestaData.modulos.push(moduloData);
        });
        
        // Guardar en Firestore (si Firebase está disponible)
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            firebase.firestore().collection('encuestascreadas')
                .add(encuestaData)
                .then(docRef => {
                    console.log('Encuesta guardada con ID:', docRef.id);
                    mostrarAlerta('Encuesta guardada correctamente', 'success');
                    resetearFormulario();
                    cargarEncuestasExistentes();
                })
                .catch(error => {
                    console.error('Error al guardar encuesta:', error);
                    mostrarAlerta('Error al guardar la encuesta: ' + error.message, 'error');
                })
                .finally(() => {
                    ocultarCargando();
                });
        } else {
            console.error('Firebase no está disponible');
            mostrarAlerta('Error: No se pudo conectar con la base de datos', 'error');
            ocultarCargando();
            
            // En modo desarrollo, simular éxito
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                setTimeout(() => {
                    console.log('DESARROLLO: Simulando guardado exitoso', encuestaData);
                    mostrarAlerta('DESARROLLO: Encuesta simulada correctamente', 'success');
                    resetearFormulario();
                }, 1000);
            }
        }
    } catch (error) {
        console.error('Error al procesar datos de encuesta:', error);
        mostrarAlerta('Error al procesar los datos: ' + error.message, 'error');
        ocultarCargando();
    }
}

/**
 * Resetea el formulario de creación de encuesta
 */
function resetearFormulario() {
    // Limpiar formulario
    document.getElementById('form-encuesta').reset();
    
    // Limpiar carreras seleccionadas
    window.carrerasSeleccionadas = [];
    const carrerasSeleccionadasContainer = document.getElementById('carreras-seleccionadas');
    if (carrerasSeleccionadasContainer) {
        carrerasSeleccionadasContainer.innerHTML = '';
    }
    
    // Limpiar módulos
    window.modulosEncuesta = [];
    const listaModulos = document.getElementById('lista-modulos');
    if (listaModulos) {
        listaModulos.innerHTML = '';
    }
    
    // Limpiar variables globales
    window.preguntasCondicionales = {};
    window.opcionesPregunta = {};
    
    // Ocultar indicador de carga
    ocultarCargando();
}

/**
 * Muestra el indicador de carga
 */
function mostrarCargando() {
    const cargando = document.getElementById('cargando');
    if (cargando) {
        cargando.style.display = 'flex';
    }
}

/**
 * Oculta el indicador de carga
 */
function ocultarCargando() {
    const cargando = document.getElementById('cargando');
    if (cargando) {
        cargando.style.display = 'none';
    }
}

/**
 * Muestra una alerta al usuario
 */
function mostrarAlerta(mensaje, tipo = 'info') {
    // Por ahora usamos alert, pero puede ser reemplazado por una alerta más elegante
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    alert(`${mensaje}`);
}

/**
 * Inicializa el sistema de creación de encuestas
 */
function inicializarCreadorEncuestas() {
    console.log('Inicializando creador de encuestas...');
    
    // Configurar listeners para el formulario de encuesta
    const formEncuesta = document.getElementById('form-encuesta');
    if (formEncuesta) {
        formEncuesta.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarEncuesta();
        });
    }
    
    // Configurar el botón cancelar
    const btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            if (confirm('¿Estás seguro de cancelar? Se perderán los cambios no guardados.')) {
                resetearFormulario();
            }
        });
    }
    
    // Inicializar la gestión de carreras
    if (typeof inicializarGestorCarreras === 'function') {
        inicializarGestorCarreras();
    } else {
        console.warn('La función inicializarGestorCarreras no está disponible');
    }
    
    // Inicializar gestor de módulos
    if (typeof inicializarGestorModulos === 'function') {
        inicializarGestorModulos();
    } else {
        console.warn('La función inicializarGestorModulos no está disponible');
    }
    
    // Inicializar gestor de preguntas
    if (typeof inicializarGestorPreguntas === 'function') {
        inicializarGestorPreguntas();
    } else {
        console.warn('La función inicializarGestorPreguntas no está disponible');
    }
    
    // Inicializar gestor de preguntas condicionales
    if (typeof inicializarGestorPreguntasCondicionales === 'function') {
        inicializarGestorPreguntasCondicionales();
    } else {
        console.warn('La función inicializarGestorPreguntasCondicionales no está disponible');
    }
    
    // Cargar encuestas existentes
    if (typeof cargarEncuestasExistentes === 'function') {
        cargarEncuestasExistentes();
    } else {
        console.warn('La función cargarEncuestasExistentes no está disponible');
    }
}

// Exportar funciones que necesitan ser accesibles desde otros módulos
window.inicializarCreadorEncuestas = inicializarCreadorEncuestas;
window.guardarEncuesta = guardarEncuesta;
window.resetearFormulario = resetearFormulario;
window.mostrarCargando = mostrarCargando;
window.ocultarCargando = ocultarCargando;
