# Sistema de Gestión Cunícola

Este es un sistema web progresivo (PWA) diseñado para la gestión integral de una granja de conejos (cunicultura). Permite el monitoreo de animales, gestión del almacén de alimentos, visualización de datos de sensores y control mediante visión computacional.

## Requisitos Previos

Para ejecutar este sistema de forma local en tu computadora, necesitas tener instalado **Node.js**.

### Cómo instalar Node.js:
1. Ve a la página oficial de Node.js: [https://nodejs.org/es/](https://nodejs.org/es/)
2. Descarga la versión **LTS** (Recomendada para la mayoría de los usuarios).
3. Ejecuta el instalador descargado y sigue las instrucciones en pantalla (simplemente dale a "Siguiente" o "Next" hasta terminar la instalación).
4. Para verificar que se instaló correctamente, abre tu terminal o línea de comandos (CMD o PowerShell) y escribe:
   ```bash
   node -v
   npm -v
   ```
   Ambos comandos deberían mostrarte números de versión.

## Instalación y Ejecución del Proyecto

Sigue estos pasos para arrancar el sistema en tu máquina local:

### 1. Clonar o descargar el repositorio
Si tienes Git instalado, puedes clonar el repositorio abriendo tu terminal y ejecutando:
```bash
git clone https://github.com/xDylanbrr/Sistema_cunicola.git
cd Sistema_cunicola
```

### 2. Instalar las dependencias
Dentro de la carpeta del proyecto (`Sistema-Cunicola-` o `Sistema_cunicola`), ejecuta el siguiente comando para instalar las librerías necesarias (como Express y SQLite):
```bash
npm install
```

### 3. Iniciar el servidor
Una vez instaladas las dependencias, inicia el servidor local con:
```bash
npm start
```

### 4. Abrir la aplicación en el navegador
Después de ejecutar el comando anterior, la consola te mostrará que el servidor está corriendo.
Abre tu navegador web favorito (Chrome, Edge, Firefox, etc.) y visita:
[http://localhost:3000](http://localhost:3000)

## Características principales
- **Monitoreo de conejos:** Control de categorías zootécnicas, pesos y estados de salud.
- **Almacén:** Gestión de stock de alimentos con notificaciones de reabastecimiento.
- **Responsivo:** Interfaz adaptada para visualizarse correctamente tanto en celulares como en computadoras.
- **Fácil despliegue:** La aplicación es compatible para ser subida fácilmente a plataformas gratuitas como Vercel o Render.
