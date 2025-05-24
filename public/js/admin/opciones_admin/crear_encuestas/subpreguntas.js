/**
 * Funciones para manejar subpreguntas condicionales
 */

// Mostrar/ocultar opciones para subpreguntas según el tipo
function toggleOpcionesSubpregunta() {
    const tipoSubpregunta = document.getElementById('tipo-subpregunta').value;
    const opcionesSubpregunta = document.getElementById('opciones-subpregunta');
    
    if (tipoSubpregunta === 'opcion_multiple') {
        opcionesSubpregunta.classList.remove('hidden');
    } else {
        opcionesSubpregunta.classList.add('hidden');
    }
}

// Mostrar sección de subpreguntas cuando hay opciones disponibles
function mostrarSeccionSubpreguntas() {
    const seccionSubpreguntas = document.getElementById('seccion-subpreguntas');
    const listaOpciones = document.getElementById('lista-opciones');
    
    if (seccionSubpreguntas && listaOpciones.children.length > 0) {
        seccionSubpreguntas.classList.remove('hidden');
        
        // Actualizar selector de opciones
        actualizarSelectorOpcionesCondicionales();
    } else if (seccionSubpreguntas) {
        seccionSubpreguntas.classList.add('hidden');
    }
}

// Actualizar el selector de opciones para subpreguntas
function actualizarSelectorOpcionesCondicionales() {
    const selectorOpciones = document.getElementById('opcion-condicional');
    if (!selectorOpciones) return;
    
    // Limpiar opciones anteriores excepto la primera
    while (selectorOpciones.options.length > 1) {
        selectorOpciones.remove(1);
    }
    
    // Añadir las opciones actuales
    if (preguntaActualId && opcionesPregunta[preguntaActualId]) {
        opcionesPregunta[preguntaActualId].forEach(opcion => {
            // No añadir opciones que ya tienen subpreguntas
            if (subpreguntasOpciones[opcion.id]) return;
            
            const option = document.createElement('option');
            option.value = opcion.id;
            option.textContent = opcion.texto;
            selectorOpciones.appendChild(option);
        });
    }
}

// Cuando se selecciona una opción para añadir subpregunta
function seleccionarOpcionCondicional() {
    const opcionId = document.getElementById('opcion-condicional').value;
    const configuracionSubpregunta = document.getElementById('configuracion-subpregunta');
    
    if (opcionId) {
        configuracionSubpregunta.classList.remove('hidden');
        opcionActualId = opcionId;
    } else {
        configuracionSubpregunta.classList.add('hidden');
        opcionActualId = null;
    }
}

// Agregar una opción a una subpregunta
function agregarOpcionSubpregunta() {
    const listaOpcionesSubpregunta = document.getElementById('lista-opciones-subpregunta');
    const numOpciones = listaOpcionesSubpregunta.children.length;
    
    // Limitar a 5 opciones
    if (numOpciones >= 5) {
        mostrarAlerta('No se pueden agregar más de 5 opciones a una subpregunta', 'advertencia');
        return;
    }
    
    // Crear un ID temporal para la opción de subpregunta
    const opcionId = 'subopt_' + generarId();
    
    // Crear el elemento de opción
    const opcionDiv = document.createElement('div');
    opcionDiv.className = 'opcion';
    opcionDiv.dataset.opcionId = opcionId;
    
    opcionDiv.innerHTML = `
        <input type="text" class="texto-opcion" placeholder="Texto de la opción" required>
        <button type="button" class="btn-eliminar-opcion">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Añadir evento para eliminar la opción
    opcionDiv.querySelector('.btn-eliminar-opcion').addEventListener('click', function() {
        opcionDiv.remove();
    });
    
    // Añadir a la lista
    listaOpcionesSubpregunta.appendChild(opcionDiv);
}

// Agregar una subpregunta a una opción
function agregarSubpregunta() {
    if (!opcionActualId) {
        mostrarAlerta('Debes seleccionar una opción para la subpregunta', 'error');
        return;
    }
    
    // Obtener datos de la subpregunta
    const textoSubpregunta = document.getElementById('texto-subpregunta').value.trim();
    const tipoSubpregunta = document.getElementById('tipo-subpregunta').value;
    const obligatoriaSubpregunta = document.getElementById('obligatoria-subpregunta').value === 'true';
    
    if (!textoSubpregunta) {
        mostrarAlerta('Debes ingresar el texto de la subpregunta', 'error');
        return;
    }
    
    // Crear ID para la subpregunta
    const subpreguntaId = 'sub_' + generarId();
    
    // Crear objeto de subpregunta
    const subpregunta = {
        id: subpreguntaId,
        texto: textoSubpregunta,
        tipo: tipoSubpregunta,
        obligatoria: obligatoriaSubpregunta,
        opcionTrigger: opcionActualId,
        opciones: []
    };
    
    // Si es de opción múltiple, recoger las opciones
    if (tipoSubpregunta === 'opcion_multiple') {
        const opcionesElements = document.getElementById('lista-opciones-subpregunta').children;
        
        if (opcionesElements.length === 0) {
            mostrarAlerta('Debes agregar al menos una opción para la subpregunta', 'error');
            return;
        }
        
        // Recoger cada opción
        Array.from(opcionesElements).forEach(opcionElement => {
            const textoOpcion = opcionElement.querySelector('.texto-opcion').value.trim();
            const opcionId = opcionElement.dataset.opcionId;
            
            if (textoOpcion) {
                subpregunta.opciones.push({
                    id: opcionId,
                    texto: textoOpcion
                });
            }
        });
        
        // Guardar opciones de la subpregunta
        opcionesSubpregunta[subpreguntaId] = [...subpregunta.opciones];
    }
    
    // Asociar la subpregunta a la opción
    subpreguntasOpciones[opcionActualId] = subpregunta;
    
    // Mostrar la subpregunta en la interfaz
    mostrarSubpreguntaEnLista(subpregunta);
    
    // Limpiar formulario y actualizar UI
    limpiarFormularioSubpregunta();
    actualizarSelectorOpcionesCondicionales();
    actualizarOpcionesConSubpreguntas();
    
    mostrarAlerta('Subpregunta añadida correctamente', 'exito');
}

// Mostrar la subpregunta en la lista de subpreguntas
function mostrarSubpreguntaEnLista(subpregunta) {
    const listaSubpreguntas = document.getElementById('lista-subpreguntas');
    
    // Crear elemento de subpregunta
    const subpreguntaDiv = document.createElement('div');
    subpreguntaDiv.className = 'subpregunta-item';
    subpreguntaDiv.dataset.subpreguntaId = subpregunta.id;
    
    // Encontrar el texto de la opción trigger
    let textoOpcionTrigger = 'Opción desconocida';
    if (preguntaActualId && opcionesPregunta[preguntaActualId]) {
        const opcionTrigger = opcionesPregunta[preguntaActualId].find(o => o.id === subpregunta.opcionTrigger);
        if (opcionTrigger) {
            textoOpcionTrigger = opcionTrigger.texto;
        }
    }
    
    // Tipo de subpregunta para mostrar
    const tipoTexto = subpregunta.tipo === 'abierta' ? 'Abierta' : 'Opción múltiple';
    const badgeClass = `badge badge-${subpregunta.tipo}`;
    
    subpreguntaDiv.innerHTML = `
        <div class="titulo-subpregunta">
            ${subpregunta.texto}
            <span class="${badgeClass}">${tipoTexto}</span>
        </div>
        <div class="subpregunta-trigger">
            Se muestra cuando se selecciona: "${textoOpcionTrigger}"
        </div>
        <div class="subpregunta-info">
            ${subpregunta.obligatoria ? 'Obligatoria' : 'Opcional'} 
            ${subpregunta.tipo === 'opcion_multiple' ? '• ' + subpregunta.opciones.length + ' opciones' : ''}
        </div>
        <button type="button" class="eliminar-subpregunta" title="Eliminar subpregunta">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // Añadir evento para eliminar la subpregunta
    subpreguntaDiv.querySelector('.eliminar-subpregunta').addEventListener('click', function() {
        eliminarSubpregunta(subpregunta.id);
        subpreguntaDiv.remove();
    });
    
    // Añadir a la lista
    listaSubpreguntas.appendChild(subpreguntaDiv);
}

// Eliminar una subpregunta
function eliminarSubpregunta(subpreguntaId) {
    if (!subpreguntaId) return;
    
    // Encontrar la opción asociada
    let opcionId = null;
    for (const [key, subpregunta] of Object.entries(subpreguntasOpciones)) {
        if (subpregunta.id === subpreguntaId) {
            opcionId = key;
            break;
        }
    }
    
    // Eliminar la subpregunta
    if (opcionId) {
        delete subpreguntasOpciones[opcionId];
        delete opcionesSubpregunta[subpreguntaId];
        
        // Actualizar la UI
        actualizarSelectorOpcionesCondicionales();
        actualizarOpcionesConSubpreguntas();
        mostrarAlerta('Subpregunta eliminada', 'exito');
    }
}

// Actualizar las opciones que tienen subpreguntas para mostrar un indicador
function actualizarOpcionesConSubpreguntas() {
    // Actualizar las opciones en el formulario principal
    const listaOpciones = document.getElementById('lista-opciones');
    if (!listaOpciones) return;
    
    Array.from(listaOpciones.children).forEach(opcionElement => {
        const opcionId = opcionElement.dataset.opcionId;
        const indicador = opcionElement.querySelector('.tiene-subpregunta');
        
        if (subpreguntasOpciones[opcionId]) {
            // Añadir indicador si no existe
            if (!indicador) {
                const label = opcionElement.querySelector('.texto-opcion').parentElement;
                const span = document.createElement('span');
                span.className = 'tiene-subpregunta';
                span.textContent = 'Tiene subpregunta';
                label.classList.add('option-label');
                label.appendChild(span);
            }
        } else if (indicador) {
            // Eliminar indicador si existe pero ya no tiene subpregunta
            indicador.remove();
        }
    });
}

// Limpiar el formulario de subpregunta
function limpiarFormularioSubpregunta() {
    document.getElementById('texto-subpregunta').value = '';
    document.getElementById('tipo-subpregunta').value = 'abierta';
    document.getElementById('obligatoria-subpregunta').value = 'true';
    document.getElementById('lista-opciones-subpregunta').innerHTML = '';
    document.getElementById('opciones-subpregunta').classList.add('hidden');
    document.getElementById('opcion-condicional').value = '';
    document.getElementById('configuracion-subpregunta').classList.add('hidden');
    opcionActualId = null;
}

// Cargar subpreguntas existentes al editar una pregunta
function cargarSubpreguntasExistentes(preguntaId) {
    const listaSubpreguntas = document.getElementById('lista-subpreguntas');
    if (!listaSubpreguntas) return;
    
    // Limpiar lista actual
    listaSubpreguntas.innerHTML = '';
    
    // Recorrer las opciones de la pregunta
    if (opcionesPregunta[preguntaId]) {
        opcionesPregunta[preguntaId].forEach(opcion => {
            // Verificar si la opción tiene subpregunta
            if (subpreguntasOpciones[opcion.id]) {
                mostrarSubpreguntaEnLista(subpreguntasOpciones[opcion.id]);
            }
        });
    }
}

// Generar ID único
function generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
