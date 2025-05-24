/**
 * Módulo para gestionar las preguntas condicionales de encuestas
 * Este archivo maneja la creación, actualización, eliminación y visualización de preguntas condicionales.
 */

// Variables globales para preguntas condicionales
let preguntasCondicionales = {}; // Objeto para almacenar preguntas condicionales: {opcionId: pregunta}

/**
 * Muestra el modal para agregar una pregunta condicional a una opción
 * @param {string} preguntaId - ID de la pregunta padre
 * @param {number} opcionIndice - Índice de la opción seleccionada
 */
function mostrarModalPreguntaCondicional(preguntaId, opcionIndice) {
    // Verificar que exista la opción
    if (!opcionesPregunta[preguntaId] || !opcionesPregunta[preguntaId][opcionIndice]) {
        console.error('No se encontró la opción especificada');
        return;
    }

    const opcionTexto = opcionesPregunta[preguntaId][opcionIndice];
    const opcionId = `${preguntaId}_opcion_${opcionIndice}`;
    
    // Reiniciar formulario
    document.getElementById('form-pregunta-condicional').reset();
    document.getElementById('seccion-opciones-condicional').classList.add('hidden');
    document.getElementById('lista-opciones-condicional').innerHTML = '';
    
    // Establecer título del modal con referencia a la opción
    document.getElementById('titulo-pregunta-condicional').textContent = 
        `Pregunta condicional para la opción: "${opcionTexto}"`;
    
    // Cargar pregunta condicional existente si existe
    if (preguntasCondicionales[opcionId]) {
        const preguntaCondicional = preguntasCondicionales[opcionId];
        
        document.getElementById('texto-pregunta-condicional').value = preguntaCondicional.texto || '';
        document.getElementById('tipo-pregunta-condicional').value = preguntaCondicional.tipo || 'abierta';
        document.getElementById('obligatoria-pregunta-condicional').value = preguntaCondicional.obligatoria ? 'true' : 'false';
        
        // Cargar opciones si es pregunta de opción múltiple
        if (preguntaCondicional.tipo === 'opcion_multiple' && preguntaCondicional.opciones) {
            document.getElementById('seccion-opciones-condicional').classList.remove('hidden');
            
            preguntaCondicional.opciones.forEach((opcion, index) => {
                agregarOpcionRespuestaCondicionalUI(opcion, opcionId);
            });
        }
    }
    
    // Almacenar referencias para cuando se guarde
    document.getElementById('modal-pregunta-condicional').dataset.preguntaId = preguntaId;
    document.getElementById('modal-pregunta-condicional').dataset.opcionIndice = opcionIndice;
    document.getElementById('modal-pregunta-condicional').dataset.opcionId = opcionId;
    
    // Mostrar modal
    document.getElementById('modal-pregunta-condicional').style.display = 'block';
}

/**
 * Guarda la pregunta condicional
 * @param {Event} event - Evento del formulario
 */
function guardarPreguntaCondicional(event) {
    event.preventDefault();
    
    const modal = document.getElementById('modal-pregunta-condicional');
    const preguntaId = modal.dataset.preguntaId;
    const opcionIndice = parseInt(modal.dataset.opcionIndice);
    const opcionId = modal.dataset.opcionId;
    
    const textoPregunta = document.getElementById('texto-pregunta-condicional').value.trim();
    const tipoPregunta = document.getElementById('tipo-pregunta-condicional').value;
    const obligatoria = document.getElementById('obligatoria-pregunta-condicional').value === 'true';
    
    if (!textoPregunta) {
        mostrarAlerta('Debes ingresar un texto para la pregunta condicional', 'error');
        return;
    }
    
    // Si es pregunta de opción múltiple, verificar que tenga opciones
    if (tipoPregunta === 'opcion_multiple') {
        const opcionesCondicionales = document.querySelectorAll('#lista-opciones-condicional .opcion-respuesta-condicional input');
        if (opcionesCondicionales.length < 2) {
            mostrarAlerta('Debes agregar al menos 2 opciones de respuesta', 'error');
            return;
        }
        
        // Recopilar opciones
        const opciones = Array.from(opcionesCondicionales).map(input => input.value.trim());
        
        // Crear objeto de pregunta condicional
        preguntasCondicionales[opcionId] = {
            texto: textoPregunta,
            tipo: tipoPregunta,
            obligatoria: obligatoria,
            opciones: opciones
        };
    } else {
        // Crear objeto de pregunta condicional de tipo abierta
        preguntasCondicionales[opcionId] = {
            texto: textoPregunta,
            tipo: tipoPregunta,
            obligatoria: obligatoria
        };
    }
    
    // Actualizar indicador visual en la opción
    actualizarIndicadorPreguntaCondicional(preguntaId, opcionIndice, true);
    
    // Cerrar modal
    document.getElementById('modal-pregunta-condicional').style.display = 'none';
    
    // Mostrar mensaje de éxito
    mostrarAlerta('Pregunta condicional guardada correctamente', 'exito');
}

/**
 * Elimina una pregunta condicional
 * @param {string} preguntaId - ID de la pregunta padre
 * @param {number} opcionIndice - Índice de la opción
 */
function eliminarPreguntaCondicional(preguntaId, opcionIndice) {
    const opcionId = `${preguntaId}_opcion_${opcionIndice}`;
    
    // Eliminar pregunta condicional
    delete preguntasCondicionales[opcionId];
    
    // Actualizar indicador visual
    actualizarIndicadorPreguntaCondicional(preguntaId, opcionIndice, false);
    
    // Mostrar mensaje
    mostrarAlerta('Pregunta condicional eliminada', 'info');
}

/**
 * Actualiza el indicador visual de pregunta condicional en una opción
 * @param {string} preguntaId - ID de la pregunta padre
 * @param {number} opcionIndice - Índice de la opción
 * @param {boolean} tieneCondicional - Indica si la opción tiene pregunta condicional
 */
function actualizarIndicadorPreguntaCondicional(preguntaId, opcionIndice, tieneCondicional) {
    const listaOpciones = document.getElementById('lista-opciones');
    const opcionElement = listaOpciones.children[opcionIndice];
    
    if (opcionElement) {
        // Buscar o crear el indicador
        let indicador = opcionElement.querySelector('.indicador-condicional');
        
        if (!indicador && tieneCondicional) {
            indicador = document.createElement('span');
            indicador.className = 'indicador-condicional';
            indicador.innerHTML = '<i class="fas fa-question-circle"></i>';
            indicador.title = 'Esta opción tiene una pregunta condicional';
            
            // Insertar antes del botón de eliminar
            const btnEliminar = opcionElement.querySelector('.btn-eliminar-opcion');
            opcionElement.insertBefore(indicador, btnEliminar);
        } else if (indicador && !tieneCondicional) {
            indicador.remove();
        }
    }
}

/**
 * Alterna la visualización de la sección de opciones según el tipo de pregunta
 */
function toggleOpcionesCondicional() {
    const tipoPregunta = document.getElementById('tipo-pregunta-condicional').value;
    const seccionOpciones = document.getElementById('seccion-opciones-condicional');
    
    if (tipoPregunta === 'opcion_multiple') {
        seccionOpciones.classList.remove('hidden');
        
        // Si no hay opciones, agregar dos por defecto
        if (document.querySelectorAll('#lista-opciones-condicional .opcion-respuesta-condicional').length === 0) {
            agregarOpcionRespuestaCondicional();
            agregarOpcionRespuestaCondicional();
        }
    } else {
        seccionOpciones.classList.add('hidden');
    }
}

/**
 * Agrega una opción de respuesta para la pregunta condicional
 */
function agregarOpcionRespuestaCondicional() {
    const opcionId = document.getElementById('modal-pregunta-condicional').dataset.opcionId;
    const listaOpciones = document.getElementById('lista-opciones-condicional');
    
    // Verificar límite de opciones
    if (listaOpciones.children.length >= 5) {
        mostrarAlerta('No se pueden agregar más de 5 opciones de respuesta', 'error');
        return;
    }
    
    // Crear nueva opción con texto predeterminado
    const nuevaOpcion = `Opción ${listaOpciones.children.length + 1}`;
    agregarOpcionRespuestaCondicionalUI(nuevaOpcion, opcionId);
}

/**
 * Agrega una opción de respuesta a la interfaz de pregunta condicional
 * @param {string} textoOpcion - Texto de la opción
 * @param {string} opcionId - ID de la opción padre
 */
function agregarOpcionRespuestaCondicionalUI(textoOpcion, opcionId) {
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
    opcionElement.querySelector('.btn-eliminar-opcion-condicional').addEventListener('click', () => {
        eliminarOpcionRespuestaCondicional(indice);
    });
    
    // Agregar al DOM
    listaOpciones.appendChild(opcionElement);
}

/**
 * Elimina una opción de respuesta de pregunta condicional
 * @param {number} indice - Índice de la opción a eliminar
 */
function eliminarOpcionRespuestaCondicional(indice) {
    const listaOpciones = document.getElementById('lista-opciones-condicional');
    
    // Verificar que haya al menos dos opciones
    if (listaOpciones.children.length <= 2) {
        mostrarAlerta('Debe haber al menos 2 opciones de respuesta', 'error');
        return;
    }
    
    // Eliminar opción de la interfaz
    if (listaOpciones.children[indice]) {
        listaOpciones.children[indice].remove();
    }
    
    // Reenumerar opciones
    Array.from(listaOpciones.children).forEach((opcion, i) => {
        opcion.dataset.indice = i;
    });
}

/**
 * Prepara las preguntas condicionales para ser guardadas con la encuesta
 * @returns {Object} Objeto con las preguntas condicionales preparadas
 */
function prepararPreguntasCondicionales() {
    const preguntasCondicionalesPreparadas = {};
    
    Object.keys(preguntasCondicionales).forEach(opcionId => {
        preguntasCondicionalesPreparadas[opcionId] = {
            ...preguntasCondicionales[opcionId]
        };
    });
    
    return preguntasCondicionalesPreparadas;
}

/**
 * Cierra el modal de pregunta condicional
 */
function cerrarModalPreguntaCondicional() {
    document.getElementById('modal-pregunta-condicional').style.display = 'none';
}

// Exponer funciones para ser utilizadas desde otros archivos
window.mostrarModalPreguntaCondicional = mostrarModalPreguntaCondicional;
window.guardarPreguntaCondicional = guardarPreguntaCondicional;
window.eliminarPreguntaCondicional = eliminarPreguntaCondicional;
window.toggleOpcionesCondicional = toggleOpcionesCondicional;
window.agregarOpcionRespuestaCondicional = agregarOpcionRespuestaCondicional;
window.cerrarModalPreguntaCondicional = cerrarModalPreguntaCondicional;
window.prepararPreguntasCondicionales = prepararPreguntasCondicionales;
