/**
 * Resultados de Encuestas - JavaScript
 * Este archivo maneja la visualización de resultados y estadísticas de las encuestas
 * en forma de gráficas utilizando Chart.js
 */

// Evitamos redeclaraciones usando una función auto-ejecutable
(function() {
// Variables globales (ahora en ámbito local a esta función)
let graficasResultados = {};
let datosEncuestas = [];
let filtroCarrera = '';
let filtroPeriodo = '';
let filtroAnio = '';

// Verificamos si el script ya se ha cargado para evitar múltiples ejecuciones
if (window.resultadosModuloCargado) {
    console.log('El módulo de resultados ya está cargado');
    return;
}

// Marcamos el script como cargado
window.resultadosModuloCargado = true;

// Colores para las gráficas
const colores = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)',
    'rgba(83, 102, 255, 0.7)',
    'rgba(40, 167, 69, 0.7)',
    'rgba(220, 53, 69, 0.7)'
];

// Bordes para las gráficas
const bordes = [
    'rgba(54, 162, 235, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(199, 199, 199, 1)',
    'rgba(83, 102, 255, 1)',
    'rgba(40, 167, 69, 1)',
    'rgba(220, 53, 69, 1)'
];

/**
 * Inicializa la página de resultados
 */
async function inicializarPaginaResultados() {
    console.log('Inicializando página de resultados de encuestas');
    
    // Verificar si estamos en la página correcta
    if (!document.getElementById('grafica-sexo') && 
        !document.getElementById('grafica-estado') && 
        !document.getElementById('grafica-idiomas')) {
        console.log('No se encontraron los elementos canvas. Esperando a que la página cargue completamente...');
        
        // Esperar a que la página se cargue completamente
        setTimeout(inicializarPaginaResultados, 500);
        return;
    }
    
    // Inicializar Firebase
    if (typeof firebase !== 'undefined') {
        // Usamos firebase.firestore() directamente sin asignarlo a una variable global
        await inicializarModuloResultados();
        
        // Inicializar listeners de filtros
        inicializarFiltros();
    } else {
        console.error('Firebase no está disponible');
        mostrarError('No se pudo conectar con la base de datos. Por favor, recargue la página.');
    }
}

// Ejecutar inicialización cuando el script se carga
inicializarPaginaResultados();

})(); // Fin de la función auto-ejecutable

/**
 * Inicializa el módulo de resultados
 */
async function inicializarModuloResultados() {
    try {
        // Cargar las carreras para el filtro
        await cargarCarreras();
        
        // Cargar datos de encuestas (módulo 1)
        await cargarDatosEncuestas();
        
        // Inicializar gráficas
        inicializarGraficas();
        
    } catch (error) {
        console.error('Error al inicializar el módulo de resultados:', error);
        mostrarError('Error al cargar los datos. Por favor, recargue la página.');
    }
}

/**
 * Carga las carreras disponibles para el filtro
 */
async function cargarCarreras() {
    try {
        const select = document.getElementById('filtro-carrera');
        
        if (!select) return;
        
        // Preservar la opción de "Todas las carreras"
        const opcionTodas = select.options[0];
        select.innerHTML = '';
        select.appendChild(opcionTodas);
        
        // Obtener carreras de Firestore
        const snapshot = await firebase.firestore().collection('carreras').get();
        
        if (snapshot.empty) {
            console.log('No hay carreras disponibles');
            return;
        }
        
        // Agregar cada carrera al select
        snapshot.forEach(doc => {
            const carrera = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = carrera.nombre;
            select.appendChild(option);
        });
        
        console.log('Carreras cargadas correctamente');
    } catch (error) {
        console.error('Error al cargar las carreras:', error);
    }
}

/**
 * Carga los datos de encuestas (módulo 1) desde Firestore
 */
async function cargarDatosEncuestas() {
    try {
        console.log('Cargando datos de encuestas (módulo 1)...');
        
        // Añadimos datos de prueba para asegurar que las gráficas no estén vacías
        const datosPrueba = [
            {
                sexo: 'M',
                trabaja: true,
                estudia: false,
                idiomas: ['Inglés', 'Francés'],
                nombreCarrera: 'Ingeniería en Sistemas'
            },
            {
                sexo: 'F',
                trabaja: true,
                estudia: true,
                idiomas: ['Inglés', 'Alemán'],
                nombreCarrera: 'Ingeniería en Sistemas'
            },
            {
                sexo: 'M',
                trabaja: false,
                estudia: true,
                idiomas: ['Inglés'],
                nombreCarrera: 'Ingeniería Mecatrónica'
            },
            {
                sexo: 'F',
                trabaja: false,
                estudia: false,
                idiomas: ['Inglés', 'Japonés', 'Francés'],
                nombreCarrera: 'Ingeniería Industrial'
            }
        ];
        
        // Referencia a la colección historial_encuestas
        const snapshot = await firebase.firestore().collection('historial_encuestas')
            .where('moduloId', '==', 'modulo1')
            .where('completado', '==', true)
            .get();
        
        if (snapshot.empty) {
            console.log('No hay datos de encuestas disponibles');
            mostrarMensaje('No hay datos de encuestas disponibles');
            return;
        }
        
        // Procesar documentos
        const promesasUsuarios = [];
        const datosTemp = [];
        
        snapshot.forEach(doc => {
            const datos = doc.data();
            
            // Convertir timestamps a fechas
            if (datos.fechaCompletado && datos.fechaCompletado.toDate) {
                datos.fechaCompletado = datos.fechaCompletado.toDate();
            }
            
            // Guardar datos básicos
            const datoEncuesta = {
                id: doc.id,
                ...datos,
                nombreAlumno: '',
                nombreCarrera: '',
                alumnoId: datos.alumnoId || datos.uid
            };
            
            // Agregar a datos temporales
            datosTemp.push(datoEncuesta);
            
            // Preparar promesa para obtener información del alumno
            if (datoEncuesta.alumnoId) {
                const promesa = firebase.firestore().collection('usuario')
                    .where('uid', '==', datoEncuesta.alumnoId)
                    .get()
                    .then(userSnapshot => {
                        if (!userSnapshot.empty) {
                            const usuario = userSnapshot.docs[0].data();
                            datoEncuesta.nombreAlumno = `${usuario.nombre || ''} ${usuario.apellidoPaterno || ''} ${usuario.apellidoMaterno || ''}`.trim();
                            datoEncuesta.nombreCarrera = usuario.nombreCarrera || datos.carrera || '';
                        }
                    })
                    .catch(error => {
                        console.error(`Error al obtener información del alumno ${datoEncuesta.alumnoId}:`, error);
                    });
                
                promesasUsuarios.push(promesa);
            }
        });
        
        // Esperar a que se resuelvan todas las promesas
        await Promise.all(promesasUsuarios);
        
        // Actualizar datos globales
        datosEncuestas = datosTemp;
        console.log(`Datos cargados: ${datosEncuestas.length} encuestas`);
        
    } catch (error) {
        console.error('Error al cargar datos de encuestas:', error);
        mostrarError('Error al cargar los datos de encuestas');
    }
}

/**
 * Inicializa los listeners de los filtros
 */
function inicializarFiltros() {
    // Filtro de carrera
    const filtroCarreraSelect = document.getElementById('filtro-carrera');
    if (filtroCarreraSelect) {
        filtroCarreraSelect.addEventListener('change', function() {
            filtroCarrera = this.value;
            actualizarGraficas();
        });
    }
    
    // Filtro de periodo
    const filtroPeriodoSelect = document.getElementById('filtro-periodo');
    if (filtroPeriodoSelect) {
        filtroPeriodoSelect.addEventListener('change', function() {
            filtroPeriodo = this.value;
            actualizarGraficas();
        });
    }
    
    // Filtro de año
    const filtroAnioSelect = document.getElementById('filtro-anio');
    if (filtroAnioSelect) {
        filtroAnioSelect.addEventListener('change', function() {
            filtroAnio = this.value;
            actualizarGraficas();
        });
    }
}

/**
 * Inicializa las gráficas con los datos cargados
 */
function inicializarGraficas() {
    // Verificar que los elementos canvas existen antes de inicializar las gráficas
    setTimeout(() => {
        // Inicializar gráfica de distribución por sexo si el canvas existe
        const canvasSexo = document.getElementById('grafica-sexo');
        if (canvasSexo) {
            inicializarGraficaSexo();
        } else {
            console.error('No se encontró el canvas para la gráfica de sexo');
        }
        
        // Inicializar gráfica de estado laboral/académico si el canvas existe
        const canvasEstado = document.getElementById('grafica-estado');
        if (canvasEstado) {
            inicializarGraficaEstado();
        } else {
            console.error('No se encontró el canvas para la gráfica de estado');
        }
        
        // Inicializar gráfica de idiomas si el canvas existe
        const canvasIdiomas = document.getElementById('grafica-idiomas');
        if (canvasIdiomas) {
            inicializarGraficaIdiomas();
        } else {
            console.error('No se encontró el canvas para la gráfica de idiomas');
        }
    }, 300); // Pequeño retraso para asegurar que el DOM esté completamente cargado
}

/**
 * Filtra los datos según los criterios de filtro actuales
 * @returns {Array} Datos filtrados
 */
function filtrarDatos() {
    return datosEncuestas.filter(dato => {
        // Filtrar por carrera
        if (filtroCarrera && dato.nombreCarrera !== filtroCarrera && dato.carreraId !== filtroCarrera) {
            return false;
        }
        
        // Filtrar por periodo
        if (filtroPeriodo && dato.mesEgreso !== filtroPeriodo) {
            return false;
        }
        
        // Filtrar por año
        if (filtroAnio) {
            const anioEgreso = dato.mesEgreso ? dato.mesEgreso.split('/')[1] : null;
            if (anioEgreso !== filtroAnio) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Actualiza todas las gráficas con los datos filtrados
 */
function actualizarGraficas() {
    // Actualizar gráfica de distribución por sexo
    actualizarGraficaSexo();
    
    // Actualizar gráfica de estado laboral/académico
    actualizarGraficaEstado();
    
    // Actualizar gráfica de idiomas
    actualizarGraficaIdiomas();
}

/**
 * Inicializa la gráfica de distribución por sexo
 */
function inicializarGraficaSexo() {
    const canvas = document.getElementById('grafica-sexo');
    if (!canvas) {
        console.error('Canvas grafica-sexo no encontrado');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Conteo inicial
    const { hombres, mujeres } = contarPorSexo(datosEncuestas);
    
    // Crear gráfica
    graficasResultados.sexo = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Hombres', 'Mujeres'],
            datasets: [{
                data: [hombres, mujeres],
                backgroundColor: [colores[0], colores[1]],
                borderColor: [bordes[0], bordes[1]],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Actualiza la gráfica de distribución por sexo
 */
function actualizarGraficaSexo() {
    if (!graficasResultados.sexo) return;
    
    const datosFiltrados = filtrarDatos();
    const { hombres, mujeres } = contarPorSexo(datosFiltrados);
    
    // Actualizar datos
    graficasResultados.sexo.data.datasets[0].data = [hombres, mujeres];
    graficasResultados.sexo.update();
}

/**
 * Cuenta el número de hombres y mujeres en los datos
 * @param {Array} datos - Datos de encuestas
 * @returns {Object} Conteo {hombres, mujeres}
 */
function contarPorSexo(datos) {
    let hombres = 0;
    let mujeres = 0;
    
    datos.forEach(dato => {
        if (dato.sexo === 'M' || dato.sexo === 'Masculino') {
            hombres++;
        } else if (dato.sexo === 'F' || dato.sexo === 'Femenino') {
            mujeres++;
        }
    });
    
    return { hombres, mujeres };
}

/**
 * Inicializa la gráfica de estado laboral/académico
 */
function inicializarGraficaEstado() {
    const canvas = document.getElementById('grafica-estado');
    if (!canvas) {
        console.error('Canvas grafica-estado no encontrado');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Conteo inicial
    const { trabaja, estudia, ambos, ninguno } = contarPorEstado(datosEncuestas);
    
    // Crear gráfica
    graficasResultados.estado = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Trabaja', 'Estudia', 'Ambos', 'Ninguno'],
            datasets: [{
                label: 'Cantidad de egresados',
                data: [trabaja, estudia, ambos, ninguno],
                backgroundColor: [colores[2], colores[3], colores[4], colores[5]],
                borderColor: [bordes[2], bordes[3], bordes[4], bordes[5]],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Actualiza la gráfica de estado laboral/académico
 */
function actualizarGraficaEstado() {
    if (!graficasResultados.estado) return;
    
    const datosFiltrados = filtrarDatos();
    const { trabaja, estudia, ambos, ninguno } = contarPorEstado(datosFiltrados);
    
    // Actualizar datos
    graficasResultados.estado.data.datasets[0].data = [trabaja, estudia, ambos, ninguno];
    graficasResultados.estado.update();
}

/**
 * Cuenta el estado laboral/académico en los datos
 * @param {Array} datos - Datos de encuestas
 * @returns {Object} Conteo {trabaja, estudia, ambos, ninguno}
 */
function contarPorEstado(datos) {
    let trabaja = 0;
    let estudia = 0;
    let ambos = 0;
    let ninguno = 0;
    
    datos.forEach(dato => {
        const estaTrabajando = dato.trabaja === true;
        const estaEstudiando = dato.estudia === true;
        
        if (estaTrabajando && estaEstudiando) {
            ambos++;
        } else if (estaTrabajando) {
            trabaja++;
        } else if (estaEstudiando) {
            estudia++;
        } else {
            ninguno++;
        }
    });
    
    return { trabaja, estudia, ambos, ninguno };
}

/**
 * Inicializa la gráfica de idiomas
 */
function inicializarGraficaIdiomas() {
    const canvas = document.getElementById('grafica-idiomas');
    if (!canvas) {
        console.error('Canvas grafica-idiomas no encontrado');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Conteo inicial
    const conteoIdiomas = contarIdiomas(datosEncuestas);
    const idiomasOrdenados = ordenarConteo(conteoIdiomas, 5);
    
    // Crear gráfica
    graficasResultados.idiomas = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: idiomasOrdenados.map(item => item.nombre),
            datasets: [{
                data: idiomasOrdenados.map(item => item.cantidad),
                backgroundColor: idiomasOrdenados.map((_, i) => colores[i % colores.length]),
                borderColor: idiomasOrdenados.map((_, i) => bordes[i % bordes.length]),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = idiomasOrdenados.reduce((acc, item) => acc + item.cantidad, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Actualiza la gráfica de idiomas
 */
function actualizarGraficaIdiomas() {
    if (!graficasResultados.idiomas) return;
    
    const datosFiltrados = filtrarDatos();
    const conteoIdiomas = contarIdiomas(datosFiltrados);
    const idiomasOrdenados = ordenarConteo(conteoIdiomas, 5);
    
    // Actualizar datos
    graficasResultados.idiomas.data.labels = idiomasOrdenados.map(item => item.nombre);
    graficasResultados.idiomas.data.datasets[0].data = idiomasOrdenados.map(item => item.cantidad);
    graficasResultados.idiomas.data.datasets[0].backgroundColor = idiomasOrdenados.map((_, i) => colores[i % colores.length]);
    graficasResultados.idiomas.data.datasets[0].borderColor = idiomasOrdenados.map((_, i) => bordes[i % bordes.length]);
    graficasResultados.idiomas.update();
}

/**
 * Cuenta los idiomas en los datos
 * @param {Array} datos - Datos de encuestas
 * @returns {Object} Conteo de idiomas {idioma: cantidad}
 */
function contarIdiomas(datos) {
    const conteo = {};
    
    datos.forEach(dato => {
        if (Array.isArray(dato.idiomas)) {
            dato.idiomas.forEach(idioma => {
                if (idioma) {
                    conteo[idioma] = (conteo[idioma] || 0) + 1;
                }
            });
        }
    });
    
    return conteo;
}

/**
 * Ordena un objeto de conteo por cantidad (mayor a menor)
 * @param {Object} conteo - Objeto con conteo {clave: cantidad}
 * @param {Number} limite - Número máximo de elementos a retornar
 * @returns {Array} Array ordenado de objetos {nombre, cantidad}
 */
function ordenarConteo(conteo, limite = 5) {
    const array = Object.entries(conteo).map(([nombre, cantidad]) => ({ nombre, cantidad }));
    
    // Ordenar por cantidad (mayor a menor)
    array.sort((a, b) => b.cantidad - a.cantidad);
    
    // Limitar cantidad si es necesario
    if (limite > 0 && array.length > limite) {
        const otros = array.slice(limite).reduce((acc, item) => acc + item.cantidad, 0);
        const limitados = array.slice(0, limite);
        
        if (otros > 0) {
            limitados.push({ nombre: 'Otros', cantidad: otros });
        }
        
        return limitados;
    }
    
    return array;
}

/**
 * Muestra un mensaje de error en la interfaz
 * @param {String} mensaje - Mensaje de error
 */
function mostrarError(mensaje) {
    console.error(mensaje);
    mostrarMensaje(mensaje, 'error');
}

/**
 * Muestra un mensaje en la interfaz
 * @param {String} mensaje - Mensaje a mostrar
 * @param {String} tipo - Tipo de mensaje ('info', 'error', 'success')
 */
function mostrarMensaje(mensaje, tipo = 'info') {
    // Buscar contenedor de gráficas
    const contenedor = document.querySelector('.graficas-container');
    if (!contenedor) {
        console.error('No se encontró el contenedor de gráficas para mostrar el mensaje:', mensaje);
        return;
    }
    
    // Crear elemento de mensaje
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = `mensaje mensaje-${tipo}`;
    mensajeDiv.style.padding = '20px';
    mensajeDiv.style.backgroundColor = tipo === 'error' ? '#ffebee' : '#e8f5e9';
    mensajeDiv.style.color = tipo === 'error' ? '#c62828' : '#2e7d32';
    mensajeDiv.style.borderRadius = '4px';
    mensajeDiv.style.margin = '20px 0';
    mensajeDiv.style.textAlign = 'center';
    mensajeDiv.style.fontWeight = 'bold';
    mensajeDiv.textContent = mensaje;
    
    // Limpiar contenedor y mostrar mensaje
    contenedor.innerHTML = '';
    contenedor.appendChild(mensajeDiv);
}
