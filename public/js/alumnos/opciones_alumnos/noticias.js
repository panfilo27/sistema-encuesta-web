/**
 * Noticias/Avisos - Dashboard Alumnos
 * 
 * Este archivo maneja la funcionalidad del carrusel de noticias/avisos
 * en el dashboard de alumnos, cargando datos desde Firestore.
 */

// Variables globales
let avisos = [];
let carouselPosition = 0;
const cardsToShow = window.innerWidth <= 480 ? 1 : window.innerWidth <= 768 ? 2 : 3;

// Ejecutar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el carrusel de noticias
    initNoticiasCarousel();
});

/**
 * Inicializa el carrusel de noticias
 */
function initNoticiasCarousel() {
    // Obtener referencias a elementos DOM
    const track = document.getElementById('carousel-track');
    const prevButton = document.getElementById('carousel-prev');
    const nextButton = document.getElementById('carousel-next');
    
    // Agregar event listeners para los botones de navegación
    if (prevButton) {
        prevButton.addEventListener('click', () => moveCarousel('prev'));
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => moveCarousel('next'));
    }
    
    // Cargar avisos desde Firestore
    cargarAvisos();
    
    // Ajustar carrusel al cambiar el tamaño de la ventana
    window.addEventListener('resize', handleResize);
}

/**
 * Carga los avisos desde Firestore
 */
async function cargarAvisos() {
    try {
        // Obtener datos del usuario para filtrar avisos por carrera
        const userSession = localStorage.getItem('userSession');
        let carreraId = '';
        
        if (userSession) {
            const userData = JSON.parse(userSession);
            carreraId = userData.carreraId || '';
        }
        
        // Obtener fecha actual para filtrar avisos vigentes
        const fechaActual = new Date();
        
        // Consultar colección de avisos en Firestore
        let query = firebase.firestore().collection('avisos')
            .where('fechaFin', '>=', firebase.firestore.Timestamp.fromDate(fechaActual))
            .orderBy('fechaFin', 'asc');
        
        const snapshot = await query.get();
        
        // Limpiar el array de avisos
        avisos = [];
        
        // Procesar los avisos
        snapshot.forEach(doc => {
            const aviso = {
                id: doc.id,
                ...doc.data(),
                fechaInicio: doc.data().fechaInicio.toDate(),
                fechaFin: doc.data().fechaFin.toDate()
            };
            
            // Incluir el aviso si es para todas las carreras o para la carrera del alumno
            if (!aviso.carreraId || aviso.carreraId === carreraId) {
                avisos.push(aviso);
            }
        });
        
        // Renderizar los avisos en el carrusel
        renderizarAvisos();
        
    } catch (error) {
        console.error('Error al cargar avisos:', error);
        mostrarErrorCarga();
    }
}

/**
 * Renderiza los avisos en el carrusel
 */
function renderizarAvisos() {
    const track = document.getElementById('carousel-track');
    
    // Limpiar el contenido actual
    track.innerHTML = '';
    
    // Si no hay avisos, mostrar mensaje
    if (avisos.length === 0) {
        track.innerHTML = `
            <div class="no-news-message">
                <i class="fas fa-bell-slash"></i>
                <p>No hay avisos disponibles en este momento.</p>
            </div>
        `;
        
        // Ocultar los botones de navegación
        document.getElementById('carousel-prev').style.display = 'none';
        document.getElementById('carousel-next').style.display = 'none';
        return;
    }
    
    // Mostrar los botones de navegación si hay más avisos que los que se pueden mostrar
    document.getElementById('carousel-prev').style.display = avisos.length > cardsToShow ? 'flex' : 'none';
    document.getElementById('carousel-next').style.display = avisos.length > cardsToShow ? 'flex' : 'none';
    
    // Crear elementos para cada aviso
    avisos.forEach(aviso => {
        // Formatear fecha de publicación
        const formatoFecha = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const fechaPublicacion = new Date(aviso.fechaCreacion.seconds * 1000).toLocaleDateString('es-ES', formatoFecha);
        
        // Crear elemento de tarjeta
        const card = document.createElement('div');
        card.className = 'news-card';
        card.dataset.id = aviso.id;
        
        // Construir HTML de la tarjeta
        card.innerHTML = `
            <div class="news-card-header">
                <h3>${aviso.titulo}</h3>
            </div>
            <div class="news-card-body">
                ${aviso.imagenURL ? `
                    <div class="news-image-container">
                        <img class="news-image" src="${aviso.imagenURL}" alt="${aviso.titulo}">
                    </div>
                    <div class="news-description">
                        ${aviso.descripcion}
                    </div>
                ` : `
                    <div class="news-description news-description-full">
                        ${aviso.descripcion}
                    </div>
                `}
            </div>
            <div class="news-card-footer">
                <span class="news-date">Publicado: ${fechaPublicacion}</span>
            </div>
        `;
        
        // Añadir evento de clic para abrir el modal
        card.addEventListener('click', () => abrirModalAviso(aviso));
        
        // Agregar tarjeta al track
        track.appendChild(card);
    });
    
    // Inicializar la posición del carrusel
    updateCarouselPosition();
}

/**
 * Abre un modal con los detalles completos del aviso
 * @param {Object} aviso - El aviso a mostrar en el modal
 */
function abrirModalAviso(aviso) {
    // Formatear fecha de publicación
    const formatoFecha = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const fechaPublicacion = new Date(aviso.fechaCreacion.seconds * 1000).toLocaleDateString('es-ES', formatoFecha);
    
    // Crear el modal
    const modal = document.createElement('div');
    modal.className = 'news-modal';
    modal.innerHTML = `
        <div class="news-modal-content">
            <span class="news-modal-close">&times;</span>
            <h2 class="news-modal-title">${aviso.titulo}</h2>
            <p class="news-modal-date">Publicado: ${fechaPublicacion}</p>
            
            ${aviso.imagenURL ? `
                <div class="news-modal-image">
                    <img src="${aviso.imagenURL}" alt="${aviso.titulo}">
                </div>
            ` : ''}
            
            <div class="news-modal-description">
                ${aviso.descripcion}
            </div>
        </div>
    `;
    
    // Añadir el modal al cuerpo del documento
    document.body.appendChild(modal);
    
    // Evitar scroll en el cuerpo del documento
    document.body.style.overflow = 'hidden';
    
    // Mostrar el modal con animación
    setTimeout(() => {
        modal.classList.add('visible');
    }, 10);
    
    // Agregar evento de cierre al botón X
    const closeButton = modal.querySelector('.news-modal-close');
    closeButton.addEventListener('click', cerrarModal);
    
    // Cerrar modal al hacer clic fuera del contenido
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarModal();
        }
    });
    
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarModal();
        }
    });
    
    // Función para cerrar el modal
    function cerrarModal() {
        modal.classList.remove('visible');
        setTimeout(() => {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        }, 300); // Tiempo de la animación
    }
}

/**
 * Muestra un mensaje de error al cargar los avisos
 */
function mostrarErrorCarga() {
    const track = document.getElementById('carousel-track');
    
    track.innerHTML = `
        <div class="no-news-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ocurrió un error al cargar los avisos. Por favor, intenta nuevamente más tarde.</p>
        </div>
    `;
    
    // Ocultar los botones de navegación
    document.getElementById('carousel-prev').style.display = 'none';
    document.getElementById('carousel-next').style.display = 'none';
}

/**
 * Maneja el evento de redimensionamiento de la ventana
 */
function handleResize() {
    // Actualizar la cantidad de tarjetas a mostrar según el ancho de la ventana
    const newCardsToShow = window.innerWidth <= 480 ? 1 : window.innerWidth <= 768 ? 2 : 3;
    
    if (newCardsToShow !== cardsToShow) {
        cardsToShow = newCardsToShow;
        
        // Actualizar posición del carrusel
        carouselPosition = 0;
        updateCarouselPosition();
        
        // Actualizar visibilidad de los botones
        document.getElementById('carousel-prev').style.display = avisos.length > cardsToShow ? 'flex' : 'none';
        document.getElementById('carousel-next').style.display = avisos.length > cardsToShow ? 'flex' : 'none';
    }
}

/**
 * Mueve el carrusel en la dirección especificada
 * @param {string} direction - Dirección del movimiento ('prev' o 'next')
 */
function moveCarousel(direction) {
    if (direction === 'prev') {
        carouselPosition = Math.max(0, carouselPosition - 1);
    } else {
        carouselPosition = Math.min(avisos.length - cardsToShow, carouselPosition + 1);
    }
    
    updateCarouselPosition();
}

/**
 * Actualiza la posición visual del carrusel
 */
function updateCarouselPosition() {
    const track = document.getElementById('carousel-track');
    const cards = track.querySelectorAll('.news-card');
    
    if (cards.length === 0) return;
    
    const cardWidth = cards[0].offsetWidth;
    const cardMargin = 20; // Margen entre tarjetas (gap)
    const offset = carouselPosition * (cardWidth + cardMargin);
    
    track.style.transform = `translateX(-${offset}px)`;
    
    // Actualizar estado de los botones (deshabilitados si está en los extremos)
    document.getElementById('carousel-prev').disabled = carouselPosition === 0;
    document.getElementById('carousel-next').disabled = carouselPosition >= avisos.length - cardsToShow;
}
