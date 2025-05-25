/**
 * Gestor de Encuestas - Módulo principal
 * 
 * Este archivo maneja la interfaz y lógica general del sistema de creación de encuestas.
 * Se encarga de la inicialización, carga de encuestas existentes y coordinación entre módulos.
 */

// Variables globales
let encuestasActivas = [];
let carrerasDisponibles = [];
let carrerasSeleccionadas = [];

// Función de inicialización principal
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema de gestión de encuestas...');
    
    // Inicializar selectores y eventos
    inicializarEventos();
    
    // Cargar datos iniciales (carreras y encuestas existentes)
    cargarDatosIniciales();
});

/**
 * Inicializa todos los eventos de la interfaz
 */
function inicializarEventos() {
    // Evento para el botón de agregar carrera
    const btnAgregarCarrera = document.getElementById('btn-agregar-carrera');
    if (btnAgregarCarrera) {
        btnAgregarCarrera.addEventListener('click', agregarCarreraSeleccionada);
    }
    
    // Evento para el botón de filtrar encuestas
    const btnFiltrar = document.getElementById('btn-filtrar');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', filtrarEncuestas);
    }
    
    // Eventos para los botones principales
    const btnAgregarModulo = document.getElementById('btn-agregar-modulo');
    if (btnAgregarModulo) {
        btnAgregarModulo.addEventListener('click', function() {
            // Esta función se implementará en gestor_modulos.js
            if (typeof mostrarModalModulo === 'function') {
                mostrarModalModulo();
            } else {
                console.error('La función mostrarModalModulo no está disponible');
            }
        });
    }
    
    // Eventos para el formulario de encuesta
    const formEncuesta = document.getElementById('form-encuesta');
    if (formEncuesta) {
        formEncuesta.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarEncuesta();
        });
    }
    
    // Evento para el botón de cancelar
    const btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarCreacionEncuesta);
    }
}

/**
 * Carga las carreras y encuestas existentes
 */
function cargarDatosIniciales() {
    // Simulación de carga de carreras (esto se conectará con Firebase)
    setTimeout(() => {
        carrerasDisponibles = [
            { id: 'ing_sistemas', nombre: 'Ingeniería en Sistemas Computacionales' },
            { id: 'ing_industrial', nombre: 'Ingeniería Industrial' },
            { id: 'ing_electronica', nombre: 'Ingeniería Electrónica' },
            { id: 'ing_gestion', nombre: 'Ingeniería en Gestión Empresarial' },
            { id: 'ing_mecatronica', nombre: 'Ingeniería Mecatrónica' }
        ];
        
        // Cargar las carreras en el selector
        cargarCarrerasEnSelector();
        
        // Simular carga de encuestas existentes
        cargarEncuestasExistentes();
    }, 500);
}

/**
 * Carga las carreras en el selector desplegable
 */
function cargarCarrerasEnSelector() {
    const selectorCarrera = document.getElementById('selector-carrera');
    if (!selectorCarrera) return;
    
    // Limpiar opciones existentes (excepto la primera)
    while (selectorCarrera.options.length > 1) {
        selectorCarrera.remove(1);
    }
    
    // Agregar las carreras disponibles
    carrerasDisponibles.forEach(carrera => {
        const option = document.createElement('option');
        option.value = carrera.id;
        option.textContent = carrera.nombre;
        selectorCarrera.appendChild(option);
    });
}

/**
 * Agrega una carrera seleccionada a la lista de carreras
 */
function agregarCarreraSeleccionada() {
    const selectorCarrera = document.getElementById('selector-carrera');
    const carrerasSeleccionadasContainer = document.getElementById('carreras-seleccionadas');
    const inputCarreras = document.getElementById('carreras-encuesta');
    
    if (!selectorCarrera || !carrerasSeleccionadasContainer || !inputCarreras) return;
    
    const carreraId = selectorCarrera.value;
    const carreraNombre = selectorCarrera.options[selectorCarrera.selectedIndex].text;
    
    // Validar selección
    if (!carreraId) {
        mostrarAlerta('Por favor, selecciona una carrera', 'error');
        return;
    }
    
    // Verificar que no esté duplicada
    if (carrerasSeleccionadas.some(c => c.id === carreraId)) {
        mostrarAlerta('Esta carrera ya ha sido seleccionada', 'error');
        return;
    }
    
    // Agregar a la lista de seleccionadas
    carrerasSeleccionadas.push({ id: carreraId, nombre: carreraNombre });
    
    // Actualizar el DOM
    actualizarCarrerasSeleccionadasUI();
    
    // Resetear el selector
    selectorCarrera.value = '';
}

/**
 * Actualiza la UI con las carreras seleccionadas
 */
function actualizarCarrerasSeleccionadasUI() {
    const carrerasSeleccionadasContainer = document.getElementById('carreras-seleccionadas');
    const inputCarreras = document.getElementById('carreras-encuesta');
    
    if (!carrerasSeleccionadasContainer || !inputCarreras) return;
    
    // Limpiar el contenedor
    carrerasSeleccionadasContainer.innerHTML = '';
    
    // Agregar cada carrera como un "tag"
    carrerasSeleccionadas.forEach((carrera, index) => {
        const carreraTag = document.createElement('div');
        carreraTag.className = 'carrera-tag';
        carreraTag.innerHTML = `
            ${carrera.nombre}
            <span class="eliminar" data-id="${carrera.id}"><i class="fas fa-times"></i></span>
        `;
        
        // Configurar evento para eliminar carrera
        carreraTag.querySelector('.eliminar').addEventListener('click', function() {
            eliminarCarreraSeleccionada(carrera.id);
        });
        
        carrerasSeleccionadasContainer.appendChild(carreraTag);
    });
    
    // Actualizar el campo oculto con los IDs de las carreras
    inputCarreras.value = carrerasSeleccionadas.map(c => c.id).join(',');
}

/**
 * Elimina una carrera de la lista de seleccionadas
 */
function eliminarCarreraSeleccionada(carreraId) {
    // Filtrar la carrera seleccionada
    carrerasSeleccionadas = carrerasSeleccionadas.filter(c => c.id !== carreraId);
    
    // Actualizar la UI
    actualizarCarrerasSeleccionadasUI();
}

/**
 * Carga las encuestas existentes desde Firestore (simulado por ahora)
 */
function cargarEncuestasExistentes() {
    // Simulación de datos de encuestas para la interfaz
    const encuestasSimuladas = [
        {
            id: 'enc1',
            nombre: 'Encuesta de Satisfacción Estudiantil',
            carreraId: 'ing_sistemas',
            carreraNombre: 'Ingeniería en Sistemas Computacionales',
            fechaCreacion: new Date('2023-09-15'),
            modulos: 3,
            preguntas: 15
        },
        {
            id: 'enc2',
            nombre: 'Evaluación Docente 2023',
            carreraId: 'ing_industrial',
            carreraNombre: 'Ingeniería Industrial',
            fechaCreacion: new Date('2023-10-05'),
            modulos: 5,
            preguntas: 25
        },
        {
            id: 'enc3',
            nombre: 'Encuesta sobre Infraestructura',
            carreraId: 'todas',
            carreraNombre: 'Todas las carreras',
            fechaCreacion: new Date('2023-11-20'),
            modulos: 2,
            preguntas: 10
        }
    ];
    
    // Mostrar las encuestas en la tabla
    mostrarEncuestasEnTabla(encuestasSimuladas);
}

/**
 * Muestra las encuestas en la tabla
 */
function mostrarEncuestasEnTabla(encuestas) {
    const tablaEncuestas = document.getElementById('cuerpo-tabla-encuestas');
    if (!tablaEncuestas) return;
    
    // Limpiar la tabla
    tablaEncuestas.innerHTML = '';
    
    if (encuestas.length === 0) {
        const fila = document.createElement('tr');
        fila.innerHTML = `<td colspan="6" class="texto-centrado">No hay encuestas disponibles</td>`;
        tablaEncuestas.appendChild(fila);
        return;
    }
    
    // Agregar cada encuesta a la tabla
    encuestas.forEach(encuesta => {
        const fechaFormateada = encuesta.fechaCreacion.toLocaleDateString();
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${encuesta.nombre}</td>
            <td>${encuesta.carreraNombre}</td>
            <td>${fechaFormateada}</td>
            <td>${encuesta.modulos}</td>
            <td>${encuesta.preguntas}</td>
            <td>
                <button class="btn-accion btn-editar" data-id="${encuesta.id}"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn-accion btn-eliminar" data-id="${encuesta.id}"><i class="fas fa-trash"></i> Eliminar</button>
                <button class="btn-accion btn-ver" data-id="${encuesta.id}"><i class="fas fa-eye"></i> Ver</button>
            </td>
        `;
        
        // Configurar eventos para los botones
        fila.querySelector('.btn-editar').addEventListener('click', function() {
            editarEncuesta(encuesta.id);
        });
        
        fila.querySelector('.btn-eliminar').addEventListener('click', function() {
            eliminarEncuesta(encuesta.id);
        });
        
        fila.querySelector('.btn-ver').addEventListener('click', function() {
            verEncuesta(encuesta.id);
        });
        
        tablaEncuestas.appendChild(fila);
    });
}

/**
 * Filtra las encuestas según los criterios seleccionados
 */
function filtrarEncuestas() {
    const filtroTexto = document.getElementById('filtro-texto').value.toLowerCase();
    const filtroCarrera = document.getElementById('filtro-carrera').value;
    
    // Filtrar encuestas (simulación)
    const encuestasFiltradas = encuestasActivas.filter(encuesta => {
        // Filtrar por texto
        const coincideTexto = !filtroTexto || 
            encuesta.nombre.toLowerCase().includes(filtroTexto);
        
        // Filtrar por carrera
        const coincideCarrera = !filtroCarrera || 
            encuesta.carreraId === filtroCarrera;
        
        return coincideTexto && coincideCarrera;
    });
    
    // Actualizar la tabla con los resultados filtrados
    mostrarEncuestasEnTabla(encuestasFiltradas);
}

/**
 * Editar una encuesta existente
 */
function editarEncuesta(encuestaId) {
    console.log(`Editando encuesta ${encuestaId}`);
    
    // Por ahora solo mostraremos un mensaje
    mostrarAlerta('Función de edición en desarrollo', 'info');
}

/**
 * Eliminar una encuesta
 */
function eliminarEncuesta(encuestaId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta encuesta?')) {
        console.log(`Eliminando encuesta ${encuestaId}`);
        
        // Simular eliminación
        mostrarAlerta('Encuesta eliminada correctamente', 'success');
        
        // Recargar tabla
        cargarEncuestasExistentes();
    }
}

/**
 * Ver detalles de una encuesta
 */
function verEncuesta(encuestaId) {
    console.log(`Viendo encuesta ${encuestaId}`);
    
    // Por ahora solo mostraremos un mensaje
    mostrarAlerta('Función de visualización en desarrollo', 'info');
}

/**
 * Guardar una nueva encuesta
 */
function guardarEncuesta() {
    // Obtener datos del formulario
    const nombreEncuesta = document.getElementById('nombre-encuesta').value.trim();
    const descripcionEncuesta = document.getElementById('descripcion-encuesta').value.trim();
    
    // Validaciones básicas
    if (!nombreEncuesta) {
        mostrarAlerta('El nombre de la encuesta es obligatorio', 'error');
        return;
    }
    
    if (carrerasSeleccionadas.length === 0) {
        mostrarAlerta('Debes seleccionar al menos una carrera', 'error');
        return;
    }
    
    // Simulación de guardado
    console.log('Guardando encuesta:', {
        nombre: nombreEncuesta,
        descripcion: descripcionEncuesta,
        carreras: carrerasSeleccionadas
    });
    
    // Por ahora solo mostraremos un mensaje de éxito
    mostrarAlerta('Encuesta guardada correctamente', 'success');
    
    // Resetear formulario
    resetearFormulario();
    
    // Recargar encuestas
    cargarEncuestasExistentes();
}

/**
 * Cancela la creación de encuesta y resetea el formulario
 */
function cancelarCreacionEncuesta() {
    if (confirm('¿Estás seguro de que deseas cancelar? Se perderán todos los datos no guardados.')) {
        resetearFormulario();
    }
}

/**
 * Resetea el formulario de creación de encuesta
 */
function resetearFormulario() {
    document.getElementById('form-encuesta').reset();
    carrerasSeleccionadas = [];
    actualizarCarrerasSeleccionadasUI();
    
    // Limpiar módulos (esto se implementará completamente en el gestor de módulos)
    document.getElementById('lista-modulos').innerHTML = '';
}

/**
 * Muestra una alerta al usuario
 */
function mostrarAlerta(mensaje, tipo = 'info') {
    // Por ahora usaremos alert básico
    alert(`${tipo.toUpperCase()}: ${mensaje}`);
}

// Exportar funciones que necesitan ser accesibles desde otros módulos
window.carrerasDisponibles = carrerasDisponibles;
window.carrerasSeleccionadas = carrerasSeleccionadas;
window.mostrarAlerta = mostrarAlerta;
