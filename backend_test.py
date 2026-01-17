#!/usr/bin/env python3
"""
Backend API Testing for ImovLocal Platform
Tests all authentication and property endpoints
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL from frontend environment
BASE_URL = "https://local-property-1.preview.emergentagent.com/api"

# Test users credentials
TEST_USERS = [
    {"email": "admin@imovlocal.com", "password": "Master@2025", "type": "Admin Master"},
    {"email": "admin.senior@imovlocal.com", "password": "AdminSenior@2025", "type": "Admin Sênior"},
    {"email": "corretor.teste@imovlocal.com", "password": "Teste@123", "type": "Corretor FREE"},
    {"email": "corretor.vitalicio@imovlocal.com", "password": "Vitalicio@2026", "type": "Corretor Vitalício"},
    {"email": "imobiliaria.vitalicia@imovlocal.com", "password": "Vitalicio@2026", "type": "Imobiliária Vitalícia"},
    {"email": "particular.teste@imovlocal.com", "password": "Teste@456", "type": "Particular FREE"},
    {"email": "particular.vitalicio@imovlocal.com", "password": "Vitalicio@2026", "type": "Particular Vitalício"}
]

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        self.details = []
    
    def add_success(self, test_name: str, details: str = ""):
        self.passed += 1
        self.details.append(f"✅ {test_name}: {details}")
        print(f"✅ {test_name}: {details}")
    
    def add_failure(self, test_name: str, error: str):
        self.failed += 1
        self.errors.append(f"❌ {test_name}: {error}")
        self.details.append(f"❌ {test_name}: {error}")
        print(f"❌ {test_name}: {error}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        print(f"{'='*60}")
        
        if self.errors:
            print("\nFAILED TESTS:")
            for error in self.errors:
                print(error)
        
        return self.failed == 0

def make_request(method: str, endpoint: str, data: Dict = None, headers: Dict = None, timeout: int = 30, form_data: bool = False) -> tuple:
    """Make HTTP request and return (success, response_data, status_code)"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=timeout)
        elif method.upper() == "POST":
            if form_data:
                # Send as form data instead of JSON
                response = requests.post(url, data=data, headers=headers, timeout=timeout)
            else:
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
        else:
            return False, f"Unsupported method: {method}", 0
        
        try:
            response_data = response.json()
        except:
            response_data = response.text
        
        return response.status_code < 400, response_data, response.status_code
    
    except requests.exceptions.Timeout:
        return False, "Request timeout", 0
    except requests.exceptions.ConnectionError:
        return False, "Connection error", 0
    except Exception as e:
        return False, f"Request error: {str(e)}", 0

def test_api_health(results: TestResults):
    """Test if API is running"""
    print("\n🔍 Testing API Health...")
    
    success, data, status = make_request("GET", "/")
    
    if success and status == 200:
        results.add_success("API Health Check", f"API is running - {data.get('message', 'OK')}")
        return True
    else:
        results.add_failure("API Health Check", f"API not responding - Status: {status}, Error: {data}")
        return False

def test_user_login(results: TestResults, user: Dict) -> Optional[str]:
    """Test user login and return access token if successful"""
    print(f"\n🔐 Testing login for {user['type']}: {user['email']}")
    
    login_data = {
        "email": user["email"],
        "password": user["password"]
    }
    
    success, data, status = make_request("POST", "/auth/login", login_data)
    
    if success and status == 200:
        if "access_token" in data and "user" in data:
            user_info = data["user"]
            results.add_success(
                f"Login {user['type']}", 
                f"User: {user_info.get('name', 'N/A')}, Type: {user_info.get('user_type', 'N/A')}"
            )
            return data["access_token"]
        else:
            results.add_failure(f"Login {user['type']}", "Invalid response format - missing token or user data")
            return None
    else:
        results.add_failure(f"Login {user['type']}", f"Status: {status}, Error: {data}")
        return None

def test_get_current_user(results: TestResults, token: str, user_type: str):
    """Test /auth/me endpoint"""
    print(f"\n👤 Testing /auth/me for {user_type}")
    
    headers = {"Authorization": f"Bearer {token}"}
    success, data, status = make_request("GET", "/auth/me", headers=headers)
    
    if success and status == 200:
        if "id" in data and "email" in data:
            results.add_success(
                f"Get Current User ({user_type})", 
                f"User: {data.get('name', 'N/A')}, Email: {data.get('email', 'N/A')}"
            )
            return True
        else:
            results.add_failure(f"Get Current User ({user_type})", "Invalid user data format")
            return False
    else:
        results.add_failure(f"Get Current User ({user_type})", f"Status: {status}, Error: {data}")
        return False

def test_list_properties(results: TestResults):
    """Test properties listing"""
    print(f"\n🏠 Testing properties listing...")
    
    success, data, status = make_request("GET", "/properties")
    
    if success and status == 200:
        if isinstance(data, list):
            total_properties = len(data)
            
            # Count special property types
            launches = sum(1 for prop in data if prop.get('is_launch', False))
            featured = sum(1 for prop in data if prop.get('is_featured', False))
            
            results.add_success(
                "List Properties", 
                f"Total: {total_properties}, Launches: {launches}, Featured: {featured}"
            )
            
            # Verify expected counts
            if total_properties >= 18:
                results.add_success("Properties Count", f"Found {total_properties} properties (expected ≥18)")
            else:
                results.add_failure("Properties Count", f"Found {total_properties} properties (expected ≥18)")
            
            if launches >= 2:
                results.add_success("Launch Properties", f"Found {launches} launches (expected ≥2)")
            else:
                results.add_failure("Launch Properties", f"Found {launches} launches (expected ≥2)")
            
            if featured >= 4:
                results.add_success("Featured Properties", f"Found {featured} featured (expected ≥4)")
            else:
                results.add_failure("Featured Properties", f"Found {featured} featured (expected ≥4)")
            
            return data
        else:
            results.add_failure("List Properties", "Response is not a list")
            return []
    else:
        results.add_failure("List Properties", f"Status: {status}, Error: {data}")
        return []

def test_property_details(results: TestResults, properties: list):
    """Test property details endpoint"""
    if not properties:
        results.add_failure("Property Details", "No properties available to test")
        return
    
    # Test first property
    property_id = properties[0].get('id')
    if not property_id:
        results.add_failure("Property Details", "First property has no ID")
        return
    
    print(f"\n🏡 Testing property details for ID: {property_id}")
    
    success, data, status = make_request("GET", f"/properties/{property_id}")
    
    if success and status == 200:
        if "id" in data and "title" in data:
            results.add_success(
                "Property Details", 
                f"Property: {data.get('title', 'N/A')}, Owner: {data.get('owner_name', 'N/A')}"
            )
        else:
            results.add_failure("Property Details", "Invalid property data format")
    else:
        results.add_failure("Property Details", f"Status: {status}, Error: {data}")


def test_particular_restriction(results: TestResults):
    """Test restriction for 'Particular' users - cannot create properties for VENDA"""
    print(f"\n🚫 Testing Particular user restriction...")
    
    # Login as particular user
    particular_user = {"email": "particular.teste@imovlocal.com", "password": "Teste@456"}
    token = test_user_login_silent(particular_user)
    
    if not token:
        results.add_failure("Particular Restriction Test", "Failed to login as particular user")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Try to create property with purpose="VENDA" - should fail with 403
    print("  Testing VENDA restriction...")
    venda_data = {
        "title": "Casa de Teste Venda",
        "description": "Teste de restrição para venda",
        "property_type": "Casa-Térrea",  # Use valid enum value
        "purpose": "VENDA",
        "price": "300000",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP"
    }
    
    success, data, status = make_request("POST", "/properties/with-images", venda_data, headers, form_data=True)
    
    if status == 403 and "Particular" in str(data) and "Venda" in str(data):
        results.add_success(
            "Particular VENDA Restriction", 
            "Correctly blocked VENDA for particular user with 403 error"
        )
    else:
        results.add_failure(
            "Particular VENDA Restriction", 
            f"Expected 403 with restriction message, got Status: {status}, Response: {data}"
        )
    
    # Test 2: Try to create property with purpose="ALUGUEL" - should succeed
    print("  Testing ALUGUEL permission...")
    aluguel_data = {
        "title": "Casa de Teste Aluguel",
        "description": "Teste de permissão para aluguel",
        "property_type": "Casa-Térrea",  # Use valid enum value
        "purpose": "ALUGUEL",
        "price": "2500",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP"
    }
    
    success, data, status = make_request("POST", "/properties/with-images", aluguel_data, headers, form_data=True)
    
    if success and status == 201:
        results.add_success(
            "Particular ALUGUEL Permission", 
            f"Successfully created ALUGUEL property: {data.get('title', 'N/A')}"
        )
    else:
        results.add_failure(
            "Particular ALUGUEL Permission", 
            f"Failed to create ALUGUEL property - Status: {status}, Error: {data}"
        )


def test_mural_oportunidades_complete_flow(results: TestResults):
    """Test COMPLETE Mural de Oportunidades Flow as requested"""
    print(f"\n💼 Testing COMPLETE Mural de Oportunidades Flow...")
    
    # ===== TEST 1: CREATE NEW DEMAND WITH NEW FIELDS =====
    print("\n1️⃣ CRIAR NOVA DEMANDA COM CAMPOS NOVOS")
    corretor_user = {"email": "corretor.vitalicio@imovlocal.com", "password": "Vitalicio@2026"}
    token_vitalicio = test_user_login_silent(corretor_user)
    
    if not token_vitalicio:
        results.add_failure("Mural Flow - Login Vitalicio", "Failed to login as corretor.vitalicio@imovlocal.com")
        return
    
    headers_vitalicio = {"Authorization": f"Bearer {token_vitalicio}"}
    
    # Create demand with new fields (estado, comissao_parceiro)
    demand_data = {
        "tipo_imovel": "Apartamento",
        "estado": "MS",
        "cidade": "Dourados", 
        "bairros_interesse": ["Centro", "Vila Industrial"],
        "valor_minimo": 150000,
        "valor_maximo": 300000,
        "comissao_parceiro": 35.5
    }
    
    print(f"  Creating demand with data: {demand_data}")
    success, data, status = make_request("POST", "/demands/", demand_data, headers_vitalicio)
    
    if success and status == 201:
        if "id" in data and "estado" in data and "comissao_parceiro" in data:
            demand_id = data["id"]
            results.add_success(
                "CREATE Demand with New Fields", 
                f"✅ Created demand ID: {demand_id}, Estado: {data.get('estado')}, Comissão: {data.get('comissao_parceiro')}%"
            )
        else:
            results.add_failure("CREATE Demand with New Fields", f"Missing required fields in response: {data}")
            return
    else:
        results.add_failure("CREATE Demand with New Fields", f"Status: {status}, Error: {data}")
        return
    
    # ===== TEST 2: VIEW PROPOSALS FOR A DEMAND =====
    print("\n2️⃣ VER PROPOSTAS DE UMA DEMANDA")
    corretor_teste_user = {"email": "corretor.teste@imovlocal.com", "password": "Teste@123"}
    token_teste = test_user_login_silent(corretor_teste_user)
    
    if not token_teste:
        results.add_failure("Mural Flow - Login Teste", "Failed to login as corretor.teste@imovlocal.com")
        return
    
    headers_teste = {"Authorization": f"Bearer {token_teste}"}
    
    # Get my demands first
    print("  Getting my-demands...")
    success, my_demands, status = make_request("GET", "/demands/my-demands", headers=headers_teste)
    
    if success and status == 200 and isinstance(my_demands, list):
        if len(my_demands) > 0:
            first_demand_id = my_demands[0]["id"]
            results.add_success(
                "GET My Demands", 
                f"✅ Found {len(my_demands)} demands, using first: {first_demand_id}"
            )
            
            # Get proposals for this demand
            print(f"  Getting proposals for demand: {first_demand_id}")
            success, proposals, status = make_request("GET", f"/demands/{first_demand_id}/proposals", headers=headers_teste)
            
            if success and status == 200:
                results.add_success(
                    "GET Demand Proposals", 
                    f"✅ Retrieved {len(proposals)} proposals for demand {first_demand_id}"
                )
                
                # Store for next test
                test_demand_id = first_demand_id
                test_proposals = proposals
            else:
                results.add_failure("GET Demand Proposals", f"Status: {status}, Error: {proposals}")
                test_demand_id = None
                test_proposals = []
        else:
            results.add_success("GET My Demands", "✅ No existing demands found (empty list is valid)")
            test_demand_id = None
            test_proposals = []
    else:
        results.add_failure("GET My Demands", f"Status: {status}, Error: {my_demands}")
        test_demand_id = None
        test_proposals = []
    
    # ===== TEST 3: ACCEPT PROPOSAL (if available) =====
    print("\n3️⃣ ACEITAR PROPOSTA")
    if test_demand_id and test_proposals and len(test_proposals) > 0:
        # Find a pending proposal
        pending_proposal = None
        for proposal in test_proposals:
            if proposal.get("status") == "pending":
                pending_proposal = proposal
                break
        
        if pending_proposal:
            proposal_id = pending_proposal["id"]
            print(f"  Accepting proposal: {proposal_id}")
            success, response, status = make_request("PUT", f"/demands/proposals/{proposal_id}/accept", headers=headers_teste)
            
            if success and status == 200:
                results.add_success(
                    "ACCEPT Proposal", 
                    f"✅ Proposal {proposal_id} accepted successfully: {response.get('message', 'OK')}"
                )
            else:
                results.add_failure("ACCEPT Proposal", f"Status: {status}, Error: {response}")
        else:
            results.add_success("ACCEPT Proposal", "ℹ️ No pending proposals found to accept (this is normal)")
    else:
        results.add_success("ACCEPT Proposal", "ℹ️ No demands/proposals available to test acceptance (this is normal)")
    
    # ===== TEST 4: VERIFY NOTIFICATIONS =====
    print("\n4️⃣ VERIFICAR NOTIFICAÇÕES")
    imobiliaria_user = {"email": "imobiliaria.vitalicia@imovlocal.com", "password": "Vitalicio@2026"}
    token_imobiliaria = test_user_login_silent(imobiliaria_user)
    
    if not token_imobiliaria:
        results.add_failure("Mural Flow - Login Imobiliaria", "Failed to login as imobiliaria.vitalicia@imovlocal.com")
        return
    
    headers_imobiliaria = {"Authorization": f"Bearer {token_imobiliaria}"}
    
    print("  Getting notifications...")
    success, notifications, status = make_request("GET", "/notifications/", headers=headers_imobiliaria)
    
    if success and status == 200:
        if isinstance(notifications, list):
            # Look for proposal accepted notifications
            proposal_notifications = [n for n in notifications if n.get("type") == "proposal_accepted"]
            results.add_success(
                "GET Notifications", 
                f"✅ Retrieved {len(notifications)} total notifications, {len(proposal_notifications)} proposal-related"
            )
        else:
            results.add_failure("GET Notifications", f"Expected list, got: {type(notifications)}")
    else:
        results.add_failure("GET Notifications", f"Status: {status}, Error: {notifications}")


def test_mural_oportunidades(results: TestResults):
    """Test Basic Mural de Oportunidades (Demands API) - Legacy Test"""
    print(f"\n💼 Testing Basic Mural de Oportunidades...")
    
    # Login as corretor
    corretor_user = {"email": "corretor.vitalicio@imovlocal.com", "password": "Vitalicio@2026"}
    token = test_user_login_silent(corretor_user)
    
    if not token:
        results.add_failure("Mural Test", "Failed to login as corretor user")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: GET /api/demands/ - should return list (can be empty)
    print("  Testing GET /api/demands/...")
    success, data, status = make_request("GET", "/demands/", headers=headers)
    
    if success and status == 200:
        if isinstance(data, list):
            results.add_success(
                "Mural GET Demands", 
                f"Successfully retrieved demands list with {len(data)} items"
            )
        else:
            results.add_failure("Mural GET Demands", f"Expected list, got: {type(data)}")
    else:
        results.add_failure("Mural GET Demands", f"Status: {status}, Error: {data}")
    
    # Test 2: POST /api/demands/ - create test demand
    print("  Testing POST /api/demands/...")
    demand_data = {
        "tipo_imovel": "Apartamento",
        "bairros_interesse": ["Centro", "Jardim"],
        "valor_minimo": 100000,
        "valor_maximo": 500000,
        "comissao_parceiro": 50
    }
    
    success, data, status = make_request("POST", "/demands/", demand_data, headers)
    
    if success and status == 201:
        if "id" in data and "tipo_imovel" in data:
            results.add_success(
                "Mural CREATE Demand", 
                f"Successfully created demand: {data.get('tipo_imovel', 'N/A')} - ID: {data.get('id', 'N/A')}"
            )
        else:
            results.add_failure("Mural CREATE Demand", "Invalid demand response format")
    else:
        results.add_failure("Mural CREATE Demand", f"Status: {status}, Error: {data}")


def test_user_login_silent(user: Dict) -> Optional[str]:
    """Test user login silently and return access token if successful"""
    login_data = {
        "email": user["email"],
        "password": user["password"]
    }
    
    success, data, status = make_request("POST", "/auth/login", login_data)
    
    if success and status == 200 and "access_token" in data:
        return data["access_token"]
    return None

def main():
    """Main test execution"""
    print("🚀 Starting ImovLocal Backend API Tests - FASE 2")
    print(f"Base URL: {BASE_URL}")
    print("="*60)
    
    results = TestResults()
    
    # Test 1: API Health
    if not test_api_health(results):
        print("\n❌ API is not responding. Stopping tests.")
        return False
    
    # Test 2: Login all users
    successful_logins = []
    for user in TEST_USERS:
        token = test_user_login(results, user)
        if token:
            successful_logins.append((token, user['type']))
    
    # Test 3: Test /auth/me with one successful login
    if successful_logins:
        token, user_type = successful_logins[0]
        test_get_current_user(results, token, user_type)
    else:
        results.add_failure("Get Current User", "No successful logins to test with")
    
    # Test 4: List properties
    properties = test_list_properties(results)
    
    # Test 5: Property details
    test_property_details(results, properties)
    
    # ===== FASE 2 TESTS =====
    print("\n" + "="*60)
    print("🔥 STARTING FASE 2 SPECIFIC TESTS")
    print("="*60)
    
    # Test 6: Particular user restriction for VENDA
    test_particular_restriction(results)
    
    # Test 7: Mural de Oportunidades APIs - Complete Flow
    test_mural_oportunidades_complete_flow(results)
    
    # Test 8: Basic Mural APIs (Legacy)
    test_mural_oportunidades(results)
    
    # Final summary
    success = results.summary()
    
    if success:
        print("\n🎉 All tests passed! Backend is working correctly.")
    else:
        print(f"\n⚠️  {results.failed} test(s) failed. Check the errors above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)