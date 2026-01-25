#!/usr/bin/env python3
"""
Backend API Testing for دار البقال E-commerce App
Tests the account approval system, customer locations, discounts, and driver/collector APIs
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Backend URL from frontend .env
BACKEND_URL = "https://darbakkal.preview.emergentagent.com/api"

# Test credentials
TEST_CREDENTIALS = {
    "admin": {"phone": "0600000001", "name": "Admin User"},
    "driver": {"phone": "0600000002", "name": "Driver User"},
    "collector": {"phone": "0600000003", "name": "Collector User"},
    "customer": {"phone": "0612345678", "name": "Test Customer"}
}

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_users = {}
        self.created_products = []
        self.created_orders = []
        
    def log_result(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, **kwargs) -> Optional[Dict]:
        """Make HTTP request with error handling"""
        url = f"{BACKEND_URL}{endpoint}"
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            if response.status_code >= 400:
                return {
                    "error": True,
                    "status_code": response.status_code,
                    "message": response.text
                }
            return response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return {"error": True, "message": str(e)}
    
    def test_health_check(self):
        """Test basic API health"""
        print("\n=== Testing API Health ===")
        
        # Test root endpoint
        result = self.make_request("GET", "/")
        if result and not result.get("error"):
            self.log_result("API Root", True, "API is accessible")
        else:
            self.log_result("API Root", False, "API not accessible", result)
            return False
        
        # Test health endpoint
        result = self.make_request("GET", "/health")
        if result and not result.get("error") and result.get("status") == "healthy":
            self.log_result("Health Check", True, "API is healthy")
            return True
        else:
            self.log_result("Health Check", False, "API health check failed", result)
            return False
    
    def test_account_approval_system(self):
        """Test Account Approval System APIs"""
        print("\n=== Testing Account Approval System ===")
        
        # 1. Test customer registration (login with new phone)
        customer_data = TEST_CREDENTIALS["customer"]
        result = self.make_request("POST", "/auth/login", params={
            "phone": customer_data["phone"],
            "name": customer_data["name"],
            "latitude": 33.5731,
            "longitude": -7.5898
        })
        
        if result and not result.get("error"):
            if result.get("is_new_registration") and result.get("needs_approval"):
                self.log_result("Customer Registration", True, "New customer registered, needs approval")
                customer_id = result.get("id")
                self.created_users["customer"] = customer_id
            else:
                # Existing user
                customer_id = result.get("id")
                self.created_users["customer"] = customer_id
                self.log_result("Customer Login", True, "Existing customer logged in")
        else:
            self.log_result("Customer Registration", False, "Failed to register customer", result)
            return False
        
        # 2. Test getting pending users
        result = self.make_request("GET", "/admin/users/pending")
        if result and not result.get("error"):
            pending_users = result if isinstance(result, list) else []
            self.log_result("Get Pending Users", True, f"Found {len(pending_users)} pending users")
        else:
            self.log_result("Get Pending Users", False, "Failed to get pending users", result)
        
        # 3. Test approving user account
        if customer_id:
            result = self.make_request("PUT", f"/admin/users/{customer_id}/approve")
            if result and not result.get("error"):
                if result.get("is_approved") and result.get("is_active"):
                    self.log_result("Approve User", True, "User account approved successfully")
                else:
                    self.log_result("Approve User", False, "User approval status not updated correctly", result)
            else:
                self.log_result("Approve User", False, "Failed to approve user", result)
        
        # 4. Test rejecting user account (create another user first)
        test_reject_phone = "0612345679"
        result = self.make_request("POST", "/auth/login", params={
            "phone": test_reject_phone,
            "name": "Test Reject User",
            "latitude": 33.5731,
            "longitude": -7.5898
        })
        
        if result and not result.get("error"):
            reject_user_id = result.get("id")
            if reject_user_id:
                result = self.make_request("PUT", f"/admin/users/{reject_user_id}/reject")
                if result and not result.get("error"):
                    self.log_result("Reject User", True, "User account rejected and deleted")
                else:
                    self.log_result("Reject User", False, "Failed to reject user", result)
        
        return True
    
    def test_customer_locations(self):
        """Test Customer Locations APIs"""
        print("\n=== Testing Customer Locations ===")
        
        # 1. Test getting customers with locations
        result = self.make_request("GET", "/customers/locations")
        if result is not None and not (isinstance(result, dict) and result.get("error")):
            customers = result if isinstance(result, list) else []
            customers_with_location = [c for c in customers if c.get("latitude") and c.get("longitude")]
            self.log_result("Get Customer Locations", True, f"Found {len(customers_with_location)} customers with locations")
        else:
            self.log_result("Get Customer Locations", False, "Failed to get customer locations", result)
        
        # 2. Test updating customer location (admin function)
        customer_id = self.created_users.get("customer")
        if customer_id:
            new_lat, new_lng = 33.6000, -7.6000
            result = self.make_request("PUT", f"/admin/users/{customer_id}/location", params={
                "latitude": new_lat,
                "longitude": new_lng
            })
            if result and not result.get("error"):
                if result.get("latitude") == new_lat and result.get("longitude") == new_lng:
                    self.log_result("Update Customer Location", True, "Customer location updated successfully")
                else:
                    self.log_result("Update Customer Location", False, "Location not updated correctly", result)
            else:
                self.log_result("Update Customer Location", False, "Failed to update customer location", result)
        
        return True
    
    def test_discounts_management(self):
        """Test Discounts Management APIs"""
        print("\n=== Testing Discounts Management ===")
        
        # First, create a test product
        product_data = {
            "name": "Test Product for Discount",
            "description": "Test product for discount testing",
            "price": 25.0,
            "original_price": 30.0,
            "category": "Test Category",
            "unit": "piece",
            "quantity_per_unit": "1 piece",
            "stock": 50,
            "is_new": False,
            "is_discount": False,
            "is_active": True
        }
        
        result = self.make_request("POST", "/products", json=product_data)
        if result and not result.get("error"):
            product_id = result.get("id")
            self.created_products.append(product_id)
            self.log_result("Create Test Product", True, "Test product created for discount testing")
        else:
            self.log_result("Create Test Product", False, "Failed to create test product", result)
            return False
        
        # 1. Test getting discount products (should be empty initially)
        result = self.make_request("GET", "/products", params={"is_discount": "true"})
        if result and not result.get("error"):
            discount_products = result if isinstance(result, list) else []
            self.log_result("Get Discount Products (Initial)", True, f"Found {len(discount_products)} discount products initially")
        else:
            self.log_result("Get Discount Products (Initial)", False, "Failed to get discount products", result)
        
        # 2. Test marking product as discount
        if product_id:
            update_data = {"is_discount": True}
            result = self.make_request("PUT", f"/products/{product_id}", json=update_data)
            if result and not result.get("error"):
                if result.get("is_discount") == True:
                    self.log_result("Mark Product as Discount", True, "Product marked as discount successfully")
                else:
                    self.log_result("Mark Product as Discount", False, "Product discount status not updated", result)
            else:
                self.log_result("Mark Product as Discount", False, "Failed to mark product as discount", result)
        
        # 3. Test getting discount products (should include our product now)
        result = self.make_request("GET", "/products", params={"is_discount": "true"})
        if result and not result.get("error"):
            discount_products = result if isinstance(result, list) else []
            our_product = next((p for p in discount_products if p.get("id") == product_id), None)
            if our_product:
                self.log_result("Get Discount Products (After Update)", True, f"Found {len(discount_products)} discount products including our test product")
            else:
                self.log_result("Get Discount Products (After Update)", False, "Our test product not found in discount products")
        else:
            self.log_result("Get Discount Products (After Update)", False, "Failed to get discount products after update", result)
        
        # 4. Test removing discount from product
        if product_id:
            update_data = {"is_discount": False}
            result = self.make_request("PUT", f"/products/{product_id}", json=update_data)
            if result and not result.get("error"):
                if result.get("is_discount") == False:
                    self.log_result("Remove Product Discount", True, "Product discount removed successfully")
                else:
                    self.log_result("Remove Product Discount", False, "Product discount status not updated", result)
            else:
                self.log_result("Remove Product Discount", False, "Failed to remove product discount", result)
        
        return True
    
    def test_driver_collector_apis(self):
        """Test Driver and Collector APIs"""
        print("\n=== Testing Driver/Collector APIs ===")
        
        # First create some test orders
        customer_id = self.created_users.get("customer")
        product_id = self.created_products[0] if self.created_products else None
        
        if customer_id and product_id:
            # Create a test order
            order_data = {
                "items": [{
                    "product_id": product_id,
                    "product_name": "Test Product",
                    "quantity": 2,
                    "price": 25.0,
                    "total": 50.0
                }],
                "delivery_address": "Test Address",
                "delivery_latitude": 33.5731,
                "delivery_longitude": -7.5898,
                "notes": "Test order for driver/collector testing",
                "use_points": False
            }
            
            result = self.make_request("POST", "/orders", params={"user_id": customer_id}, json=order_data)
            if result and not result.get("error"):
                order_id = result.get("id")
                self.created_orders.append(order_id)
                self.log_result("Create Test Order", True, "Test order created for driver/collector testing")
            else:
                self.log_result("Create Test Order", False, "Failed to create test order", result)
        
        # 1. Test getting today's orders (driver API)
        result = self.make_request("GET", "/orders/today")
        if result and not result.get("error"):
            today_orders = result if isinstance(result, list) else []
            self.log_result("Get Today's Orders", True, f"Found {len(today_orders)} orders for today")
        else:
            self.log_result("Get Today's Orders", False, "Failed to get today's orders", result)
        
        # 2. Test getting orders to collect (collector API)
        result = self.make_request("GET", "/orders/to-collect")
        if result and not result.get("error"):
            collect_orders = result if isinstance(result, list) else []
            self.log_result("Get Orders to Collect", True, f"Found {len(collect_orders)} orders to collect")
        else:
            self.log_result("Get Orders to Collect", False, "Failed to get orders to collect", result)
        
        # 3. Test getting products for tomorrow (collector API)
        result = self.make_request("GET", "/orders/products-tomorrow")
        if result and not result.get("error"):
            tomorrow_products = result if isinstance(result, list) else []
            self.log_result("Get Products for Tomorrow", True, f"Found {len(tomorrow_products)} product aggregations for tomorrow")
        else:
            self.log_result("Get Products for Tomorrow", False, "Failed to get products for tomorrow", result)
        
        # 4. Test generating gift QR code (driver API)
        if customer_id:
            # First, give the customer some points by updating their record
            result = self.make_request("PUT", f"/auth/user/{customer_id}", json={"points": 100})
            
            # Now try to generate a gift code
            result = self.make_request("POST", "/gift/generate", params={
                "user_id": customer_id,
                "amount": 50
            })
            if result and not result.get("error"):
                gift_code = result.get("code")
                if gift_code:
                    self.log_result("Generate Gift QR Code", True, f"Gift code generated: {gift_code}")
                else:
                    self.log_result("Generate Gift QR Code", False, "No gift code in response", result)
            else:
                self.log_result("Generate Gift QR Code", False, "Failed to generate gift code", result)
        
        return True
    
    def test_additional_apis(self):
        """Test additional important APIs"""
        print("\n=== Testing Additional APIs ===")
        
        # Test statistics API
        result = self.make_request("GET", "/statistics")
        if result and not result.get("error"):
            stats = result
            required_fields = ["total_customers", "total_orders", "today_orders", "monthly_revenue"]
            if all(field in stats for field in required_fields):
                self.log_result("Get Statistics", True, "Statistics API working correctly")
            else:
                self.log_result("Get Statistics", False, "Statistics missing required fields", stats)
        else:
            self.log_result("Get Statistics", False, "Failed to get statistics", result)
        
        # Test settings API
        result = self.make_request("GET", "/settings")
        if result and not result.get("error"):
            settings = result
            if "delivery_fee" in settings and "points_percentage" in settings:
                self.log_result("Get Settings", True, "Settings API working correctly")
            else:
                self.log_result("Get Settings", False, "Settings missing required fields", settings)
        else:
            self.log_result("Get Settings", False, "Failed to get settings", result)
        
        # Test product categories
        result = self.make_request("GET", "/products/categories")
        if result and not result.get("error"):
            categories = result if isinstance(result, list) else []
            self.log_result("Get Product Categories", True, f"Found {len(categories)} product categories")
        else:
            self.log_result("Get Product Categories", False, "Failed to get product categories", result)
    
    def cleanup(self):
        """Clean up test data"""
        print("\n=== Cleaning Up Test Data ===")
        
        # Delete test products
        for product_id in self.created_products:
            result = self.make_request("DELETE", f"/products/{product_id}")
            if result and not result.get("error"):
                print(f"✅ Deleted test product {product_id}")
            else:
                print(f"❌ Failed to delete test product {product_id}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for دار البقال")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run tests in order
        if not self.test_health_check():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        self.test_account_approval_system()
        self.test_customer_locations()
        self.test_discounts_management()
        self.test_driver_collector_apis()
        self.test_additional_apis()
        
        # Cleanup
        self.cleanup()
        
        # Summary
        end_time = time.time()
        duration = end_time - start_time
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)