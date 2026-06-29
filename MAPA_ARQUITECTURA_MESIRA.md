# 🗺️ Mapa de Arquitectura y Guía de Optimización de Tokens - Mesira

Este documento contiene la estructura completa del proyecto de **Mesira (Web + App)**. Está diseñado especialmente para que puedas copiar y pegar secciones específicas a cualquier Agente de Inteligencia Artificial (IA), permitiéndole entender la arquitectura rápidamente y **ahorrar tokens** al enfocar su análisis únicamente en los archivos relevantes.

---

## 🌐 1. ESTRUCTURA DE LA PLATAFORMA WEB (Next.js / React / Firestore)

El backend de la web y la app corre sobre Next.js 15+ (Directorio `/app`) con Firebase Client SDK para lógica cliente y Firebase Admin SDK para operaciones del servidor.

### 🔑 A. Núcleo, Base de Datos y Autenticación
Esta es la base de todo el sistema. Si hay un problema con las sesiones, los registros o el guardado de datos, está acá.

*   **`context/AuthContext.tsx`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\context\AuthContext.tsx`
    *   **Función:** Maneja el estado de la sesión de los usuarios. Escucha a Firebase Auth, lee el perfil del usuario de Firestore, maneja el onboarding y gestiona el **Inicio de Sesión con Google** (detecta si es web o nativo app).
    *   **Riesgo de Bugs:** 🔴 **ALTO**. Cualquier error de sintaxis o de lógica asíncrona puede dejar toda la web en blanco. Propenso a bucles de renderizado (re-renders infinitos) y fallos al cargar en SSR si se intenta usar `window` sin verificar.
*   **`lib/db.ts`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\lib\db.ts`
    *   **Función:** Contiene todas las consultas cliente a Firestore (crear producto, guardar alertas, registrar token FCM, moderar producto, etc.).
    *   **Riesgo de Bugs:** 🔴 **ALTO**. Si se cambian las reglas de seguridad de Firestore (`firestore.rules`) o si falta algún índice compuesto, las funciones de este archivo fallarán silenciosamente devolviendo arreglos vacíos o errores de permisos.
*   **`lib/firebase.ts`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\lib\firebase.ts`
    *   **Función:** Inicialización del SDK cliente de Firebase.
    *   **Riesgo de Bugs:** 🟢 **BAJO**. Solo falla si las credenciales en `.env.local` están mal cargadas.

---

### 🎨 B. Componentes Visuales (UI)
Lógica de interfaz de usuario de React reutilizable.

*   **`components/PushManager.tsx`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\components\PushManager.tsx`
    *   **Función:** Pide permisos de notificaciones push en el celular, registra el dispositivo en Firebase Cloud Messaging (FCM) y guarda el token del celular en Firestore.
    *   **Riesgo de Bugs:** 🟡 **MEDIO**. Solo se ejecuta dentro de la app móvil. Si falla, el usuario no recibirá notificaciones push. Propenso a fallar si se ejecuta antes de que el usuario haya iniciado sesión en la app.
*   **`components/AuthModal.tsx`** e **`components/OnboardingModal.tsx`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\components\`
    *   **Función:** Modales para iniciar sesión / registrarse y para completar los datos obligatorios del perfil (Nombre, Kehilá, Teléfono).
    *   **Riesgo de Bugs:** 🟡 **MEDIO**. Propenso a validaciones de formularios incompletas (teléfonos con formatos raros) o problemas de visualización (scroll bloqueado).
*   **`components/ProductCard.tsx`** y **`components/ProductPreview.tsx`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\components\`
    *   **Función:** Tarjetas de productos de mitzvá en el grid principal y modal de previsualización detallada.
    *   **Riesgo de Bugs:** 🟢 **BAJO**. Lógica meramente visual. A veces, problemas menores si las imágenes cargadas fallan (falta fallback).

---

### 📄 C. Páginas y Rutas Web (Frontend)
Vistas e interfaces principales que el usuario ve al navegar.

*   **`app/mi-cuenta/page.tsx`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\app\mi-cuenta\page.tsx`
    *   **Función:** Panel personal del usuario. Contiene 3 pestañas complejas: "Mi Perfil" (con el switch para activar notificaciones push generales), "Mis Alertas" (configurar alertas personalizadas por email o push), e "Historial de Publicaciones". **Además contiene la consola de administración** (tablas de moderación de productos y usuarios).
    *   **Riesgo de Bugs:** 🔴 **ALTO**. Es la página con más interactividad y estados de React. Prone a bugs de validación, problemas en el renderizado de tablas grandes y errores al disparar acciones administrativas si el token del admin expiró.
*   **`app/page.tsx`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\app\page.tsx`
    *   **Función:** Pantalla principal de Mesira. Muestra el buscador, filtros por categoría/kehilá, lista de productos activos y el formulario para "Publicar una Mitzvá".
    *   **Riesgo de Bugs:** 🟡 **MEDIO**. Prone a problemas al subir imágenes pesadas (Firebase Storage timeouts) o bugs de filtrado combinados (ej: filtrar por categoría y buscador a la vez).
*   **`app/producto/[id]/page.tsx`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\app\producto\[id]\page.tsx`
    *   **Función:** Vista individual de un producto. Muestra datos de contacto del vendedor, botones de acción (entregar, compartir) y botones de moderación rápida para el administrador.
    *   **Riesgo de Bugs:** 🟡 **MEDIO**. Vulnerable a crasheos si el ID del producto no existe en Firestore (devuelve `null` y rompe el renderizado si no hay chequeos condicionales).

---

### ⚙️ D. APIs Backend y Despachadores (Next.js API Routes)
Funciones del servidor en Node.js que corren de fondo.

*   **`app/api/alerts/notify/route.ts`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\app\api\alerts\notify\route.ts`
    *   **Función:** Es el corazón del sistema de alertas. Cuando se crea un producto nuevo, esta API busca coincidencias y despacha correos (vía SMTP/Nodemailer) o **Notificaciones Push masivas** (vía Firebase Admin FCM Multicast). También limpia de la base de datos los tokens de celulares que ya no existen (desinstalados).
    *   **Riesgo de Bugs:** 🔴 **ALTO**. Utiliza servicios externos. Puede fallar si el servidor SMTP bloquea la conexión, si el token de Firebase Admin expira, si el volumen de notificaciones push es muy alto (throttling) o si se producen timeouts por ejecuciones serverless largas.

---

## 📱 2. ESTRUCTURA DE LA APLICACIÓN ANDROID (Capacitor / Nativo)

La aplicación nativa de Android funciona como un *Wrapper* (contenedor WebView) que carga `https://mesira.net` e implementa la capa puente nativa para notificaciones push y diálogos del sistema.

### ⚙️ A. Compilación Gradle y Seguridad Nativa
*   **`android/app/build.gradle`** y **`android/build.gradle`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\android\app\build.gradle`
    *   **Función:** Lógica de compilación nativa de Android. Gestiona las firmas de la app, dependencias de plugins y optimizaciones de producción.
    *   **Riesgo de Bugs:** 🔴 **ALTO**. Cualquier error de dependencias (versiones de Google Services incompatibles con Capacitor) romperá la compilación por completo. También es sensible a la configuración de ProGuard/minify: si faltan reglas de preservación (`proguard-rules.pro`), el compilador ofuscará clases de Firebase o Capacitor y la app crasheará al abrirse.
*   **`android/app/src/main/AndroidManifest.xml`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\android\app\src\main\AndroidManifest.xml`
    *   **Función:** Registro de actividades del sistema, permisos de Internet y notificaciones push.
    *   **Riesgo de Bugs:** 🟡 **MEDIO**. Puede causar rechazos de Play Store si tiene activados atributos de depuración (`android:debuggable="true"`) o tráfico HTTP inseguro (`android:usesCleartextTraffic="true"`).

### 🔑 B. Credenciales y Archivos Locales
*   **`android/keystore.properties`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\android\keystore.properties`
    *   **Función:** Contiene las contraseñas de la firma digital de producción.
    *   **Riesgo de Bugs:** 🟡 **MEDIO**. Si se cambia el nombre del archivo `.keystore` o su contraseña en este archivo, Gradle fallará inmediatamente al compilar release.
*   **`android/app/src/main/res/values/strings.xml`**
    *   **Ruta:** `C:\Users\israe\OneDrive\Desktop\mesira\android\app\src\main\res\values\strings.xml`
    *   **Función:** Define recursos del sistema Android, incluyendo el `server_client_id` (Google Web Client ID).
    *   **Riesgo de Bugs:** 🟡 **MEDIO**. Si el `server_client_id` no coincide exactamente con el Web Client ID de tu consola de Firebase, el inicio de sesión nativo de Google dará error inmediatamente.

---

## 💬 3. CÓMO USAR ESTE ARCHIVO PARA AHORRAR TOKENS (PROMPTS RECOMENDADOS)

Cuando uses un Agente de IA nuevo, **NO le cargues todo el proyecto**. Copiale este mapa y usá prompts ultra enfocados.

### Prompt de Ejemplo para corregir un Bug en la Web (Alertas):
> *"Hola, estoy trabajando en el proyecto de Mesira. Necesito solucionar un problema en la pantalla donde el usuario configura sus alertas de correo y push. Por favor, lee únicamente el archivo: `C:\Users\israe\OneDrive\Desktop\mesira\app\mi-cuenta\page.tsx` para revisar la interfaz y `C:\Users\israe\OneDrive\Desktop\mesira\lib\db.ts` para ver cómo se guarda. No analices ninguna otra carpeta externa."*

### Prompt de Ejemplo para verificar el Backend de Notificaciones:
> *"Hola, las notificaciones push no se están despachando cuando se sube un producto. Por favor, analiza solo la lógica de envío en `C:\Users\israe\OneDrive\Desktop\mesira\app\api\alerts\notify\route.ts` y las funciones de lectura de tokens en `C:\Users\israe\OneDrive\Desktop\mesira\lib\db.ts`. Indícame dónde podría estar fallando."*

### Prompt de Ejemplo para compilar o firmar la App Android:
> *"Hola, necesito verificar la configuración de firma de producción y reglas de ofuscación de la app Android. Por favor, analiza solo `C:\Users\israe\OneDrive\Desktop\mesira\android\app\build.gradle` y `C:\Users\israe\OneDrive\Desktop\mesira\android\app\proguard-rules.pro`. No leas el resto de la app web."*
