/**
 * Cargador de Módulos - JavaScript
 * Este script se encarga de cargar todos los módulos necesarios para la creación de encuestas
 */

// Evitar redeclaraciones
if (typeof window.modulosYaCargados === 'undefined') {
    window.modulosYaCargados = true;

    // Función para cargar un script
    function cargarScript(url, callback) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback || function() {};
        script.onerror = function() {
            console.error('Error al cargar el script:', url);
        };
        document.head.appendChild(script);
    }

    // Función para cargar un estilo CSS
    function cargarEstilo(url) {
        if (document.querySelector(`link[href="${url}"]`)) return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    }

    // Cargar estilos
    cargarEstilo('../../../../css/admin/opciones_admin/crear_encuestas/preguntas_condicionales.css');

    // Cola de carga secuencial
    const scripts = [
        '../../../../js/admin/opciones_admin/crear_encuestas/cargar_carreras_fix.js',
        '../../../../js/admin/opciones_admin/crear_encuestas/gestionar_preguntas_condicionales.js',
        '../../../../js/admin/opciones_admin/crear_encuestas/integrar_condicionales.js',
        '../../../../js/admin/opciones_admin/crear_encuestas/crear_encuestas_fixed.js'
    ];

    // Cargar scripts en secuencia
    function cargarSiguienteScript(index) {
        if (index >= scripts.length) {
            console.log('Todos los módulos han sido cargados correctamente');
            return;
        }
        
        cargarScript(scripts[index], function() {
            cargarSiguienteScript(index + 1);
        });
    }

    // Iniciar carga
    cargarSiguienteScript(0);

    // Verificar inserción de HTML del modal
    function verificarModalCondicional() {
        if (!document.getElementById('modal-pregunta-condicional')) {
            // Cargar HTML del modal
            fetch('modal_pregunta_condicional.html')
                .then(response => response.text())
                .then(html => {
                    const div = document.createElement('div');
                    div.innerHTML = html;
                    document.body.appendChild(div.firstElementChild);
                    console.log('Modal de preguntas condicionales insertado');
                })
                .catch(error => {
                    console.error('Error al cargar el modal de pregunta condicional:', error);
                });
        }
    }

    // Verificar después de que se carguen los scripts
    setTimeout(verificarModalCondicional, 2000);
}
