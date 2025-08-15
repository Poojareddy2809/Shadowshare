// DOM Elements
const cryptoForm = document.getElementById('cryptoForm');
const resetBtn = document.getElementById('resetBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultSection = document.getElementById('resultSection');
const toast = document.getElementById('toast');
const imageUpload = document.getElementById('imageUpload');
const timeLimitContainer = document.getElementById('timeLimitContainer');
const encryptRadio = document.getElementById('encrypt');
const decryptRadio = document.getElementById('decrypt');

// Translator Elements
const translatorInput = document.getElementById('translatorInput');
const translatorOutput = document.getElementById('translatorOutput');
const translatorLanguageSelector = document.getElementById('translatorLanguageSelector');
const translateButton = document.getElementById('translateButton');

// Show/Hide Time Limit Input
encryptRadio.addEventListener('change', () => {
    timeLimitContainer.style.display = 'block';
});
decryptRadio.addEventListener('change', () => {
    timeLimitContainer.style.display = 'none';
});

// Show toast notification
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = `fixed bottom-5 right-5 ${isError ? 'bg-red-600' : 'bg-green-600'} text-white py-2 px-4 rounded-lg opacity-100 transition-all duration-300`;
    setTimeout(() => {
        toast.classList.add('opacity-0');
    }, 3000);
}

// Read image file as base64
function readImageAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Form submit handler
cryptoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = document.getElementById('text').value.trim();
    const password = document.getElementById('password').value.trim();
    const timeLimit = parseInt(document.getElementById('timeLimit').value) || null;
    const operation = document.querySelector('input[name="operation"]:checked').value;
    const imageFile = imageUpload.files[0];

    if (!password) {
        showToast('Password is required', true);
        return;
    }

    try {
        loadingSpinner.classList.remove('hidden');

        if (operation === 'encrypt') {
            let content = {};
            if (text) content.text = text;
            if (imageFile) content.image = await readImageAsBase64(imageFile);
            if (!text && !imageFile) {
                showToast('Please enter text or upload an image', true);
                return;
            }
            if (timeLimit) {
                content.expires = Date.now() + timeLimit * 60 * 1000;
            }
            const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(content), password).toString();
            resultSection.innerHTML = `
                <div class="fade-in">
                    <h3 class="text-green-400 font-semibold mb-2">Encrypted Text:</h3>
                    <textarea readonly class="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-green-300" rows="4">${ciphertext}</textarea>
                    <button onclick="copyToClipboard('${ciphertext.replace(/'/g, "\\'")}')" class="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg">Copy</button>
                </div>
            `;
        } else if (operation === 'decrypt') {
            if (!text) {
                showToast('Please enter ciphertext to decrypt', true);
                return;
            }
            const bytes = CryptoJS.AES.decrypt(text, password);
            const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

            if (decrypted.expires && Date.now() > decrypted.expires) {
                resultSection.innerHTML = `<p class="text-red-500">This message has expired.</p>`;
                return;
            }

            let outputHtml = `<div class="fade-in"><h3 class="text-blue-400 font-semibold mb-2">Decrypted Content:</h3>`;
            if (decrypted.text) {
                outputHtml += `<p class="mb-2 text-gray-200">${decrypted.text}</p>`;
            }
            if (decrypted.image) {
                outputHtml += `<img src="${decrypted.image}" alt="Decrypted Image" class="max-w-full rounded-lg mt-2"/>`;
            }
            outputHtml += `<button onclick="copyToClipboard('${decrypted.text ? decrypted.text.replace(/'/g, "\\'") : ''}')" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">Copy Text</button></div>`;
            resultSection.innerHTML = outputHtml;
        }

        showToast(`${operation === 'encrypt' ? 'Encrypted' : 'Decrypted'} successfully`);
    } catch (error) {
        console.error(error);
        showToast('Error processing request', true);
    } finally {
        loadingSpinner.classList.add('hidden');
    }
});

// Reset form
resetBtn.addEventListener('click', () => {
    cryptoForm.reset();
    resultSection.innerHTML = '';
    imageUpload.value = '';
    timeLimitContainer.style.display = encryptRadio.checked ? 'block' : 'none';
});

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard');
    });
}

// Translation function (Google Gemini API)
translateButton.addEventListener('click', async () => {
    const inputText = translatorInput.value.trim();
    const targetLang = translatorLanguageSelector.value;

    if (!inputText) {
        showToast('Enter text to translate', true);
        return;
    }

    try {
        loadingSpinner.classList.remove('hidden');
        // NOTE: Replace with your actual Gemini API key and endpoint
        const response = await fetch('https://api.gemini.google/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_GEMINI_API_KEY'
            },
            body: JSON.stringify({ text: inputText, targetLang })
        });

        if (!response.ok) throw new Error('Translation failed');
        const data = await response.json();
        translatorOutput.value = data.translation || 'No translation available';
        showToast('Translated successfully');
    } catch (err) {
        console.error(err);
        showToast('Translation failed', true);
    } finally {
        loadingSpinner.classList.add('hidden');
    }
});
