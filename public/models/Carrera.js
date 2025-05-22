/**
 * Modelo para la gestión de carreras
 * 
 * Este modelo define la estructura de una carrera y proporciona métodos
 * para convertir entre objetos JavaScript y documentos de Firestore.
 */
class Carrera {
    /**
     * Constructor para crear una nueva carrera
     * @param {string} id - ID de la carrera (opcional, generado por Firestore)
     * @param {string} nombre - Nombre de la carrera
     * @param {string} jefeDepartamentoId - ID del jefe de departamento asignado
     * @param {Date} fechaCreacion - Fecha de creación (opcional)
     * @param {Date} fechaActualizacion - Fecha de última actualización (opcional)
     */
    constructor(id = null, nombre = '', jefeDepartamentoId = '', fechaCreacion = null, fechaActualizacion = null) {
        this.id = id;
        this.nombre = nombre;
        this.jefeDepartamentoId = jefeDepartamentoId;
        this.fechaCreacion = fechaCreacion || new Date();
        this.fechaActualizacion = fechaActualizacion || new Date();
    }

    /**
     * Convierte un objeto de Firestore a una instancia de Carrera
     * @param {Object} doc - Documento de Firestore
     * @returns {Carrera} Una instancia de carrera
     */
    static fromFirestore(doc) {
        if (!doc) return null;
        
        const data = doc.data();
        return new Carrera(
            doc.id,
            data.nombre,
            data.jefeDepartamentoId,
            data.fechaCreacion ? data.fechaCreacion.toDate() : new Date(),
            data.fechaActualizacion ? data.fechaActualizacion.toDate() : new Date()
        );
    }

    /**
     * Convierte una instancia de Carrera a un objeto para guardar en Firestore
     * @returns {Object} Objeto para guardar en Firestore
     */
    toFirestore() {
        return {
            nombre: this.nombre,
            jefeDepartamentoId: this.jefeDepartamentoId,
            fechaCreacion: firebase.firestore.Timestamp.fromDate(this.fechaCreacion),
            fechaActualizacion: firebase.firestore.Timestamp.fromDate(new Date())
        };
    }
}

// Exportar la clase para usarla en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Carrera;
}
