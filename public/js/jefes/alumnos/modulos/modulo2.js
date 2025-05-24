/**
 * Módulo 2: Evaluación de la Formación Académica - Vista Admin
 * Este archivo maneja la funcionalidad para mostrar los datos del módulo 2
 * en el panel de administración.
 */

// Variables globales
let datosModulo = null;
let db = null;
let alumnoId = null;
let encuestaId = null;

// Inicializar Firebase si aún no está inicializado
if (typeof firebase !== 'undefined') {
    db = firebase.firestore();
} else {
    console.error('Firebase no está disponible');
}

/**
 * Inicializa la vista del módulo para el panel de administración
 * @param {Object} datos - Datos del módulo a mostrar
 */
function inicializarVistaAdminModulo(datos) {
    try {
        console.log('Inicializando vista admin para Módulo 2', datos);
        
        // Guardar los datos
        datosModulo = datos;
        alumnoId = datos.alumnoId;
        encuestaId = datos.encuestaId;
        
        // Verificar si el modelo de Módulo 2 está disponible
        if (typeof parseModulo2Firestore !== 'function') {
            cargarModeloModulo2();
            return; // La función continuará después de cargar el modelo
        }
        
        // Actualizar información de estado
        document.getElementById('estado-modulo').textContent = datos.completado ? 'Completado' : 'En progreso';
        
        // Mostrar fecha de completado si existe
        if (datos.fechaCompletado) {
            document.getElementById('fecha-completado').textContent = datos.fechaCompletado.toLocaleString();
        } else {
            document.getElementById('fecha-completado').textContent = 'No disponible';
        }
        
        // Cargar los datos en el formulario usando el modelo
        cargarDatosFormulario();
        
    } catch (error) {
        console.error('Error al inicializar vista admin del módulo 2:', error);
        alert('Error al cargar los datos del módulo. Por favor, inténtelo de nuevo.');
    }
}

/**
 * Carga el modelo del Módulo 2 dinámicamente
 */
function cargarModeloModulo2() {
    const scriptModelo = document.createElement('script');
    scriptModelo.src = '../../../../models/modulos/modulo2.js';
    scriptModelo.onload = function() {
        console.log('Modelo Módulo 2 cargado correctamente');
        cargarDatosFormulario();
    };
    scriptModelo.onerror = function() {
        console.error('Error al cargar el modelo Módulo 2');
        alert('Error al cargar el modelo de datos. Algunas funcionalidades no estarán disponibles.');
    };
    document.head.appendChild(scriptModelo);
}

/**
 * Carga los datos en el formulario del módulo usando el modelo
 */
async function cargarDatosFormulario() {
    try {
        if (!datosModulo || !datosModulo.datos) {
            throw new Error('No hay datos disponibles para mostrar');
        }
        
        let datosProcesados;
        
        // Utilizar el modelo parseModulo2Firestore si está disponible
        if (typeof parseModulo2Firestore === 'function') {
            datosProcesados = parseModulo2Firestore(datosModulo.datos);
        } else {
            datosProcesados = datosModulo.datos;
        }
        
        // Mostrar valoraciones
        mostrarValoracion('calidad-docentes', datosProcesados.calidad_docentes);
        mostrarValoracion('plan-estudios', datosProcesados.plan_estudios);
        mostrarValoracion('oportunidad-proyectos', datosProcesados.oportunidad_proyectos);
        mostrarValoracion('enfasis-investigacion', datosProcesados.enfasis_investigacion);
        mostrarValoracion('satisfaccion-infraestructura', datosProcesados.satisfaccion_infraestructura);
        mostrarValoracion('experiencia-residencia', datosProcesados.experiencia_residencia);
        
        // Mostrar comentario
        if (datosProcesados.comentario_formacion && datosProcesados.comentario_formacion.trim()) {
            document.getElementById('comentario-formacion').innerHTML = `<p>${datosProcesados.comentario_formacion}</p>`;
        } else {
            document.getElementById('comentario-formacion').innerHTML = '<p class="comentario-vacio">El alumno no proporcionó comentarios adicionales.</p>';
        }
        
        // Inicializar botones de exportación después de cargar los datos
        inicializarBotonesExportacion();
        
    } catch (error) {
        console.error('Error al cargar datos en el formulario:', error);
        alert('Error al mostrar los datos del módulo: ' + error.message);
    }
}

/**
 * Muestra una valoración con estrellas
 * @param {string} id - ID base del elemento (se usará para stars-{id} y valor-{id})
 * @param {number} valor - Valor de la valoración (1-5)
 */
function mostrarValoracion(id, valor) {
    const starsContainer = document.getElementById(`stars-${id}`);
    const valorElement = document.getElementById(`valor-${id}`);
    
    if (!starsContainer || !valorElement) return;
    
    // Limpiar contenido previo
    starsContainer.innerHTML = '';
    
    // Mostrar valor numérico
    valorElement.textContent = valor || 'No evaluado';
    
    // Si no hay valor, no mostrar estrellas
    if (!valor) return;
    
    // Mostrar estrellas
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = i <= valor ? 'star' : 'star empty';
        star.innerHTML = '&#9733;'; // Estrella sólida
        starsContainer.appendChild(star);
    }
}

/**
 * Inicializa los event listeners para los botones de exportación
 */
function inicializarBotonesExportacion() {
    const btnExcel = document.getElementById('btn-exportar-excel');
    const btnPDF = document.getElementById('btn-exportar-pdf');
    
    if (btnExcel) {
        btnExcel.addEventListener('click', exportarAExcel);
    }
    
    if (btnPDF) {
        btnPDF.addEventListener('click', exportarAPDF);
    }
}

/**
 * Obtiene los datos formateados del formulario para exportación
 * @returns {Object} Datos formateados para exportación
 */
function obtenerDatosFormulario() {
    try {
        if (!datosModulo || !datosModulo.datos) {
            throw new Error('No hay datos disponibles para exportar');
        }
        
        const alumno = datosModulo.alumno || {};
        const datos = datosModulo.datos || {};
        const datosProcesados = typeof parseModulo2Firestore === 'function' ? 
            parseModulo2Firestore(datos) : datos;
        
        // Obtener datos del estado del módulo
        const estadoModulo = document.getElementById('estado-modulo').textContent;
        const fechaCompletado = document.getElementById('fecha-completado').textContent;
        
        // Obtener valoraciones
        const valoraciones = {
            calidad_docentes: document.getElementById('valor-calidad-docentes').textContent,
            plan_estudios: document.getElementById('valor-plan-estudios').textContent,
            oportunidad_proyectos: document.getElementById('valor-oportunidad-proyectos').textContent,
            enfasis_investigacion: document.getElementById('valor-enfasis-investigacion').textContent,
            satisfaccion_infraestructura: document.getElementById('valor-satisfaccion-infraestructura').textContent,
            experiencia_residencia: document.getElementById('valor-experiencia-residencia').textContent
        };
        
        // Obtener comentario
        const comentarioElement = document.getElementById('comentario-formacion');
        const comentarioVacio = comentarioElement.querySelector('.comentario-vacio');
        const comentario = comentarioVacio ? '' : comentarioElement.textContent.trim();
        
        // Crear objeto con todos los datos necesarios para la exportación
        return {
            // Información del módulo
            modulo: 'Módulo 2: Evaluación de la Formación Académica',
            estado: estadoModulo,
            fechaCompletado: fechaCompletado,
            
            // Información básica del alumno
            numeroControl: alumno.usuario || '',
            nombre: `${alumno.nombre || ''} ${alumno.apellidoPaterno || ''} ${alumno.apellidoMaterno || ''}`.trim(),
            
            // Valoraciones académicas
            valoraciones: valoraciones,
            
            // Comentario
            comentario: comentario
        };
    } catch (error) {
        console.error('Error al obtener datos del formulario para exportación:', error);
        return {};
    }
}

/**
 * Exporta los datos del módulo a un archivo Excel
 */
function exportarAExcel() {
    try {
        const datos = obtenerDatosFormulario();
        if (!datos || Object.keys(datos).length === 0) {
            throw new Error('No hay datos disponibles para exportar');
        }
        
        // Convertir datos a formato adecuado para Excel
        const worksheetData = [
            ['EVALUACIÓN DE LA FORMACIÓN ACADÉMICA - MÓDULO 2'],
            [],
            ['Alumno:', datos.nombre],
            ['Número de control:', datos.numeroControl],
            ['Estado del módulo:', datos.estado],
            ['Fecha de completado:', datos.fechaCompletado],
            [],
            ['VALORACIONES ACADÉMICAS (escala 1-5)'],
            ['Calidad de los docentes:', datos.valoraciones.calidad_docentes],
            ['Plan de estudios (contenido de las asignaturas):', datos.valoraciones.plan_estudios],
            ['Oportunidades para participar en proyectos de investigación o prácticas:', datos.valoraciones.oportunidad_proyectos],
            ['Énfasis en la investigación dentro del programa de estudios:', datos.valoraciones.enfasis_investigacion],
            ['Satisfacción con la infraestructura y recursos disponibles:', datos.valoraciones.satisfaccion_infraestructura],
            ['Experiencia de residencia profesional o prácticas:', datos.valoraciones.experiencia_residencia],
            [],
            ['COMENTARIOS ADICIONALES'],
            [datos.comentario || 'El alumno no proporcionó comentarios adicionales.'],
        ];
        
        // Crear libro y hoja de trabajo
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Aplicar estilos básicos (ancho de columnas)
        ws['!cols'] = [{ wch: 60 }, { wch: 30 }];
        
        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Evaluación Académica');
        
        // Generar nombre de archivo con fecha y número de control
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `Modulo2_${datos.numeroControl}_${fecha}.xlsx`;
        
        // Exportar a Excel
        XLSX.writeFile(wb, nombreArchivo);
        
        console.log('Exportación a Excel completada');
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        alert('Error al exportar a Excel: ' + error.message);
    }
}

/**
 * Exporta los datos del módulo a un archivo PDF
 */
function exportarAPDF() {
    try {
        const datos = obtenerDatosFormulario();
        if (!datos || Object.keys(datos).length === 0) {
            throw new Error('No hay datos disponibles para exportar');
        }
        
        // Acceder a las clases de jsPDF
        const { jsPDF } = window.jspdf;
        
        // Crear documento PDF
        const doc = new jsPDF();
        
        // Configurar fuente y tamaño
        doc.setFont('helvetica');
        
        // Título
        doc.setFontSize(16);
        doc.setTextColor(0, 51, 102);
        doc.text('MÓDULO 2: EVALUACIÓN DE LA FORMACIÓN ACADÉMICA', 105, 20, { align: 'center' });
        
        // Información del egresado
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Egresado: ${datos.nombre}`, 105, 30, { align: 'center' });
        doc.text(`Número de control: ${datos.numeroControl}`, 105, 38, { align: 'center' });
        
        // Estado del módulo
        doc.setFontSize(10);
        doc.setTextColor(0, 102, 51);
        doc.text(`Estado: ${datos.estado} | Completado: ${datos.fechaCompletado}`, 105, 46, { align: 'center' });
        
        // Reiniciar color
        doc.setTextColor(0, 0, 0);
        
        // Valoraciones académicas
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('VALORACIONES ACADÉMICAS', 20, 60);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        // Tabla de valoraciones
        const valoracionesData = [
            ['Calidad de los docentes', datos.valoraciones.calidad_docentes],
            ['Plan de estudios', datos.valoraciones.plan_estudios],
            ['Oportunidades para proyectos/prácticas', datos.valoraciones.oportunidad_proyectos],
            ['Énfasis en la investigación', datos.valoraciones.enfasis_investigacion],
            ['Satisfacción con infraestructura', datos.valoraciones.satisfaccion_infraestructura],
            ['Experiencia de residencia/prácticas', datos.valoraciones.experiencia_residencia],
        ];
        
        doc.autoTable({
            startY: 65,
            head: [['Aspecto Evaluado', 'Valoración (1-5)']],
            body: valoracionesData,
            theme: 'grid',
            headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
            styles: { overflow: 'linebreak', cellWidth: 'auto' },
            columnStyles: { 0: { cellWidth: 100 } }
        });
        
        // Comentarios adicionales
        let currentY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('COMENTARIOS ADICIONALES', 20, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        currentY += 10;
        
        // Añadir comentario con posible salto de línea
        const comentario = datos.comentario || 'El alumno no proporcionó comentarios adicionales.';
        const splitComentario = doc.splitTextToSize(comentario, 170);
        doc.text(splitComentario, 20, currentY);
        
        // Pie de página
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generado el ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
        
        // Generar nombre de archivo con fecha y número de control
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `Modulo2_${datos.numeroControl}_${fecha}.pdf`;
        
        // Guardar PDF
        doc.save(nombreArchivo);
        
        console.log('Exportación a PDF completada');
    } catch (error) {
        console.error('Error al exportar a PDF:', error);
        alert('Error al exportar a PDF: ' + error.message);
    }
}

// Exportar funciones para que sean accesibles desde el iframe
window.inicializarVistaAdminModulo = inicializarVistaAdminModulo;
window.cargarDatosFormulario = cargarDatosFormulario;
