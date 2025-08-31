from flask import Blueprint, render_template, request, jsonify
from app.utils.file_handlers import allowed_file, extract_text_from_file
from app.models.classifier import classify_email, generate_response
import os

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/classify', methods=['POST'])
def classify():
    try:

        if 'email_text' in request.form and request.form['email_text'].strip():
            email_text = request.form['email_text']
  
        elif 'email_file' in request.files:
            file = request.files['email_file']
            if file.filename == '':
                return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
            
            if file and allowed_file(file.filename):
                email_text = extract_text_from_file(file)
            else:
                return jsonify({'error': 'Tipo de arquivo não permitido'}), 400
        else:
            return jsonify({'error': 'Nenhum conteúdo de email fornecido'}), 400
        
      
        is_productive, confidence = classify_email(email_text)
        
    
        response = generate_response(email_text, is_productive)
        
     
        return jsonify({
            'category': 'Produtivo' if is_productive else 'Improdutivo',
            'confidence': confidence,
            'response': response
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro no processamento: {str(e)}'}), 500