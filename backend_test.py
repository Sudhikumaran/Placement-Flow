import requests
import sys
import json
from datetime import datetime, timedelta

class PlacementFlowAPITester:
    def __init__(self, base_url="https://placementflow.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.student_token = None
        self.admin_user_id = None
        self.student_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_drive_id = None
        self.created_app_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@college.edu", "password": "demo123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            self.admin_user_id = response['user_id']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_student_login(self):
        """Test student login"""
        success, response = self.run_test(
            "Student Login",
            "POST",
            "auth/login",
            200,
            data={"email": "student@college.edu", "password": "demo123"}
        )
        if success and 'token' in response:
            self.student_token = response['token']
            self.student_user_id = response['user_id']
            print(f"   Student token obtained: {self.student_token[:20]}...")
            return True
        return False

    def test_student_profile_get(self):
        """Test getting student profile"""
        success, response = self.run_test(
            "Get Student Profile",
            "GET",
            "profile",
            200,
            token=self.student_token
        )
        return success

    def test_student_profile_update(self):
        """Test updating student profile"""
        update_data = {
            "name": "Test Student Updated",
            "department": "Computer Science",
            "batch": 2024,
            "cgpa": 8.5,
            "skills": ["Python", "JavaScript", "React"]
        }
        success, response = self.run_test(
            "Update Student Profile",
            "PUT",
            "profile",
            200,
            data=update_data,
            token=self.student_token
        )
        return success

    def test_create_placement_drive(self):
        """Test creating a placement drive"""
        drive_data = {
            "company_name": "TechCorp",
            "company_domain": "techcorp.com",
            "job_role": "Software Engineer",
            "package": "12 LPA",
            "location": "Bangalore",
            "job_description": "Full-stack development role",
            "eligibility": {
                "min_cgpa": 7.0,
                "required_skills": ["Python", "JavaScript"],
                "departments": ["Computer Science", "Information Technology"],
                "batches": [2024, 2025]
            },
            "deadline": (datetime.now() + timedelta(days=30)).isoformat(),
            "status": "active"
        }
        success, response = self.run_test(
            "Create Placement Drive",
            "POST",
            "drives",
            200,
            data=drive_data,
            token=self.admin_token
        )
        if success and 'id' in response:
            self.created_drive_id = response['id']
            print(f"   Created drive ID: {self.created_drive_id}")
        return success

    def test_get_drives_admin(self):
        """Test getting drives as admin"""
        success, response = self.run_test(
            "Get Drives (Admin)",
            "GET",
            "drives",
            200,
            token=self.admin_token
        )
        return success

    def test_get_drives_student(self):
        """Test getting drives as student (should be filtered by eligibility)"""
        success, response = self.run_test(
            "Get Drives (Student)",
            "GET",
            "drives",
            200,
            token=self.student_token
        )
        return success

    def test_apply_to_drive(self):
        """Test student applying to a drive"""
        if not self.created_drive_id:
            print("❌ No drive ID available for application test")
            return False
            
        success, response = self.run_test(
            "Apply to Drive",
            "POST",
            "applications",
            200,
            data={"drive_id": self.created_drive_id},
            token=self.student_token
        )
        if success and 'id' in response:
            self.created_app_id = response['id']
            print(f"   Created application ID: {self.created_app_id}")
        return success

    def test_get_applications_student(self):
        """Test getting applications as student"""
        success, response = self.run_test(
            "Get Applications (Student)",
            "GET",
            "applications",
            200,
            token=self.student_token
        )
        return success

    def test_get_applications_admin(self):
        """Test getting applications as admin"""
        success, response = self.run_test(
            "Get Applications (Admin)",
            "GET",
            "applications",
            200,
            token=self.admin_token
        )
        return success

    def test_get_drive_applications(self):
        """Test getting applications for a specific drive"""
        if not self.created_drive_id:
            print("❌ No drive ID available for drive applications test")
            return False
            
        success, response = self.run_test(
            "Get Drive Applications",
            "GET",
            f"applications/drive/{self.created_drive_id}",
            200,
            token=self.admin_token
        )
        return success

    def test_update_application_status(self):
        """Test updating application status"""
        if not self.created_app_id:
            print("❌ No application ID available for status update test")
            return False
            
        success, response = self.run_test(
            "Update Application Status",
            "PUT",
            f"applications/{self.created_app_id}/status",
            200,
            data={"status": "shortlisted"},
            token=self.admin_token
        )
        return success

    def test_get_notifications(self):
        """Test getting notifications"""
        success, response = self.run_test(
            "Get Notifications (Student)",
            "GET",
            "notifications",
            200,
            token=self.student_token
        )
        return success

    def test_mark_notification_read(self):
        """Test marking notification as read"""
        # First get notifications to find one to mark as read
        success, response = self.run_test(
            "Get Notifications for Read Test",
            "GET",
            "notifications",
            200,
            token=self.student_token
        )
        
        if success and response and len(response) > 0:
            notif_id = response[0]['id']
            success, _ = self.run_test(
                "Mark Notification Read",
                "PUT",
                f"notifications/{notif_id}/read",
                200,
                token=self.student_token
            )
            return success
        else:
            print("   No notifications found to mark as read")
            return True  # Not a failure if no notifications exist

    def test_mark_all_notifications_read(self):
        """Test marking all notifications as read"""
        success, response = self.run_test(
            "Mark All Notifications Read",
            "PUT",
            "notifications/read-all",
            200,
            token=self.student_token
        )
        return success

    def test_get_analytics(self):
        """Test getting analytics"""
        success, response = self.run_test(
            "Get Analytics",
            "GET",
            "analytics",
            200,
            token=self.admin_token
        )
        return success

    def test_export_applications(self):
        """Test CSV export of applications"""
        if not self.created_drive_id:
            print("❌ No drive ID available for export test")
            return False
            
        success, response = self.run_test(
            "Export Applications CSV",
            "GET",
            f"export/applications/{self.created_drive_id}",
            200,
            token=self.admin_token
        )
        return success

    def test_update_drive(self):
        """Test updating a placement drive"""
        if not self.created_drive_id:
            print("❌ No drive ID available for update test")
            return False
            
        update_data = {
            "package": "15 LPA",
            "location": "Mumbai"
        }
        success, response = self.run_test(
            "Update Placement Drive",
            "PUT",
            f"drives/{self.created_drive_id}",
            200,
            data=update_data,
            token=self.admin_token
        )
        return success

    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n🔒 Testing Role-Based Access Control...")
        
        # Student trying to access admin endpoint
        success, response = self.run_test(
            "Student Access Admin Endpoint (Should Fail)",
            "GET",
            "analytics",
            403,  # Should be forbidden
            token=self.student_token
        )
        
        # Admin trying to access student profile endpoint
        success2, response2 = self.run_test(
            "Admin Access Student Profile (Should Fail)",
            "GET",
            "profile",
            403,  # Should be forbidden
            token=self.admin_token
        )
        
        return success and success2

def main():
    print("🚀 Starting PlacementFlow API Tests...")
    print("=" * 50)
    
    tester = PlacementFlowAPITester()
    
    # Test authentication first
    print("\n📋 AUTHENTICATION TESTS")
    print("-" * 30)
    
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1
        
    if not tester.test_student_login():
        print("❌ Student login failed, stopping tests")
        return 1

    # Test student profile operations
    print("\n👤 STUDENT PROFILE TESTS")
    print("-" * 30)
    tester.test_student_profile_get()
    tester.test_student_profile_update()

    # Test placement drive operations
    print("\n🏢 PLACEMENT DRIVE TESTS")
    print("-" * 30)
    tester.test_create_placement_drive()
    tester.test_get_drives_admin()
    tester.test_get_drives_student()
    tester.test_update_drive()

    # Test application operations
    print("\n📝 APPLICATION TESTS")
    print("-" * 30)
    tester.test_apply_to_drive()
    tester.test_get_applications_student()
    tester.test_get_applications_admin()
    tester.test_get_drive_applications()
    tester.test_update_application_status()

    # Test notification operations
    print("\n🔔 NOTIFICATION TESTS")
    print("-" * 30)
    tester.test_get_notifications()
    tester.test_mark_notification_read()
    tester.test_mark_all_notifications_read()

    # Test analytics and export
    print("\n📊 ANALYTICS & EXPORT TESTS")
    print("-" * 30)
    tester.test_get_analytics()
    tester.test_export_applications()

    # Test role-based access
    print("\n🔒 SECURITY TESTS")
    print("-" * 30)
    tester.test_role_based_access()

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())