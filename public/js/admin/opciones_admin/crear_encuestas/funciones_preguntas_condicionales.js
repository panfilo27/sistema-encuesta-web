/**
 * Funciones auxiliares para la integración de preguntas condicionales
 */

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
    document.getElementById('modal-pregunta-condicional').querySelectorAll('.cerrar, #btn-cancelar-pregunta-condicional').forEach(elem => {
        elem.addEventListener('click', cerrarModalPreguntaCondicional);
    });
    
    document.getElementById('form-pregunta-condicional').addEventListener('submit', guardarPreguntaCondicional);
    document.getElementById('tipo-pregunta-condicional').addEventListener('change', toggleOpcionesCondicional);
    document.getElementById('btn-agregar-opcion-condicional').addEventListener('click', agregarOpcionRespuestaCondicional);
}

// Integrar con la lógica de guardar encuesta
function prepararEncuestaConPreguntas(nuevaEncuesta) {
    // Convertir preguntas condicionales a formato final para guardar
    nuevaEncuesta.modulos.forEach(modulo => {
        modulo.preguntas.forEach(pregunta => {
            if (pregunta.preguntasCondicionales) {
                // Ya están en formato adecuado gracias a la preparación en guardarPregunta
            }
        });
    });
    
    return nuevaEncuesta;
}
