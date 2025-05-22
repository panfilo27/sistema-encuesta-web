/**
 * Configuración Global
 */
let currentForm = 'personal'; // 'personal' o 'alumnos'
// Las variables db y auth ya están declaradas en firebase-init.js

/**
 * Inicialización cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    // Las referencias a Firebase ya están inicializadas en firebase-init.js
    
    // Verificar si ya hay sesión en localStorage
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
        try {
            const userData = JSON.parse(userSession);
            // Redirigir al usuario según su rol
            redirectToUserDashboard(userData.rolUser);
        } catch (error) {
            console.error('Error al recuperar sesión:', error);
            localStorage.removeItem('userSession');
        }
    }
    
    // Configurar switches entre formularios
    document.getElementById('alum').addEventListener('click', function(e) {
        e.preventDefault();
        switchForm('alumnos');
    });
    
    document.getElementById('pro').addEventListener('click', function(e) {
        e.preventDefault();
        switchForm('personal');
    });

    // Manejar envío de formularios
    document.getElementById('form-personal').addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin('personal');
    });

    document.getElementById('form-alumnos').addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin('alumnos');
    });

    // Configurar apertura del modal de registro desde el formulario de alumnos
    document.getElementById('link-registro-alumno').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('modal-registro-alumno').style.display = 'block';
        // Cargar las carreras en el select
        loadCarreras();
    });
    
    // Configurar apertura del modal de registro desde el formulario de personal
    document.getElementById('link-registro-personal').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('modal-registro-personal').style.display = 'block';
    });
    
    // Configurar cierre de los modales de registro
    document.querySelectorAll('.close').forEach(function(closeBtn) {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Cerrar modales haciendo clic fuera de ellos
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            resetAllCaptchas(); // Restablecer captchas cuando se cierre el modal
        }
    });
    
    // Inicializar configuración de reCAPTCHA
    // Función que se llamará cuando reCAPTCHA esté listo
    window.onRecaptchaLoaded = function() {
        console.log('reCAPTCHA cargado completamente');
        initializeCaptchas();
    };

    // En caso de que ya esté cargado cuando llegamos aquí
    if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
        // Solo inicializar si no se ha hecho antes
        if (captchaWidgets.alumnos === null && captchaWidgets.personal === null) {
            setTimeout(initializeCaptchas, 500);
        }
    }
    
    // Los scripts de registro ahora se cargan directamente desde el HTML

    // Mostrar formulario de personal por defecto
    switchForm('personal');
});

// Variable para almacenar los IDs de widgets de reCAPTCHA
let captchaWidgets = {
    alumnos: null,
    personal: null
};

/**
 * Cambia entre formularios de login
 * @param {string} formType - 'personal' o 'alumnos'
 */
function switchForm(formType) {
    currentForm = formType;
    
    // Actualizar pestañas activas
    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(formType === 'alumnos' ? 'alum' : 'pro').classList.add('active');
    
    // Remover clase active de todos los formularios
    document.querySelectorAll('.formulario').forEach(form => {
        form.classList.remove('active');
        form.style.display = 'none';
    });
    
    // Mostrar el formulario activo
    const activeForm = document.getElementById(`form-${formType}`);
    activeForm.classList.add('active');
    activeForm.style.display = 'block';
    
    // Renderizar el captcha si es necesario
    try {
        if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
            // Si el captcha ya existe, lo reseteamos
            if (captchaWidgets[formType] !== null) {
                grecaptcha.reset(captchaWidgets[formType]);
            }
        }
    } catch (error) {
        console.warn('Error al manipular captcha:', error);
    }
}

/**
 * Maneja el proceso de login
 * @param {string} userType - 'personal' o 'alumnos'
 */
async function handleLogin(userType) {
    const form = document.getElementById(`form-${userType}`);
    const button = document.getElementById(`btn-${userType === 'alumnos' ? 'alumno' : 'personal'}`);
    
    // Obtener credenciales
    let username, password;
    if (userType === 'personal') {
        username = form.querySelector('#usuario').value;
        password = form.querySelector('#contraseña').value;
    } else {
        username = form.querySelector('#numero_control').value;
        password = form.querySelector('#nip').value;
    }

    // Validación básica
    if (!validateCredentials({username, password}, userType)) {
        return;
    }
    
    // Validar reCAPTCHA (validación del lado del cliente)
    let recaptchaResponse;
    try {
        // Usar los IDs de widget almacenados para obtener la respuesta
        if (userType === 'alumnos' && captchaWidgets.alumnos !== null) {
            recaptchaResponse = grecaptcha.getResponse(captchaWidgets.alumnos);
        } else if (userType === 'personal' && captchaWidgets.personal !== null) {
            recaptchaResponse = grecaptcha.getResponse(captchaWidgets.personal);
        } else {
            // Fallback: intentar obtener la respuesta de cualquier captcha
            recaptchaResponse = grecaptcha.getResponse();
        }
        
        console.log(`Validando captcha para ${userType}, respuesta:`, recaptchaResponse ? 'Obtenida' : 'No obtenida');
        
        if (!recaptchaResponse) {
            showError('Por favor, complete el captcha');
            return;
        }
    } catch (error) {
        console.error('Error al validar reCAPTCHA:', error);
        // En desarrollo, permitimos continuar incluso si hay error con reCAPTCHA
        console.warn('Continuando sin validación de reCAPTCHA (solo en desarrollo)');
    }
    
    // Nota: En un entorno de producción, deberías enviar el token al servidor para validación
    console.log('Token reCAPTCHA obtenido:', recaptchaResponse.substring(0, 20) + '...');

    // Deshabilitar botón durante la petición
    button.disabled = true;
    button.textContent = 'Ingresando...';

    try {
        // Consultar Firestore para encontrar el usuario
        console.log('Buscando usuario:', username);
        
        // En la captura de pantalla vemos que el campo se llama 'usuario' en Firestore
        const querySnapshot = await db.collection('usuario')
            .where('usuario', '==', username)
            .get();
        
        console.log('Resultados encontrados:', querySnapshot.size);
        
        if (querySnapshot.empty) {
            showError('Usuario no encontrado');
            console.log('No se encontró el usuario:', username);
            button.disabled = false;
            button.textContent = 'Ingresar';
            // Restablecer captcha del formulario actual
            grecaptcha.reset(userType === 'personal' ? 1 : 0);
            return;
        }
        
        // Solo debe haber un usuario con ese nombre de usuario
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        console.log('Datos del usuario:', userData);
        
        // Verificar contraseña - según la captura se llama 'contraseña' en Firestore
        if (userData.contraseña !== password) {
            showError('Contraseña incorrecta');
            button.disabled = false;
            button.textContent = 'Ingresar';
            return;
        }
        
        // Verificar si el correo ha sido verificado
        if (userData.email && userData.hasOwnProperty('emailVerificado') && !userData.emailVerificado) {
            // Intentar verificar el estado de verificación en Firebase Auth
            try {
                // Iniciar sesión en Firebase Auth para verificar el estado
                const authResult = await firebase.auth().signInWithEmailAndPassword(userData.email, password);
                const user = authResult.user;
                
                if (!user.emailVerified) {
                    // El correo no está verificado, enviar otro correo de verificación
                    // Configurar URL de acción para el correo de verificación
                    const actionCodeSettings = {
                        url: window.location.origin + '/auth/email-verificado.html',
                        handleCodeInApp: false
                    };
                    
                    await user.sendEmailVerification(actionCodeSettings);
                    await firebase.auth().signOut(); // Cerrar sesión
                    
                    showError('Tu correo electrónico no ha sido verificado. Se ha enviado un nuevo correo de verificación.');
                    showVerificationModal(userData.email);
                    button.disabled = false;
                    button.textContent = 'Ingresar';
                    return;
                } else {
                    // El correo ya está verificado en Firebase, actualizar en Firestore
                    await db.collection('usuario').doc(userDoc.id).update({
                        emailVerificado: true
                    });
                    
                    // Actualizar datos en memoria
                    userData.emailVerificado = true;
                    
                    // Cerrar sesión en Firebase Auth para usar nuestro propio sistema
                    await firebase.auth().signOut();
                }
            } catch (authError) {
                console.error('Error al verificar estado de autenticación:', authError);
                // Continuar con el inicio de sesión normal si hay error de autenticación
            }
        }
        
        // Verificar el tipo de usuario (alumno o personal)
        // En la captura vemos que el campo se llama 'rolUser' en Firestore
        const userRole = userData.rolUser;
        console.log('Rol del usuario:', userRole);
        
        if (userType === 'alumnos' && userRole !== 'alumno') {
            showError('Este usuario no está registrado como alumno');
            button.disabled = false;
            button.textContent = 'Ingresar';
            return;
        }
        
        if (userType === 'personal' && userRole !== 'jefedepartamento' && userRole !== 'admin') {
            showError('Este usuario no está registrado como personal');
            button.disabled = false;
            button.textContent = 'Ingresar';
            return;
        }
        
        // Guardar la sesión en localStorage
        // Usamos los campos exactos que vemos en la captura de Firestore
        const sessionData = {
            id: userDoc.id,
            nombre: userData.nombre || '',
            usuario: userData.usuario,
            rolUser: userData.rolUser,
            timestamp: new Date().getTime()
        };
        
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        console.log('Sesión guardada:', sessionData);
        
        // Redirigir según el rol
        redirectToUserDashboard(userRole);
        
    } catch (error) {
        console.error('Error en login:', error);
        showError('Error al conectar con la base de datos: ' + error.message);
    } finally {
        button.disabled = false;
        button.textContent = 'Ingresar';
    }
}

/**
 * Redirecciona al usuario al dashboard correspondiente según su rol
 * @param {string} userRole - Rol del usuario (alumno, jefedepartamento, admin)
 */
function redirectToUserDashboard(userRole) {
    switch(userRole) {
        case 'admin':
            window.location.href = '../admin/nuevo_dashboard.html';
            break;
        case 'jefedepartamento':
            window.location.href = '../jefes/dashboard.html';
            break;
        case 'alumno':
            window.location.href = '../alumnos/dashboard.html';
            break;
        default:
            console.error('Rol desconocido:', userRole);
            showError('Rol de usuario no reconocido');
            // Eliminar la sesión local
            localStorage.removeItem('userSession');
    }
}

/**
 * Validación de credenciales en el cliente
 */
function validateCredentials(credentials, userType) {
    // Validación para personal
    if (userType === 'personal') {
        if (!credentials.username || credentials.username.length < 3) {
            showError('Usuario debe tener al menos 3 caracteres');
            return false;
        }
        if (!credentials.password || credentials.password.length < 6) {
            showError('Contraseña debe tener al menos 6 caracteres');
            return false;
        }
    } 
    // Validación para alumnos
    else {
        if (!credentials.username || !/^\d{8}$/.test(credentials.username)) {
            showError('Número de control debe tener 8 dígitos');
            return false;
        }
        if (!credentials.password || credentials.password.length !== 8) {
            showError('NIP debe tener 8 caracteres');
            return false;
        }
    }
    return true;
}

/**
 * Muestra un mensaje de error
 */
function showError(message) {
    // Puedes implementar un sistema más elegante de notificaciones
    alert(message);
}

/**
 * Inicializa los captchas en los formularios
 */
function initializeCaptchas() {
    try {
        // Comprobar si ya se ha inicializado
        if (captchaWidgets.alumnos !== null && captchaWidgets.personal !== null) {
            console.log('Los captchas ya están inicializados, omitiendo.');
            return;
        }
        
        // Inicializar captcha para el formulario de alumnos
        if (captchaWidgets.alumnos === null) {
            try {
                const captchaAlumnos = document.querySelector('#form-alumnos .g-recaptcha');
                if (captchaAlumnos) {
                    // Comprobar si ya tiene el atributo data-widget-id (ya ha sido renderizado)
                    if (!captchaAlumnos.getAttribute('data-widget-id')) {
                        captchaWidgets.alumnos = grecaptcha.render(captchaAlumnos, {
                            'sitekey': captchaAlumnos.getAttribute('data-sitekey'),
                            'callback': function(response) {
                                console.log('Captcha alumnos completado');
                            }
                        });
                        console.log('Captcha de alumnos inicializado con ID:', captchaWidgets.alumnos);
                    }
                }
            } catch (e) {
                console.warn('Error al inicializar captcha de alumnos:', e.message);
            }
        }

        // Inicializar captcha para el formulario de personal
        if (captchaWidgets.personal === null) {
            try {
                const captchaPersonal = document.querySelector('#form-personal .g-recaptcha');
                if (captchaPersonal) {
                    // Comprobar si ya tiene el atributo data-widget-id (ya ha sido renderizado)
                    if (!captchaPersonal.getAttribute('data-widget-id')) {
                        captchaWidgets.personal = grecaptcha.render(captchaPersonal, {
                            'sitekey': captchaPersonal.getAttribute('data-sitekey'),
                            'callback': function(response) {
                                console.log('Captcha personal completado');
                            }
                        });
                        console.log('Captcha de personal inicializado con ID:', captchaWidgets.personal);
                    }
                }
            } catch (e) {
                console.warn('Error al inicializar captcha de personal:', e.message);
            }
        }
    } catch (error) {
        // Evitamos errores en la consola
        console.warn('Advertencia al inicializar captchas:', error.message);
    }
}

/**
 * Restablece todos los captchas del formulario
 */
function resetAllCaptchas() {
    try {
        // Resetear captchas usando los IDs almacenados
        if (captchaWidgets.alumnos !== null) {
            grecaptcha.reset(captchaWidgets.alumnos);
        }
        if (captchaWidgets.personal !== null) {
            grecaptcha.reset(captchaWidgets.personal);
        }
    } catch (error) {
        console.error('Error al restablecer captchas:', error);
    }
}

/**
 * Carga las carreras desde Firestore para el desplegable de registro
 */
async function loadCarreras() {
    try {
        const carreraSelect = document.getElementById('reg-carrera');
        // Limpiar opciones actuales (excepto la primera)
        while (carreraSelect.options.length > 1) {
            carreraSelect.remove(1);
        }
        
        // Obtener las carreras de Firestore
        const querySnapshot = await db.collection('carreras').get();
        
        if (querySnapshot.empty) {
            console.log('No hay carreras disponibles');
            return;
        }
        
        // Agregar cada carrera como una opción al select
        querySnapshot.forEach(doc => {
            const carrera = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = carrera.nombre;
            carreraSelect.appendChild(option);
        });
        
        console.log('Carreras cargadas correctamente');
    } catch (error) {
        console.error('Error al cargar las carreras:', error);
        showError('Error al cargar las carreras. Por favor, intenta nuevamente.');
    }
}

/**
 * Maneja el proceso de registro de un nuevo alumno
 */
async function handleRegistration() {
    const form = document.getElementById('form-registro');
    const btnRegistrar = form.querySelector('.btn-registrar');
    
    // Obtener valores del formulario
    const numeroControl = document.getElementById('reg-numero-control').value;
    const nombre = document.getElementById('reg-nombre').value;
    const apellidoPaterno = document.getElementById('reg-apellido-paterno').value;
    const apellidoMaterno = document.getElementById('reg-apellido-materno').value || '';
    const carreraId = document.getElementById('reg-carrera').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    // Validaciones básicas
    if (!numeroControl || numeroControl.length < 8) {
        showError('El número de control debe tener al menos 8 caracteres');
        return;
    }
    
    if (!nombre || !apellidoPaterno) {
        showError('El nombre y apellido paterno son obligatorios');
        return;
    }
    
    if (!carreraId) {
        showError('Debes seleccionar una carrera');
        return;
    }
    
    if (!email || !validateEmail(email)) {
        showError('Debes ingresar un correo electrónico válido');
        return;
    }
    
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }
    
    // Deshabilitar botón durante el proceso
    btnRegistrar.disabled = true;
    btnRegistrar.textContent = 'Registrando...';
    
    try {
        // Verificar si ya existe un usuario con ese número de control o correo
        const userQuery = await db.collection('usuario')
            .where('usuario', '==', numeroControl)
            .get();
            
        const emailQuery = await db.collection('usuario')
            .where('email', '==', email)
            .get();
        
        if (!userQuery.empty) {
            showError('Ya existe un usuario con este número de control');
            btnRegistrar.disabled = false;
            btnRegistrar.textContent = 'Registrarse';
            return;
        }
        
        if (!emailQuery.empty) {
            showError('Este correo electrónico ya está registrado');
            btnRegistrar.disabled = false;
            btnRegistrar.textContent = 'Registrarse';
            return;
        }
        
        // Obtener la referencia de la carrera
        let carreraNombre = '';
        if (carreraId) {
            const carreraDoc = await db.collection('carreras').doc(carreraId).get();
            if (carreraDoc.exists) {
                carreraNombre = carreraDoc.data().nombre;
            }
        }
        
        // Crear usuario en Firebase Authentication
        try {
            // Crear usuario con correo y contraseña
            const authResult = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = authResult.user;
            
            // Configurar URL de acción para el correo de verificación
            const actionCodeSettings = {
                url: window.location.origin + '/auth/email-verificado.html',
                handleCodeInApp: false
            };
            
            // Enviar correo de verificación con URL personalizada
            await user.sendEmailVerification(actionCodeSettings);
            
            // Crear nuevo usuario en la colección 'usuario'
            const userData = {
                usuario: numeroControl,
                contraseña: password, // Idealmente debería estar encriptada
                nombre: nombre,
                apellidoPaterno: apellidoPaterno,
                apellidoMaterno: apellidoMaterno,
                email: email,
                emailVerificado: false,
                carrera: carreraNombre,
                rolUser: 'alumno',
                uid: user.uid, // Guardar el UID de autenticación
                fechaCreacion: new Date(),
                fechaActualizacion: new Date()
            };
            
            await db.collection('usuario').add(userData);
            
            // Cerrar sesión para que el usuario tenga que iniciar sesión después de verificar
            await firebase.auth().signOut();
            
            // Mostrar el modal de verificación
            showVerificationModal(email);
            
            // Cerrar el modal de registro
            document.getElementById('modal-registro').style.display = 'none';
            
            // Limpiar formulario
            form.reset();
            
            // Enfocar el campo de número de control en el formulario de login
            document.getElementById('numero_control').focus();
            switchForm('alumnos'); // Cambiamos al formulario de alumnos
        } catch (authError) {
            console.error('Error de autenticación:', authError);
            if (authError.code === 'auth/email-already-in-use') {
                showError('Este correo electrónico ya está registrado en el sistema de autenticación');
            } else if (authError.code === 'auth/invalid-email') {
                showError('El formato del correo electrónico no es válido');
            } else {
                showError('Error en el registro: ' + authError.message);
            }
        }
    } catch (error) {
        console.error('Error al registrar alumno:', error);
        showError('Error al registrar. Por favor, intenta nuevamente.');
    } finally {
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = 'Registrarse';
    }
}

/**
 * Valida el formato de un correo electrónico
 * @param {string} email - Correo electrónico a validar
 * @returns {boolean} true si el formato es válido
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Muestra un modal con instrucciones para verificar el correo electrónico
 * @param {string} email - Correo electrónico al que se envió la verificación
 */
function showVerificationModal(email) {
    // Crear el modal si no existe
    let verificationModal = document.getElementById('verification-modal');
    
    if (!verificationModal) {
        verificationModal = document.createElement('div');
        verificationModal.id = 'verification-modal';
        verificationModal.className = 'modal';
        verificationModal.innerHTML = `
            <div class="modal-content verification-content">
                <span class="close">&times;</span>
                <h2>Verificación de Correo</h2>
                <p>Se ha enviado un correo de verificación a:</p>
                <p class="email-highlight"></p>
                <p>Por favor, revisa tu bandeja de entrada (o carpeta de spam) y haz clic en el enlace de verificación.</p>
                <p>Debes verificar tu correo electrónico antes de poder iniciar sesión.</p>
                <button class="btn-ok">Entendido</button>
            </div>
        `;
        document.body.appendChild(verificationModal);
        
        // Configurar eventos del modal
        const closeBtn = verificationModal.querySelector('.close');
        const okBtn = verificationModal.querySelector('.btn-ok');
        
        closeBtn.addEventListener('click', function() {
            verificationModal.style.display = 'none';
        });
        
        okBtn.addEventListener('click', function() {
            verificationModal.style.display = 'none';
        });
        
        window.addEventListener('click', function(event) {
            if (event.target == verificationModal) {
                verificationModal.style.display = 'none';
            }
        });
    }
    
    // Actualizar el correo electrónico en el modal
    verificationModal.querySelector('.email-highlight').textContent = email;
    
    // Mostrar el modal
    verificationModal.style.display = 'block';
}

/**
 * Alternar visibilidad de contraseña
 */
function toggleVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.src = '../assets/images/ojo-abierto.png';
    } else {
        input.type = 'password';
        icon.src = '../assets/images/ojo-cerrado.png';
    }
}

// Función global para ser llamada desde HTML
window.toggleVisibility = toggleVisibility;
