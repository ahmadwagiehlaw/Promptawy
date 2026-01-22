import { firebaseConfig, geminiApiKey } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, writeBatch, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// --- Services Init ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const genAI = new GoogleGenerativeAI(geminiApiKey);

// --- State ---
let currentUser = null;
let allPrompts = [];
let deferredInstallPrompt = null;

// --- User Interface ---
const ui = {
    loginScreen: document.getElementById('login-screen'),
    appContainer: document.getElementById('app-container'),
    promptsGrid: document.getElementById('prompts-grid'),
    loading: document.getElementById('loading-indicator'),
    emptyState: document.getElementById('empty-state'),
    loginBtn: document.getElementById('btn-login-google'),
    logoutBtn: document.getElementById('btn-logout'),
    uploadBtn: document.getElementById('btn-upload'),
    deleteAllBtn: document.getElementById('btn-delete-all'),
    searchInput: document.getElementById('search-input'),
    importModal: document.getElementById('import-modal'),
    enhanceModal: document.getElementById('enhance-modal'),
    installModal: document.getElementById('install-modal'),
    fileInput: document.getElementById('file-input'),
    importStatus: document.getElementById('import-status'),
    enhanceText: document.getElementById('enhance-text'),
    enhanceLoading: document.getElementById('enhance-loading'),
    enhanceResult: document.getElementById('enhance-result'),
    copyEnhancedBtn: document.getElementById('btn-copy-enhanced')
};

// --- Auth ---
ui.loginBtn.onclick = async () => {
    try {
        await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
        console.error(e);
        document.getElementById('login-error').style.display = 'block';
    }
};

ui.logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        ui.loginScreen.style.display = 'none';
        ui.appContainer.style.display = 'block';
        loadPrompts();
    } else {
        ui.loginScreen.style.display = 'flex';
        ui.appContainer.style.display = 'none';
    }
});

// --- Firestore CRUD ---
async function loadPrompts() {
    if (!currentUser) return;
    ui.loading.style.display = 'block';
    ui.promptsGrid.innerHTML = '';
    ui.emptyState.style.display = 'none';

    try {
        const q = query(collection(db, "prompts"), where("userId", "==", currentUser.uid));
        const snapshot = await getDocs(q);

        allPrompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Client side sort (newest first)
        allPrompts.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

        renderPrompts(allPrompts);
    } catch (e) {
        console.error("Load error:", e);
    } finally {
        ui.loading.style.display = 'none';
    }
}

function renderPrompts(prompts) {
    ui.promptsGrid.innerHTML = '';
    if (prompts.length === 0) {
        ui.emptyState.style.display = 'block';
        return;
    }
    ui.emptyState.style.display = 'none';

    prompts.forEach(prompt => {
        const el = document.createElement('div');
        el.className = 'card';
        el.innerHTML = `
            <div class="tags">
                ${(prompt.tags || []).slice(0, 3).map(t => `<span class="tag">#${t}</span>`).join('')}
                <span class="tag" style="background: rgba(59, 130, 246, 0.1); color: var(--accent-blue);">${prompt.meta?.art_style || 'General'}</span>
            </div>
            <div class="card-text">${prompt.originalText}</div>
            <div class="card-actions">
                <button class="btn btn-ghost btn-enhance" style="font-size: 0.8rem; padding: 5px 10px;">
                    <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i> Enhance
                </button>
                <button class="btn btn-ghost btn-delete" style="color: var(--danger); opacity: 0.8;" title="Delete">
                    <i data-lucide="trash" style="width: 16px; height: 16px;"></i>
                </button>
            </div>
        `;

        // Handlers
        el.querySelector('.btn-delete').onclick = () => deletePrompt(prompt.id);
        el.querySelector('.btn-enhance').onclick = () => openEnhancer(prompt.originalText);

        ui.promptsGrid.appendChild(el);
    });
    lucide.createIcons();
}

async function deletePrompt(id) {
    if (!confirm("Are you sure you want to delete this prompt?")) return;
    try {
        await deleteDoc(doc(db, "prompts", id));
        // Remove from local & re-render
        allPrompts = allPrompts.filter(p => p.id !== id);
        renderPrompts(allPrompts);
    } catch (e) {
        alert("Delete failed: " + e.message);
    }
}

ui.deleteAllBtn.onclick = async () => {
    if (!confirm("🛑 DANGER: Delete ALL prompts? This cannot be undone!")) return;

    try {
        const q = query(collection(db, "prompts"), where("userId", "==", currentUser.uid));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        allPrompts = [];
        renderPrompts([]);
        alert("All deleted.");
    } catch (e) {
        alert("Batch delete failed: " + e.message);
    }
};

// --- Import Logic ---
ui.uploadBtn.onclick = () => ui.importModal.classList.add('active');
ui.fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    ui.importStatus.innerText = "Reading file...";
    const text = await file.text();

    // Simple line parsing
    const lines = text.split('\n').filter(l => l.trim().length > 10);
    ui.importStatus.innerText = `Found ${lines.length} prompts. Saving...`;

    const batch = writeBatch(db);
    lines.forEach(line => {
        // Basic cleaning
        const clean = line.replace(/^\d+[\.\)]\s*/, '').trim();
        const ref = doc(collection(db, "prompts"));
        batch.set(ref, {
            originalText: clean,
            userId: currentUser.uid,
            createdAt: Timestamp.now(),
            tags: [],
            meta: {}
        });
    });

    await batch.commit();
    ui.importStatus.innerText = "Done! Refreshing...";
    setTimeout(() => {
        ui.importModal.classList.remove('active');
        loadPrompts();
    }, 1000);
};

// --- Enhancer ---
function openEnhancer(text) {
    ui.enhanceModal.classList.add('active');
    ui.enhanceLoading.style.display = 'block';
    ui.enhanceResult.style.display = 'none';

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    model.generateContent(`Rewrite this prompt to be more artistic, vivid and safe: "${text}"`)
        .then(result => {
            const response = result.response.text();
            ui.enhanceText.value = response;
            ui.enhanceLoading.style.display = 'none';
            ui.enhanceResult.style.display = 'block';
        })
        .catch(err => {
            alert("AI Error: " + err);
            ui.enhanceModal.classList.remove('active');
        });
}

ui.copyEnhancedBtn.onclick = () => {
    navigator.clipboard.writeText(ui.enhanceText.value);
    ui.enhanceModal.classList.remove('active');
}

// --- Search ---
ui.searchInput.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allPrompts.filter(p => p.originalText.toLowerCase().includes(term));
    renderPrompts(filtered);
};


// --- PWA Install ---
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    ui.installModal.classList.add('active');
});

document.getElementById('btn-install-confirm').onclick = async () => {
    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
            ui.installModal.classList.remove('active');
        }
        deferredInstallPrompt = null;
    }
};

document.getElementById('btn-install-cancel').onclick = () => {
    ui.installModal.classList.remove('active');
};
