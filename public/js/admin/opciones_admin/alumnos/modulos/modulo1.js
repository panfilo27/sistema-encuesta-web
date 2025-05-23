/**
 * Funciones para la vista de administrador del Módulo 1
 */

/**
 * Inicializa la vista de administrador del módulo 1 con los datos del alumno
 * @param {Object} datos - Datos del módulo y alumno
 */
function inicializarVistaAdminModulo(datos) {
    console.log('Inicializando vista de administrador del módulo 1', datos);
    
    try {
        // Mostrar estado y fecha de completado
        const estadoModulo = document.getElementById('estado-modulo');
        const fechaCompletado = document.getElementById('fecha-completado');
        
        if (estadoModulo) {
            estadoModulo.textContent = datos.completado ? 'Completado' : 'En progreso';
            estadoModulo.className = datos.completado ? 'completado' : 'en-progreso';
        }
        
        if (fechaCompletado && datos.fechaCompletado) {
            fechaCompletado.textContent = datos.fechaCompletado.toLocaleString();
        } else if (fechaCompletado) {
            fechaCompletado.textContent = 'No completado';
        }
        
        // Asegurarse de que datos.datos exista
        if (!datos || !datos.datos) {
            console.error('No hay datos disponibles para mostrar');
            mostrarError('No hay datos disponibles para este módulo');
            return;
        }
        
        // Rellenar el formulario con los datos del módulo
        const formulario = document.getElementById('form-modulo1');
        if (!formulario) {
            console.error('No se encontró el formulario del módulo 1');
            return;
        }
        
        // Datos personales
        setInputValue('nombre', datos.datos.nombre);
        setInputValue('apellido-paterno', datos.datos.apellidoPaterno);
        setInputValue('apellido-materno', datos.datos.apellidoMaterno);
        setInputValue('fecha-nacimiento', datos.datos.fechaNacimiento);
        setInputValue('curp', datos.datos.curp);
        setInputValue('genero', datos.datos.genero);
        setInputValue('estado-civil', datos.datos.estadoCivil);
        
        // Domicilio
        setInputValue('domicilio', datos.datos.domicilio);
        setInputValue('ciudad', datos.datos.ciudad);
        setInputValue('municipio', datos.datos.municipio);
        setInputValue('estado', datos.datos.estado);
        
        // Contacto
        setInputValue('telefono', datos.datos.telefono);
        setInputValue('tel-casa', datos.datos.telCasa);
        setInputValue('email', datos.datos.email);
        
        // Académico
        setInputValue('carrera', datos.datos.carrera);
        setInputValue('titulado', datos.datos.titulado ? 'Sí' : 'No');
        setInputValue('mes-egreso', datos.datos.mesEgreso);
        
        // Ocupación actual
        setCheckboxValue('trabaja', datos.datos.trabaja);
        setCheckboxValue('estudia', datos.datos.estudia);
        
        // Idiomas
        if (Array.isArray(datos.datos.idiomas)) {
            setCheckboxValue('idioma-ingles', datos.datos.idiomas.includes('Inglés'));
            setCheckboxValue('idioma-frances', datos.datos.idiomas.includes('Francés'));
            setCheckboxValue('idioma-aleman', datos.datos.idiomas.includes('Alemán'));
            setCheckboxValue('idioma-japones', datos.datos.idiomas.includes('Japonés'));
            setCheckboxValue('idioma-italiano', datos.datos.idiomas.includes('Italiano'));
            setCheckboxValue('idioma-chino', datos.datos.idiomas.includes('Chino'));
            
            // Otros idiomas
            const idiomasEstándar = ['Inglés', 'Francés', 'Alemán', 'Japonés', 'Italiano', 'Chino'];
            const otrosIdiomas = datos.datos.idiomas.filter(i => !idiomasEstándar.includes(i));
            
            if (otrosIdiomas.length > 0) {
                setInputValue('otro-idioma', otrosIdiomas.join(', '));
            }
        }
        
        // Paquetes de cómputo
        if (Array.isArray(datos.datos.paquetes)) {
            setCheckboxValue('paquete-word', datos.datos.paquetes.includes('Word'));
            setCheckboxValue('paquete-excel', datos.datos.paquetes.includes('Excel'));
            setCheckboxValue('paquete-powerpoint', datos.datos.paquetes.includes('PowerPoint'));
            setCheckboxValue('paquete-access', datos.datos.paquetes.includes('Access'));
            
            // Otros paquetes
            const paquetesEstándar = ['Word', 'Excel', 'PowerPoint', 'Access'];
            const otrosPaquetes = datos.datos.paquetes.filter(p => !paquetesEstándar.includes(p));
            
            if (otrosPaquetes.length > 0) {
                setInputValue('otro-paquete', otrosPaquetes.join(', '));
            }
        }
        
        // Configurar botones de exportación
        configurarBotonesExportacion(datos);
        
    } catch (error) {
        console.error('Error al inicializar vista del módulo 1:', error);
        mostrarError('Error al cargar los datos del módulo: ' + error.message);
    }
}

/**
 * Establece el valor de un campo de texto
 * @param {string} id - ID del elemento
 * @param {string} valor - Valor a establecer
 */
function setInputValue(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.value = valor || '';
    }
}

/**
 * Establece el valor de un checkbox
 * @param {string} id - ID del elemento
 * @param {boolean} valor - Valor a establecer
 */
function setCheckboxValue(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.checked = !!valor;
    }
}

/**
 * Muestra un mensaje de error
 * @param {string} mensaje - Mensaje de error
 */
function mostrarError(mensaje) {
    const contenedor = document.querySelector('.contenedor-principal');
    
    if (contenedor) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-mensaje';
        errorDiv.style.color = '#721c24';
        errorDiv.style.backgroundColor = '#f8d7da';
        errorDiv.style.padding = '10px';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.marginBottom = '15px';
        errorDiv.innerHTML = `<p>${mensaje}</p>`;
        
        // Insertar al principio del contenedor
        contenedor.insertBefore(errorDiv, contenedor.firstChild);
    }
}

/**
 * Configura los botones de exportación
 * @param {Object} datos - Datos del módulo
 */
function configurarBotonesExportacion(datos) {
    // Configurar exportación a Excel
    const btnExportarExcel = document.getElementById('btn-exportar-excel');
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', () => {
            alert('Función de exportación a Excel no implementada');
        });
    }
    
    // Configurar exportación a PDF
    const btnExportarPDF = document.getElementById('btn-exportar-pdf');
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', () => {
            alert('Función de exportación a PDF no implementada');
        });
    }
}

// Exponer función para que pueda ser llamada desde el iframe
window.inicializarVistaAdminModulo = inicializarVistaAdminModulo;
