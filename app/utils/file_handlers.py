def extract_text_from_file(file):
    filename = file.filename
    if filename.endswith('.txt'):
        # Para Heroku, leia o arquivo diretamente sem salvar no disco
        return file.read().decode('utf-8')
    elif filename.endswith('.pdf'):
        try:
            text = ""
            # Para PDF, precisamos um ajuste especial para Heroku
            import tempfile
            import os
            
            # Criar arquivo temporário
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
                file.save(tmp)
                tmp_path = tmp.name
                
            try:
                with pdfplumber.open(tmp_path) as pdf:
                    for page in pdf.pages:
                        text += page.extract_text() or ""
            finally:
                # Limpar arquivo temporário
                os.unlink(tmp_path)
                
            return text
        except Exception as e:
            raise Exception(f"Erro ao extrair texto do PDF: {str(e)}")
    else:
        raise Exception("Tipo de arquivo não suportado")