/**
 * Gestor de Preguntas Condicionales - Sistema de Encuestas
 * 
 * Este archivo maneja la creación y gestión de preguntas condicionales (subpreguntas)
 * que aparecen dependiendo de la respuesta seleccionada en una pregunta de opción múltiple.
 */

// Variables globales
let preguntasCondicionales = {};  // Estructura: { 'preguntaId_opcionIndice': { datos de pregunta } }
let preguntaParentId = null;      // ID de la pregunta principal
let opcionParentIndex = null;     // Índice de la opción en la pregunta principal

/**
 * Inicializa el gestor de preguntas condicionales
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando gestor de preguntas condicionales...');
    
    // Configurar eventos para el modal de preguntas condicionales
    const modalPreguntaCondicional = document.getElementById('modal-pregunta-condicional');
    if (modalPreguntaCondicional) {
        // Cerrar modal
        const cerrarModal = modalPreguntaCondicional.querySelector('.cerrar-modal');
        if (cerrarModal) {
            cerrarModal.addEventListener('click', cerrarModalPreguntaCondicional);
        }
        
        // Botón cancelar
        const btnCancelar = document.getElementById('btn-cancelar-pregunta-condicional');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', cerrarModalPreguntaCondicional);
        }
        
        // Formulario
        const formPreguntaCondicional = document.getElementById('form-pregunta-condicional');
        if (formPreguntaCondicional) {
            formPreguntaCondicional.addEventListener('submit', function(e) {
                e.preventDefault();
                guardarPreguntaCondicional();
            });
        }
        
        // Cambio de tipo de pregunta
        const tipoPreguntaCondicional = document.getElementById('tipo-pregunta-condicional');
        if (tipoPreguntaCondicional) {
            tipoPreguntaCondicional.addEventListener('change', toggleOpcionesCondicional);
        }
        
        // Botón para agregar opción
        const btnAgregarOpcionCondicional = document.getElementById('btn-agregar-opcion-condicional');
        if (btnAgregarOpcionCondicional) {
            btnAgregarOpcionCondicional.addEventListener('click', agregarOpcionRespuestaCondicional);
        }
    }
});

/**
 * Muestra el modal para configurar una pregunta condicional
 * @param {string} preguntaId - ID de la pregunta principal
 * @param {number} opcionIndice - Índice de la opción seleccionada
 */
function mostrarModalPreguntaCondicional(preguntaId, opcionIndice) {
    console.log(`Mostrando modal para pregunta ${preguntaId}, opción ${opcionIndice}`);
    
    // Guardar referencias
    preguntaParentId = preguntaId;
    opcionParentIndex = opcionIndice;
    
    // Obtener el texto de la opción para mostrar en el título
    const opcionTexto = window.opcionesPregunta[preguntaId][opcionIndice];
    const tituloModal = document.getElementById('titulo-pregunta-condicional');
    if (tituloModal && opcionTexto) {
        tituloModal.textContent = `Pregunta condicional para: "${opcionTexto}"`;
    }
    
    // Limpiar formulario
    const formPreguntaCondicional = document.getElementById('form-pregunta-condicional');
    if (formPreguntaCondicional) {
        formPreguntaCondicional.reset();
    }
    
    // Limpiar opciones
    const listaOpcionesCondicional = document.getElementById('lista-opciones-condicional');
    if (listaOpcionesCondicional) {
        listaOpcionesCondicional.innerHTML = '';
    }
    
    // Ocultar sección de opciones inicialmente
    const seccionOpcionesCondicional = document.getElementById('seccion-opciones-condicional');
    if (seccionOpcionesCondicional) {
        seccionOpcionesCondicional.classList.add('hidden');
    }
    
    // Verificar si ya existe una pregunta condicional para esta opción
    const preguntaCondicionalKey = `${preguntaId}_${opcionIndice}`;
    if (preguntasCondicionales[preguntaCondicionalKey]) {
        const preguntaCondicional = preguntasCondicionales[preguntaCondicionalKey];
        
        // Cargar datos en el formulario
        document.getElementById('texto-pregunta-condicional').value = preguntaCondicional.texto || '';
        document.getElementById('tipo-pregunta-condicional').value = preguntaCondicional.tipo || 'abierta';
        document.getElementById('obligatoria-pregunta-condicional').value = 
            preguntaCondicional.obligatoria ? 'true' : 'false';
        
        // Si es de opción múltiple, cargar las opciones
        if (preguntaCondicional.tipo === 'opcion_multiple' && preguntaCondicional.opciones) {
            seccionOpcionesCondicional.classList.remove('hidden');
            
            // Cargar cada opción
            preguntaCondicional.opciones.forEach(opcion => {
                agregarOpcionRespuestaCondicionalUI(opcion);
            });
        }
    }
    
    // Mostrar modal
    const modalPreguntaCondicional = document.getElementById('modal-pregunta-condicional');
    if (modalPreguntaCondicional) {
        modalPreguntaCondicional.style.display = 'flex';
    }
}

/**
 * Cierra el modal de pregunta condicional
 */
function cerrarModalPreguntaCondicional() {
    const modal = document.getElementById('modal-pregunta-condicional');
    if (modal) {
        modal.style.display = 'none';
    }
    
    preguntaParentId = null;
    opcionParentIndex = null;
}

/**
 * Alterna la visibilidad de la sección de opciones según el tipo de pregunta
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
 * Agrega una opción de respuesta para pregunta condicional
 */
function agregarOpcionRespuestaCondicional() {
    const listaOpciones = document.getElementById('lista-opciones-condicional');
    if (!listaOpciones) return;
    
    // Verificar límite de opciones
    if (listaOpciones.children.length >= 5) {
        window.mostrarAlerta('No se pueden agregar más de 5 opciones', 'error');
        return;
    }
    
    // Generar nueva opción
    const nuevaOpcion = `Opción ${listaOpciones.children.length + 1}`;
    agregarOpcionRespuestaCondicionalUI(nuevaOpcion);
}

/**
 * Agrega una opción de respuesta a la interfaz de pregunta condicional
 * @param {string} textoOpcion - Texto de la opción
 */
function agregarOpcionRespuestaCondicionalUI(textoOpcion) {
    const listaOpciones = document.getElementById('lista-opciones-condicional');
    if (!listaOpciones) return;
    
    // Crear elemento de opción
    const opcionElement = document.createElement('div');
    opcionElement.className = 'opcion-respuesta';
    opcionElement.dataset.indice = listaOpciones.children.length;
    
    opcionElement.innerHTML = `
        <input type="text" value="${textoOpcion}" placeholder="Texto de la opción">
        <button type="button" class="btn-eliminar-opcion-condicional">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // Configurar evento de eliminación
    opcionElement.querySelector('.btn-eliminar-opcion-condicional').addEventListener('click', function() {
        eliminarOpcionRespuestaCondicional(opcionElement);
    });
    
    // Agregar al DOM
    listaOpciones.appendChild(opcionElement);
}

/**
 * Elimina una opción de respuesta condicional
 * @param {HTMLElement} opcionElement - Elemento DOM de la opción
 */
function eliminarOpcionRespuestaCondicional(opcionElement) {
    const listaOpciones = document.getElementById('lista-opciones-condicional');
    if (!listaOpciones) return;
    
    // Verificar que haya al menos dos opciones
    if (listaOpciones.children.length <= 2) {
        window.mostrarAlerta('Debe haber al menos 2 opciones', 'error');
        return;
    }
    
    // Eliminar el elemento
    opcionElement.remove();
    
    // Actualizar los índices de las opciones restantes
    Array.from(listaOpciones.children).forEach((elem, idx) => {
        elem.dataset.indice = idx;
    });
}

/**
 * Guarda la pregunta condicional
 */
function guardarPreguntaCondicional() {
    // Verificar que tenemos una pregunta y opción seleccionadas
    if (!preguntaParentId || opcionParentIndex === null) {
        window.mostrarAlerta('Error de configuración: No se ha identificado correctamente la pregunta principal', 'error');
        return;
    }
    
    // Obtener datos del formulario
    const textoPregunta = document.getElementById('texto-pregunta-condicional').value.trim();
    const tipoPregunta = document.getElementById('tipo-pregunta-condicional').value;
    const obligatoria = document.getElementById('obligatoria-pregunta-condicional').value === 'true';
    
    // Validaciones básicas
    if (!textoPregunta) {
        window.mostrarAlerta('El texto de la pregunta es obligatorio', 'error');
        return;
    }
    
    // Crear objeto de pregunta condicional
    const preguntaCondicional = {
        texto: textoPregunta,
        tipo: tipoPregunta,
        obligatoria: obligatoria
    };
    
    // Si es de opción múltiple, recopilar opciones
    if (tipoPregunta === 'opcion_multiple') {
        const listaOpciones = document.getElementById('lista-opciones-condicional');
        
        // Verificar que haya al menos 2 opciones
        if (!listaOpciones || listaOpciones.children.length < 2) {
            window.mostrarAlerta('Las preguntas de opción múltiple deben tener al menos 2 opciones', 'error');
            return;
        }
        
        // Recopilar opciones
        const opciones = [];
        let todasValidas = true;
        
        Array.from(listaOpciones.children).forEach(opcionElement => {
            const textoOpcion = opcionElement.querySelector('input').value.trim();
            if (!textoOpcion) {
                todasValidas = false;
            } else {
                opciones.push(textoOpcion);
            }
        });
        
        if (!todasValidas) {
            window.mostrarAlerta('Todas las opciones deben tener texto', 'error');
            return;
        }
        
        // Agregar opciones al objeto de pregunta
        preguntaCondicional.opciones = opciones;
    }
    
    // Guardar la pregunta condicional
    const preguntaCondicionalKey = `${preguntaParentId}_${opcionParentIndex}`;
    preguntasCondicionales[preguntaCondicionalKey] = preguntaCondicional;
    
    // Marcar visualmente la opción como que tiene pregunta condicional
    actualizarIndicadorPreguntaCondicional(preguntaParentId, opcionParentIndex, true);
    
    // Cerrar modal
    cerrarModalPreguntaCondicional();
    
    // Mostrar mensaje de éxito
    window.mostrarAlerta('Pregunta condicional guardada correctamente', 'success');
}

/**
 * Actualiza el indicador visual de que una opción tiene pregunta condicional
 * @param {string} preguntaId - ID de la pregunta principal
 * @param {number} opcionIndice - Índice de la opción
 * @param {boolean} tieneCondicional - Indica si tiene pregunta condicional
 */
function actualizarIndicadorPreguntaCondicional(preguntaId, opcionIndice, tieneCondicional) {
    // Esta función se usa cuando estamos en el modal de edición de una pregunta principal
    const listaOpciones = document.getElementById('lista-opciones');
    if (!listaOpciones) return;
    
    const opcionElement = listaOpciones.children[opcionIndice];
    if (!opcionElement) return;
    
    const btnCondicional = opcionElement.querySelector('.btn-condicional-opcion');
    if (btnCondicional) {
        if (tieneCondicional) {
            btnCondicional.classList.add('btn-condicional-activo');
            btnCondicional.title = "Esta opción ya tiene una subpregunta configurada";
        } else {
            btnCondicional.classList.remove('btn-condicional-activo');
            btnCondicional.title = "Agregar pregunta condicional";
        }
    }
}

/**
 * Obtiene las preguntas condicionales asociadas a una pregunta principal
 * @param {string} preguntaId - ID de la pregunta principal
 * @returns {Object|null} Objeto con las preguntas condicionales o null si no hay ninguna
 */
function obtenerPreguntasCondicionales(preguntaId) {
    // Filtrar las preguntas condicionales para esta pregunta
    const preguntasDeEstaPregunta = {};
    let hayPreguntas = false;
    
    Object.keys(preguntasCondicionales).forEach(key => {
        if (key.startsWith(`${preguntaId}_`)) {
            // Extraer índice de opción
            const opcionIndice = parseInt(key.split('_')[1]);
            preguntasDeEstaPregunta[opcionIndice] = preguntasCondicionales[key];
            hayPreguntas = true;
        }
    });
    
    return hayPreguntas ? preguntasDeEstaPregunta : null;
}

// Exportar funciones para uso en otros módulos
window.mostrarModalPreguntaCondicional = mostrarModalPreguntaCondicional;
window.cerrarModalPreguntaCondicional = cerrarModalPreguntaCondicional;
window.obtenerPreguntasCondicionales = obtenerPreguntasCondicionales;
window.preguntasCondicionales = preguntasCondicionales;
