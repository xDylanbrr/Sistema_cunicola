# Contexto General del Sistema Cunícola

Este documento explica de forma resumida el propósito y funcionamiento de los 4 módulos principales que componen el Sistema de Gestión Cunícola. El aplicativo fue diseñado como una solución integral para modernizar y digitalizar las operaciones diarias en granjas de conejos.

---

## 1. Monitoreo de Conejos 🐇
Este es el módulo central o "core" del negocio. Su objetivo principal es llevar la trazabilidad individual de cada animal dentro de la granja.

**Funciones principales:**
- **Ficha Clínica e Identificación:** Registro de número de jaula, arete (ID), raza, sexo, fecha de nacimiento y estado actual (Activo, Vendido, Baja).
- **Control Reproductivo:** Seguimiento de montas, palpaciones (positivas/negativas), fechas estimadas de parto y destetes. Manejo del ciclo de gestación y lactancia.
- **Categorías Zootécnicas:** Clasificación automática o manual del animal según su etapa de vida (Gazapo, Crecimiento, Engorde, Gestante, Lactante, Padrote, etc.).
- **Historial de Peso y Sanidad:** Registro continuo del peso para calcular la ganancia diaria, y bitácora de tratamientos médicos o vacunas aplicadas.

## 2. Almacén 📦
Este módulo está enfocado en la gestión de los recursos físicos de la granja, con especial énfasis en el alimento, que representa uno de los mayores costos de producción.

**Funciones principales:**
- **Control de Inventario:** Registro de la cantidad disponible de alimento (sacos, kilos) e insumos médicos (medicamentos, vitaminas).
- **Trazabilidad de Consumo:** Salidas de inventario para alimentar a los lotes o administrar tratamientos.
- **Alertas de Reabastecimiento:** Indicadores visuales automáticos que notifican cuando el stock de un producto específico llega a niveles mínimos, previniendo el desabastecimiento.

## 3. Sensores (IoT) 🌡️
Este módulo representa la integración de hardware y "Smart Farming" (Granjas Inteligentes). Su objetivo es garantizar que el entorno ambiental de los conejos sea el óptimo, lo cual es crítico para reducir el estrés, mejorar la conversión alimenticia y prevenir enfermedades.

**Funciones principales:**
- **Monitoreo en Tiempo Real:** Lectura continua de temperatura y humedad ambiental dentro de los galpones.
- **Detección de Gases:** Monitoreo de niveles de Amoníaco (NH3) u otros gases perjudiciales generados por el estiércol y la orina.
- **Visualización de Datos:** Gráficas de tendencias históricas y alertas cuando los parámetros salen del rango de confort térmico ideal para los conejos.

## 4. Visión Computacional 📷
Este es el módulo más avanzado e innovador, utilizando Inteligencia Artificial (IA) para la automatización de procesos mediante el análisis de imágenes o video en tiempo real.

**Funciones principales:**
- **Conteo Automático:** Identificación y conteo de gazapos en el nido de manera automatizada para reducir la manipulación humana y el estrés en las camadas.
- **Estimación de Peso y Tamaño:** Análisis de biometría a través de cámaras para calcular aproximaciones del peso del animal sin necesidad de una báscula física.
- **Análisis de Comportamiento:** Monitoreo de la actividad de los animales para detectar tempranamente anomalías, letargo o posibles enfermedades mediante su patrón de movimiento.
