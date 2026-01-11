import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  BarChart3, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2,
  Download,
  Bell,
  Search,
  Building2,
  MapPin,
  DollarSign,
  Calendar
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Sidebar = ({ active }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin' },
    { id: 'drives', label: 'Placement Drives', icon: Briefcase, path: '/admin/drives' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="w-64 bg-card border-r border-border min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-primary mb-1">PlacementFlow</h2>
        <p className="text-sm text-muted-foreground">Admin Dashboard</p>
      </div>

      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              to={item.path}
              data-testid={`nav-${item.id}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-border">
        <div className="px-4 py-3 mb-2 rounded-lg bg-muted">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={handleLogout}
          data-testid="logout-button"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  );
};

const Overview = () => {
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [drivesRes, appsRes] = await Promise.all([
        axios.get(`${API_URL}/drives`),
        axios.get(`${API_URL}/applications`)
      ]);
      setDrives(drivesRes.data);
      setApplications(appsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalDrives: drives.length,
    activeDrives: drives.filter(d => d.status === 'active').length,
    totalApplications: applications.length,
    recentApplications: applications.slice(0, 5)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-overview">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Dashboard Overview</h2>
        <p className="text-muted-foreground">Monitor your placement activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Drives</CardDescription>
            <CardTitle className="text-4xl">{stats.totalDrives}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {stats.activeDrives} active drives
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Applications</CardDescription>
            <CardTitle className="text-4xl">{stats.totalApplications}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Across all drives
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Drives</CardDescription>
            <CardTitle className="text-4xl">{stats.activeDrives}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Currently accepting applications
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>Latest student applications</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentApplications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No applications yet</p>
          ) : (
            <div className="space-y-4">
              {stats.recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium">{app.student_name}</p>
                    <p className="text-sm text-muted-foreground">{app.company_name} - {app.job_role}</p>
                  </div>
                  <Badge variant={
                    app.status === 'selected' ? 'success' :
                    app.status === 'rejected' ? 'destructive' :
                    'default'
                  }>
                    {app.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const DrivesManagement = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const response = await axios.get(`${API_URL}/drives`);
      setDrives(response.data);
    } catch (error) {
      toast.error('Failed to fetch drives');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (driveId) => {
    if (!window.confirm('Are you sure you want to delete this drive?')) return;

    try {
      await axios.delete(`${API_URL}/drives/${driveId}`);
      toast.success('Drive deleted successfully');
      fetchDrives();
    } catch (error) {
      toast.error('Failed to delete drive');
    }
  };

  const handleExport = async (driveId) => {
    try {
      const response = await axios.get(`${API_URL}/export/applications/${driveId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applications_${driveId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Applications exported successfully');
    } catch (error) {
      toast.error('Failed to export applications');
    }
  };

  const filteredDrives = drives.filter(drive =>
    drive.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drive.job_role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="drives-management">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Placement Drives</h2>
          <p className="text-muted-foreground">Manage all placement opportunities</p>
        </div>
        <Button
          onClick={() => {
            setEditingDrive(null);
            setShowForm(true);
          }}
          className="rounded-full gap-2"
          data-testid="create-drive-button"
        >
          <Plus className="w-4 h-4" />
          Create Drive
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search drives..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-drives-input"
        />
      </div>

      {showForm ? (
        <DriveForm
          drive={editingDrive}
          onClose={() => {
            setShowForm(false);
            setEditingDrive(null);
          }}
          onSuccess={() => {
            fetchDrives();
            setShowForm(false);
            setEditingDrive(null);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredDrives.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No placement drives found</p>
              </CardContent>
            </Card>
          ) : (
            filteredDrives.map((drive) => (
              <Card key={drive.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <img
                        src={`https://logo.clearbit.com/${drive.company_domain}`}
                        alt={drive.company_name}
                        className="w-12 h-12 rounded-lg border border-border"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/48?text=' + drive.company_name[0];
                        }}
                      />
                      <div>
                        <CardTitle className="mb-1">{drive.company_name}</CardTitle>
                        <CardDescription className="text-base font-medium text-foreground">
                          {drive.job_role}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={drive.status === 'active' ? 'success' : 'secondary'}>
                      {drive.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{drive.package}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{drive.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(drive.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/drives/${drive.id}/applicants`)}
                      data-testid={`view-applicants-${drive.id}`}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      View Applicants
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingDrive(drive);
                        setShowForm(true);
                      }}
                      data-testid={`edit-drive-${drive.id}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(drive.id)}
                      data-testid={`export-drive-${drive.id}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(drive.id)}
                      data-testid={`delete-drive-${drive.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const DriveForm = ({ drive, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: drive?.company_name || '',
    company_domain: drive?.company_domain || '',
    job_role: drive?.job_role || '',
    package: drive?.package || '',
    location: drive?.location || '',
    job_description: drive?.job_description || '',
    deadline: drive?.deadline || '',
    status: drive?.status || 'active',
    min_cgpa: drive?.eligibility?.min_cgpa || 0,
    required_skills: drive?.eligibility?.required_skills?.join(', ') || '',
    departments: drive?.eligibility?.departments?.join(', ') || '',
    batches: drive?.eligibility?.batches?.join(', ') || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      company_name: formData.company_name,
      company_domain: formData.company_domain,
      job_role: formData.job_role,
      package: formData.package,
      location: formData.location,
      job_description: formData.job_description,
      deadline: formData.deadline,
      status: formData.status,
      eligibility: {
        min_cgpa: parseFloat(formData.min_cgpa),
        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        departments: formData.departments.split(',').map(s => s.trim()).filter(Boolean),
        batches: formData.batches.split(',').map(s => parseInt(s.trim())).filter(Boolean)
      }
    };

    try {
      if (drive) {
        await axios.put(`${API_URL}/drives/${drive.id}`, payload);
        toast.success('Drive updated successfully');
      } else {
        await axios.post(`${API_URL}/drives`, payload);
        toast.success('Drive created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save drive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card data-testid="drive-form">
      <CardHeader>
        <CardTitle>{drive ? 'Edit Drive' : 'Create New Drive'}</CardTitle>
        <CardDescription>Fill in the details for the placement drive</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
                data-testid="company-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_domain">Company Domain *</Label>
              <Input
                id="company_domain"
                placeholder="example.com"
                value={formData.company_domain}
                onChange={(e) => setFormData({ ...formData, company_domain: e.target.value })}
                required
                data-testid="company-domain-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_role">Job Role *</Label>
              <Input
                id="job_role"
                value={formData.job_role}
                onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                required
                data-testid="job-role-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="package">Package *</Label>
              <Input
                id="package"
                placeholder="e.g., 10-12 LPA"
                value={formData.package}
                onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                required
                data-testid="package-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                data-testid="location-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
                data-testid="deadline-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_description">Job Description *</Label>
            <Textarea
              id="job_description"
              rows={4}
              value={formData.job_description}
              onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
              required
              data-testid="job-description-input"
            />
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold mb-4">Eligibility Criteria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_cgpa">Minimum CGPA *</Label>
                <Input
                  id="min_cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.min_cgpa}
                  onChange={(e) => setFormData({ ...formData, min_cgpa: e.target.value })}
                  required
                  data-testid="min-cgpa-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="required_skills">Required Skills (comma-separated)</Label>
                <Input
                  id="required_skills"
                  placeholder="Python, JavaScript, React"
                  value={formData.required_skills}
                  onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                  data-testid="skills-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departments">Departments (comma-separated) *</Label>
                <Input
                  id="departments"
                  placeholder="CSE, IT, ECE"
                  value={formData.departments}
                  onChange={(e) => setFormData({ ...formData, departments: e.target.value })}
                  required
                  data-testid="departments-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batches">Batches (comma-separated years) *</Label>
                <Input
                  id="batches"
                  placeholder="2024, 2025"
                  value={formData.batches}
                  onChange={(e) => setFormData({ ...formData, batches: e.target.value })}
                  required
                  data-testid="batches-input"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-button">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} data-testid="submit-drive-button">
              {loading ? 'Saving...' : drive ? 'Update Drive' : 'Create Drive'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const Applicants = () => {
  const [applications, setApplications] = useState([]);
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const driveId = location.pathname.split('/')[3];

  useEffect(() => {
    fetchData();
  }, [driveId]);

  const fetchData = async () => {
    try {
      const [driveRes, appsRes] = await Promise.all([
        axios.get(`${API_URL}/drives/${driveId}`),
        axios.get(`${API_URL}/applications/drive/${driveId}`)
      ]);
      setDrive(driveRes.data);
      setApplications(appsRes.data);
    } catch (error) {
      toast.error('Failed to fetch applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appId, status) => {
    try {
      await axios.put(`${API_URL}/applications/${appId}/status`, { status });
      toast.success('Status updated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const statusOptions = ['applied', 'shortlisted', 'interview', 'selected', 'rejected'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="applicants-view">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Applicants</h2>
        <p className="text-muted-foreground">
          {drive?.company_name} - {drive?.job_role}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Applicants: {applications.length}</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No applications received yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{app.student_name}</h4>
                    <p className="text-sm text-muted-foreground">{app.student_email}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span>{app.student_department}</span>
                      <span className="font-mono">CGPA: {app.student_cgpa}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                      data-testid={`status-select-${app.id}`}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="analytics-view">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Analytics</h2>
        <p className="text-muted-foreground">Placement statistics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardDescription>Total Drives</CardDescription>
            <CardTitle className="text-4xl">{analytics.total_drives}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Drives</CardDescription>
            <CardTitle className="text-4xl">{analytics.active_drives}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-4xl">{analytics.total_students}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Applications</CardDescription>
            <CardTitle className="text-4xl">{analytics.total_applications}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.department_stats).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="font-medium">{dept}</span>
                  <Badge>{count} students</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.status_stats).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="font-medium capitalize">{status}</span>
                  <Badge variant={
                    status === 'selected' ? 'success' :
                    status === 'rejected' ? 'destructive' :
                    'default'
                  }>
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const location = useLocation();
  const path = location.pathname;

  let activeTab = 'overview';
  if (path.includes('/drives') && !path.includes('/applicants')) {
    activeTab = 'drives';
  } else if (path.includes('/analytics')) {
    activeTab = 'analytics';
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar active={activeTab} />
      <main className="flex-1 p-8">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/drives" element={<DrivesManagement />} />
          <Route path="/drives/:driveId/applicants" element={<Applicants />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  );
}
