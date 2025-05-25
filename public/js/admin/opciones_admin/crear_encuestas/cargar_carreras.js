/**
 * Módulo para cargar carreras desde Firestore
 * Sistema de Encuestas ITVER
 */

// Evitar redeclaraciones usando un patrón de módulo autoejecutable
(function() {
    // Verificar si ya se ha cargado el script
    if (window.carrerasModuleLoaded) {
        console.log('Módulo de carreras ya cargado anteriormente');
        return;
    }
    
    // Marcar como cargado
    window.carrerasModuleLoaded = true;
    
    /**
     * Carga las carreras desde Firestore y las devuelve como una promesa
     * @returns {Promise<Array>} Promesa que resuelve a un array de objetos de carrera
     */
    function cargarCarreras() {
        return new Promise((resolve, reject) => {
            try {
                // Verificar que firebase esté disponible
                if (!firebase || !firebase.firestore) {
                    console.error("Firebase no está disponible");
                    resolve([]);
                    return;
                }
                
                // Referencia a la colección de carreras
                const carrerasRef = firebase.firestore().collection('carreras');
                
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
                        resolve([]); // Devolver array vacío en caso de error
                    });
            } catch (error) {
                console.error("Error al intentar cargar carreras:", error);
                resolve([]); // Devolver array vacío en caso de error
            }
        });
    }

    /**
     * Carga las carreras y las agrega a un elemento select
     * @param {HTMLSelectElement} selectElement - Elemento select donde se agregarán las opciones
     * @param {boolean} incluirOpcionTodas - Si se debe incluir una opción "Todas las carreras"
     */
    function cargarCarrerasEnSelect(selectElement, incluirOpcionTodas = true) {
        if (!selectElement) {
            console.error("El elemento select no existe");
            return;
        }
        
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
                if (!carreras || carreras.length === 0) {
                    const optionNoCarreras = document.createElement('option');
                    optionNoCarreras.value = '';
                    optionNoCarreras.textContent = 'No hay carreras disponibles';
                    optionNoCarreras.disabled = true;
                    selectElement.appendChild(optionNoCarreras);
                    return;
                }
                
                // Ordenar alfabéticamente
                carreras.sort((a, b) => {
                    const nombreA = a.nombre || '';
                    const nombreB = b.nombre || '';
                    return nombreA.localeCompare(nombreB);
                });
                
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
    window.cargarCarrerasEnSelect = cargarCarrerasEnSelect;
})();
