"""
Script para testar o login de todos os usuários criados
"""
import requests
import json

BACKEND_URL = "https://cloudinary-migrate-4.preview.emergentagent.com/api"

# Lista de todos os usuários para testar
TEST_USERS = [
    {
        "name": "Admin Master",
        "email": "admin@imovlocal.com",
        "password": "Master@2025",
        "type": "admin"
    },
    {
        "name": "Corretor (FREE)",
        "email": "corretor.teste@imovlocal.com",
        "password": "Teste@123",
        "type": "corretor"
    },
    {
        "name": "Corretor Vitalício",
        "email": "corretor.vitalicio@imovlocal.com",
        "password": "Vitalicio@2026",
        "type": "corretor"
    },
    {
        "name": "Imobiliária Vitalícia",
        "email": "imobiliaria.vitalicia@imovlocal.com",
        "password": "Vitalicio@2026",
        "type": "imobiliaria"
    },
    {
        "name": "Particular (FREE)",
        "email": "particular.teste@imovlocal.com",
        "password": "Teste@456",
        "type": "particular"
    },
    {
        "name": "Particular Vitalício",
        "email": "particular.vitalicio@imovlocal.com",
        "password": "Vitalicio@2026",
        "type": "particular"
    }
]

def test_login(user):
    """Testa o login de um usuário"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json={
                "email": user["email"],
                "password": user["password"]
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user_info = data.get("user", {})
            plan_type = user_info.get("plan_type", "N/A")
            plan_label = "⭐ VITALÍCIO" if plan_type == "lifetime" else plan_type.upper()
            
            print(f"   ✅ LOGIN OK - {user['name']}")
            print(f"      Tipo: {user_info.get('user_type', 'N/A')}")
            print(f"      Plano: {plan_label}")
            print(f"      Token: {token[:50]}...")
            return True
        else:
            print(f"   ❌ FALHOU - {user['name']}")
            print(f"      Status: {response.status_code}")
            print(f"      Erro: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ ERRO - {user['name']}")
        print(f"      Exception: {str(e)}")
        return False

def main():
    print("\n" + "=" * 70)
    print("🔐 TESTANDO LOGIN DE TODOS OS USUÁRIOS")
    print("=" * 70 + "\n")
    
    success_count = 0
    fail_count = 0
    
    for user in TEST_USERS:
        if test_login(user):
            success_count += 1
        else:
            fail_count += 1
        print()
    
    print("=" * 70)
    print(f"📊 RESULTADO DOS TESTES:")
    print(f"   ✅ Sucessos: {success_count}/{len(TEST_USERS)}")
    print(f"   ❌ Falhas:   {fail_count}/{len(TEST_USERS)}")
    print("=" * 70 + "\n")
    
    if success_count == len(TEST_USERS):
        print("🎉 TODOS OS USUÁRIOS ESTÃO FUNCIONANDO PERFEITAMENTE!\n")
    else:
        print("⚠️  ALGUNS USUÁRIOS APRESENTARAM PROBLEMAS\n")

if __name__ == "__main__":
    main()
