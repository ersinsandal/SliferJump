const isMobileDevice = (() => {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '') || 
           (typeof window !== 'undefined' && (window.innerWidth <= 600 || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches)));
})();

/**
 * SliferJump 2.0: Rise of Slifer
 * Global Configuration
 */
const config = {
    // ─── Core Physics ───
    FPS: 60,
    GRAVITY: 0.25,
    THRESHOLD: 300,
    STEPS: 9,
    MAX_FALLING_SPEED: 12,

    // ─── Platform Chances ───
    SPRINGED_CHANCE: 0.1,
    TRAP_CHANCE: 0.08,
    VANISHING_CHANCE: 0.06,
    COLLECTIBLE_CHANCE: 0.25,

    // ─── Orichalcos ───
    ORICHALCOS_CHANCE: 0.02,

    // ─── Meteor Config ───
    METEOR_BASE_INTERVAL: 180,   // frames between meteors (decreases with realm)
    METEOR_WARNING_FRAMES: 60,   // warning line duration before impact
    METEOR_SPEED: 4,
    METEOR_SIZES: { SMALL: 15, MEDIUM: 25, LARGE: 40 },

    // ─── Lava Config ───
    LAVA_BASE_SPEED: 0.15,
    LAVA_WAVE_AMP: 8,
    LAVA_WAVE_FREQ: 0.03,
    LAVA_BUBBLE_CHANCE: 0.02,

    // ─── Monster Config ───
    MONSTER_CHANCE: 0.015,
    MONSTER_SPEED: 1.5,
    MONSTER_LASER_SPEED: 6,
    MONSTER_LASER_WIDTH: 4,

    // ─── Collectible Config ───
    COLLECTIBLE_DURATION: {
        SHIELD: 300,       // frames (~5 seconds)
        MAGNET: 180,       // frames (~3 seconds)
        SCORE_MULTI: 600,  // frames (~10 seconds)
    },
    MAGNET_RANGE: 150,
    SUPER_JUMP_FORCE: 18,

    // ─── Screen Shake ───
    SHAKE_INTENSITY: 8,
    SHAKE_DURATION: 15,

    // ─── Particle Limits ───
    MAX_PARTICLES: isMobileDevice ? 90 : 200,
};

/**
 * Level Definitions (25 Levels)
 */
const LEVELS = [];

LEVELS.push({
    id: 1,
    name: "Böcek Ormanı",
    boss: "Weevil Underwood",
    story: "Böceklerin fısıltısı ormanda yankılanıyor.",
    bgImage: "assets/img/bg_level_1.png",
    particleColor: "#228B22",
    scoreGoal: 2500,
    platformStableChance: 0.68,
    platformMovingChance: 0.12,
    platformFragileChance: 0.12,
    hasMeteors: false,
    meteorInterval: 245,
    hasLava: false,
    lavaSpeed: 0,
    hasMonsters: true,
    orichalcosChance: 0.0495,
    isBossLevel: false
});

LEVELS.push({
    id: 2,
    name: "Harpie Tepesi",
    boss: "Mai Valentine",
    story: "Sert rüzgarlar Harpie kadınlarını getiriyor.",
    bgImage: "assets/img/bg_level_2.png",
    particleColor: "#228B22",
    scoreGoal: 4000,
    platformStableChance: 0.66,
    platformMovingChance: 0.13,
    platformFragileChance: 0.13,
    hasMeteors: true,
    meteorInterval: 240,
    hasLava: false,
    lavaSpeed: 0,
    hasMonsters: true,
    orichalcosChance: 0.0540,
    isBossLevel: false
});

LEVELS.push({
    id: 3,
    name: "Dinozor Krallığı",
    boss: "Rex Raptor",
    story: "Tarih öncesi canavarların ayak sesleri yeri titretiyor.",
    bgImage: "assets/img/bg_level_3.png",
    particleColor: "#228B22",
    scoreGoal: 5500,
    platformStableChance: 0.64,
    platformMovingChance: 0.15,
    platformFragileChance: 0.15,
    hasMeteors: true,
    meteorInterval: 235,
    hasLava: false,
    lavaSpeed: 0,
    hasMonsters: true,
    orichalcosChance: 0.0585,
    isBossLevel: false
});

LEVELS.push({
    id: 4,
    name: "Umi Okyanusu",
    boss: "Mako Tsunami",
    story: "Derinliklerden gelen tehlike.",
    bgImage: "assets/img/bg_level_4.png",
    particleColor: "#228B22",
    scoreGoal: 7000,
    platformStableChance: 0.62,
    platformMovingChance: 0.16,
    platformFragileChance: 0.16,
    hasMeteors: true,
    meteorInterval: 230,
    hasLava: false,
    lavaSpeed: 0,
    hasMonsters: true,
    orichalcosChance: 0.0630,
    isBossLevel: false
});

LEVELS.push({
    id: 5,
    name: "Toon Dünyası (BOSS)",
    boss: "Pegasus",
    story: "Pegasusun illüzyonlarla dolu çizgi film evreni.",
    bgImage: "assets/img/bg_level_5.png",
    particleColor: "#228B22",
    scoreGoal: 8500,
    platformStableChance: 0.60,
    platformMovingChance: 0.17,
    platformFragileChance: 0.17,
    hasMeteors: true,
    meteorInterval: 225,
    hasLava: true,
    lavaSpeed: 0.3,
    hasMonsters: true,
    orichalcosChance: 0.0675,
    isBossLevel: true
});

LEVELS.push({
    id: 6,
    name: "Karanlık Sokaklar",
    boss: "Nadir Avcılar",
    story: "Görünmez tehlikeler şehrin gölgelerinde saklanıyor.",
    bgImage: "assets/img/bg_level_6.png",
    particleColor: "#6A6AFF",
    scoreGoal: 10000,
    platformStableChance: 0.58,
    platformMovingChance: 0.19,
    platformFragileChance: 0.19,
    hasMeteors: true,
    meteorInterval: 220,
    hasLava: false,
    lavaSpeed: 0,
    hasMonsters: true,
    orichalcosChance: 0.0720,
    isBossLevel: false
});

LEVELS.push({
    id: 7,
    name: "Savaş Şehri Arenası",
    boss: "Espa Roba",
    story: "Telepatik tuzaklarla dolu bir karnaval.",
    bgImage: "assets/img/bg_level_7.png",
    particleColor: "#6A6AFF",
    scoreGoal: 11500,
    platformStableChance: 0.56,
    platformMovingChance: 0.21,
    platformFragileChance: 0.21,
    hasMeteors: true,
    meteorInterval: 215,
    hasLava: false,
    lavaSpeed: 0,
    hasMonsters: true,
    orichalcosChance: 0.0765,
    isBossLevel: false
});

LEVELS.push({
    id: 8,
    name: "Karanlık Çadır",
    boss: "Arkana",
    story: "Ölümcül testereler ve sahte büyücüler.",
    bgImage: "assets/img/bg_level_8.png",
    particleColor: "#6A6AFF",
    scoreGoal: 13000,
    platformStableChance: 0.54,
    platformMovingChance: 0.22,
    platformFragileChance: 0.22,
    hasMeteors: true,
    meteorInterval: 210,
    hasLava: false,
    lavaSpeed: 0,
    hasMonsters: true,
    orichalcosChance: 0.0810,
    isBossLevel: false
});

LEVELS.push({
    id: 9,
    name: "Kralların Tapınağı",
    boss: "Odion",
    story: "Antik tuzakların koruduğu kutsal tapınak.",
    bgImage: "assets/img/bg_level_9.png",
    particleColor: "#6A6AFF",
    scoreGoal: 14500,
    platformStableChance: 0.52,
    platformMovingChance: 0.24,
    platformFragileChance: 0.24,
    hasMeteors: true,
    meteorInterval: 205,
    hasLava: false,
    lavaSpeed: 0,
    hasMonsters: true,
    orichalcosChance: 0.0855,
    isBossLevel: false
});

LEVELS.push({
    id: 10,
    name: "Gölge Arenası (BOSS)",
    boss: "Yami Marik",
    story: "Karanlık oyunların başladığı yer.",
    bgImage: "assets/img/bg_level_10.png",
    particleColor: "#6A6AFF",
    scoreGoal: 16000,
    platformStableChance: 0.50,
    platformMovingChance: 0.25,
    platformFragileChance: 0.25,
    hasMeteors: true,
    meteorInterval: 200,
    hasLava: true,
    lavaSpeed: 0.3,
    hasMonsters: true,
    orichalcosChance: 0.0900,
    isBossLevel: true
});

LEVELS.push({
    id: 11,
    name: "Sanal Gerçeklik",
    boss: "Noah Kaiba",
    story: "Dijital bir hapishane.",
    bgImage: "assets/img/bg_level_11.png",
    particleColor: "#9A40FF",
    scoreGoal: 17500,
    platformStableChance: 0.48,
    platformMovingChance: 0.27,
    platformFragileChance: 0.27,
    hasMeteors: true,
    meteorInterval: 195,
    hasLava: false,
    lavaSpeed: 0,
    hasMonsters: true,
    orichalcosChance: 0.0945,
    isBossLevel: false
});

LEVELS.push({
    id: 12,
    name: "Derin Sistem",
    boss: "Gozaburo Kaiba",
    story: "Eski Kaibacorpun hayaleti.",
    bgImage: "assets/img/bg_level_12.png",
    particleColor: "#9A40FF",
    scoreGoal: 19000,
    platformStableChance: 0.46,
    platformMovingChance: 0.28,
    platformFragileChance: 0.28,
    hasMeteors: true,
    meteorInterval: 190,
    hasLava: false,
    lavaSpeed: 0,
    hasMonsters: true,
    orichalcosChance: 0.0990,
    isBossLevel: false
});

LEVELS.push({
    id: 13,
    name: "Penguen Kabusu",
    boss: "Big Five",
    story: "Buzulların arasında sinsi bir tuzak.",
    bgImage: "assets/img/bg_level_13.png",
    particleColor: "#9A40FF",
    scoreGoal: 20500,
    platformStableChance: 0.44,
    platformMovingChance: 0.30,
    platformFragileChance: 0.30,
    hasMeteors: true,
    meteorInterval: 185,
    hasLava: false,
    lavaSpeed: 0,
    hasMonsters: true,
    orichalcosChance: 0.1035,
    isBossLevel: false
});

LEVELS.push({
    id: 14,
    name: "Makine Mezarlığı",
    boss: "Bandit Keith",
    story: "Paslı çelik ve ateş.",
    bgImage: "assets/img/bg_level_14.png",
    particleColor: "#9A40FF",
    scoreGoal: 22000,
    platformStableChance: 0.42,
    platformMovingChance: 0.31,
    platformFragileChance: 0.31,
    hasMeteors: true,
    meteorInterval: 180,
    hasLava: false,
    lavaSpeed: 0,
    hasMonsters: true,
    orichalcosChance: 0.1080,
    isBossLevel: false
});

LEVELS.push({
    id: 15,
    name: "KaibaCorp Kulesi (BOSS)",
    boss: "Seto Kaiba",
    story: "Mavi Gözlü Beyaz Ejderin kükreyişi.",
    bgImage: "assets/img/bg_level_15.png",
    particleColor: "#9A40FF",
    scoreGoal: 23500,
    platformStableChance: 0.40,
    platformMovingChance: 0.32,
    platformFragileChance: 0.32,
    hasMeteors: true,
    meteorInterval: 175,
    hasLava: true,
    lavaSpeed: 0.3,
    hasMonsters: true,
    orichalcosChance: 0.1125,
    isBossLevel: true
});

LEVELS.push({
    id: 16,
    name: "Orichalcos Mührü",
    boss: "Gurimo",
    story: "Yeşil alevler ruhunu tüketmek istiyor.",
    bgImage: "assets/img/bg_level_16.png",
    particleColor: "#00FF00",
    scoreGoal: 25000,
    platformStableChance: 0.38,
    platformMovingChance: 0.34,
    platformFragileChance: 0.34,
    hasMeteors: true,
    meteorInterval: 170,
    hasLava: true,
    lavaSpeed: 0.31,
    hasMonsters: true,
    orichalcosChance: 0.1170,
    isBossLevel: false
});

LEVELS.push({
    id: 17,
    name: "Gök Gemisi",
    boss: "Alister",
    story: "Bulutların üzerinde bitmeyen bir savaş.",
    bgImage: "assets/img/bg_level_17.png",
    particleColor: "#00FF00",
    scoreGoal: 26500,
    platformStableChance: 0.36,
    platformMovingChance: 0.35,
    platformFragileChance: 0.35,
    hasMeteors: true,
    meteorInterval: 165,
    hasLava: true,
    lavaSpeed: 0.32,
    hasMonsters: true,
    orichalcosChance: 0.1215,
    isBossLevel: false
});

LEVELS.push({
    id: 18,
    name: "Zırh Şehri",
    boss: "Valon",
    story: "Fiziksel gücün ve çeliğin çarpışması.",
    bgImage: "assets/img/bg_level_18.png",
    particleColor: "#00FF00",
    scoreGoal: 28000,
    platformStableChance: 0.34,
    platformMovingChance: 0.37,
    platformFragileChance: 0.37,
    hasMeteors: true,
    meteorInterval: 160,
    hasLava: true,
    lavaSpeed: 0.33,
    hasMonsters: true,
    orichalcosChance: 0.1260,
    isBossLevel: false
});

LEVELS.push({
    id: 19,
    name: "Muhafız Zirvesi",
    boss: "Rafael",
    story: "Kılıçların koruduğu kutsal dağ.",
    bgImage: "assets/img/bg_level_19.png",
    particleColor: "#00FF00",
    scoreGoal: 29500,
    platformStableChance: 0.32,
    platformMovingChance: 0.39,
    platformFragileChance: 0.39,
    hasMeteors: true,
    meteorInterval: 155,
    hasLava: true,
    lavaSpeed: 0.34,
    hasMonsters: true,
    orichalcosChance: 0.1305,
    isBossLevel: false
});

LEVELS.push({
    id: 20,
    name: "Atlantis Tapınağı (BOSS)",
    boss: "Dartz",
    story: "Büyük Leviathan uyanıyor.",
    bgImage: "assets/img/bg_level_20.png",
    particleColor: "#00FF00",
    scoreGoal: 31000,
    platformStableChance: 0.30,
    platformMovingChance: 0.40,
    platformFragileChance: 0.40,
    hasMeteors: true,
    meteorInterval: 150,
    hasLava: true,
    lavaSpeed: 0.3,
    hasMonsters: true,
    orichalcosChance: 0.1350,
    isBossLevel: true
});

LEVELS.push({
    id: 21,
    name: "Karanlık Zindan",
    boss: "Yami Bakura",
    story: "Karanlık Zorcun gölgeleri uzuyor.",
    bgImage: "assets/img/bg_level_21.png",
    particleColor: "#FFD700",
    scoreGoal: 32500,
    platformStableChance: 0.28,
    platformMovingChance: 0.40,
    platformFragileChance: 0.40,
    hasMeteors: true,
    meteorInterval: 145,
    hasLava: true,
    lavaSpeed: 0.36,
    hasMonsters: true,
    orichalcosChance: 0.1395,
    isBossLevel: false
});

LEVELS.push({
    id: 22,
    name: "Antik Mısır Çölü",
    boss: "Hırsız Kral Bakura",
    story: "Altın kumların altında yatan sırlar.",
    bgImage: "assets/img/bg_level_22.png",
    particleColor: "#FFD700",
    scoreGoal: 34000,
    platformStableChance: 0.26,
    platformMovingChance: 0.40,
    platformFragileChance: 0.40,
    hasMeteors: true,
    meteorInterval: 140,
    hasLava: true,
    lavaSpeed: 0.37,
    hasMonsters: true,
    orichalcosChance: 0.1440,
    isBossLevel: false
});

LEVELS.push({
    id: 23,
    name: "Firavunun Sarayı",
    boss: "Rahip Seto",
    story: "Işık ve karanlığın dengesi.",
    bgImage: "assets/img/bg_level_23.png",
    particleColor: "#FFD700",
    scoreGoal: 35500,
    platformStableChance: 0.24,
    platformMovingChance: 0.40,
    platformFragileChance: 0.40,
    hasMeteors: true,
    meteorInterval: 135,
    hasLava: true,
    lavaSpeed: 0.38,
    hasMonsters: true,
    orichalcosChance: 0.1485,
    isBossLevel: false
});

LEVELS.push({
    id: 24,
    name: "Tutulma",
    boss: "Zorc Necrophades",
    story: "Dünyanın sonunu getiren sonsuz karanlık.",
    bgImage: "assets/img/bg_level_24.png",
    particleColor: "#FFD700",
    scoreGoal: 37000,
    platformStableChance: 0.22,
    platformMovingChance: 0.40,
    platformFragileChance: 0.40,
    hasMeteors: true,
    meteorInterval: 130,
    hasLava: true,
    lavaSpeed: 0.39,
    hasMonsters: true,
    orichalcosChance: 0.1530,
    isBossLevel: false
});

LEVELS.push({
    id: 25,
    name: "Krallar Vadisi (FİNAL)",
    boss: "Atem",
    story: "İki ruhun son vedası.",
    bgImage: "assets/img/bg_level_25.png",
    particleColor: "#FFD700",
    scoreGoal: 38500,
    platformStableChance: 0.20,
    platformMovingChance: 0.40,
    platformFragileChance: 0.40,
    hasMeteors: true,
    meteorInterval: 125,
    hasLava: true,
    lavaSpeed: 0.3,
    hasMonsters: true,
    orichalcosChance: 0.1575,
    isBossLevel: true
});

function getCurrentLevel(levelId) {
    if (levelId < 1) levelId = 1;
    if (levelId > 25) levelId = 25;
    return LEVELS[levelId - 1];
}

/**
 * Game States
 */
const GAME_STATE = {
    MENU: "MENU",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    REALM_TRANSITION: "REALM_TRANSITION",
    GAME_OVER: "GAME_OVER",
};

/**
 * Collectible Types
 */
const COLLECTIBLE_TYPES = {
    MILLENNIUM_EYE: {
        id: "eye",
        name: "Millennium Eye",
        hudLabel: "MILLENNIUM EYE",
        hudIcon: "👁",
        hudColor: [255, 215, 0],
        barColor: [255, 215, 0],
        effect: "superJump",
        color: "#FFD700",
        glowColor: "#FFA500",
        duration: 0,
    },
    SWORDS_OF_LIGHT: {
        id: "swords",
        name: "Swords of Revealing Light",
        hudLabel: "SWORDS OF REVEALING LIGHT",
        hudIcon: "⚔️",
        hudColor: [255, 255, 0],
        barColor: [255, 255, 0], // Bright Yellow
        effect: "shield",
        color: "#FFFACD",
        glowColor: "#FFFF00",
        duration: 600, // 10 seconds
    },
    MONSTER_REBORN: {
        id: "reborn",
        name: "Monster Reborn",
        hudLabel: "MONSTER REBORN",
        hudIcon: "☥",
        hudColor: [0, 191, 255],
        barColor: [0, 191, 255], // Blue
        effect: "extraLife",
        color: "#00BFFF",
        glowColor: "#00BFFF",
        duration: 0,
    },
    POT_OF_GREED: {
        id: "pot",
        name: "Pot of Greed",
        hudLabel: "POT OF GREED",
        hudIcon: "🏺",
        hudColor: [210, 180, 140],
        barColor: [210, 180, 140], // Light Brown
        effect: "scoreMulti",
        color: "#D2B48C",
        glowColor: "#D2B48C",
        multi: 2,
        duration: 600, // 10 seconds
    },
};

/**
 * Monster Types Config
 */
const MONSTER_TYPES = {
    KURIBOH: {
        id: "kuriboh",
        name: "Kuriboh",
        w: 35,
        h: 35,
        speed: 1.2,
        behavior: "patrol",     // walks left-right on platform
        color: "#8B4513",
        eyeColor: "#00FF00",
        firstRealm: 3,
    },
    MAN_EATER_BUG: {
        id: "manEaterBug",
        name: "Man-Eater Bug",
        w: 40,
        h: 30,
        speed: 4,
        behavior: "ambush",     // sits still, lunges when player near
        color: "#4A0080",
        eyeColor: "#FF0000",
        lungeRange: 120,
        firstRealm: 3,
    },
    DARK_MAGICIAN_PHANTOM: {
        id: "darkMagicianPhantom",
        name: "Dark Magician Phantom",
        w: 35,
        h: 50,
        speed: 1.5,
        behavior: "float",      // floats in air, phases in/out
        color: "#6A0DAD",
        eyeColor: "#FF00FF",
        phaseInterval: 120,     // frames between visibility toggle
        firstRealm: 4,
    },
    BLUE_EYES_SPIRIT: {
        id: "blueEyesSpirit",
        name: "Blue-Eyes Spirit",
        w: 50,
        h: 45,
        speed: 0,
        behavior: "laser",      // shoots horizontal laser beam
        color: "#4169E1",
        eyeColor: "#00BFFF",
        laserInterval: 180,     // frames between laser shots
        laserWarning: 40,       // frames of warning before firing
        firstRealm: 5,
    },
};

/**
 * Achievement Definitions
 */
const ACHIEVEMENT_DEFS = [
    { id: "first_flight", name: "İlk Uçuş", desc: "İlk oyununu tamamla", icon: "🥇" },
    { id: "god_card", name: "Tanrı Kartı Uyandı", desc: "5.000 skora ulaş", icon: "🐉" },
    { id: "shadow_duelist", name: "Gölge Düellocu", desc: "Shadow Realm'e gir", icon: "🌑" },
    { id: "meteor_hunter", name: "Meteor Avcısı", desc: "Tek oyunda 20 meteordan kaç", icon: "☄️" },
    { id: "lava_walker", name: "Lav Yürüyücü", desc: "Lav aktifken 5.000 skor kazan", icon: "🌋" },
    { id: "collector", name: "Milenyum Koleksiyoncusu", desc: "Tüm eser türlerini topla", icon: "🛡️" },
    { id: "divine_ascent", name: "İlahi Yükseliş", desc: "Divine Ascent bölümüne ulaş", icon: "👑" },
    { id: "orichalcos_curse", name: "Orichalcos'un Laneti", desc: "100 kez Orichalcos mührüne yem ol", icon: "💀" },
    { id: "legend", name: "Efsane Düellocu", desc: "50.000 skora ulaş", icon: "🏆" },
    { id: "lightning_breath", name: "Yıldırım Nefesi", desc: "Tek oyunda 5 canavarı geç", icon: "⚡" },
    { id: "realm_master", name: "Boyut Gezgini", desc: "Tüm 5 bölümü gör", icon: "🌀" },
    { id: "speed_demon", name: "Hız Şeytanı", desc: "30 saniyede 3.000 skora ulaş", icon: "💨" },
];

/**
 * Quest Templates
 */
const QUEST_TEMPLATES = {
    instant: [
        { id: "collect_eyes_3", desc: "Bu oyunda 3 Milenyum Gözü topla", target: 3, stat: "eyesCollected" },
        { id: "moving_plats_5", desc: "5 hareketli platforma zıpla", target: 5, stat: "movingPlatJumps" },
        { id: "no_fragile_2000", desc: "Kırılgan platforma basmadan 2000 skora ulaş", target: 2000, stat: "scoreWithoutFragile", special: true },
        { id: "dodge_meteors_10", desc: "10 meteordan kaç", target: 10, stat: "meteorsDodged" },
        { id: "collect_any_5", desc: "5 Milenyum eseri topla", target: 5, stat: "totalCollected" },
        { id: "survive_lava_30s", desc: "Lav aktifken 30 saniye hayatta kal", target: 1800, stat: "lavaSurvivalFrames" },
    ],
    persistent: [
        { id: "reach_battle_city", desc: "Battle City'ye ulaş (2000 skor)", target: 2000, stat: "highScore" },
        { id: "reach_shadow_realm", desc: "Shadow Realm'e ulaş (5000 skor)", target: 5000, stat: "highScore" },
        { id: "reach_orichalcos", desc: "Orichalcos Domain'e ulaş (10000 skor)", target: 10000, stat: "highScore" },
        { id: "reach_divine", desc: "Divine Ascent'e ulaş (20000 skor)", target: 20000, stat: "highScore" },
        { id: "total_items_50", desc: "Toplam 50 Milenyum eseri topla", target: 50, stat: "lifetimeCollected" },
        { id: "total_games_25", desc: "25 oyun oyna", target: 25, stat: "totalGames" },
    ],
};
