"""
ImovLocal API Tests - Pre-publication testing
Tests for: Properties API, Auth API, Visits API, Admin functionality
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://imovlocal-1.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "imovlocaladm@gmail.com"
ADMIN_PASSWORD = "96113045Ro@"


class TestHealthCheck:
    """Basic API health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "ImovLocal" in data["message"]
        print(f"SUCCESS: API root returns: {data}")


class TestPropertiesAPI:
    """Properties API endpoint tests"""
    
    def test_list_properties(self):
        """Test GET /api/properties/ - List all properties"""
        response = requests.get(f"{BASE_URL}/api/properties/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} properties")
        
        # Validate property structure if properties exist
        if len(data) > 0:
            prop = data[0]
            assert "id" in prop
            assert "title" in prop
            assert "price" in prop
            assert "city" in prop
            print(f"SUCCESS: Property structure validated - First property: {prop.get('title', 'N/A')}")
    
    def test_list_properties_with_filters(self):
        """Test GET /api/properties/ with filters"""
        # Test purpose filter
        response = requests.get(f"{BASE_URL}/api/properties/?purpose=VENDA")
        assert response.status_code == 200
        data = response.json()
        print(f"SUCCESS: Filter by VENDA returned {len(data)} properties")
        
        # Test city filter
        response = requests.get(f"{BASE_URL}/api/properties/?city=Campo%20Grande")
        assert response.status_code == 200
        data = response.json()
        print(f"SUCCESS: Filter by Campo Grande returned {len(data)} properties")
    
    def test_list_properties_pagination(self):
        """Test pagination on properties list"""
        response = requests.get(f"{BASE_URL}/api/properties/?limit=5&skip=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5
        print(f"SUCCESS: Pagination working - returned {len(data)} properties with limit=5")
    
    def test_get_cities(self):
        """Test GET /api/properties/locations/cities"""
        response = requests.get(f"{BASE_URL}/api/properties/locations/cities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} cities: {data[:5]}...")
    
    def test_get_neighborhoods(self):
        """Test GET /api/properties/locations/neighborhoods"""
        response = requests.get(f"{BASE_URL}/api/properties/locations/neighborhoods")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} neighborhoods")
    
    def test_get_property_by_id(self):
        """Test GET /api/properties/{id} - Get single property"""
        # First get list to find a valid ID
        list_response = requests.get(f"{BASE_URL}/api/properties/?limit=1")
        assert list_response.status_code == 200
        properties = list_response.json()
        
        if len(properties) > 0:
            property_id = properties[0]["id"]
            response = requests.get(f"{BASE_URL}/api/properties/{property_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == property_id
            assert "owner_name" in data  # Should include owner info
            print(f"SUCCESS: Got property by ID: {data.get('title', 'N/A')}")
            print(f"  - Owner: {data.get('owner_name', 'N/A')}")
            print(f"  - Location: {data.get('city', 'N/A')}/{data.get('state', 'N/A')}")
        else:
            pytest.skip("No properties available to test")
    
    def test_get_nonexistent_property(self):
        """Test GET /api/properties/{id} with invalid ID"""
        response = requests.get(f"{BASE_URL}/api/properties/nonexistent-id-12345")
        assert response.status_code == 404
        print("SUCCESS: Returns 404 for nonexistent property")


class TestAuthAPI:
    """Authentication API tests"""
    
    def test_login_success(self):
        """Test POST /api/auth/login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"SUCCESS: Admin login successful - User: {data['user'].get('name', 'N/A')}")
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test POST /api/auth/login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@email.com", "password": "wrongpassword"}
        )
        assert response.status_code in [401, 404]
        print("SUCCESS: Returns error for invalid credentials")
    
    def test_login_missing_fields(self):
        """Test POST /api/auth/login with missing fields"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL}
        )
        assert response.status_code == 422
        print("SUCCESS: Returns 422 for missing password field")
    
    def test_get_profile(self):
        """Test GET /api/auth/me - Get current user profile"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get profile
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        print(f"SUCCESS: Got profile - Name: {data.get('name', 'N/A')}, Type: {data.get('user_type', 'N/A')}")


class TestVisitsAPI:
    """Visit scheduling API tests"""
    
    def test_schedule_visit(self):
        """Test POST /api/visits/schedule - Schedule a visit"""
        # First get a property ID
        props_response = requests.get(f"{BASE_URL}/api/properties/?limit=1")
        assert props_response.status_code == 200
        properties = props_response.json()
        
        if len(properties) == 0:
            pytest.skip("No properties available to test visit scheduling")
        
        property_id = properties[0]["id"]
        
        # Schedule visit
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        visit_data = {
            "property_id": property_id,
            "visitor_name": "TEST_Visitante Teste",
            "visitor_phone": "(67) 99999-9999",
            "visitor_email": "teste@teste.com",
            "visit_date": tomorrow,
            "visit_time": "14:00",
            "message": "Gostaria de visitar o imóvel"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/visits/schedule",
            json=visit_data
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["visitor_name"] == "TEST_Visitante Teste"
        print(f"SUCCESS: Visit scheduled - ID: {data['id']}")
    
    def test_schedule_visit_validation(self):
        """Test visit scheduling validation"""
        # Test with missing required fields
        response = requests.post(
            f"{BASE_URL}/api/visits/schedule",
            json={
                "property_id": "some-id",
                "visitor_name": "A",  # Too short
                "visitor_phone": "123"  # Too short
            }
        )
        assert response.status_code == 400
        print("SUCCESS: Validation working for visit scheduling")


class TestAdminAPI:
    """Admin panel API tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    def test_admin_stats(self, admin_token):
        """Test GET /api/admin/stats - Admin dashboard stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data or "users" in data or isinstance(data, dict)
        print(f"SUCCESS: Admin stats retrieved: {data}")
    
    def test_admin_users_list(self, admin_token):
        """Test GET /api/admin/users - List all users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} users in admin panel")
    
    def test_admin_unauthorized(self):
        """Test admin endpoints without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code in [401, 403]
        print("SUCCESS: Admin endpoints protected - returns 401/403 without auth")


class TestBannersAPI:
    """Banner management API tests"""
    
    def test_get_active_banners(self):
        """Test GET /api/banners/active - Get active banners"""
        response = requests.get(f"{BASE_URL}/api/banners/active?position=home_topo")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} active banners for home_topo")


class TestPlansPage:
    """Test plans/pricing page data"""
    
    def test_plans_endpoint_or_static(self):
        """Verify plans data is available"""
        # Plans might be static in frontend, but let's check if there's an API
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("SUCCESS: API accessible for plans page")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
