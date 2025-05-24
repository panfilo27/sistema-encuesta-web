/**
 * Gestión de Preguntas Condicionales - JavaScript
 * Este módulo maneja la funcionalidad para crear y gestionar preguntas condicionales
 * que se muestran dependiendo de respuestas específicas en preguntas de opción múltiple.
 */

// Espacio de nombres para preguntas condicionales
const PreguntasCondicionales = (function() {
    // Mapeo de preguntas condicionales: preguntaId -> opcionId -> preguntaCondicional
    let mapaPreguntasCondicionales = {};
    
    /**
     * Inicializa el gestor de preguntas condicionales
     */
    function inicializar() {
        console.log('Inicializando gestor de preguntas condicionales...');
    }
    
    /**
     * Muestra el modal para agregar/editar una pregunta condicional
     * @param {string} preguntaId - ID de la pregunta principal
     * @param {string} opcionId - ID de la opción que dispara la pregunta condicional
     */
    function mostrarModalPreguntaCondicional(preguntaId, opcionId) {
        // Referencia al modal existente de preguntas pero con título diferente
        const modal = document.getElementById('modal-pregunta-condicional');
        if (!modal) return;
        
        // Actualizar título del modal
        modal.querySelector('h2').textContent = 'Configurar Pregunta Condicional';
        
        // Limpiar formulario
        const form = modal.querySelector('form');
        form.reset();
        
        // Guardar referencia a la pregunta principal y opción
        form.dataset.preguntaPrincipalId = preguntaId;
        form.dataset.opcionId = opcionId;
        
        // Verificar si ya existe una pregunta condicional para esta opción
        const preguntaCondicional = obtenerPreguntaCondicional(preguntaId, opcionId);
        
        if (preguntaCondicional) {
            // Si existe, llenar el formulario con los datos existentes
            form.querySelector('#texto-pregunta-condicional').value = preguntaCondicional.texto;
            form.querySelector('#tipo-pregunta-condicional').value = preguntaCondicional.tipo;
            form.querySelector('#obligatoria-pregunta-condicional').value = preguntaCondicional.obligatoria.toString();
            
            // Si es opción múltiple, cargar las opciones
            if (preguntaCondicional.tipo === 'opcion_multiple' && preguntaCondicional.opciones) {
                cargarOpcionesPreguntaCondicional(preguntaCondicional.opciones);
            }
        }
        
        // Mostrar modal
        modal.style.display = 'block';
    }
    
    /**
     * Carga las opciones de una pregunta condicional en el formulario
     * @param {Array} opciones - Lista de opciones de la pregunta condicional
     */
    function cargarOpcionesPreguntaCondicional(opciones) {
        const listaOpciones = document.getElementById('lista-opciones-condicional');
        listaOpciones.innerHTML = '';
        
        opciones.forEach(opcion => {
            agregarOpcionRespuestaCondicional(opcion.texto);
        });
    }
    
    /**
     * Agrega una opción de respuesta a la pregunta condicional
     * @param {string} textoOpcion - Texto de la opción (opcional)
     */
    function agregarOpcionRespuestaCondicional(textoOpcion = '') {
        const listaOpciones = document.getElementById('lista-opciones-condicional');
        
        // Verificar límite de opciones (máximo 5)
        if (listaOpciones.children.length >= 5) {
            alert('No puedes agregar más de 5 opciones de respuesta.');
            return;
        }
        
        // Crear elemento de opción
        const divOpcion = document.createElement('div');
        divOpcion.className = 'opcion-respuesta';
        divOpcion.innerHTML = `
            <input type="text" class="texto-opcion" value="${textoOpcion}" placeholder="Texto de la opción">
            <button type="button" class="btn-eliminar-opcion">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Agregar evento para eliminar opción
        divOpcion.querySelector('.btn-eliminar-opcion').addEventListener('click', function() {
            divOpcion.remove();
        });
        
        // Agregar a la lista
        listaOpciones.appendChild(divOpcion);
    }
    
    /**
     * Guarda una pregunta condicional
     * @param {Event} event - Evento del formulario
     */
    function guardarPreguntaCondicional(event) {
        event.preventDefault();
        
        const form = event.target;
        const preguntaId = form.dataset.preguntaPrincipalId;
        const opcionId = form.dataset.opcionId;
        
        const texto = form.querySelector('#texto-pregunta-condicional').value.trim();
        const tipo = form.querySelector('#tipo-pregunta-condicional').value;
        const obligatoria = form.querySelector('#obligatoria-pregunta-condicional').value === 'true';
        
        // Validar texto
        if (!texto) {
            alert('El texto de la pregunta es obligatorio');
            return;
        }
        
        // Crear objeto de pregunta condicional
        const preguntaCondicional = {
            id: opcionId + '_cond_' + Date.now(),
            texto: texto,
            tipo: tipo,
            obligatoria: obligatoria
        };
        
        // Si es opción múltiple, obtener las opciones
        if (tipo === 'opcion_multiple') {
            const opcionesElements = form.querySelectorAll('#lista-opciones-condicional .opcion-respuesta');
            const opciones = [];
            
            opcionesElements.forEach((opcionElement, index) => {
                const textoOpcion = opcionElement.querySelector('.texto-opcion').value.trim();
                
                if (textoOpcion) {
                    opciones.push({
                        id: 'opt_cond_' + Date.now() + '_' + index,
                        texto: textoOpcion
                    });
                }
            });
            
            // Validar que haya al menos 2 opciones
            if (opciones.length < 2) {
                alert('Debes agregar al menos 2 opciones de respuesta para una pregunta de opción múltiple');
                return;
            }
            
            preguntaCondicional.opciones = opciones;
        }
        
        // Guardar la pregunta condicional
        guardarEnMapa(preguntaId, opcionId, preguntaCondicional);
        
        // Actualizar la visualización
        actualizarVisualizacionOpcion(preguntaId, opcionId);
        
        // Cerrar modal
        cerrarModalPreguntaCondicional();
    }
    
    /**
     * Guarda la pregunta condicional en el mapa
     * @param {string} preguntaId - ID de la pregunta principal
     * @param {string} opcionId - ID de la opción
     * @param {Object} preguntaCondicional - Datos de la pregunta condicional
     */
    function guardarEnMapa(preguntaId, opcionId, preguntaCondicional) {
        if (!mapaPreguntasCondicionales[preguntaId]) {
            mapaPreguntasCondicionales[preguntaId] = {};
        }
        
        mapaPreguntasCondicionales[preguntaId][opcionId] = preguntaCondicional;
    }
    
    /**
     * Obtiene una pregunta condicional del mapa
     * @param {string} preguntaId - ID de la pregunta principal
     * @param {string} opcionId - ID de la opción
     * @returns {Object|null} Pregunta condicional o null si no existe
     */
    function obtenerPreguntaCondicional(preguntaId, opcionId) {
        if (!mapaPreguntasCondicionales[preguntaId]) return null;
        
        return mapaPreguntasCondicionales[preguntaId][opcionId] || null;
    }
    
    /**
     * Actualiza la visualización de una opción para mostrar si tiene pregunta condicional
     * @param {string} preguntaId - ID de la pregunta principal
     * @param {string} opcionId - ID de la opción
     */
    function actualizarVisualizacionOpcion(preguntaId, opcionId) {
        // Buscar la opción en el DOM
        const opcionElement = document.querySelector(`.opcion-respuesta[data-opcion-id="${opcionId}"]`);
        if (!opcionElement) return;
        
        const preguntaCondicional = obtenerPreguntaCondicional(preguntaId, opcionId);
        
        // Actualizar visualización
        if (preguntaCondicional) {
            // Si tiene pregunta condicional, mostrar indicador
            if (!opcionElement.querySelector('.indicador-condicional')) {
                const indicador = document.createElement('span');
                indicador.className = 'indicador-condicional';
                indicador.innerHTML = '<i class="fas fa-level-down-alt"></i>';
                indicador.title = 'Esta opción tiene una pregunta condicional';
                opcionElement.appendChild(indicador);
            }
        } else {
            // Si no tiene, quitar indicador si existe
            const indicador = opcionElement.querySelector('.indicador-condicional');
            if (indicador) indicador.remove();
        }
    }
    
    /**
     * Cierra el modal de pregunta condicional
     */
    function cerrarModalPreguntaCondicional() {
        const modal = document.getElementById('modal-pregunta-condicional');
        if (modal) modal.style.display = 'none';
    }
    
    /**
     * Elimina una pregunta condicional
     * @param {string} preguntaId - ID de la pregunta principal
     * @param {string} opcionId - ID de la opción
     */
    function eliminarPreguntaCondicional(preguntaId, opcionId) {
        if (mapaPreguntasCondicionales[preguntaId]) {
            delete mapaPreguntasCondicionales[preguntaId][opcionId];
            
            // Si no quedan preguntas condicionales para esta pregunta, eliminar entrada
            if (Object.keys(mapaPreguntasCondicionales[preguntaId]).length === 0) {
                delete mapaPreguntasCondicionales[preguntaId];
            }
            
            // Actualizar visualización
            actualizarVisualizacionOpcion(preguntaId, opcionId);
        }
    }
    
    /**
     * Obtiene todas las preguntas condicionales para ser almacenadas
     * @returns {Object} Mapa de preguntas condicionales
     */
    function obtenerTodasPreguntasCondicionales() {
        return mapaPreguntasCondicionales;
    }
    
    /**
     * Carga preguntas condicionales desde un mapa existente
     * @param {Object} mapa - Mapa de preguntas condicionales
     */
    function cargarPreguntasCondicionales(mapa) {
        mapaPreguntasCondicionales = mapa || {};
    }
    
    // Exponer API pública
    return {
        inicializar,
        mostrarModalPreguntaCondicional,
        guardarPreguntaCondicional,
        agregarOpcionRespuestaCondicional,
        obtenerPreguntaCondicional,
        eliminarPreguntaCondicional,
        cerrarModalPreguntaCondicional,
        obtenerTodasPreguntasCondicionales,
        cargarPreguntasCondicionales
    };
})();

// Exportar para uso global
window.PreguntasCondicionales = PreguntasCondicionales;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    PreguntasCondicionales.inicializar();
});
