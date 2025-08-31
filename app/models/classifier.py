import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
import joblib
import os


try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

class EmailClassifier:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words=stopwords.words('portuguese'),
            ngram_range=(1, 2)
        )
        self.model = LogisticRegression()
        self.stemmer = PorterStemmer()
        self.is_trained = False
    
    def preprocess_text(self, text):
    
        text = text.lower()
        
      
        text = re.sub(r'[^a-záàâãéèêíïóôõöúçñ\s]', '', text)
        
       
        words = text.split()
        words = [self.stemmer.stem(word) for word in words if len(word) > 2]
        
        return ' '.join(words)
    
    def train(self, texts, labels):
      
        processed_texts = [self.preprocess_text(text) for text in texts]
        
       
        X = self.vectorizer.fit_transform(processed_texts)
        
     
        self.model.fit(X, labels)
        self.is_trained = True
        
    def predict(self, text):
        if not self.is_trained:
          
            return self._keyword_based_prediction(text)
        
       
        processed_text = self.preprocess_text(text)
        
       
        X = self.vectorizer.transform([processed_text])
        
      
        prediction = self.model.predict(X)[0]
        confidence = np.max(self.model.predict_proba(X))
        
        return prediction, confidence
    
    def _keyword_based_prediction(self, text):
 
        productive_keywords = [
            'suporte', 'problema', 'erro', 'ajuda', 'solicitação', 
            'requisição', 'atualização', 'status', 'urgente', 'importante',
            'sistema', 'tecnico', 'cliente', 'contrato', 'proposta',
            'pagamento', 'fatura', 'cobrança', 'dúvida', 'pergunta'
        ]
        

        unproductive_keywords = [
            'obrigado', 'agradeço', 'parabéns', 'feliz', 'natal', 
            'ano novo', 'comemoração', 'festa', 'almoço', 'jantar',
            'saudações', 'cumprimentos', 'espero que esteja bem'
        ]
        
        text = text.lower()
        productive_score = 0
        unproductive_score = 0
        

        for word in productive_keywords:
            if word in text:
                productive_score += 1
        

        for word in unproductive_keywords:
            if word in text:
                unproductive_score += 1
        

        total = productive_score + unproductive_score
        if total == 0:
            return True, 0.5  
        
        confidence = abs(productive_score - unproductive_score) / total
        
        return productive_score >= unproductive_score, confidence


classifier = EmailClassifier()

def classify_email(text):
    return classifier.predict(text)

def generate_response(text, is_productive):
    if is_productive:
        responses = [
            "Agradecemos seu contato. Nossa equipe já está analisando sua solicitação e retornará em breve com uma solução.",
            "Obrigado por relatar este problema. Estamos trabalhando para resolvê-lo o mais rápido possível.",
            "Recebemos sua requisição e ela está sendo processada. Em breve enviaremos uma atualização sobre o status.",
            "Sua solicitação foi recebida e está em análise. Retornaremos em até 24 horas com mais informações."
        ]
    else:
        responses = [
            "Agradecemos seu email. Ficamos felizes com suas palavras e desejamos a você um ótimo dia!",
            "Obrigado pelo contato. Apreciamos suas gentis palavras e retornaremos em breve com novidades profissionais.",
            "Agradecemos sua mensagem. Estamos sempre à disposição para questões relacionadas ao nosso trabalho.",
            "Obrigado por compartilhar. Desejamos a você tudo de bom e estamos à disposição para assuntos profissionais."
        ]
    

    import random
    return random.choice(responses)