# DOCUMENTACIÓN COMPLETA Y CREDENCIALES DEL PROYECTO
## MESIRA ARGENTINA (https://mesira.net)

Este documento es una guía autónoma para reconstruir la página web de Mesira Argentina desde cero. Incluye todos los accesos, cuentas, contraseñas, variables de entorno y configuraciones de servicios necesarias. Guardá este archivo y el ZIP en un lugar seguro.

---

## 1. RESUMEN DE CUENTAS Y ACCESOS

### A. FIREBASE (Base de datos, Autenticación y Almacenamiento)
* **Proveedor**: Google Firebase
* **Cuenta de Inicio de Sesión**: Iniciar sesión con Google usando la cuenta `imc112818@...` (Gmail).
* **ID de Proyecto**: `mesira-argentina`
* **URL de la Consola**: [Consola de Firebase](https://console.firebase.google.com/project/mesira-argentina)
* **Servicios activos**:
  * **Authentication**: Proveedor de Google habilitado.
  * **Firestore Database**: Base de datos NoSQL para productos, usuarios y alertas.
  * **Cloud Storage**: Almacenamiento de archivos.

### B. VERCEL (Hosting y Despliegue en producción)
* **Proveedor**: Vercel
* **Cuenta de Inicio de Sesión**: Iniciar sesión con Google usando la cuenta `xscel03@...` (Gmail).
* **Proyecto**: `mesira`
* **Dominio**: `https://mesira.net` (también `https://www.mesira.net` y subdominios de Vercel).
* **CI/CD**: Vinculado directamente al repositorio de GitHub para compilar y desplegar automáticamente en cada push a la rama `main`.

### C. GITHUB (Repositorio de Código Fuente)
* **Cuenta de Inicio de Sesión**: Cuenta asociada a `CHKI541`.
* **URL del Repositorio**: `https://github.com/CHKI541/Mesira`
* **Rama principal**: `main`

### D. RESEND (Proveedor de Correo de Alertas)
* **Proveedor**: Resend (https://resend.com)
* **Cuenta de Inicio de Sesión**: Iniciar sesión con Google usando la cuenta `xscel03@...` (Gmail).
* **API Key**: `re_H72r31Wa_7V7kmLrCcpkAZmdQRNUM2ga1`
* **Dominio verificado**: `mesira.net`
* **Correo de envío configurado**: `alertas@mesira.net`

### E. CLOUDFLARE (Dominio y DNS)
* **Proveedor**: Cloudflare
* **Cuenta de Inicio de Sesión**: Iniciar sesión con Google usando la cuenta `xscel03@...` (Gmail).
* **Dominio Administrado**: `mesira.net`
* **Configuración activa**:
  * Registros DNS que apuntan a Vercel.
  * Registros DNS de validación de Resend (DKIM, SPF, MX).
  * Email Routing activado para redireccionar correos entrantes de `alertas@mesira.net`.

### F. SMTP DE GMAIL (Configuración de Respaldo)
* **Servidor**: `smtp.gmail.com`
* **Puerto**: `465` (SSL)
* **Usuario**: `xscel05@gmail.com`
* **Contraseña de Aplicación de Google**: `ucynckfqkwimgyho`

---

## 2. CONFIGURACIÓN DEL ENTORNO (.env.local)

Estas son las variables de entorno que deben estar configuradas tanto a nivel local (en un archivo `.env.local` en la raíz del proyecto) como en el panel de configuración de **Vercel** (Settings > Environment Variables).

```env
# ==========================================
# CONFIGURACIÓN PÚBLICA DE FIREBASE (CLIENTE)
# ==========================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBgDaO4SIBXQexDvR9vGOIjkoBR9YTj2iM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mesira-argentina.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mesira-argentina
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mesira-argentina.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=67846483216
NEXT_PUBLIC_FIREBASE_APP_ID=1:67846483216:web:d9a40a5f2355aad65a8995

# ==========================================
# CREDENCIALES DE ADMIN DE FIREBASE (SERVIDOR)
# ==========================================
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@mesira-argentina.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5KYyTdNGnLCzf\nRP3JkYfYtmql5BDigKaCF8MkfkuSt/uR9JzRpQ+BDVmyiEU5HmAa+TRCroj8FnDt\n7+7NBGvpEr/gHZUE8jZ3zHtKRc/CRqAd0VEo2/ZyAuuBhu3Q4quP9sT+kdY7UxEU\nZLSAJsOwmu7XwApPlxdctz/Wc7KKALD40Pb4PChn6mhjp1plS2PbgkWz99FmO7rv\nhw0KUeY9Ttmnwe2DDYlkAZV00oVfJPgjOYpTZ/lCJ0bBTOBHTMcKKHneAdx0GEb1\n8YwflgNfPyRySBawAF9F0G5cpbQpoE9tp3qm7pjpXvs80+y4KMkczS0fbzhGdKnq\nE7TLAO0NAgMBAAECggEAE4jAneXbIGnWqg9bPuKtlD1abvnqlhrAdkUPf1AbpPTo\nA3Ps/2kMg67m4aDivK3psa7MxqQnK4EqlM+VP+fRgptJxtkYGZd8C5N1BlbrHjHZ\nPowQpeDe1RRdyCJ2AG2Jb/y2t6ynD0cqLB6btFFin8UYoYZPECp+eneSsosuMMTH\n8j95WCW6rfnDBOgLrOmfeXXqKgMCcHGnpToORQLUsmhI7WJ8NdLMsYsuVjOQQSC2\nzNCiRSQMtxleMATDkxE/HkODtOCKwq/x8kZXsbSNNNRtqZySWXAgH9z5mwxUQGYP\nR73PJetEcWGV/MuVMZth6lyBqV/aUwfOJvFpnn96eQKBgQDfvFC1yc0mUqpoOhoO\nHxKfOUqcXuZX2xhNjVad3K+hD/xPfQp8eqANbCzaLcWhW8vFkh2EL8M1oYJOFPGc\nHdeyUAuwBNFDL7bJLSS12SjJH+zr6JIs+5OUjPC++v2WtC7L1VifD6L6SwLb0sXL\nxL5lrdQOS9+1QiFAQrGIL16xJwKBgQDT3Td52H4ohvqAnnEP9cCj77L5Fvf75Xqo\nceZAj0TApqiKGuQcOzC977CZKYHNjK4jej+HcYj/8BmOgSYJl7D7kTZDgJ0ZaB9D\nywLSkhlwsu5OO99iQxtZpOmzrPh89bDqPUHKpJwHAkF8tN1BHqQX1dEOnQB0Boro\njWg5yumoqwKBgAkT1+Z4SJWMdxOBf/sgsZ26MlfD1e6smgDTgjcndAzB3EfRV/KS\n+xlwUSWNA963Hb5nXkE1uuLbKbFHUkI2R8EZVFAQ8fia3/yrkzi5ldkLLY6owf2H\nO4akbUQiZNWPe/KTNmRFuyQSlQwcMiBBXEQ92EO4OlxdUYIM8q0G1v2zAoGBAKRJ\sq8llg7PPIloU7xQkWWOhnZpvTr0JD1itW3yqxnJIoCVgbXyoEVpDMR4T1OZd5/D\nOGhLPjVZdjfvJhPiMTeizzVhEnGVMEldr36iFGA0IF9CRmLoLtlA7IiL5NThoKLD\nhbUiGGvG8AlIJxpMLGrfPxHZ5XQTbrwOi3flRXOpAoGBANyY58PeGzsT/lKsyxMm\nuzeKT5fAG30+1O/X8CjTP0BwlQO/GcCLgdPA4fZOk9RI+aojq4kqPWPtqhGJeU4t\nQztfeKiJiz2OUOsy7sOmU6xn+b7riC3NeyfMxFjZrguOrB1ryuQsCHHCHiLhB9FW\nIZYh8V0oxKJvpWTzopF+6ghD\n-----END PRIVATE KEY-----\n"

# ==========================================
# CONFIGURACIÓN DEL SERVIDOR DE EMAIL (SMTP)
# ==========================================
# Opción A: Usar Resend (SMTP oficial de producción)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER="resend"
SMTP_PASS="re_H72r31Wa_7V7kmLrCcpkAZmdQRNUM2ga1"
SMTP_FROM="alertas@mesira.net"

# Opción B: Usar Gmail (SMTP de respaldo)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=465
# SMTP_USER="xscel05@gmail.com"
# SMTP_PASS="ucynckfqkwimgyho"
# SMTP_FROM="xscel05@gmail.com"

# ==========================================
# CONFIGURACIÓN DE LA APP (PRODUCCIÓN / LOCAL)
# ==========================================
NEXT_PUBLIC_APP_URL="https://mesira.net"

# ==========================================
# SECRETO INTERNO PARA PROTECCIÓN DE ENDPOINT DE ALERTAS
# ==========================================
# Este token protege el endpoint /api/alerts/notify de llamadas maliciosas externas
ALERT_NOTIFY_SECRET="mesira-internal-2025-xK9mP7q"
NEXT_PUBLIC_ALERT_NOTIFY_SECRET="mesira-internal-2025-xK9mP7q"
```

---

## 3. REGLAS DE SEGURIDAD PARA BASE DE DATOS Y STORAGE

Estas reglas deben ser aplicadas directamente en las consolas correspondientes de Firebase para proteger los datos de los usuarios.

### A. FIRESTORE RULES (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regla para perfiles de usuario
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regla para productos publicados
    match /products/{productId} {
      allow read: if true; // Lectura pública
      allow create: if request.auth != null;
      // Solo el dueño puede editar su producto, excepto para incrementar vistas
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.sellerId || 
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewsCount', 'viewedUserIds']))
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.sellerId;
    }
    
    // Regla para alertas de usuarios
    match /alerts/{alertId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### B. STORAGE RULES (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true; // Lectura pública de imágenes de productos
      allow write: if request.auth != null; // Solo usuarios autenticados
      // Solo el dueño del archivo (que coincide con la ruta o metadatos) puede borrarlo
      allow delete: if request.auth != null && (
        request.auth.uid == resource.metadata.ownerId ||
        allPaths.startsWith('products/' + request.auth.uid + '/')
      );
    }
  }
}
```

---

## 4. GUÍA DE RECONSTRUCCIÓN PASO A PASO

Si la página se elimina o se desea desplegar de cero en una cuenta nueva, siga estos pasos:

### PASO 1: Configurar el Repositorio de GitHub
1. Crear un repositorio en GitHub (ej. privado o público) con el nombre `Mesira`.
2. Extraer el contenido de este ZIP (excluyendo este documento si se prefiere) en una carpeta local.
3. Inicializar git localmente, vincularlo al repositorio de GitHub y subir la rama `main`:
   ```bash
   git init
   git remote add origin https://github.com/TU_USUARIO/Mesira.git
   git add .
   git commit -m "Initial commit from backup ZIP"
   git branch -M main
   git push -u origin main
   ```

### PASO 2: Configurar Firebase
1. Ingresar a la [Consola de Firebase](https://console.firebase.google.com/) con el email `imc112818@...` (o cuenta nueva).
2. Crear un proyecto llamado `mesira-argentina` (o similar).
3. **Authentication**: Habilitar el proveedor de inicio de sesión **Google**.
   * **¡IMPORTANTE!**: En la pestaña **Settings** > **Authorized Domains**, agregar `mesira.net` y `www.mesira.net` (además de los dominios por defecto de localhost y firebaseapp.com). Si no se hace esto, el inicio de sesión con Google fallará en producción con un mensaje de error.
4. **Firestore Database**:
   * Crear la base de datos en modo producción.
   * Ir a la pestaña **Rules** (Reglas) y pegar el contenido de las reglas detalladas en la sección 3.A de este documento.
   * Crear los índices compuestos necesarios (o dejar que la aplicación genere los enlaces de error compuestos en la consola al usarse y hacer clic en ellos para crearlos).
5. **Storage**:
   * Habilitar Cloud Storage.
   * Pegar las reglas de Storage de la sección 3.B.
6. **Configuración de la App Web**:
   * Registrar una nueva aplicación Web en la configuración del proyecto Firebase.
   * Copiar las credenciales públicas generadas (`apiKey`, `authDomain`, etc.) y reemplazar los valores en la sección cliente del archivo `.env.local` / Configuración de Vercel.
7. **Firebase Admin SDK (Clave Privada)**:
   * Ir a Project Settings > Service Accounts.
   * Hacer clic en **Generate new private key** (Generar nueva clave privada).
   * Esto descargará un archivo JSON. Extraer de allí el `client_email` y el `private_key` (reemplazando los saltos de línea con `\n` en una sola línea de texto) y configurarlos como variables de entorno.

### PASO 3: Configurar Cloudflare (DNS)
1. Iniciar sesión en Cloudflare con la cuenta `xscel03@...`.
2. Seleccionar el dominio `mesira.net`.
3. Configurar los registros DNS tipo A y CNAME provistos por Vercel para apuntar la web.
4. Configurar registros MX y TXT provistos por Resend para validar el dominio y habilitar el correo saliente de `alertas@mesira.net`.
5. En Cloudflare Email Routing, configurar la redirección para que los correos que lleguen a `alertas@mesira.net` vayan al correo del administrador.

### PASO 4: Configurar Resend
1. Iniciar sesión en Resend con la cuenta `xscel03@...`.
2. Agregar y verificar el dominio `mesira.net` configurando los registros DNS correspondientes en Cloudflare.
3. Generar una API Key con permisos de envío y configurarla en las variables de entorno.

### PASO 5: Despliegue en Vercel
1. Iniciar sesión en Vercel con la cuenta `xscel03@...`.
2. Crear un nuevo proyecto e importar el repositorio de GitHub `Mesira`.
3. En la sección **Environment Variables** durante la creación o en Settings, agregar todas las variables detalladas en la Sección 2.
4. Presionar **Deploy** (Desplegar). Vercel compilará la aplicación y la publicará de forma segura.
5. Vincular el dominio `mesira.net` y `www.mesira.net` en la pestaña Domains del proyecto Vercel.

---
**Guía y Credenciales preparadas para Mesira Argentina en Junio de 2026.**
