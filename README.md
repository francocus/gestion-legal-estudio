# Sistema de Gestión de Expedientes (Santa Fe) ⚖️

Plataforma web integral para la administración de estudios jurídicos, optimizada específicamente para la normativa y procesos de la Provincia de Santa Fe.

Centraliza la gestión de clientes, el seguimiento de causas judiciales y el control financiero del estudio, reemplazando planillas de Excel dispersas con una solución unificada y moderna.

![Dashboard Principal](/screenshots/dashboard.png)
*Vista general del estado financiero y la agenda prioritaria del estudio.*

---

## Funcionalidades Clave

### Especialización Santa Fe 🇦🇷
* **Calculadora JUS Integrada:** Conversión automática y actualizada de Unidades JUS a Pesos para presupuestar y verificar regulaciones de honorarios al instante.
* **Conexión con SISFE:** Acceso directo a la visualización de expedientes en el Poder Judicial de Santa Fe desde cada causa.
* **Juzgados Locales:** Base de datos precargada con la nómina de juzgados de Rosario y Santa Fe.

![Calculadora JUS](/screenshots/expediente-edit.png)
*Módulo de cálculo automático de honorarios basado en el valor JUS actual.*

### Gestión Procesal y Financiera
* **Expediente Digital:** Historial cronológico de movimientos, control de estados y semáforo de vencimientos.
* **Control de Caja:** Registro de ingresos y gastos por expediente. Visualización gráfica del progreso de cobro de honorarios.
* **Agenda Inteligente:** Alertas visuales de plazos fatales y audiencias próximas.

![Detalle de Expediente](/screenshots/expediente.png)
*Vista de detalle con seguimiento de cobros y próximos vencimientos.*

---

## Stack Tecnológico

Desarrollado con una arquitectura moderna, tipada y de alto rendimiento:

* **Frontend:** Next.js 14 (App Router), React, TypeScript.
* **Estilos & UI:** Tailwind CSS, Shadcn/ui (Componentes accesibles y modo oscuro nativo).
* **Backend:** Server Actions.
* **Base de Datos:** PostgreSQL (vía Neon DB).
* **ORM:** Prisma.
* **Seguridad:** Auth.js (NextAuth v5).

---

## Estado del Proyecto

El sistema se encuentra en fase de producción, con todas sus funcionalidades principales operativas.

🔗 **Deploy (Demo):** [[gestion-legal-estudio.vercel.app](https://gestion-legal-estudio.vercel.app/)]
*(Acceso con credenciales de demostración)*