"""
Validação de Email - ImovLocal
Verifica se o domínio do email é válido através de consulta DNS
"""

import dns.resolver
import re
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

# Lista de domínios populares conhecidos (cache para evitar consultas repetidas)
KNOWN_VALID_DOMAINS = {
    'gmail.com', 'googlemail.com',
    'hotmail.com', 'hotmail.com.br', 'outlook.com', 'outlook.com.br', 'live.com', 'msn.com',
    'yahoo.com', 'yahoo.com.br',
    'icloud.com', 'me.com', 'mac.com',
    'uol.com.br', 'bol.com.br',
    'terra.com.br',
    'globo.com', 'globomail.com',
    'ig.com.br',
    'oi.com.br',
    'r7.com',
    'zipmail.com.br',
    'protonmail.com', 'proton.me',
    'zoho.com',
}

# Erros comuns de digitação e suas correções
TYPO_CORRECTIONS = {
    'gmial.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmail.cm': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'hotmal.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'hotmial.com': 'hotmail.com',
    'hotmail.co': 'hotmail.com',
    'hotmail.con': 'hotmail.com',
    'hitmail.com': 'hotmail.com',
    'outloo.com': 'outlook.com',
    'outlok.com': 'outlook.com',
    'outlook.co': 'outlook.com',
    'outllok.com': 'outlook.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'yahoo.co': 'yahoo.com',
    'yahoo.con': 'yahoo.com',
    'uol.com': 'uol.com.br',
    'bol.com': 'bol.com.br',
    'terra.com': 'terra.com.br',
}


def validate_email_format(email: str) -> Tuple[bool, str]:
    """
    Valida o formato básico do email
    Retorna: (is_valid, error_message)
    """
    if not email:
        return False, "Email é obrigatório"
    
    email = email.strip().lower()
    
    # Regex para validação básica de email
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        return False, "Formato de email inválido"
    
    # Verificar se tem @ e domínio
    if '@' not in email:
        return False, "Email deve conter @"
    
    local_part, domain = email.rsplit('@', 1)
    
    if not local_part:
        return False, "Email inválido antes do @"
    
    if not domain:
        return False, "Domínio do email não informado"
    
    if '.' not in domain:
        return False, "Domínio do email inválido"
    
    return True, ""


def check_typo_suggestion(domain: str) -> str:
    """
    Verifica se o domínio é um erro de digitação comum
    Retorna sugestão de correção ou string vazia
    """
    domain = domain.lower()
    return TYPO_CORRECTIONS.get(domain, "")


def validate_domain_dns(domain: str) -> Tuple[bool, str]:
    """
    Verifica se o domínio existe através de consulta DNS (registros MX)
    Retorna: (is_valid, error_message)
    """
    domain = domain.lower()
    
    # Se é um domínio conhecido, não precisa verificar
    if domain in KNOWN_VALID_DOMAINS:
        return True, ""
    
    # Verificar se é erro de digitação comum
    suggestion = check_typo_suggestion(domain)
    if suggestion:
        return False, f"Domínio inválido. Você quis dizer @{suggestion}?"
    
    try:
        # Tentar buscar registros MX (Mail Exchange)
        dns.resolver.resolve(domain, 'MX')
        logger.info(f"Domínio {domain} validado com sucesso via MX")
        return True, ""
    except dns.resolver.NXDOMAIN:
        # Domínio não existe
        logger.warning(f"Domínio {domain} não existe (NXDOMAIN)")
        return False, f"O domínio @{domain} não existe. Verifique se digitou corretamente."
    except dns.resolver.NoAnswer:
        # Domínio existe mas não tem MX, tentar verificar se tem registro A
        try:
            dns.resolver.resolve(domain, 'A')
            logger.info(f"Domínio {domain} validado via registro A (sem MX)")
            return True, ""  # Alguns domínios usam registro A para email
        except:
            logger.warning(f"Domínio {domain} não tem registros MX ou A")
            return False, f"O domínio @{domain} não parece aceitar emails."
    except dns.resolver.NoNameservers:
        logger.warning(f"Sem nameservers para domínio {domain}")
        return False, f"Não foi possível verificar o domínio @{domain}."
    except dns.resolver.Timeout:
        # Em caso de timeout, dar o benefício da dúvida
        logger.warning(f"Timeout ao verificar domínio {domain}")
        return True, ""  # Não bloquear por timeout
    except Exception as e:
        # Em caso de erro inesperado, dar o benefício da dúvida
        logger.error(f"Erro ao verificar domínio {domain}: {e}")
        return True, ""


def validate_email(email: str) -> Tuple[bool, str]:
    """
    Validação completa do email: formato + domínio
    Retorna: (is_valid, error_message)
    """
    # Primeiro, validar formato
    is_valid, error = validate_email_format(email)
    if not is_valid:
        return False, error
    
    # Extrair domínio
    email = email.strip().lower()
    _, domain = email.rsplit('@', 1)
    
    # Verificar domínio via DNS
    is_valid, error = validate_domain_dns(domain)
    if not is_valid:
        return False, error
    
    return True, ""


# Função auxiliar para uso direto
def is_valid_email(email: str) -> bool:
    """Retorna True se o email é válido, False caso contrário"""
    is_valid, _ = validate_email(email)
    return is_valid


def get_email_validation_error(email: str) -> str:
    """Retorna a mensagem de erro ou string vazia se válido"""
    _, error = validate_email(email)
    return error
