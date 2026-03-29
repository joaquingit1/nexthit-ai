from __future__ import annotations

PERSONA_NAME_SEEDS = [
    "Mia", "Jordan", "Sofia", "Liam", "Ava", "Noah", "Zoe", "Lucas", "Emma", "Leo",
    "Grace", "Mateo", "Olivia", "Ethan", "Nina", "Theo", "Isla", "Julian", "Aria", "Mason",
    "Elena", "Bruno", "Camila", "Dylan", "Valentina", "Gael", "Lucia", "Hugo", "Alma", "Samuel",
    "Clara", "Thiago", "Aurora", "Max", "Renata", "Brisa", "Elisa", "Adrian", "Vera", "Tomas",
    "Iris", "Benicio", "Julia", "Santiago", "Lola", "Nicolas", "Paula", "Daniel", "Ines", "Marco",
    "Sara", "Federico", "Malena", "Andres", "Carmen", "Facundo", "Pilar", "Gonzalo", "Ambar", "Joaquin",
]

PERSONA_LAST_NAME_SEEDS = [
    "Cruz", "Reyes", "Vega", "Santos", "Navarro", "Costa", "Silva", "Molina", "Castro", "Prieto",
    "Suarez", "Ortega", "Rojas", "Medina", "Herrera", "Campos", "Ibarra", "Benitez", "Aguilar", "Salazar",
    "Fuentes", "Paredes", "Valdez", "Romero", "Mendez", "Lopez", "Acosta", "Arias", "Pena", "Delgado",
    "Peralta", "Correa", "Nieves", "Cabrera", "Bustos", "Miranda", "Luna", "Aguirre", "Soria", "Montero",
]

PERSONA_COLOR_PALETTE = [
    "#5eead4", "#38bdf8", "#f59e0b", "#a78bfa", "#22d3ee",
    "#fb7185", "#facc15", "#c084fc", "#4ade80", "#f97316",
]

PERSONA_GENDERS = ["Mujer", "Hombre", "Otro"]

PERSONA_COUNTRIES = [
    "Mexico",
    "Estados Unidos",
    "Argentina",
    "Reino Unido",
    "Espana",
    "Alemania",
    "Brasil",
    "Francia",
    "Canada",
    "Australia",
]

PERSONA_AGE_RANGES = ["<18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"]

PERSONA_INCOME_BRACKETS = [
    "$0-$15k",
    "$15k-$25k",
    "$25k-$50k",
    "$50k-$90k",
    "$90k-$140k",
    "$140k-$220k",
]

PERSONA_SOCIAL_STATUS = [
    "Estudiante",
    "Profesional joven",
    "Profesional consolidado",
    "Dueno de negocio",
    "Retirado activo",
]

PERSONA_NATIVE_LANGUAGES = {
    "Mexico": "es",
    "Estados Unidos": "en",
    "Argentina": "es",
    "Reino Unido": "en",
    "Espana": "es",
    "Alemania": "de",
    "Brasil": "pt",
    "Francia": "fr",
    "Canada": "en",
    "Australia": "en",
}

PERSONA_AUDIENCE_CONTEXTS = [
    {
        "id": "ctx-01",
        "gender": "Mujer",
        "age_range": "<18",
        "country": "Mexico",
        "native_language": "es",
        "income_bracket": "$0-$15k",
        "social_status": "Estudiante",
    },
    {
        "id": "ctx-02",
        "gender": "Hombre",
        "age_range": "18-24",
        "country": "Estados Unidos",
        "native_language": "en",
        "income_bracket": "$15k-$25k",
        "social_status": "Estudiante",
    },
    {
        "id": "ctx-03",
        "gender": "Mujer",
        "age_range": "25-34",
        "country": "Argentina",
        "native_language": "es",
        "income_bracket": "$25k-$50k",
        "social_status": "Profesional joven",
    },
    {
        "id": "ctx-04",
        "gender": "Hombre",
        "age_range": "25-34",
        "country": "Reino Unido",
        "native_language": "en",
        "income_bracket": "$50k-$90k",
        "social_status": "Profesional joven",
    },
    {
        "id": "ctx-05",
        "gender": "Mujer",
        "age_range": "35-44",
        "country": "Espana",
        "native_language": "es",
        "income_bracket": "$50k-$90k",
        "social_status": "Profesional consolidado",
    },
    {
        "id": "ctx-06",
        "gender": "Hombre",
        "age_range": "35-44",
        "country": "Alemania",
        "native_language": "de",
        "income_bracket": "$90k-$140k",
        "social_status": "Profesional consolidado",
    },
    {
        "id": "ctx-07",
        "gender": "Mujer",
        "age_range": "45-54",
        "country": "Brasil",
        "native_language": "pt",
        "income_bracket": "$90k-$140k",
        "social_status": "Dueno de negocio",
    },
    {
        "id": "ctx-08",
        "gender": "Hombre",
        "age_range": "55-64",
        "country": "Francia",
        "native_language": "fr",
        "income_bracket": "$140k-$220k",
        "social_status": "Dueno de negocio",
    },
    {
        "id": "ctx-09",
        "gender": "Otro",
        "age_range": "65+",
        "country": "Canada",
        "native_language": "en",
        "income_bracket": "$50k-$90k",
        "social_status": "Retirado activo",
    },
    {
        "id": "ctx-10",
        "gender": "Mujer",
        "age_range": "18-24",
        "country": "Australia",
        "native_language": "en",
        "income_bracket": "$25k-$50k",
        "social_status": "Profesional joven",
    },
]

PERSONA_INTEREST_PROFILES = [
    {
        "id": "int-01",
        "occupation": "Analista de performance",
        "interests": ["marketing de performance", "testing creativo", "medicion"],
        "hobbies": ["leer newsletters", "podcasts de negocios", "correr"],
        "niche_tags": ["growth marketing", "paid social", "analytics"],
        "motivations": ["detectar anuncios ganadores", "mejorar ROAS", "ahorrar presupuesto"],
        "frustrations": ["claims sin prueba", "hooks lentos", "mensajes ambiguos"],
    },
    {
        "id": "int-02",
        "occupation": "Founder ecommerce",
        "interests": ["ecommerce", "conversion", "brand building"],
        "hobbies": ["cafes de networking", "viajes cortos", "side projects"],
        "niche_tags": ["ecommerce", "beauty", "conversion"],
        "motivations": ["vender mas", "encontrar creatives escalables", "entender a la audiencia"],
        "frustrations": ["cta tardio", "beneficio poco claro", "promesas infladas"],
    },
    {
        "id": "int-03",
        "occupation": "Creador gaming",
        "interests": ["gaming", "streaming", "short-form editing"],
        "hobbies": ["gaming", "edicion de video", "Discord"],
        "niche_tags": ["gaming", "creator economy", "short-form"],
        "motivations": ["detectar hooks potentes", "subir retencion", "encontrar ideas nuevas"],
        "frustrations": ["baja novedad", "ritmo plano", "visuales debiles"],
    },
    {
        "id": "int-04",
        "occupation": "Coach wellness",
        "interests": ["wellness", "fitness", "habitos"],
        "hobbies": ["gym", "meal prep", "running"],
        "niche_tags": ["fitness", "wellness", "self improvement"],
        "motivations": ["ver transformaciones claras", "encontrar prueba visual", "detectar contenido util"],
        "frustrations": ["demasiada charla", "sin demo", "falta de energia"],
    },
    {
        "id": "int-05",
        "occupation": "Consultor de productividad",
        "interests": ["productividad", "automatizacion", "sistemas personales"],
        "hobbies": ["notion", "lectura", "walking"],
        "niche_tags": ["productivity", "automation", "edtech"],
        "motivations": ["ahorrar tiempo", "encontrar marcos claros", "ver soluciones concretas"],
        "frustrations": ["sobrecarga cognitiva", "valor poco claro", "intro larga"],
    },
    {
        "id": "int-06",
        "occupation": "Padre o madre multitarea",
        "interests": ["hogar", "familia", "consumo inteligente"],
        "hobbies": ["cocinar", "series", "salidas de fin de semana"],
        "niche_tags": ["family", "home", "consumer goods"],
        "motivations": ["resolver algo rapido", "entender un beneficio practico", "optimizar decisiones"],
        "frustrations": ["mensajes confusos", "promesas abstractas", "poca relevancia"],
    },
    {
        "id": "int-07",
        "occupation": "Operador tech",
        "interests": ["startups", "producto", "AI tools"],
        "hobbies": ["hackathons", "product demos", "gaming"],
        "niche_tags": ["tech", "saas", "ai"],
        "motivations": ["ver producto en accion", "entender el diferencial", "detectar señal real"],
        "frustrations": ["sin demo", "narrativa floja", "visual poco informativo"],
    },
    {
        "id": "int-08",
        "occupation": "Creador lifestyle",
        "interests": ["travel", "lifestyle", "social trends"],
        "hobbies": ["fotografia", "viajar", "scrolling reels"],
        "niche_tags": ["travel", "lifestyle", "social"],
        "motivations": ["buscar ideas inspiracionales", "ver algo aspiracional", "encontrar formatos nativos"],
        "frustrations": ["baja novedad", "inicio frio", "poco payoff visual"],
    },
    {
        "id": "int-09",
        "occupation": "Profesional de carrera",
        "interests": ["career growth", "educacion", "liderazgo"],
        "hobbies": ["LinkedIn", "podcasts", "leer"],
        "niche_tags": ["education", "career", "b2b"],
        "motivations": ["aprender algo aplicable", "ver credibilidad", "ahorrar tiempo"],
        "frustrations": ["falta de estructura", "sin prueba", "habla demasiado caotica"],
    },
    {
        "id": "int-10",
        "occupation": "Emprendedor hospitality",
        "interests": ["food content", "hospitality", "local business"],
        "hobbies": ["foodie tours", "cafe", "salidas"],
        "niche_tags": ["food", "hospitality", "local business"],
        "motivations": ["ver resultados concretos", "detectar ideas vendibles", "encontrar audiencias reales"],
        "frustrations": ["beneficio difuso", "cta tardio", "edicion poco clara"],
    },
]

PERSONA_OCCUPATIONS = [profile["occupation"] for profile in PERSONA_INTEREST_PROFILES]
PERSONA_INTERESTS = [profile["interests"] for profile in PERSONA_INTEREST_PROFILES]
PERSONA_HOBBIES = [profile["hobbies"] for profile in PERSONA_INTEREST_PROFILES]
PERSONA_MOTIVATIONS = [profile["motivations"] for profile in PERSONA_INTEREST_PROFILES]
PERSONA_FRUSTRATIONS = [profile["frustrations"] for profile in PERSONA_INTEREST_PROFILES]
