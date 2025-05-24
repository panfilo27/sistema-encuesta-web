/**
 * Módulo 1: Datos Personales - Vista Admin
 * Este archivo maneja la funcionalidad para mostrar los datos del módulo 1
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
        console.log('Inicializando vista admin para Módulo 1', datos);
        
        // Guardar los datos
        datosModulo = datos;
        alumnoId = datos.alumnoId;
        encuestaId = datos.encuestaId;
        
        // Verificar si el modelo de Módulo 1 está disponible
        if (typeof parseModulo1Firestore !== 'function') {
            cargarModeloModulo1();
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
        console.error('Error al inicializar vista admin del módulo 1:', error);
        alert('Error al cargar los datos del módulo. Por favor, inténtelo de nuevo.');
    }
}

/**
 * Carga el modelo del Módulo 1 desde el servidor
 */
function cargarModeloModulo1() {
    const script = document.createElement('script');
    script.src = '../../../../models/modulos/modulo1.js';
    script.onload = function() {
        console.log('Modelo de Módulo 1 cargado correctamente');
        
        // Continuar con la inicialización una vez cargado el modelo
        if (datosModulo) {
            inicializarVistaAdminModulo(datosModulo);
        }
    };
    script.onerror = function() {
        console.error('Error al cargar el modelo de Módulo 1');
        alert('Error al cargar los datos del módulo. Por favor, recargue la página.');
    };
    document.head.appendChild(script);
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
        const alumno = datosModulo.alumno || {};
        const datos = datosModulo.datos || {};
        const datosProcesados = typeof parseModulo1Firestore === 'function' ? 
            parseModulo1Firestore(datos) : datos;
        
        // Obtener datos del estado del módulo
        const estadoModulo = document.getElementById('estado-modulo').textContent;
        const fechaCompletado = document.getElementById('fecha-completado').textContent;
        
        // Crear objeto con todos los datos necesarios para la exportación
        return {
            // Información del módulo
            modulo: 'Módulo 1: Datos Personales',
            estado: estadoModulo,
            fechaCompletado: fechaCompletado,
            
            // Datos personales
            nombre: document.getElementById('nombre').value,
            apellidoPaterno: document.getElementById('apellido-paterno').value,
            apellidoMaterno: document.getElementById('apellido-materno').value,
            numeroControl: document.getElementById('numero-control').value,
            
            // Datos de contacto
            telefono: document.getElementById('telefono').value,
            email: document.getElementById('email').value,
            direccion: document.getElementById('direccion').value,
            ciudad: document.getElementById('ciudad').value,
            estado: document.getElementById('estado').value,
            codigoPostal: document.getElementById('codigo-postal').value,
            
            // Información académica
            carrera: document.getElementById('carrera').value,
            especialidad: document.getElementById('especialidad').value,
            anioEgreso: document.getElementById('anio-egreso').value,
            mesEgreso: document.getElementById('mes-egreso').value,
            titulado: document.getElementById('titulado').value
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
            ['INFORMACIÓN DEL EGRESADO - MÓDULO 1: DATOS PERSONALES'],
            [],
            ['Estado del módulo:', datos.estado],
            ['Fecha de completado:', datos.fechaCompletado],
            [],
            ['DATOS PERSONALES'],
            ['Nombre completo:', `${datos.nombre} ${datos.apellidoPaterno} ${datos.apellidoMaterno}`],
            ['Número de control:', datos.numeroControl],
            [],
            ['DATOS DE CONTACTO'],
            ['Teléfono:', datos.telefono],
            ['Correo electrónico:', datos.email],
            ['Dirección:', datos.direccion],
            ['Ciudad:', datos.ciudad],
            ['Estado:', datos.estado],
            ['Código postal:', datos.codigoPostal],
            [],
            ['INFORMACIÓN ACADÉMICA'],
            ['Carrera:', datos.carrera],
            ['Especialidad:', datos.especialidad],
            ['Año de egreso:', datos.anioEgreso],
            ['Mes de egreso:', datos.mesEgreso],
            ['¿Está titulado?:', datos.titulado],
        ];
        
        // Crear libro y hoja de trabajo
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Aplicar estilos básicos (ancho de columnas)
        ws['!cols'] = [{ wch: 25 }, { wch: 50 }];
        
        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Datos Personales');
        
        // Generar nombre de archivo con fecha y número de control
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `Modulo1_${datos.numeroControl}_${fecha}.xlsx`;
        
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
        doc.text('MÓDULO 1: DATOS PERSONALES', 105, 20, { align: 'center' });
        
        // Información del egresado
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Egresado: ${datos.nombre} ${datos.apellidoPaterno} ${datos.apellidoMaterno}`, 105, 30, { align: 'center' });
        
        // Estado del módulo
        doc.setFontSize(10);
        doc.setTextColor(0, 102, 51);
        doc.text(`Estado: ${datos.estado} | Completado: ${datos.fechaCompletado}`, 105, 40, { align: 'center' });
        
        // Reiniciar color
        doc.setTextColor(0, 0, 0);
        
        // Datos personales
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DATOS PERSONALES', 20, 55);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        // Usar tabla para mostrar datos personales
        let contenido = [
            ['Nombre', datos.nombre],
            ['Apellido Paterno', datos.apellidoPaterno],
            ['Apellido Materno', datos.apellidoMaterno],
            ['Número de Control', datos.numeroControl],
        ];
        
        doc.autoTable({
            startY: 60,
            head: [['Campo', 'Valor']],
            body: contenido,
            theme: 'grid',
            headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
            styles: { overflow: 'linebreak', cellWidth: 'auto' },
            columnStyles: { 0: { cellWidth: 50 } }
        });
        
        // Datos de contacto
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        let currentY = doc.lastAutoTable.finalY + 10;
        doc.text('DATOS DE CONTACTO', 20, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        contenido = [
            ['Teléfono', datos.telefono],
            ['Correo Electrónico', datos.email],
            ['Dirección', datos.direccion],
            ['Ciudad', datos.ciudad],
            ['Estado', datos.estado],
            ['Código Postal', datos.codigoPostal],
        ];
        
        doc.autoTable({
            startY: currentY + 5,
            head: [['Campo', 'Valor']],
            body: contenido,
            theme: 'grid',
            headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
            styles: { overflow: 'linebreak', cellWidth: 'auto' },
            columnStyles: { 0: { cellWidth: 50 } }
        });
        
        // Información académica
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        currentY = doc.lastAutoTable.finalY + 10;
        doc.text('INFORMACIÓN ACADÉMICA', 20, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        contenido = [
            ['Carrera', datos.carrera],
            ['Especialidad', datos.especialidad],
            ['Año de Egreso', datos.anioEgreso],
            ['Mes de Egreso', datos.mesEgreso],
            ['¿Está titulado?', datos.titulado],
        ];
        
        doc.autoTable({
            startY: currentY + 5,
            head: [['Campo', 'Valor']],
            body: contenido,
            theme: 'grid',
            headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
            styles: { overflow: 'linebreak', cellWidth: 'auto' },
            columnStyles: { 0: { cellWidth: 50 } }
        });
        
        // Pie de página
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generado el ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
        
        // Generar nombre de archivo con fecha y número de control
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `Modulo1_${datos.numeroControl}_${fecha}.pdf`;
        
        // Guardar PDF
        doc.save(nombreArchivo);
        
        console.log('Exportación a PDF completada');
    } catch (error) {
        console.error('Error al exportar a PDF:', error);
        alert('Error al exportar a PDF: ' + error.message);
    }
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
        
        // Utilizar el modelo parseModulo1Firestore si está disponible
        if (typeof parseModulo1Firestore === 'function') {
            datosProcesados = parseModulo1Firestore(datosModulo.datos);
        } else {
            datosProcesados = datosModulo.datos;
        }
        
        const alumno = datosModulo.alumno;
        
        // Cargar datos personales
        document.getElementById('nombre').value = datosProcesados.nombre || alumno.nombre || '';
        document.getElementById('apellido-paterno').value = datosProcesados.apellidoPaterno || alumno.apellidoPaterno || '';
        document.getElementById('apellido-materno').value = datosProcesados.apellidoMaterno || alumno.apellidoMaterno || '';
        document.getElementById('numero-control').value = datosProcesados.noControl || alumno.usuario || '';
        
        // Cargar datos de contacto (utilizando los campos correctos del modelo)
        document.getElementById('telefono').value = datosProcesados.telefono || '';
        document.getElementById('email').value = datosProcesados.email || alumno.email || '';
        document.getElementById('direccion').value = datosProcesados.domicilio || '';
        document.getElementById('ciudad').value = datosProcesados.ciudad || '';
        document.getElementById('estado').value = datosProcesados.estado || '';
        
        // Cargar información académica
        document.getElementById('carrera').value = datosProcesados.carrera || alumno.nombreCarrera || '';
        document.getElementById('anio-egreso').value = datosProcesados.mesEgreso ? datosProcesados.mesEgreso.split('/')[1] || '' : '';
        document.getElementById('mes-egreso').value = datosProcesados.mesEgreso ? datosProcesados.mesEgreso.split('/')[0] || '' : '';
        document.getElementById('titulado').value = datosProcesados.titulado === true ? 'Sí' : 
                                                (datosProcesados.titulado === false ? 'No' : 'No especificado');
        
        // Inicializar botones de exportación después de cargar los datos
        inicializarBotonesExportacion();
        
    } catch (error) {
        console.error('Error al cargar datos en el formulario:', error);
        alert('Error al mostrar los datos del módulo: ' + error.message);
    }
}

// Exportar funciones para que sean accesibles desde el iframe
window.inicializarVistaAdminModulo = inicializarVistaAdminModulo;
window.cargarDatosFormulario = cargarDatosFormulario;
