# 📖 AGENT 1: ESTRUCTURA DE ENSEÑANZA

## 🎯 PRINCIPIO FUNDAMENTAL

> "el agente 1 redactor toma el texto literal y con eso elabora el contenido practico con su estructura de enseñanza"

**Regla de oro:**
- ✅ Agent 1 toma **texto LITERAL** de CodexObsidiana (vía Agent 0)
- ✅ Construye **estructura de enseñanza** alrededor del texto literal
- ❌ **NUNCA inventa** contenido bíblico
- ❌ **NUNCA modifica** el texto del versículo

---

## 📊 FLUJO DE DATOS

```
┌─────────────────────────────────────────────────────┐
│  AGENT 0: Investigador                              │
│  Output: agent-0-decision.json                      │
├─────────────────────────────────────────────────────┤
│  {                                                   │
│    reference: "Salmos 23:1",                        │
│    text: "Jehová es mi pastor; nada me faltará.", ← TEXTO LITERAL de CodexObsidiana
│    category: "consuelo",                            │
│    historicalContext: "David escribió...",          │
│    visualDescriptions: { ... },                     │
│    customHook: "...",                               │
│    historicalInsight: "..."                         │
│  }                                                   │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  AGENT 1: Redactor                                  │
│  Input: agent-0-decision.json                       │
│  Output: script.json                                │
├─────────────────────────────────────────────────────┤
│  Toma el TEXTO LITERAL y construye:                 │
│                                                      │
│  1. HOOK (5s)                                       │
│     - Gancho viral basado en customHook             │
│     - NO usa el texto literal todavía               │
│                                                      │
│  2. INTRO (25s)                                     │
│     - Cita el TEXTO LITERAL completo                │
│     - Usa historicalInsight de Agent 0              │
│     - Contexto histórico REAL                       │
│                                                      │
│  3. BODY (45s)                                      │
│     - Desglosa el TEXTO LITERAL palabra por palabra │
│     - Explica significado usando metadata           │
│     - Conexiones prácticas a la vida               │
│                                                      │
│  4. APPLICATION (25s)                               │
│     - Aplicación práctica del TEXTO LITERAL         │
│     - Paso concreto que el usuario puede hacer      │
│                                                      │
│  5. CTA (20s)                                       │
│     - Llamado a acción                              │
│     - Refuerza mensaje del TEXTO LITERAL            │
└─────────────────────────────────────────────────────┘
```

---

## 🏗️ ESTRUCTURA DE ENSEÑANZA DETALLADA

### Fase 1: HOOK (5 segundos)

**Objetivo:** Captar atención inmediata SIN revelar el versículo todavía

**NO usa texto literal, usa:**
- `customHook` de Agent 0
- O template basado en `bestHookType`

**Ejemplo:**
```
Agent 0 provee:
- customHook: "Si te falta amor en tu vida, esto es para ti."

Agent 1 genera:
"Si te falta amor en tu vida, esto es para ti."
```

**✅ Correcto:** Gancho viral personalizado
**❌ Incorrecto:** Citar el versículo literal aquí (mata la curiosidad)

---

### Fase 2: INTRO (25 segundos)

**Objetivo:** Presentar el TEXTO LITERAL + contexto histórico

**USA texto literal completo:**

```javascript
generateIntroWithFramework(verse) {
  // ✅ CORRECTO: Cita el texto LITERAL completo
  return `${verse.reference} dice: "${verse.text}"

${verse.historicalInsight || verse.historicalContext}

Quizás te preguntas si Dios realmente te ama. Si eres suficiente.

Pero hay algo en estas palabras que puede cambiarlo todo. Y en los próximos 2 minutos, lo vas a descubrir.`;
}
```

**Componentes:**
1. **Referencia + Texto Literal:** `"Salmos 23:1 dice: 'Jehová es mi pastor; nada me faltará.'"`
2. **Contexto Histórico:** De `historicalInsight` (Agent 0)
3. **Gancho Emocional:** Conexión personal con el espectador
4. **Open Loop:** "vas a descubrir algo..."

**✅ Correcto:** Texto literal palabra por palabra de CodexObsidiana
**❌ Incorrecto:** Parafrasear o modificar el versículo

---

### Fase 3: BODY (45 segundos)

**Objetivo:** Desglosar el TEXTO LITERAL y revelar significado profundo

**Técnica: Deconstrucción del texto literal**

```javascript
generateBodyWithStorytelling(verse) {
  // ✅ CORRECTO: Desglosar el texto LITERAL palabra por palabra

  // Ejemplo con Salmos 23:1
  const body = `
Cuando el salmista escribió "${verse.text}", cada palabra importa.

"Jehová" - no cualquier dios, sino el Dios personal que te conoce por nombre.

"es mi pastor" - tiempo presente, no "fue" ni "será", ES ahora mismo.

"nada me faltará" - no dice "casi nada" o "poco me faltará". NADA.

Pero aquí viene algo que mucha gente no entiende...

${verse.historicalInsight}

Es el tipo de amor que da TODO sin esperar nada a cambio.

Esto te incluye a ti. Con tu pasado. Con tus errores. Con tus dudas.
  `;

  return body;
}
```

**Componentes:**
1. **Cita literal:** `"${verse.text}"`
2. **Deconstrucción:** Palabra por palabra del texto literal
3. **Significado profundo:** Usando metadata de Agent 0
4. **Revelación:** Insight histórico/teológico
5. **Aplicación universal:** Cómo aplica a todos

**✅ Correcto:** Cada análisis referencia el texto literal original
**❌ Incorrecto:** Agregar palabras que no están en el versículo

---

### Fase 4: APPLICATION (25 segundos)

**Objetivo:** Convertir el TEXTO LITERAL en acción práctica

```javascript
generatePracticalApplication(verse) {
  // ✅ CORRECTO: Aplicación basada en el texto literal

  const application = `
Entonces, ¿qué haces con "${verse.text}" AHORA MISMO?

Cierra tus ojos por un segundo. Solo un segundo. Respira profundo.

Y di esto en tu mente, o en voz alta si estás solo:
"${verse.text.split(',')[0]}" - repítelo hasta que lo sientas.

Eso es todo. Así de simple. No necesitas palabras perfectas.

Hoy puede ser el día en que todo cambia. No lo dejes pasar.
  `;

  return application;
}
```

**Componentes:**
1. **Referencia al texto literal:** Cita exacta
2. **Paso concreto:** Acción práctica inmediata
3. **Personalización:** Adaptado al mensaje del versículo
4. **Urgencia:** "Ahora mismo", "Hoy"

**✅ Correcto:** La acción deriva directamente del texto literal
**❌ Incorrecto:** Sugerir acciones no relacionadas con el versículo

---

### Fase 5: CTA (20 segundos)

**Objetivo:** Llamado a acción + reforzar el TEXTO LITERAL

```javascript
generateUltraShortCTA(verse) {
  return `
Si esto tocó tu corazón, déjame un AMÉN en los comentarios.

Suscríbete para más versículos que cambian vidas 🔔.

Comparte esto con alguien que necesite escuchar que "${verse.text.substring(0, 30)}...".

Dios te bendiga.
  `;
}
```

**Componentes:**
1. **Engagement:** Comentarios, like, suscripción
2. **Share:** Compartir con otros
3. **Cierre con texto literal:** Fragmento del versículo
4. **Bendición:** Cierre espiritual

---

## 🔍 EJEMPLO COMPLETO: Salmos 23:1

### Input de Agent 0:
```json
{
  "reference": "Salmos 23:1",
  "text": "Jehová es mi pastor; nada me faltará.",
  "category": "consuelo",
  "historicalContext": "David escribió este salmo después de años de ser pastor...",
  "historicalInsight": "David usó la palabra 'pastor' porque él mismo cuidó ovejas. Sabía que un pastor nunca abandona su rebaño.",
  "customHook": "Si sientes que estás solo en la tormenta, esto es para ti.",
  "visualDescriptions": {
    "hook": "Valle verde pacífico con pastor y ovejas...",
    "intro": "Campos pastorales de Belén...",
    "body": "Aguas tranquilas cristalinas...",
    "application": "Mano suave acariciando lana de oveja...",
    "cta": "Pastor guiando rebaño hacia horizonte dorado..."
  }
}
```

### Output de Agent 1:

**HOOK (5s):**
```
"Si sientes que estás solo en la tormenta, esto es para ti."
```
✅ NO usa texto literal todavía
✅ Usa customHook de Agent 0

**INTRO (25s):**
```
Salmos 23:1 dice: "Jehová es mi pastor; nada me faltará."

David escribió este salmo después de años de ser pastor.
Él sabía que un pastor nunca abandona su rebaño.

Quizás te preguntas si Dios realmente te cuida. Si estás solo.

Pero hay algo en estas palabras que puede cambiarlo todo.
Y en los próximos 2 minutos, lo vas a descubrir.
```
✅ Cita texto LITERAL completo
✅ Usa historicalInsight de Agent 0
✅ NO modifica el versículo

**BODY (45s):**
```
Cuando David escribió "Jehová es mi pastor; nada me faltará.",
cada palabra importa.

"Jehová" - no cualquier dios, sino el Dios personal que te conoce por nombre.

"es mi pastor" - tiempo presente, no "fue" ni "será", ES ahora mismo.

"nada me faltará" - no dice "casi nada" o "poco me faltará". NADA.

Pero aquí viene algo que mucha gente no entiende...

David usó la palabra "pastor" porque él mismo cuidó ovejas.
Sabía exactamente cómo un pastor protege, guía y nunca abandona su rebaño.

Es el tipo de cuidado que NO depende de si tú eres perfecto.
Depende de QUIÉN es el Pastor.

Esto te incluye a ti. Con tu pasado. Con tus miedos. Con tus errores.
```
✅ Desglose palabra por palabra del texto LITERAL
✅ Usa historicalInsight de Agent 0
✅ NO inventa contenido bíblico

**APPLICATION (25s):**
```
Entonces, ¿qué haces con "Jehová es mi pastor; nada me faltará" AHORA MISMO?

Cierra tus ojos por un segundo. Solo un segundo. Respira profundo.

Y di esto en tu mente, o en voz alta si estás solo:
"Jehová es mi pastor" - repítelo hasta que lo sientas.

Eso es todo. Así de simple. No necesitas estar en una iglesia.
Solo necesitas ser honesto.

Hoy puede ser el día en que todo cambia. No lo dejes pasar.
```
✅ Aplicación basada en el texto LITERAL
✅ Acción práctica concreta

**CTA (20s):**
```
Si esto tocó tu corazón, déjame un AMÉN en los comentarios.

Suscríbete para más versículos que cambian vidas 🔔.

Comparte esto con alguien que necesite escuchar que "Jehová es mi pastor; nada me faltará".

Dios te bendiga.
```
✅ Refuerza el texto LITERAL en el cierre

---

## ❌ ERRORES COMUNES A EVITAR

### Error 1: Parafrasear el Versículo

**❌ MAL:**
```
Salmos 23:1 dice: "Dios me cuida; no me va a faltar nada."
```

**✅ BIEN:**
```
Salmos 23:1 dice: "Jehová es mi pastor; nada me faltará."
```

**Por qué:** El texto literal es Reina Valera 1960. NO parafrasear.

---

### Error 2: Agregar Palabras al Versículo

**❌ MAL:**
```
"Jehová es mi pastor AMOROSO; nada me faltará JAMÁS."
```

**✅ BIEN:**
```
"Jehová es mi pastor; nada me faltará."
```

**Por qué:** No agregar palabras que no están en el texto original.

---

### Error 3: Mezclar Versículos

**❌ MAL:**
```
Salmos 23:1 dice: "Jehová es mi pastor; nada me faltará.
Y Él me hace descansar en verdes pastos."
```

**✅ BIEN:**
```
Salmos 23:1 dice: "Jehová es mi pastor; nada me faltará."
[Luego en el body]: "El versículo 2 continúa diciendo..."
```

**Por qué:** Agent 0 selecciona UN versículo específico. No mezclar con otros.

---

### Error 4: Inventar Contexto Histórico

**❌ MAL:**
```
// Agent 1 inventando:
"David escribió esto cuando estaba escapando de sus enemigos en una cueva."
```

**✅ BIEN:**
```
// Agent 1 usando metadata de Agent 0:
`${verse.historicalInsight}`
```

**Por qué:** El contexto histórico viene de Agent 0 (que lo genera con IA basado en fuentes reales). Agent 1 NO inventa.

---

## 🎯 CHECKLIST DE VALIDACIÓN

Antes de generar un script, verificar:

- [ ] ✅ Texto literal citado exactamente como está en `verse.text`
- [ ] ✅ NO hay parafraseo del versículo
- [ ] ✅ NO hay palabras agregadas al versículo
- [ ] ✅ Contexto histórico viene de `verse.historicalInsight` (Agent 0)
- [ ] ✅ Deconstrucción palabra por palabra del texto literal
- [ ] ✅ Aplicación deriva directamente del texto literal
- [ ] ✅ NO se mezclan versículos diferentes
- [ ] ✅ NO se inventa contenido bíblico

---

## 🔧 IMPLEMENTACIÓN EN CÓDIGO

### Regla de Oro en Agent 1:

```javascript
class ViralScriptWriter {

  /**
   * REGLA CRÍTICA: SIEMPRE usar verse.text LITERAL
   * NUNCA modificar, parafrasear o agregar al versículo
   */
  generateIntroWithFramework(verse) {
    // ✅ CORRECTO: Cita EXACTA
    const verseQuote = `${verse.reference} dice: "${verse.text}"`;

    // ✅ CORRECTO: Contexto de Agent 0
    const context = verse.historicalInsight || verse.historicalContext;

    // ❌ NUNCA hacer esto:
    // const verseQuote = `${verse.reference} dice: "${this.paraphrase(verse.text)}"`;

    return `${verseQuote}\n\n${context}\n\n...`;
  }

  generateBodyWithStorytelling(verse) {
    // ✅ CORRECTO: Desglosar palabra por palabra
    const words = verse.text.split(' ');

    // Construir análisis referenciando SIEMPRE el texto original
    let body = `Cuando el salmista escribió "${verse.text}", cada palabra importa.\n\n`;

    // Desglose específico basado en palabras clave del texto literal
    // ...

    return body;
  }

  generatePracticalApplication(verse) {
    // ✅ CORRECTO: Aplicación basada en el texto LITERAL
    return `
Entonces, ¿qué haces con "${verse.text}" AHORA MISMO?

Cierra tus ojos por un segundo.

Y di esto: "${verse.text.split(',')[0]}" - repítelo hasta que lo sientas.
    `;
  }
}
```

---

## 📖 RESUMEN

**Agent 1 es un MAESTRO, no un AUTOR:**

✅ **Toma** el texto literal de CodexObsidiana (vía Agent 0)
✅ **Construye** estructura de enseñanza alrededor del texto
✅ **Explica** el significado palabra por palabra
✅ **Aplica** el mensaje a la vida práctica
❌ **NUNCA** modifica el texto bíblico
❌ **NUNCA** inventa contenido que no está en CodexObsidiana

**Analogía:**
Agent 1 es como un profesor de literatura que analiza un poema clásico:
- NO reescribe el poema
- Cita el poema EXACTO
- Explica cada línea
- Conecta el mensaje con la vida del estudiante

**El texto literal es SAGRADO. La enseñanza es PRÁCTICA.**
