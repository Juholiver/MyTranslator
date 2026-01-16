// Módulo de UI: Responsável por interagir com o DOM
const UI = (() => {
    const selectors = {
        inputText: '#inputText',
        languageSelect: '#languageSelect',
        translateButton: '.buttonTraduzir',
        speakButton: '.buttonFalar',
        listenButton: '.buttonOuvir',
        outputText: '#outputText',
        status: '#status'
    };

    return {
        getSelectors: () => selectors,
        getInputText: () => document.querySelector(selectors.inputText).value,
        setInputText: (text) => {
            document.querySelector(selectors.inputText).value = text;
        },
        getLanguage: () => document.querySelector(selectors.languageSelect).value,
        setOutputText: (text) => {
            document.querySelector(selectors.outputText).value = text;
        },
        setSpeakButtonText: (text) => {
            document.querySelector(selectors.speakButton).innerHTML = text;
        },
        setStatus: (text, isError = false) => {
            const statusEl = document.querySelector(selectors.status);
            statusEl.textContent = text;
            statusEl.style.color = isError ? '#ff4d4d' : '#ffc107';
        },
        disableSpeechButtons: () => {
            document.querySelector(selectors.speakButton).disabled = true;
            document.querySelector(selectors.listenButton).disabled = true;
        }
    };
})();

// Módulo de Tradução: Responsável pela lógica de tradução
const Translation = (() => {
    const translate = async (text, language) => {
        if (!text) return '';

        // URL da API de tradução (usando MyMemory como exemplo)
        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=pt-BR|${language}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('A resposta da rede não foi boa');
            }
            const data = await response.json();
            return data.responseData.translatedText;
        } catch (error) {
            console.error('Erro na tradução:', error);
            UI.setStatus('Erro ao traduzir. Por favor, tente novamente mais tarde.', true);
            return '';
        }
    };

    return {
        translate
    };
})();

// Módulo de Fala: Responsável pela funcionalidade de texto para fala e reconhecimento de voz
const Speech = (() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;

    if (!isSupported) {
        return { isSupported: false };
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;


    recognition.onstart = () => {
        UI.setSpeakButtonText('<i class="fa-solid fa-microphone-lines"></i> Ouvindo...');
    };

    recognition.onend = () => {
        UI.setSpeakButtonText('<i class="fa-solid fa-microphone"></i> Falar e Traduzir');
    };

    recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        UI.setStatus(`Erro no reconhecimento de voz: ${event.error}`, true);
    };

    const speak = (text) => {
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    };

    const recognize = (callback) => {
        recognition.onresult = (event) => {
            const spokenText = event.results[0][0].transcript;
            callback(spokenText);
        };
        
        recognition.start();
        UI.setStatus('Por favor, permita o uso do microfone, se solicitado.');
    };

    return {
        isSupported,
        speak,
        recognize
    };
})();

// Módulo Principal: Orquestra os outros módulos
const App = ((UI, Translation, Speech) => {
    const setupEventListeners = () => {
        const selectors = UI.getSelectors();

        document.querySelector(selectors.translateButton).addEventListener('click', async () => {
            UI.setStatus('Traduzindo...');
            const text = UI.getInputText();
            const lang = UI.getLanguage();
            const translatedText = await Translation.translate(text, lang);
            UI.setOutputText(translatedText);
            UI.setStatus('Tradução concluída.');
        });

        if (Speech.isSupported) {
            document.querySelector(selectors.speakButton).addEventListener('click', () => {
                Speech.recognize((spokenText) => {
                    UI.setInputText(spokenText);
                    document.querySelector(selectors.translateButton).click();
                });
            });

            document.querySelector(selectors.listenButton).addEventListener('click', () => {
                const text = document.querySelector(selectors.outputText).value;
                if(text){
                    Speech.speak(text);
                } else {
                    UI.setStatus('Não há texto para ouvir.', true)
                }
            });
        } else {
            UI.setStatus('API de fala não suportada neste navegador.', true);
            UI.disableSpeechButtons();
        }
    };

    return {
        init: () => {
            UI.setStatus('Aplicação pronta.');
            setupEventListeners();
        }
    };
})(UI, Translation, Speech);

// Inicializa a aplicação
document.addEventListener('DOMContentLoaded', App.init);
