const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const axios     = require('axios');
const { spawn } = require('child_process');
const chatRoutes = require('./routes/chat');

const app        = express();
const PORT       = 5000;
const OLLAMA_URL = 'http://localhost:11434';

async function isOllamaRunning() {
    try {
        await axios.get(OLLAMA_URL, { timeout: 2000 });
        return true;
    } catch {
        return false;
    }
}

function startOllama() {
    return new Promise((resolve, reject) => {
        console.log('Menjalankan Ollama...');
        const proc = spawn('ollama', ['serve'], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true
        });
        proc.unref();

        // Tunggu sampai Ollama siap (max 15 detik)
        let elapsed = 0;
        const interval = setInterval(async () => {
            elapsed += 500;
            if (await isOllamaRunning()) {
                clearInterval(interval);
                console.log('Ollama berhasil dinyalakan.');
                resolve();
            } else if (elapsed >= 15000) {
                clearInterval(interval);
                reject(new Error('Ollama tidak merespons setelah 15 detik.'));
            }
        }, 500);
    });
}

async function ensureOllama() {
    if (await isOllamaRunning()) {
        console.log('Ollama sudah berjalan.');
        return;
    }
    await startOllama();
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', chatRoutes);

ensureOllama()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server berjalan di http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Gagal menyalakan Ollama:', err.message);
        console.log('Server tetap berjalan, tapi chatbot mungkin tidak berfungsi.');
        app.listen(PORT, () => {
            console.log(`Server berjalan di http://localhost:${PORT}`);
        });
    });
