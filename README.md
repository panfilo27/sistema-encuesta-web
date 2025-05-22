# Sistema de Encuestas Web

Sistema web para la gestión y aplicación de encuestas académicas con distintos roles de usuario (administradores, jefes de departamento y alumnos).

## Estructura del Proyecto

```
sistema-encuesta-web/
├── public/                  # Archivos públicos accesibles directamente
│   ├── index.html           # Página principal/landing
│   ├── auth/                # Sección de autenticación
│   │   ├── login.html       # Página de inicio de sesión
│   │   └── signup.html      # Página de registro (si es necesario)
│   │
│   ├── alumnos/             # Vistas específicas para alumnos
│   │   ├── dashboard.html   # Panel principal para alumnos
│   │   ├── encuestas.html   # Lista de encuestas disponibles
│   │   └── responder.html   # Responder encuesta específica
│   │
│   ├── admin/               # Vistas específicas para administradores
│   │   ├── dashboard.html   # Panel principal para admin
│   │   ├── usuarios.html    # Gestión de usuarios
│   │   ├── encuestas.html   # Gestión de todas las encuestas
│   │   └── reportes.html    # Reportes globales
│   │
│   ├── jefes/               # Vistas para jefes de departamento
│   │   ├── dashboard.html   # Panel principal para jefes
│   │   ├── crear-encuesta.html  # Crear nuevas encuestas
│   │   ├── resultados.html  # Ver resultados de sus encuestas
│   │   └── reportes.html    # Reportes de su departamento
│   │
│   ├── css/                 # Estilos CSS
│   ├── js/                  # Scripts JavaScript
│   └── assets/              # Recursos estáticos
```

## Tecnologías Utilizadas

- **HTML5**: Estructura de las páginas web
- **CSS3**: Estilos y diseño responsivo
- **JavaScript**: Funcionalidad del lado del cliente
- **Firebase**: Backend como servicio
  - **Authentication**: Gestión de usuarios y autenticación
  - **Firestore**: Base de datos NoSQL para almacenar datos
  - **Storage**: Almacenamiento de archivos (opcional)
  - **Analytics**: Análisis de uso (opcional)

## Roles de Usuario

### Administrador
- Gestión completa de usuarios
- Creación y administración de departamentos
- Acceso a todas las encuestas y sus resultados
- Reportes globales del sistema

### Jefe de Departamento
- Creación y gestión de encuestas
- Visualización de resultados de encuestas de su departamento
- Reportes específicos de su departamento

### Alumno
- Acceso a encuestas asignadas
- Responder encuestas disponibles
- Ver histórico de encuestas respondidas

## Configuración de Firebase

El proyecto utiliza Firebase para la autenticación y almacenamiento de datos. La configuración se encuentra en `public/js/firebase-init.js`.

## Instalación y Ejecución

1. Clona este repositorio
2. Abre la carpeta del proyecto
3. Puedes utilizar un servidor local para desarrollo (como Live Server en VS Code)
4. Abre el archivo `public/index.html` en tu navegador

## Desarrollo

Para añadir nuevas funcionalidades o modificar las existentes, sigue la estructura de carpetas establecida y mantén la separación de responsabilidades entre los diferentes archivos.

## Licencia

Este proyecto está licenciado bajo [tu licencia aquí].
