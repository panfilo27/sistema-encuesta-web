/**
 * Funciones auxiliares para la integración de preguntas condicionales
 */

// Variables globales para gestionar preguntas condicionales
let preguntaParentId = null; // ID de la pregunta padre
let opcionParentIndex = null; // Índice de la opción padre
let preguntasCondicionales = {}; // Objeto para almacenar preguntas condicionales por pregunta y opción
let opcionesCondicionales = {}; // Objeto para almacenar opciones de preguntas condicionales

/**
 * Carga el módulo de preguntas condicionales
 */
function cargarModuloPreguntasCondicionales() {
    // Cargar el CSS
    if (!document.querySelector('link[href*="preguntas_condicionales.css"]')) {
        const cssCondicional = document.createElement('link');
        cssCondicional.rel = 'stylesheet';
        cssCondicional.href = '../../../../css/admin/opciones_admin/crear_encuestas/preguntas_condicionales.css';
        document.head.appendChild(cssCondicional);
    }
    
    // Cargar el script
    if (!window.moduloPreguntasCondicionalesCargado && !document.querySelector('script[src*="gestionar_preguntas_condicionales.js"]')) {
        const scriptCondicional = document.createElement('script');
        scriptCondicional.src = '../../../../js/admin/opciones_admin/crear_encuestas/gestionar_preguntas_condicionales.js';
        scriptCondicional.onload = function() {
            window.moduloPreguntasCondicionalesCargado = true;
            console.log('Módulo de preguntas condicionales cargado correctamente');
            inicializarPreguntasCondicionales();
        };
        scriptCondicional.onerror = function() {
            console.error('Error al cargar el módulo de preguntas condicionales');
        };
        document.head.appendChild(scriptCondicional);
    } else if (window.moduloPreguntasCondicionalesCargado) {
        inicializarPreguntasCondicionales();
    }
}

/**
 * Inicializa los eventos para las preguntas condicionales
 */
function inicializarPreguntasCondicionales() {
    // Configurar eventos para el modal de pregunta condicional
    const modalPreguntaCondicional = document.getElementById('modal-pregunta-condicional');
    if (modalPreguntaCondicional) {
        modalPreguntaCondicional.querySelectorAll('.cerrar, #btn-cancelar-pregunta-condicional').forEach(elem => {
            elem.addEventListener('click', cerrarModalPreguntaCondicional);
        });
        
        const formPreguntaCondicional = document.getElementById('form-pregunta-condicional');
        if (formPreguntaCondicional) {
            formPreguntaCondicional.addEventListener('submit', function(e) {
                e.preventDefault();
                guardarPreguntaCondicional();
            });
        }
        
        const tipoPreguntaCondicional = document.getElementById('tipo-pregunta-condicional');
        if (tipoPreguntaCondicional) {
            tipoPreguntaCondicional.addEventListener('change', toggleOpcionesCondicional);
        }
        
        const btnAgregarOpcionCondicional = document.getElementById('btn-agregar-opcion-condicional');
        if (btnAgregarOpcionCondicional) {
            btnAgregarOpcionCondicional.addEventListener('click', agregarOpcionRespuestaCondicional);
        }
    }
}

/**
 * Muestra el modal para configurar una pregunta condicional
 * @param {string} preguntaId - ID de la pregunta principal
 * @param {number} opcionIndice - Índice de la opción a la que se asociará la pregunta condicional
 */
function mostrarModalPreguntaCondicional(preguntaId, opcionIndice) {
    console.log(`Mostrando modal para pregunta ${preguntaId}, opción ${opcionIndice}`);
    
    // Guardar referencia a la pregunta y opción padre
    preguntaParentId = preguntaId;
    opcionParentIndex = opcionIndice;
    
    // Obtener texto de la opción para mostrar en el título
    const opcionTexto = opcionesPregunta[preguntaId][opcionIndice];
    const tituloModal = document.getElementById('titulo-pregunta-condicional');
    if (tituloModal) {
        tituloModal.textContent = `Pregunta condicional para: "${opcionTexto}"`;
    }
    
    // Resetear formulario
    const form = document.getElementById('form-pregunta-condicional');
    if (form) form.reset();
    
    // Limpiar opciones condicionales si existen
    const listaOpcionesCondicional = document.getElementById('lista-opciones-condicional');
    if (listaOpcionesCondicional) {
        listaOpcionesCondicional.innerHTML = '';
    }
    
    // Ocultar sección de opciones inicialmente
    const seccionOpcionesCondicional = document.getElementById('seccion-opciones-condicional');
    if (seccionOpcionesCondicional) {
        seccionOpcionesCondicional.classList.add('hidden');
    }
    
    // Cargar pregunta condicional si ya existe
    const preguntaCondicionalKey = `${preguntaId}_${opcionIndice}`;
    if (preguntasCondicionales[preguntaCondicionalKey]) {
        const preguntaCondicional = preguntasCondicionales[preguntaCondicionalKey];
        
        // Llenar campos
        document.getElementById('texto-pregunta-condicional').value = preguntaCondicional.texto || '';
        document.getElementById('tipo-pregunta-condicional').value = preguntaCondicional.tipo || 'abierta';
        document.getElementById('obligatoria-pregunta-condicional').value = preguntaCondicional.obligatoria ? 'true' : 'false';
        
        // Mostrar opciones si es de tipo opción múltiple
        if (preguntaCondicional.tipo === 'opcion_multiple') {
            seccionOpcionesCondicional.classList.remove('hidden');
            
            // Cargar opciones
            if (preguntaCondicional.opciones && preguntaCondicional.opciones.length > 0) {
                preguntaCondicional.opciones.forEach(opcion => {
                    agregarOpcionRespuestaCondicionalUI(opcion);
                });
            }
        }
    }
    
    // Mostrar modal
    document.getElementById('modal-pregunta-condicional').style.display = 'flex';
}

/**
 * Cierra el modal de pregunta condicional
 */
function cerrarModalPreguntaCondicional() {
    document.getElementById('modal-pregunta-condicional').style.display = 'none';
    preguntaParentId = null;
    opcionParentIndex = null;
}

/**
 * Alterna la visibilidad de la sección de opciones múltiples según el tipo de pregunta seleccionado
 */
function toggleOpcionesCondicional() {
    const tipoPregunta = document.getElementById('tipo-pregunta-condicional').value;
    const seccionOpciones = document.getElementById('seccion-opciones-condicional');
    
    if (tipoPregunta === 'opcion_multiple') {
        seccionOpciones.classList.remove('hidden');
    } else {
        seccionOpciones.classList.add('hidden');
    }
}

/**
 * Agrega una opción de respuesta para la pregunta condicional
 */
function agregarOpcionRespuestaCondicional() {
    const listaOpciones = document.getElementById('lista-opciones-condicional');
    
    // Verificar límite de opciones
    if (listaOpciones.children.length >= 5) {
        mostrarAlerta('No se pueden agregar más de 5 opciones', 'error');
        return;
    }
    
    // Crear nueva opción
    const nuevaOpcion = `Opción ${listaOpciones.children.length + 1}`;
    agregarOpcionRespuestaCondicionalUI(nuevaOpcion);
}

/**
 * Agrega una opción de respuesta a la interfaz de la pregunta condicional
 * @param {string} textoOpcion - Texto de la opción
 */
function agregarOpcionRespuestaCondicionalUI(textoOpcion) {
    const listaOpciones = document.getElementById('lista-opciones-condicional');
    const indice = listaOpciones.children.length;
    
    // Crear elemento de opción
    const opcionElement = document.createElement('div');
    opcionElement.className = 'opcion-respuesta-condicional';
    opcionElement.dataset.indice = indice;
    
    opcionElement.innerHTML = `
        <input type="text" value="${textoOpcion}" placeholder="Texto de la opción">
        <button type="button" class="btn-eliminar-opcion-condicional">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // Configurar evento de eliminación
    opcionElement.querySelector('.btn-eliminar-opcion-condicional').addEventListener('click', function() {
        opcionElement.remove();
        // Reordenar índices
        actualizarIndicesOpcionesCondicionales();
    });
    
    // Agregar al DOM
    listaOpciones.appendChild(opcionElement);
}

/**
 * Actualiza los índices de las opciones condicionales después de eliminar una
 */
function actualizarIndicesOpcionesCondicionales() {
    const listaOpciones = document.getElementById('lista-opciones-condicional');
    Array.from(listaOpciones.children).forEach((opcion, indice) => {
        opcion.dataset.indice = indice;
    });
}

/**
 * Guarda la pregunta condicional configurada
 */
function guardarPreguntaCondicional() {
    if (!preguntaParentId || opcionParentIndex === null) {
        console.error('No se ha configurado correctamente la pregunta o la opción padre');
        return;
    }
    
    // Obtener datos del formulario
    const textoPregunta = document.getElementById('texto-pregunta-condicional').value.trim();
    const tipoPregunta = document.getElementById('tipo-pregunta-condicional').value;
    const obligatoria = document.getElementById('obligatoria-pregunta-condicional').value === 'true';
    
    // Validar
    if (!textoPregunta) {
        mostrarAlerta('El texto de la pregunta es obligatorio', 'error');
        return;
    }
    
    // Crear objeto de pregunta condicional
    const preguntaCondicional = {
        texto: textoPregunta,
        tipo: tipoPregunta,
        obligatoria: obligatoria
    };
    
    // Agregar opciones si es pregunta de opción múltiple
    if (tipoPregunta === 'opcion_multiple') {
        const listaOpciones = document.getElementById('lista-opciones-condicional');
        const opciones = [];
        
        // Verificar que haya al menos 2 opciones
        if (listaOpciones.children.length < 2) {
            mostrarAlerta('Las preguntas de opción múltiple deben tener al menos 2 opciones', 'error');
            return;
        }
        
        // Recopilar opciones
        Array.from(listaOpciones.children).forEach(opcionElement => {
            const textoOpcion = opcionElement.querySelector('input').value.trim();
            if (textoOpcion) {
                opciones.push(textoOpcion);
            }
        });
        
        preguntaCondicional.opciones = opciones;
    }
    
    // Guardar pregunta condicional
    const preguntaCondicionalKey = `${preguntaParentId}_${opcionParentIndex}`;
    preguntasCondicionales[preguntaCondicionalKey] = preguntaCondicional;
    
    // Agregar indicador visual en la opción para mostrar que tiene pregunta condicional
    const listaOpciones = document.getElementById('lista-opciones');
    const opcionElement = listaOpciones.children[opcionParentIndex];
    if (opcionElement) {
        const btnCondicional = opcionElement.querySelector('.btn-condicional-opcion');
        if (btnCondicional) {
            btnCondicional.classList.add('btn-condicional-activo');
        }
    }
    
    // Cerrar modal
    cerrarModalPreguntaCondicional();
    
    // Mostrar mensaje de éxito
    mostrarAlerta('Pregunta condicional guardada correctamente', 'exito');
}

/**
 * Obtiene las preguntas condicionales para una pregunta
 * @param {string} preguntaId - ID de la pregunta
 * @returns {Object} Objeto con las preguntas condicionales por opción
 */
function obtenerPreguntasCondicionales(preguntaId) {
    const preguntasDeEstaPregunta = {};
    
    // Filtrar preguntas condicionales que pertenecen a esta pregunta
    Object.keys(preguntasCondicionales).forEach(key => {
        if (key.startsWith(`${preguntaId}_`)) {
            const opcionIndice = parseInt(key.split('_')[1]);
            preguntasDeEstaPregunta[opcionIndice] = preguntasCondicionales[key];
        }
    });
    
    return Object.keys(preguntasDeEstaPregunta).length > 0 ? preguntasDeEstaPregunta : null;
}

// Integrar con la lógica de guardar encuesta
function prepararEncuestaConPreguntas(nuevaEncuesta) {
    // Convertir preguntas condicionales a formato final para guardar
    nuevaEncuesta.modulos.forEach(modulo => {
        modulo.preguntas.forEach(pregunta => {
            const preguntasCondicionalesData = obtenerPreguntasCondicionales(pregunta.id);
            if (preguntasCondicionalesData) {
                pregunta.preguntasCondicionales = preguntasCondicionalesData;
            }
        });
    });
    
    return nuevaEncuesta;
}

// Función auxiliar para mostrar alertas
function mostrarAlerta(mensaje, tipo) {
    if (typeof window.mostrarAlerta === 'function') {
        window.mostrarAlerta(mensaje, tipo);
    } else {
        alert(mensaje);
        console.log(`[${tipo}] ${mensaje}`);
    }
}
