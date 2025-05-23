/**
 * Módulo para cargar carreras desde Firestore
 * Sistema de Encuestas ITVER
 */

// Verificar si ya se ha cargado el script
if (typeof window.carrerasScriptLoaded === 'undefined') {
    // Marcar el script como cargado
    window.carrerasScriptLoaded = true;
    
    // Referencia a la colección de carreras
    const carrerasRef = firebase.firestore().collection('carreras');

/**
 * Carga las carreras desde Firestore y las devuelve como una promesa
 * @returns {Promise<Array>} Promesa que resuelve a un array de objetos de carrera
 */
function cargarCarreras() {
    return new Promise((resolve, reject) => {
        carrerasRef.get()
            .then((snapshot) => {
                const carreras = [];
                snapshot.forEach((doc) => {
                    carreras.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                resolve(carreras);
            })
            .catch((error) => {
                console.error("Error al cargar carreras:", error);
                reject(error);
            });
    });
}

/**
 * Carga las carreras y las agrega a un elemento select
 * @param {HTMLSelectElement} selectElement - Elemento select donde se agregarán las opciones
 * @param {boolean} incluirOpcionTodas - Si se debe incluir una opción "Todas las carreras"
 */
function cargarCarrerasEnSelect(selectElement, incluirOpcionTodas = true) {
    // Limpiar select primero
    selectElement.innerHTML = '';
    
    // Agregar opción "Todas las carreras" si se solicita
    if (incluirOpcionTodas) {
        const optionTodas = document.createElement('option');
        optionTodas.value = 'todas';
        optionTodas.textContent = 'Todas las carreras (General)';
        selectElement.appendChild(optionTodas);
    }
    
    // Cargar carreras desde Firestore
    cargarCarreras()
        .then((carreras) => {
            // Ordenar alfabéticamente
            carreras.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            
            // Agregar cada carrera como opción
            carreras.forEach((carrera) => {
                const option = document.createElement('option');
                option.value = carrera.id;
                option.textContent = carrera.nombre || `Carrera ${carrera.id}`;
                selectElement.appendChild(option);
            });
        })
        .catch((error) => {
            console.error("Error al cargar carreras en select:", error);
            
            // Agregar un mensaje de error como opción
            const optionError = document.createElement('option');
            optionError.value = '';
            optionError.textContent = 'Error al cargar carreras';
            optionError.disabled = true;
            selectElement.appendChild(optionError);
        });
}

// Exportar funciones para uso externo
window.cargarCarreras = cargarCarreras;
window.cargarCarrerasEnSelect = cargarCarrerasEnSelect          
})();


