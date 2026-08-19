const API_KEY = "VOTRE_CLE_API_GEMINI";

let state = {
    streak: parseInt(localStorage.getItem('streak')) || 0,
    lastWorkout: localStorage.getItem('lastWorkout') || null,
    mode: 'discipline'
};

// Initialisation
function init() {
    checkSanction();
    updateUI();
}

// Vérifier si la sanction doit tomber (24h sans séance)
function checkSanction() {
    if (state.lastWorkout) {
        const now = Date.now();
        const diff = now - parseInt(state.lastWorkout);
        const hours24 = 24 * 60 * 60 * 1000;

        if (diff > hours24) {
            state.streak = 0;
            state.mode = 'sanction';
            save();
        }
    }
}

function updateUI() {
    const card = document.getElementById('main-card');
    const tag = document.getElementById('status-tag');
    const streakDisplay = document.getElementById('streak-val');
    const lastSeen = document.getElementById('last-seen');

    streakDisplay.innerText = state.streak;

    if (state.mode === 'sanction') {
        card.classList.add('sanction-border');
        tag.innerText = "MODE SANCTION : ÉCHEC DÉTECTÉ";
        tag.classList.add('text-[#FF453A]', 'pulse-red');
        streakDisplay.classList.add('text-[#FF453A]');
    } else {
        card.classList.remove('sanction-border');
        tag.innerText = "Discipline Active";
        tag.classList.remove('text-[#FF453A]', 'pulse-red');
        streakDisplay.classList.remove('text-[#FF453A]');
    }

    if (state.lastWorkout) {
        const date = new Date(parseInt(state.lastWorkout));
        lastSeen.innerText = `Dernière séance : ${date.toLocaleDateString()} à ${date.toLocaleTimeString()}`;
    }
}

window.logWorkout = () => {
    state.streak += 1;
    state.lastWorkout = Date.now().toString();
    state.mode = 'discipline';
    save();
    updateUI();
    alert("STAY HARD. À demain.");
};

function save() {
    localStorage.setItem('streak', state.streak);
    localStorage.setItem('lastWorkout', state.lastWorkout);
}

// IA Vision Gemini
window.analyzeImage = async (type) => {
    const fileInput = document.getElementById(type === 'meal' ? 'meal-input' : 'body-input');
    const file = fileInput.files[0];
    if (!file) return;

    const responseArea = document.getElementById('ai-response');
    const aiText = document.getElementById('ai-text');
    responseArea.classList.remove('hidden');
    aiText.innerText = "Analyse en cours... Regarde ton miroir en attendant.";

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        const prompt = type === 'meal' 
            ? "Analyse ce repas. Donne les calories, macros (P/G/L) et un verdict brutal sans filtre sur la qualité du carburant."
            : "Analyse ce physique. Sois direct, dur et donne un programme d'entraînement immédiat.";

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Data } }] }]
                })
            });
            const data = await response.json();
            aiText.innerText = data.candidates[0].content.parts[0].text;
        } catch (e) {
            aiText.innerText = "Erreur. L'IA a peur de ton manque de discipline. Réessaie.";
        }
    };
};

init();
