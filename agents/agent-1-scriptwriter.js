// AGENTE 1: GUIONISTA EXPERTO
// El cerebro del sistema - Genera guiones optimizados para YouTube

const fs = require('fs');
const path = require('path');

// Base de datos de versículos populares
const POPULAR_VERSES = [
  {
    reference: 'Juan 3:16',
    text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
    category: 'promesas',
    keywords: ['amor', 'salvación', 'vida eterna', 'fe'],
    targetAudience: ['familias', 'nuevos creyentes', 'jóvenes']
  },
  {
    reference: 'Salmos 23:1',
    text: 'Jehová es mi pastor; nada me faltará.',
    category: 'consuelo',
    keywords: ['paz', 'confianza', 'provisión', 'pastor'],
    targetAudience: ['adultos mayores', 'personas con ansiedad']
  },
  {
    reference: 'Filipenses 4:13',
    text: 'Todo lo puedo en Cristo que me fortalece.',
    category: 'fortaleza',
    keywords: ['fuerza', 'poder', 'superación', 'victoria'],
    targetAudience: ['jóvenes', 'personas en crisis', 'emprendedores']
  },
  {
    reference: 'Proverbios 3:5-6',
    text: 'Fíate de Jehová de todo tu corazón, Y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, Y él enderezará tus veredas.',
    category: 'sabiduría',
    keywords: ['confianza', 'dirección', 'sabiduría', 'guía'],
    targetAudience: ['personas en decisiones', 'estudiantes', 'profesionales']
  },
  {
    reference: 'Isaías 41:10',
    text: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.',
    category: 'promesas',
    keywords: ['miedo', 'valentía', 'presencia de Dios', 'ayuda'],
    targetAudience: ['personas con miedo', 'familias en crisis']
  },
  {
    reference: 'Mateo 11:28',
    text: 'Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.',
    category: 'descanso',
    keywords: ['descanso', 'paz', 'cansancio', 'alivio'],
    targetAudience: ['trabajadores', 'padres', 'personas agotadas']
  },
  {
    reference: 'Romanos 8:28',
    text: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.',
    category: 'esperanza',
    keywords: ['propósito', 'bien', 'plan de Dios', 'esperanza'],
    targetAudience: ['personas en sufrimiento', 'buscadores de sentido']
  },
  {
    reference: 'Jeremías 29:11',
    text: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.',
    category: 'promesas',
    keywords: ['futuro', 'esperanza', 'plan de Dios', 'paz'],
    targetAudience: ['jóvenes', 'estudiantes', 'personas en transición']
  }
];

// Sistema de prompts con aprendizaje de analytics
class ScriptwriterAgent {
  constructor() {
    this.analyticsPath = path.join(__dirname, '../logs/analytics-feedback.json');
    this.scriptsPath = path.join(__dirname, '../output/scripts');
    this.learnings = this.loadLearnings();

    // Asegurar que existe el directorio de scripts
    if (!fs.existsSync(this.scriptsPath)) {
      fs.mkdirSync(this.scriptsPath, { recursive: true });
    }
  }

  // Cargar aprendizajes de videos anteriores
  loadLearnings() {
    if (fs.existsSync(this.analyticsPath)) {
      try {
        const data = fs.readFileSync(this.analyticsPath, 'utf8');
        return JSON.parse(data);
      } catch (err) {
        console.log('No hay analytics previos, empezando desde cero');
        return {
          bestPerformingHooks: [],
          avgCTR: 0,
          avgRetention: 0,
          topKeywords: [],
          audiencePreferences: {}
        };
      }
    }
    return {
      bestPerformingHooks: [],
      avgCTR: 0,
      avgRetention: 0,
      topKeywords: [],
      audiencePreferences: {}
    };
  }

  // Seleccionar versículo de forma inteligente
  selectVerse(preference = 'random') {
    if (preference === 'random') {
      return POPULAR_VERSES[Math.floor(Math.random() * POPULAR_VERSES.length)];
    }

    // Selección basada en analytics (si hay datos)
    if (this.learnings.topKeywords && this.learnings.topKeywords.length > 0) {
      const bestKeyword = this.learnings.topKeywords[0];
      const matchingVerses = POPULAR_VERSES.filter(v =>
        v.keywords.includes(bestKeyword)
      );
      if (matchingVerses.length > 0) {
        return matchingVerses[0];
      }
    }

    return POPULAR_VERSES[0]; // Fallback a Juan 3:16
  }

  // Generar hook optimizado para CTR
  generateHook(verse, learnings) {
    const hooks = [
      `¿Sabías que este versículo cambió ${Math.floor(Math.random() * 900 + 100)} mil vidas? Hoy puede cambiar la tuya.`,
      `La respuesta que buscabas está en ${verse.reference}. Descúbrela ahora.`,
      `¿Te has preguntado cuál es el secreto de ${verse.keywords[0]}? Está aquí.`,
      `Este versículo tiene el poder de transformar tu día. Escúchalo hasta el final.`,
      `${Math.floor(Math.random() * 500 + 100)} mil personas ya lo descubrieron. ¿Serás tú el siguiente?`
    ];

    // Si tenemos datos de best performing hooks, usarlos
    if (learnings.bestPerformingHooks && learnings.bestPerformingHooks.length > 0) {
      const pattern = learnings.bestPerformingHooks[0].pattern;
      return pattern.replace('{verse}', verse.reference).replace('{keyword}', verse.keywords[0]);
    }

    return hooks[Math.floor(Math.random() * hooks.length)];
  }

  // Generar script completo optimizado
  generateScript(versePreference = 'random') {
    const verse = this.selectVerse(versePreference);
    const hook = this.generateHook(verse, this.learnings);

    const script = {
      metadata: {
        verse: verse.reference,
        category: verse.category,
        targetAudience: verse.targetAudience,
        keywords: verse.keywords,
        duration: 120, // 2 minutos
        generatedAt: new Date().toISOString()
      },

      // Estructura del guión con timings exactos
      scenes: [
        {
          id: 1,
          timing: '0:00-0:05',
          duration: 5,
          type: 'hook',
          text: hook,
          visualDescription: 'Rayos de luz dorada atravesando nubes dramáticas, cielo épico con colores vibrantes',
          visualStyle: 'cinematográfico, impactante, épico',
          cameraMovement: 'slow zoom in',
          mood: 'expectativa, curiosidad'
        },
        {
          id: 2,
          timing: '0:05-0:30',
          duration: 25,
          type: 'verse',
          text: `${verse.reference} dice: "${verse.text}"\n\nEste versículo es uno de los más poderosos de toda la Biblia.`,
          visualDescription: 'Biblia abierta con luz suave dorada, página mostrando el versículo, ambiente cálido',
          visualStyle: 'reverente, acogedor, íntimo',
          cameraMovement: 'gentle pan',
          mood: 'reverencia, paz'
        },
        {
          id: 3,
          timing: '0:30-1:15',
          duration: 45,
          type: 'reflection',
          text: `Tres verdades que transformarán tu vida:\n\nPrimero: ${this.generateReflection(verse, 1)}\n\nSegundo: ${this.generateReflection(verse, 2)}\n\nY tercero: ${this.generateReflection(verse, 3)}`,
          visualDescription: 'Amanecer majestuoso sobre montañas, cielo naranja y dorado, naturaleza inspiradora',
          visualStyle: 'esperanzador, majestuoso, natural',
          cameraMovement: 'slow aerial rise',
          mood: 'inspiración, asombro'
        },
        {
          id: 4,
          timing: '1:15-1:40',
          duration: 25,
          type: 'application',
          text: `¿Qué significa esto HOY para ti?\n\n${this.generateApplication(verse)}\n\nHoy mismo puedes experimentar esta verdad. Solo abre tu corazón.`,
          visualDescription: 'Manos abiertas hacia el cielo recibiendo luz celestial, rayos dorados, conexión íntima',
          visualStyle: 'personal, transformador, íntimo',
          cameraMovement: 'static close-up',
          mood: 'conexión personal, transformación'
        },
        {
          id: 5,
          timing: '1:40-2:00',
          duration: 20,
          type: 'cta',
          text: `Si este versículo tocó tu corazón, déjame un AMÉN en los comentarios.\n\nNo olvides SUSCRIBIRTE y activar la campanita 🔔 para tu versículo diario.\n\nComparte con alguien que necesite esperanza hoy.\n\n¡Nos vemos mañana con más Palabra de Dios!`,
          visualDescription: 'Cruz con resplandor dorado brillante, cielo azul celeste, rayos de luz convergentes',
          visualStyle: 'triunfante, esperanzador, glorioso',
          cameraMovement: 'dramatic zoom out',
          mood: 'victoria, esperanza, comunidad'
        }
      ],

      // Texto completo para voice-over
      fullText: null,

      // Metadata para YouTube
      youtubeMetadata: {
        title: this.generateTitle(verse),
        description: this.generateDescription(verse),
        tags: this.generateTags(verse),
        category: '22' // People & Blogs
      }
    };

    // Ensamblar texto completo
    script.fullText = script.scenes.map(s => s.text).join('\n\n');

    return script;
  }

  // Generar reflexiones específicas por versículo
  generateReflection(verse, pointNumber) {
    const reflections = {
      'Juan 3:16': [
        'El amor de Dios es infinito. Tan grande que dio a su único Hijo por ti.',
        'Este amor es para TODOS. No importa tu pasado o circunstancias. Dios te ama como eres.',
        'La vida eterna es un regalo gratuito. No se gana por obras, sino por fe.'
      ],
      'Salmos 23:1': [
        'Dios es tu pastor personal. Conoce tu nombre y cuida de ti individualmente.',
        'Cuando él provee, nada falta. Sus recursos son infinitos.',
        'Su cuidado es continuo. No solo hoy, sino todos los días de tu vida.'
      ],
      'Filipenses 4:13': [
        'No es tu fuerza, es la de Cristo en ti. Esa es la diferencia.',
        'No hay límite para lo que puedes lograr con Cristo. Todo es posible.',
        'Esta fuerza está disponible HOY. No tienes que esperar.'
      ]
    };

    const ref = verse.reference.split(':')[0]; // Tomar solo el libro y capítulo
    return reflections[ref] ? reflections[ref][pointNumber - 1] :
           `El versículo nos enseña una verdad poderosa que cambiará tu perspectiva.`;
  }

  // Generar aplicación práctica
  generateApplication(verse) {
    const applications = {
      'promesas': 'Significa que tienes esperanza segura. Que tu futuro está en manos de Dios.',
      'consuelo': 'Significa que no estás solo. Que Dios está contigo en cada momento.',
      'fortaleza': 'Significa que puedes enfrentar cualquier desafío. Cristo es tu fuerza.',
      'sabiduría': 'Significa que tienes acceso a la sabiduría divina para tus decisiones.',
      'descanso': 'Significa que puedes soltar tus cargas. Dios las llevará por ti.',
      'esperanza': 'Significa que hay un propósito en tu dolor. Dios está trabajando.'
    };

    return applications[verse.category] || 'Significa que Dios tiene un plan perfecto para tu vida.';
  }

  // Generar título optimizado para CTR
  generateTitle(verse) {
    const templates = [
      `${verse.reference} - El Versículo que Cambió Millones de Vidas | ${verse.keywords[0].charAt(0).toUpperCase() + verse.keywords[0].slice(1)}`,
      `¿Conoces ${verse.reference}? Este Mensaje te Transformará`,
      `${verse.reference} - La Promesa que Necesitas Escuchar HOY`,
      `El Secreto de ${verse.keywords[0]} está en ${verse.reference}`,
      `${verse.reference} - Palabra de Dios para Ti HOY | ${verse.category.charAt(0).toUpperCase() + verse.category.slice(1)}`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Generar descripción SEO optimizada
  generateDescription(verse) {
    return `🙏 ${verse.reference} - ${verse.text}

✨ En este video exploramos uno de los versículos más poderosos de la Biblia. Descubre las verdades transformadoras que cambiarán tu perspectiva y fortalecerán tu fe.

📖 Versículo completo: ${verse.reference}
🎯 Categoría: ${verse.category}
💡 Palabras clave: ${verse.keywords.join(', ')}

🔔 SUSCRÍBETE para recibir un versículo inspirador cada día
👍 Dale LIKE si este mensaje tocó tu corazón
💬 Comparte en los comentarios cómo Dios está obrando en tu vida
📤 COMPARTE con alguien que necesite esperanza hoy

#VersículoDelDía #${verse.reference.replace(/[: ]/g, '')} #PalabraDeDios #BibliaDiaria #${verse.category} #DevocionalDiario #ReinaValera1960 #VersículosDiarios #FeCristiana #PromesasDeDios

🎬 Nuevo video mañana a las 12:00 PM
📺 Canal: Rey Celestial - Tu refugio diario de paz y esperanza`;
  }

  // Generar tags optimizados
  generateTags(verse) {
    const baseTags = [
      verse.reference,
      verse.reference.replace(/[: ]/g, ''),
      'versículo del día',
      'biblia diaria',
      'palabra de dios',
      'reina valera 1960',
      'devocional diario',
      'versículos diarios',
      verse.category,
      ...verse.keywords,
      'promesas de dios',
      'fe cristiana',
      'reflexiones cristianas',
      'biblia hablada',
      'versículos poderosos'
    ];

    return baseTags.slice(0, 15); // YouTube limit
  }

  // Guardar script generado
  saveScript(script) {
    const filename = `script-${script.metadata.verse.replace(/[: ]/g, '-')}-${Date.now()}.json`;
    const filepath = path.join(this.scriptsPath, filename);

    fs.writeFileSync(filepath, JSON.stringify(script, null, 2));
    console.log(`✅ Script guardado: ${filepath}`);

    return filepath;
  }

  // API endpoint para n8n
  async generate(options = {}) {
    console.log('🎬 Agente 1: Guionista Experto - Generando script...\n');

    const script = this.generateScript(options.versePreference || 'random');
    const filepath = this.saveScript(script);

    console.log(`✅ Script generado exitosamente:`);
    console.log(`   Versículo: ${script.metadata.verse}`);
    console.log(`   Categoría: ${script.metadata.category}`);
    console.log(`   Duración: ${script.metadata.duration}s`);
    console.log(`   Escenas: ${script.scenes.length}`);
    console.log(`   Archivo: ${filepath}\n`);

    return {
      success: true,
      script: script,
      filepath: filepath,
      metadata: script.metadata
    };
  }
}

// Exportar agente
module.exports = ScriptwriterAgent;

// CLI para testing
if (require.main === module) {
  const agent = new ScriptwriterAgent();
  agent.generate().then(result => {
    console.log('\n📄 SCRIPT PREVIEW:\n');
    result.script.scenes.forEach(scene => {
      console.log(`[${scene.timing}] ${scene.type.toUpperCase()}`);
      console.log(`${scene.text}\n`);
    });
  });
}
