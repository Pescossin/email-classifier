// Elementos da interface
const analyzeBtn = document.getElementById('analyzeBtn');
const resultCard = document.getElementById('resultCard');
const loadingSpinner = document.getElementById('loadingSpinner');
const categoryBadge = document.getElementById('categoryBadge');
const suggestedResponse = document.getElementById('suggestedResponse');
const copyResponseBtn = document.getElementById('copyResponseBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const saveResultBtn = document.getElementById('saveResultBtn');
const fileInput = document.getElementById('fileInput');
const emailText = document.getElementById('emailText');
const historyContainer = document.getElementById('historyContainer');
const dropZone = document.getElementById('dropZone');
const fileName = document.getElementById('fileName');
const confidenceValue = document.getElementById('confidenceValue');

// Histórico de análises
let analysisHistory = [];

// Event Listeners
analyzeBtn.addEventListener('click', analyzeEmail);
copyResponseBtn.addEventListener('click', copyResponseToClipboard);
newAnalysisBtn.addEventListener('click', resetForm);
saveResultBtn.addEventListener('click', saveResult);
fileInput.addEventListener('change', handleFileSelect);

// Configuração da área de arrastar e soltar
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropZone.classList.add('dragover');
}

function unhighlight() {
    dropZone.classList.remove('dragover');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
        fileInput.files = files;
        handleFiles(files);
    }
}

function handleFileSelect(event) {
    const files = event.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        fileName.textContent = `Arquivo selecionado: ${file.name}`;
        
        const fileType = file.type;
        
        if (fileType === 'text/plain') {
            const reader = new FileReader();
            reader.onload = function(e) {
                emailText.value = e.target.result;
            };
            reader.readAsText(file);
        } else if (fileType === 'application/pdf') {
            // Para PDF, apenas mostramos o nome do arquivo
            emailText.value = `[Arquivo PDF: ${file.name}] - Em uma implementação completa, o texto seria extraído automaticamente.`;
        } else {
            alert('Por favor, selecione um arquivo .txt ou .pdf');
            fileInput.value = '';
            fileName.textContent = '';
        }
    }
}

// Função principal para análise do email
async function analyzeEmail() {
    const emailContent = emailText.value.trim();
    
    if (!emailContent) {
        alert('Por favor, insira o texto do email ou faça upload de um arquivo.');
        return;
    }
    
    // Mostrar spinner de carregamento
    loadingSpinner.style.display = 'block';
    analyzeBtn.disabled = true;
    
    try {
        const formData = new FormData();
        
        if (emailContent) {
            formData.append('email_text', emailContent);
        } else if (fileInput.files.length > 0) {
            formData.append('email_file', fileInput.files[0]);
        }
        
        const response = await fetch('/classify', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Atualizar a interface com os resultados
            updateUI(data.category, data.response, data.confidence);
            
            // Adicionar ao histórico
            addToHistory(emailContent, data.category, data.response);
        } else {
            alert('Erro: ' + data.error);
        }
    } catch (error) {
        alert('Erro de conexão: ' + error.message);
    } finally {
        // Esconder spinner
        loadingSpinner.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

// Atualizar a interface com os resultados
function updateUI(category, response, confidence) {
    // Atualizar categoria
    categoryBadge.textContent = category;
    
    if (category === 'Produtivo') {
        categoryBadge.className = 'badge bg-success';
        resultCard.className = 'card shadow-lg category-produtivo';
    } else {
        categoryBadge.className = 'badge bg-warning';
        resultCard.className = 'card shadow-lg category-improdutivo';
    }
    
    // Adicionar indicador de confiança
    confidenceValue.textContent = `(${Math.round(confidence * 100)}% de confiança)`;
    
    // Atualizar resposta sugerida
    suggestedResponse.textContent = response;
    
    // Mostrar resultados
    resultCard.style.display = 'block';
    
    // Rolar para os resultados
    resultCard.scrollIntoView({ behavior: 'smooth' });
}

// Copiar resposta para a área de transferência
function copyResponseToClipboard() {
    const responseText = suggestedResponse.textContent;
    navigator.clipboard.writeText(responseText).then(() => {
        // Feedback visual
        const originalText = copyResponseBtn.innerHTML;
        copyResponseBtn.innerHTML = '<i class="fas fa-check me-1"></i>Copiado!';
        setTimeout(() => {
            copyResponseBtn.innerHTML = originalText;
        }, 2000);
    });
}

// Reiniciar o formulário
function resetForm() {
    emailText.value = '';
    fileInput.value = '';
    fileName.textContent = '';
    resultCard.style.display = 'none';
    confidenceValue.textContent = '';
}

// Salvar resultado (simulação)
function saveResult() {
    alert('Funcionalidade de salvar será implementada em breve!');
}

// Adicionar ao histórico
function addToHistory(content, category, response) {
    // Limitar o histórico aos 5 itens mais recentes
    if (analysisHistory.length >= 5) {
        analysisHistory.pop();
    }
    
    // Adicionar novo item no início do array
    analysisHistory.unshift({
        content: content.length > 100 ? content.substring(0, 100) + '...' : content,
        category: category,
        response: response,
        timestamp: new Date().toLocaleTimeString()
    });
    
    // Atualizar a interface do histórico
    updateHistoryUI();
}

// Atualizar a interface do histórico
function updateHistoryUI() {
    if (analysisHistory.length === 0) {
        historyContainer.innerHTML = '<p class="text-muted text-center">Nenhuma análise realizada ainda</p>';
        return;
    }
    
    let historyHTML = '';
    analysisHistory.forEach((item, index) => {
        historyHTML += `
            <div class="history-item">
                <div class="d-flex justify-content-between">
                    <strong>${item.category}</strong>
                    <small class="text-muted">${item.timestamp}</small>
                </div>
                <p class="mb-1 small">${item.content}</p>
                <button class="btn btn-sm btn-outline-secondary mt-1" onclick="copyHistoryResponse(${index})">
                    <i class="fas fa-copy me-1"></i>Copiar resposta
                </button>
            </div>
        `;
    });
    
    historyContainer.innerHTML = historyHTML;
}

// Copiar resposta do histórico
function copyHistoryResponse(index) {
    const response = analysisHistory[index].response;
    navigator.clipboard.writeText(response).then(() => {
        alert('Resposta copiada para a área de transferência!');
    });
}

// Inicializar a página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se há parâmetros na URL (para futuras implementações)
    const urlParams = new URLSearchParams(window.location.search);
    const prefillText = urlParams.get('text');
    
    if (prefillText) {
        emailText.value = decodeURIComponent(prefillText);
    }
});