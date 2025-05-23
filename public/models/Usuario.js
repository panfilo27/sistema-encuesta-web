/**
 * Clase que representa un Usuario en el sistema
 */
class Usuario {
    /**
     * Constructor de la clase Usuario
     * @param {string} id - ID único del usuario (opcional, se genera automáticamente si no se proporciona)
     * @param {string} usuario - Nombre de usuario (número de control o RFC)
     * @param {string} nombre - Nombre(s) del usuario
     * @param {string} apellidoPaterno - Apellido paterno del usuario
     * @param {string} apellidoMaterno - Apellido materno del usuario
     * @param {string} email - Correo electrónico del usuario
     * @param {string} rolUser - Rol del usuario ('alumno', 'personal', 'admin')
     * @param {string} carreraId - ID de la carrera (solo para alumnos)
     * @param {string} carreraNombre - Nombre de la carrera (solo para alumnos)
     * @param {string} departamento - Departamento (solo para personal)
     * @param {string} contraseña - Contraseña del usuario
     * @param {boolean} emailVerificado - Indica si el correo ha sido verificado
     * @param {Date} fechaCreacion - Fecha de creación del registro
     * @param {Date} fechaActualizacion - Fecha de última actualización
     */
    constructor(
        id = null,
        usuario,
        nombre,
        apellidoPaterno,
        apellidoMaterno = '',
        email,
        rolUser,
        carreraId = '',
        carreraNombre = '',
        departamento = '',
        contraseña = '',
        emailVerificado = false,
        fechaCreacion = new Date(),
        fechaActualizacion = new Date()
    ) {
        this.id = id;
        this.usuario = usuario;
        this.nombre = nombre;
        this.apellidoPaterno = apellidoPaterno;
        this.apellidoMaterno = apellidoMaterno;
        this.email = email;
        this.rolUser = rolUser;
        this.carreraId = carreraId;
        this.carreraNombre = carreraNombre;
        this.departamento = departamento;
        this.contraseña = contraseña;
        this.emailVerificado = emailVerificado;
        this.fechaCreacion = fechaCreacion;
        this.fechaActualizacion = fechaActualizacion;
    }

    /**
     * Obtiene el nombre completo del usuario
     * @returns {string} Nombre completo
     */
    getNombreCompleto() {
        return `${this.nombre} ${this.apellidoPaterno} ${this.apellidoMaterno}`.trim();
    }

    /**
     * Convierte el objeto a un formato adecuado para Firestore
     * @returns {Object} Objeto para almacenar en Firestore
     */
    toFirestore() {
        return {
            usuario: this.usuario,
            nombre: this.nombre,
            apellidoPaterno: this.apellidoPaterno,
            apellidoMaterno: this.apellidoMaterno,
            email: this.email,
            rolUser: this.rolUser,
            carreraId: this.carreraId,
            carreraNombre: this.carreraNombre,
            departamento: this.departamento,
            contraseña: this.contraseña,
            emailVerificado: this.emailVerificado,
            fechaCreacion: this.fechaCreacion,
            fechaActualizacion: new Date() // Actualizar la fecha
        };
    }

    /**
     * Crea una instancia de Usuario a partir de un documento de Firestore
     * @param {string} id - ID del documento
     * @param {Object} data - Datos del documento
     * @returns {Usuario} Instancia de Usuario
     */
    static fromFirestore(id, data) {
        // Convertir timestamps de Firestore a objetos Date
        let fechaCreacion = new Date();
        let fechaActualizacion = new Date();
        
        try {
            if (data.fechaCreacion) {
                if (typeof data.fechaCreacion.toDate === 'function') {
                    fechaCreacion = data.fechaCreacion.toDate();
                } else if (data.fechaCreacion instanceof Date) {
                    fechaCreacion = data.fechaCreacion;
                } else if (data.fechaCreacion.seconds) {
                    fechaCreacion = new Date(data.fechaCreacion.seconds * 1000);
                }
            }
            
            if (data.fechaActualizacion) {
                if (typeof data.fechaActualizacion.toDate === 'function') {
                    fechaActualizacion = data.fechaActualizacion.toDate();
                } else if (data.fechaActualizacion instanceof Date) {
                    fechaActualizacion = data.fechaActualizacion;
                } else if (data.fechaActualizacion.seconds) {
                    fechaActualizacion = new Date(data.fechaActualizacion.seconds * 1000);
                }
            }
        } catch (e) {
            console.warn('Error al convertir fechas:', e);
        }

        return new Usuario(
            id,
            data.usuario || '',
            data.nombre || '',
            data.apellidoPaterno || '',
            data.apellidoMaterno || '',
            data.email || '',
            data.rolUser || 'alumno',
            data.carreraId || '',
            data.carreraNombre || '',
            data.departamento || '',
            data.contraseña || '',
            data.emailVerificado || false,
            fechaCreacion,
            fechaActualizacion
        );
    }
}

// Exportar la clase para su uso en otros archivos
// Si se está ejecutando en un entorno que soporta módulos ES
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Usuario;
}

// Exponer la función para crear un usuario a partir de datos de Firestore en el objeto window
// para que sea accesible desde cualquier script que incluya este archivo
window.parseUsuarioFirestore = function(data) {
    return Usuario.fromFirestore(data.id || null, data);
};
