export const profile = {
  name: "Maarten van Els",
  email: "maarten@ariensvanels.nl",
  github: "https://github.com/maartenvanels",
  linkedin: "https://www.linkedin.com/in/maarten-van-els-40748598/",
  site: "https://maartenvanels.github.io/3d-portfolio/",
};

export const content = {
  nl: {
    title: "Maarten van Els — Engineering & technisch leiderschap",
    description:
      "Software, regeltechniek en technisch leiderschap. Maarten van Els verbindt engineering, mensen en uitvoering in industriële automatisering en elektrische en hybride aandrijfsystemen.",
    nav: ["Expertise", "Projecten", "Over mij", "Contact"],
    skip: "Naar de inhoud",
    menu: "Menu",
    closeMenu: "Menu sluiten",
    home: "Naar de homepage",
    language: "Taal kiezen",
    contactButton: "Laten we kennismaken",
    eyebrow: "ENGINEERING & TECHNISCH LEIDERSCHAP",
    hero: ["Van idee naar", "systemen die", "werken."],
    intro:
      "Ik ben Maarten. Ik ontwikkel software en besturingen, geef technische richting en help engineers groeien. Van de eerste systeemkeuze tot een machine die in de praktijk werkt.",
    workCta: "Bekijk mijn werk",
    aboutCta: "Meer over mij",
    credentials: ["MSc Control Systems Engineering", "Nederland"],
    expertiseLabel: "01 / EXPERTISE",
    expertiseTitle: "De techniek én het geheel.",
    expertiseIntro:
      "Goede systemen vragen om meer dan goede code. Ik verbind de technische inhoud met heldere keuzes en de mensen die het realiseren.",
    expertise: [
      {
        icon: "wave",
        title: "Software & regeltechniek",
        text: "Van wiskundig model naar software op de machine. Ontwerpen, simuleren en testen van besturingen voor elektrische en hybride aandrijfsystemen.",
        tags: ["MATLAB / Simulink", "PLC / SCADA", "CAN / J1939"],
      },
      {
        icon: "system",
        title: "Systeem & realisatie",
        text: "De vraag achter de techniek scherp krijgen. Architectuur, haalbaarheid en risico’s vertalen naar scope, planning en afstemming met engineers en leveranciers.",
        tags: ["Systeemarchitectuur", "Projectmanagement", "Machineveiligheid"],
      },
      {
        icon: "people",
        title: "Technisch leiderschap",
        text: "Richting geven vanuit inhoud en vertrouwen. Engineers begeleiden, kennis delen en samenwerken over de grenzen van software, elektro en mechanica.",
        tags: ["Teamontwikkeling", "Technische richting", "Kennisoverdracht"],
      },
    ],
    workLabel: "02 / GESELECTEERD WERK",
    workTitle: "Gebouwd. Getest. In de praktijk.",
    workIntro:
      "Een selectie uit mijn werk aan machines, productielijnen en eigen software.",
    filters: ["Alles", "Professioneel", "Eigen projecten"],
    filterLabel: "Projecten filteren",
    count: "projecten zichtbaar",
    contribution: "Mijn bijdrage",
    context: "De opgave",
    result: "Het resultaat",
    repo: "Bekijk de code",
    visit: "Open het project",
    projects: [
      {
        id: "elift",
        category: "professional",
        visual: "power",
        label: "SPIERINGS MOBILE CRANES",
        title: "eLift",
        subtitle: "Van model naar elektrische kraan.",
        description:
          "Software voor de elektrische en hybride aandrijving van mobiele torenkranen, ontwikkeld met Model-Based Design.",
        tags: ["Elektrificatie", "MATLAB / Simulink", "PLC"],
        challenge:
          "Elektrisch hijsen mogelijk maken met een besturing die verschillende energiebronnen en de vermogensvraag van de kraan samenbrengt.",
        contribution:
          "Met het team ontwikkelde en testte ik de besturingssoftware voor eLift v1. Ik zette ook de toolchain op die Simulink-modellen automatisch vertaalt naar PLC-code.",
        result:
          "Met het team binnen één jaar van concept naar productie. De modelgebaseerde aanpak vormde een basis voor verdere ontwikkeling.",
      },
      {
        id: "cityboy",
        category: "professional",
        visual: "crane",
        label: "SPIERINGS MOBILE CRANES",
        title: "City-boy v2",
        subtitle: "Technische diepgang. Gezamenlijke richting.",
        description:
          "Softwareontwikkeling voor de machinebesturing en hybride aandrijving van een nieuwe generatie mobiele torenkranen.",
        tags: [
          "Technisch leiderschap",
          "Machinebesturing",
          "Hybride aandrijving",
        ],
        challenge:
          "Bestaande eLift-software integreren en doorontwikkelen voor een nieuw kraanontwerp, met aandacht voor betrouwbaarheid en machineveiligheid.",
        contribution:
          "Als Lead Software Engineer begeleidde ik de engineers en stuurde ik softwareontwikkeling, planning, testen en releases aan.",
        result:
          "Met het team de besturings- en aandrijfsoftware voor City-boy v2 gerealiseerd. Ervaringen uit dit project namen we mee in de verdere eLift-ontwikkeling.",
      },
      {
        id: "connected",
        category: "professional",
        visual: "cloud",
        label: "SPIERINGS MOBILE CRANES",
        title: "Connected machinery",
        subtitle: "Inzicht dat verder gaat dan de werkplaats.",
        description:
          "Remote software-updates en clouddatalogging voor kranen in het veld.",
        tags: ["OTA-updates", "Azure", "Datalogging"],
        challenge:
          "Machines ook na aflevering kunnen onderhouden en prestaties en storingen op afstand kunnen analyseren.",
        contribution:
          "Ik introduceerde remote software-updates en clouddatalogging als onderdeel van de softwareontwikkeling bij Spierings.",
        result:
          "Software op afstand kunnen bijwerken en operationele gegevens beschikbaar maken voor onderhoud en foutanalyse.",
      },
      {
        id: "automation",
        category: "professional",
        visual: "process",
        label: "VAN DOREN ENGINEERS",
        title: "Industriële automatisering",
        subtitle: "Een productielijn moet iedere dag leveren.",
        description:
          "PLC- en SCADA-projecten in food, pharma, waterbehandeling en zuivel. Van functioneel ontwerp tot inbedrijfstelling.",
        tags: ["PLC / SCADA", "Commissioning", "Procesautomatisering"],
        challenge:
          "Klantwensen vertalen naar betrouwbare besturingen in nieuwe en bestaande productieomgevingen.",
        contribution:
          "Lead programmeur voor een nieuwe Coca-Cola-productielijn, inclusief CIP. Bij Kingspan Unidek breidde ik een lijn uit en ondersteunde ik de MES-implementatie voor traceability.",
        result:
          "Besturingen gerealiseerd en in bedrijf gesteld, processen uitgebreid en klanten geholpen bij storingen en verbeteringen.",
      },
      {
        id: "cantools",
        category: "personal",
        visual: "code",
        label: "EIGEN PROJECT / OPEN SOURCE",
        title: "CanTools.NET",
        subtitle: "CAN-data bruikbaar maken in .NET.",
        description:
          "Een C#/.NET-port van de cantools-bibliotheek voor CAN-databases, berichten en logbestanden, met aanvullende CANopen-ondersteuning.",
        tags: ["C# / .NET", "CAN / CANopen", "DBC / J1939"],
        challenge:
          "CAN-data en databaseformaten verwerken in een .NET-omgeving.",
        contribution:
          "Een zelfstandige port van de bestaande Python-bibliotheek, met ondersteuning voor onder meer DBC, KCD, SYM en CANopen. Gedrag wordt vergeleken met de upstream-tests en Python-implementatie.",
        result:
          "Een openbare bibliotheek en commandlinetool voor het lezen, coderen en decoderen van CAN-data. Gebouwd op het werk van de cantools-community.",
        url: "https://github.com/maartenvanels/cantools-net",
      },
      {
        id: "stateit",
        category: "personal",
        visual: "states",
        label: "EIGEN PROJECT / OPEN SOURCE",
        title: "State-It",
        subtitle: "Besturingslogica zichtbaar maken.",
        description:
          "Een visuele editor om hiërarchische state machines te ontwerpen, te simuleren en naar code te vertalen.",
        tags: ["State machines", "Simulatie", "Codegeneratie"],
        challenge:
          "Toestanden en overgangen van een besturing overzichtelijk kunnen ontwerpen en uitproberen.",
        contribution:
          "Een visuele softwaretool die ontwerp, simulatie en codegeneratie samenbrengt in één werkproces.",
        result:
          "Een openbaar project waarmee je hiërarchische state machines kunt uitwerken en simuleren.",
        url: "https://github.com/maartenvanels/state-it",
        live: "https://state-it.vercel.app",
      },
    ],
    aboutLabel: "03 / OVER MIJ",
    aboutTitle: "Techniek ontwikkelen. Mensen laten groeien.",
    about: [
      "Ik begin bij mensen en het proces. Eerst begrijpen wat nodig is, dan pas de oplossing kiezen. Ik maak afwegingen expliciet en breng engineers, leveranciers en management bij elkaar.",
      "Mijn route liep van elektrotechniek naar een MSc in Control Systems Engineering, werkend en studerend tegelijk. Bij Spierings groeide ik van software engineer naar lead. Een jaar voor de klas aan de HAN leerde me nog bewuster hoe je kennis overdraagt en anderen laat groeien.",
      "Die behoefte om te bouwen stopt niet bij mijn werk. Ik bouwde mijn eigen huis en maak software en technische projecten vanuit mijn eigen nieuwsgierigheid.",
    ],
    experienceLabel: "DE ROUTE TOT NU TOE",
    experience: [
      {
        date: "2025 — heden",
        role: "Software & Innovation Engineer",
        company: "Spierings Mobile Cranes",
        text: "Technische voorstellen, systeemkeuzes en projectafstemming met engineers en leveranciers.",
      },
      {
        date: "2024 — 2025",
        role: "Docent / Onderzoeker Elektrotechniek",
        company: "HAN",
        text: "Netwerktheorie, elektronica en programmeren. Begeleiding van projecten en stages.",
      },
      {
        date: "2021 — 2024",
        role: "Lead Software Engineer",
        company: "Spierings Mobile Cranes",
        text: "Softwareteams begeleiden; ontwikkeling, validatie en releases van elektrische en hybride kranen.",
      },
      {
        date: "2019 — 2021",
        role: "Software Engineer",
        company: "Spierings Mobile Cranes",
        text: "Kraanbesturing, Model-Based Design en automatische PLC-codegeneratie.",
      },
      {
        date: "2015 — 2019",
        role: "Software Engineer",
        company: "Van Doren Engineers",
        text: "Industriële automatisering, PLC/SCADA en commissioning.",
      },
      {
        date: "2014 — 2015",
        role: "Junior Software Engineer",
        company: "Petrogas",
        text: "PLC- en SCADA-applicaties voor de energie- en gassector.",
      },
    ],
    contactLabel: "04 / CONTACT",
    contactTitle: "Een technisch vraagstuk begint met een goed gesprek.",
    contactText:
      "Over besturingen, elektrificatie of het ontwikkelen van een technisch team. Ik maak graag kennis.",
    emailCta: "Stuur me een bericht",
    footer: "Engineering, met oog voor het geheel.",
    backTop: "Terug naar boven",
    notFound: "Deze pagina bestaat niet.",
    notFoundText:
      "Misschien is de link veranderd. Je vindt mijn werk op de homepage.",
  },
  en: {
    title: "Maarten van Els — Engineering & technical leadership",
    description:
      "Software, control engineering and technical leadership. Maarten van Els connects engineering, people and delivery in industrial automation and electric and hybrid powertrains.",
    nav: ["Expertise", "Projects", "About", "Contact"],
    skip: "Skip to content",
    menu: "Menu",
    closeMenu: "Close menu",
    home: "Go to homepage",
    language: "Choose language",
    contactButton: "Let’s connect",
    eyebrow: "ENGINEERING & TECHNICAL LEADERSHIP",
    hero: ["From ideas to", "systems that", "work."],
    intro:
      "I’m Maarten. I develop software and controls, guide technical decisions and help engineers grow. From the first system concept to a machine that works in practice.",
    workCta: "Explore my work",
    aboutCta: "More about me",
    credentials: ["MSc Control Systems Engineering", "The Netherlands"],
    expertiseLabel: "01 / EXPERTISE",
    expertiseTitle: "The detail. And the bigger picture.",
    expertiseIntro:
      "Good systems take more than good code. I connect technical depth with clear decisions and the people who deliver them.",
    expertise: [
      {
        icon: "wave",
        title: "Software & controls",
        text: "From mathematical models to software on a machine. Designing, simulating and testing controls for electric and hybrid powertrains.",
        tags: ["MATLAB / Simulink", "PLC / SCADA", "CAN / J1939"],
      },
      {
        icon: "system",
        title: "Systems & delivery",
        text: "Understanding the need behind the technology. Translating architecture, feasibility and risk into scope, planning and coordination with engineers and suppliers.",
        tags: ["System architecture", "Project management", "Machinery safety"],
      },
      {
        icon: "people",
        title: "Technical leadership",
        text: "Providing direction through knowledge and trust. Guiding engineers, sharing expertise and connecting software, electrical and mechanical disciplines.",
        tags: ["Team development", "Technical direction", "Knowledge sharing"],
      },
    ],
    workLabel: "02 / SELECTED WORK",
    workTitle: "Built. Tested. Put to work.",
    workIntro:
      "Selected work across machines, production lines and my own software projects.",
    filters: ["All work", "Professional", "Personal projects"],
    filterLabel: "Filter projects",
    count: "projects shown",
    contribution: "My contribution",
    context: "The challenge",
    result: "The outcome",
    repo: "View the code",
    visit: "Open the project",
    projects: [
      {
        id: "elift",
        category: "professional",
        visual: "power",
        label: "SPIERINGS MOBILE CRANES",
        title: "eLift",
        subtitle: "From model to electric crane.",
        description:
          "Control software for electric and hybrid mobile tower cranes, developed using Model-Based Design.",
        tags: ["Electrification", "MATLAB / Simulink", "PLC"],
        challenge:
          "Enabling electric crane operation with controls that coordinate multiple energy sources and the crane’s power demand.",
        contribution:
          "With the team, I developed and tested the eLift v1 control software. I also set up the toolchain that automatically translates Simulink models into PLC code.",
        result:
          "From concept to production within one year, together with the team. The model-based approach provided a foundation for subsequent development.",
      },
      {
        id: "cityboy",
        category: "professional",
        visual: "crane",
        label: "SPIERINGS MOBILE CRANES",
        title: "City-boy v2",
        subtitle: "Technical depth. Shared direction.",
        description:
          "Software development for machine control and the hybrid powertrain of a new generation of mobile tower cranes.",
        tags: ["Technical leadership", "Machine control", "Hybrid powertrain"],
        challenge:
          "Integrating and extending existing eLift software for a new crane design, with attention to reliability and machinery safety.",
        contribution:
          "As Lead Software Engineer, I guided the engineers and coordinated software development, planning, testing and releases.",
        result:
          "Delivered the machine control and powertrain software for City-boy v2 with the team. Lessons from the project fed into further eLift development.",
      },
      {
        id: "connected",
        category: "professional",
        visual: "cloud",
        label: "SPIERINGS MOBILE CRANES",
        title: "Connected machinery",
        subtitle: "Insight beyond the workshop.",
        description:
          "Remote software updates and cloud data logging for cranes operating in the field.",
        tags: ["OTA updates", "Azure", "Data logging"],
        challenge:
          "Maintaining machines after delivery and analysing performance and faults remotely.",
        contribution:
          "I introduced remote software updates and cloud data logging as part of software development at Spierings.",
        result:
          "The ability to update software remotely and make operational data available for maintenance and fault analysis.",
      },
      {
        id: "automation",
        category: "professional",
        visual: "process",
        label: "VAN DOREN ENGINEERS",
        title: "Industrial automation",
        subtitle: "A production line has to deliver every day.",
        description:
          "PLC and SCADA projects in food, pharmaceuticals, water treatment and dairy. From functional design to commissioning.",
        tags: ["PLC / SCADA", "Commissioning", "Process automation"],
        challenge:
          "Turning customer requirements into reliable controls for new and existing production environments.",
        contribution:
          "Lead programmer for a new Coca-Cola production line, including CIP. At Kingspan Unidek, I extended a line and supported MES implementation for traceability.",
        result:
          "Delivered and commissioned controls, extended production processes, and helped customers troubleshoot and improve their systems.",
      },
      {
        id: "cantools",
        category: "personal",
        visual: "code",
        label: "PERSONAL PROJECT / OPEN SOURCE",
        title: "CanTools.NET",
        subtitle: "Making CAN data useful in .NET.",
        description:
          "A C#/.NET port of the cantools library for CAN databases, messages and logs, with additional CANopen support.",
        tags: ["C# / .NET", "CAN / CANopen", "DBC / J1939"],
        challenge:
          "Working with CAN data and database formats in a .NET environment.",
        contribution:
          "An independent port of the existing Python library, supporting formats including DBC, KCD and SYM, alongside CANopen. Behaviour is checked against upstream tests and the Python implementation.",
        result:
          "A public library and command-line tool for reading, encoding and decoding CAN data. Built on the work of the cantools community.",
        url: "https://github.com/maartenvanels/cantools-net",
      },
      {
        id: "stateit",
        category: "personal",
        visual: "states",
        label: "PERSONAL PROJECT / OPEN SOURCE",
        title: "State-It",
        subtitle: "Making control logic visible.",
        description:
          "A visual editor for designing, simulating and generating code from hierarchical state machines.",
        tags: ["State machines", "Simulation", "Code generation"],
        challenge:
          "Clearly designing and exploring the states and transitions of a control system.",
        contribution:
          "A visual software tool that brings design, simulation and code generation together in one workflow.",
        result:
          "A public project for developing and simulating hierarchical state machines.",
        url: "https://github.com/maartenvanels/state-it",
        live: "https://state-it.vercel.app",
      },
    ],
    aboutLabel: "03 / ABOUT ME",
    aboutTitle: "An engineer who develops people, too.",
    about: [
      "I start with people and the process. Understand what is needed, then choose the solution. I make trade-offs explicit and bring engineers, suppliers and management together.",
      "My route took me from electrical engineering to an MSc in Control Systems Engineering, combining work and study. At Spierings, I grew from software engineer to lead. A year of teaching at HAN made me more deliberate about sharing knowledge and helping others grow.",
      "That drive to build goes beyond my work. I built my own house and develop software and technical projects out of curiosity.",
    ],
    experienceLabel: "THE PATH SO FAR",
    experience: [
      {
        date: "2025 — present",
        role: "Software & Innovation Engineer",
        company: "Spierings Mobile Cranes",
        text: "Technical proposals, system decisions and project coordination with engineers and suppliers.",
      },
      {
        date: "2024 — 2025",
        role: "Lecturer / Researcher Electrical Engineering",
        company: "HAN",
        text: "Network theory, electronics and programming. Project and internship supervision.",
      },
      {
        date: "2021 — 2024",
        role: "Lead Software Engineer",
        company: "Spierings Mobile Cranes",
        text: "Guiding software engineers; development, validation and releases for electric and hybrid cranes.",
      },
      {
        date: "2019 — 2021",
        role: "Software Engineer",
        company: "Spierings Mobile Cranes",
        text: "Crane controls, Model-Based Design and automatic PLC code generation.",
      },
      {
        date: "2015 — 2019",
        role: "Software Engineer",
        company: "Van Doren Engineers",
        text: "Industrial automation, PLC/SCADA and commissioning.",
      },
      {
        date: "2014 — 2015",
        role: "Junior Software Engineer",
        company: "Petrogas",
        text: "PLC and SCADA applications for the energy and gas sector.",
      },
    ],
    contactLabel: "04 / CONTACT",
    contactTitle: "A technical challenge starts with a good conversation.",
    contactText:
      "About controls, electrification or developing an engineering team. Let’s connect.",
    emailCta: "Send me a message",
    footer: "Engineering, with the bigger picture in mind.",
    backTop: "Back to top",
    notFound: "This page does not exist.",
    notFoundText:
      "The link may have changed. You can find my work on the homepage.",
  },
};
