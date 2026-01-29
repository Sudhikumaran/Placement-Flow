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
  Calendar,
  Upload,
  FileText,
  X
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Sidebar = ({ active }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin' },
    { id: 'drives', label: 'Placement Drives', icon: Briefcase, path: '/admin/drives' },
    { id: 'shortlist', label: 'Bulk Status Update', icon: Upload, path: '/admin/shortlist' },
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
  const navigate = useNavigate();
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

  // Group applications by company
  const applicationsByCompany = applications.reduce((acc, app) => {
    if (!acc[app.company_name]) {
      acc[app.company_name] = { count: 0, drive_id: app.drive_id };
    }
    acc[app.company_name].count++;
    return acc;
  }, {});

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

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
          onClick={() => navigate('/admin/all-applicants')}
        >
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center justify-between">
              <span>Total Applications</span>
              <Users className="w-4 h-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-4xl">{stats.totalApplications}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-primary font-medium flex items-center gap-2">
              Click to view all applicants
              <span className="text-lg">→</span>
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
          <CardTitle>Applications by Company</CardTitle>
          <CardDescription>View applicants for each placement drive</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(applicationsByCompany).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No applications yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(applicationsByCompany).map(([company, data]) => (
                <div
                  key={company}
                  onClick={() => navigate(`/admin/drives/${data.drive_id}/applicants`)}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{company}</p>
                      <p className="text-sm text-muted-foreground">{data.count} applicants</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View <Users className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

const AllApplicants = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, drivesRes] = await Promise.all([
        axios.get(`${API_URL}/applications`),
        axios.get(`${API_URL}/drives`)
      ]);
      setApplications(appsRes.data);
      setDrives(drivesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Group applications by drive
  const applicationsByDrive = drives.map(drive => {
    const driveApps = applications.filter(app => app.drive_id === drive.id);
    return {
      drive,
      applications: driveApps,
      count: driveApps.length
    };
  }).filter(item => item.count > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">All Applicants</h2>
          <p className="text-muted-foreground">View all applications grouped by placement drive</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          Back to Overview
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Drives</CardDescription>
            <CardTitle className="text-3xl">{drives.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Applications</CardDescription>
            <CardTitle className="text-3xl">{applications.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Drives with Applications</CardDescription>
            <CardTitle className="text-3xl">{applicationsByDrive.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {applicationsByDrive.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No applications received yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {applicationsByDrive.map(({ drive, applications: driveApps, count }) => (
            <Card key={drive.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-6 h-6 text-primary" />
                      <CardTitle className="text-2xl">{drive.company_name}</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {drive.job_role} • {drive.location} • Package: {drive.package}
                    </CardDescription>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="secondary">{count} applicants</Badge>
                      <Badge variant={drive.status === 'active' ? 'default' : 'secondary'}>
                        {drive.status}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate(`/admin/drives/${drive.id}/applicants`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {driveApps.slice(0, 5).map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {app.student_name?.charAt(0) || 'S'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{app.student_name}</p>
                          <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>{app.student_email}</span>
                            {app.student_department && (
                              <>
                                <span>•</span>
                                <span>{app.student_department}</span>
                              </>
                            )}
                            {app.student_cgpa && (
                              <>
                                <span>•</span>
                                <span>CGPA: {app.student_cgpa}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant={
                        app.status === 'selected' ? 'success' :
                        app.status === 'rejected' ? 'destructive' :
                        app.status === 'interview' ? 'default' :
                        'secondary'
                      }>
                        {app.status}
                      </Badge>
                    </div>
                  ))}
                  {driveApps.length > 5 && (
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => navigate(`/admin/drives/${drive.id}/applicants`)}
                    >
                      View all {driveApps.length} applicants →
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
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
    required_skills: drive?.eligibility?.required_skills || [],
    departments: drive?.eligibility?.departments || [],
    batches: drive?.eligibility?.batches || []
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
        required_skills: formData.required_skills,
        departments: formData.departments,
        batches: formData.batches
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
                <Label htmlFor="required_skills">Required Skills</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      id="skill-input-admin"
                      placeholder="Type a skill and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.target.value.trim();
                          if (value && !formData.required_skills?.includes(value)) {
                            setFormData({ ...formData, required_skills: [...(formData.required_skills || []), value] });
                            e.target.value = '';
                          }
                        }
                      }}
                      data-testid="skills-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById('skill-input-admin');
                        const value = input.value.trim();
                        if (value && !formData.required_skills?.includes(value)) {
                          setFormData({ ...formData, required_skills: [...(formData.required_skills || []), value] });
                          input.value = '';
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.required_skills?.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="px-3 py-1 text-sm flex items-center gap-1"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => {
                            const newSkills = formData.required_skills.filter((_, i) => i !== index);
                            setFormData({ ...formData, required_skills: newSkills });
                          }}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {(!formData.required_skills || formData.required_skills.length === 0) && (
                    <p className="text-sm text-muted-foreground">No skills added. Add skills like Python, JavaScript, etc.</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departments">Departments *</Label>
                <div className="border border-input rounded-md p-3 space-y-2 bg-background">
                  {['Computer Science', 'Information Technology', 'Electronics and Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Biotechnology', 'Artificial Intelligence', 'Data Science'].map(dept => (
                    <label key={dept} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.departments?.includes(dept)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, departments: [...(formData.departments || []), dept] });
                          } else {
                            setFormData({ ...formData, departments: formData.departments.filter(d => d !== dept) });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{dept}</span>
                    </label>
                  ))}
                </div>
                {(!formData.departments || formData.departments.length === 0) && (
                  <p className="text-sm text-destructive">Please select at least one department</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="batches">Batches (Graduation Years) *</Label>
                <div className="border border-input rounded-md p-3 flex flex-wrap gap-3 bg-background">
                  {[2024, 2025, 2026, 2027, 2028].map(year => (
                    <label key={year} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.batches?.includes(year)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, batches: [...(formData.batches || []), year] });
                          } else {
                            setFormData({ ...formData, batches: formData.batches.filter(b => b !== year) });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">{year}</span>
                    </label>
                  ))}
                </div>
                {(!formData.batches || formData.batches.length === 0) && (
                  <p className="text-sm text-destructive">Please select at least one batch</p>
                )}
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

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driveId]);

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

  const totalOffers = analytics.status_stats['selected'] || 0;
  const maxDeptValue = Math.max(...Object.values(analytics.department_stats));
  const maxStatusValue = Math.max(...Object.values(analytics.status_stats));

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
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardDescription>Total Offers</CardDescription>
            <CardTitle className="text-4xl text-primary">{totalOffers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Students selected
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Students by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.department_stats).map(([dept, count]) => {
                const percentage = (count / maxDeptValue) * 100;
                return (
                  <div key={dept} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{dept}</span>
                      <Badge variant="secondary">{count} students</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Status breakdown with visual representation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.status_stats).map(([status, count]) => {
                const percentage = (count / maxStatusValue) * 100;
                const getColor = () => {
                  if (status === 'selected') return 'bg-emerald-500';
                  if (status === 'interview') return 'bg-blue-500';
                  if (status === 'shortlisted') return 'bg-purple-500';
                  if (status === 'rejected') return 'bg-red-500';
                  return 'bg-slate-500';
                };
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm capitalize">{status}</span>
                      <Badge variant={
                        status === 'selected' ? 'success' :
                        status === 'rejected' ? 'destructive' :
                        'default'
                      }>
                        {count}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className={`${getColor()} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const UploadShortlist = () => {
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const response = await axios.get(`${API_URL}/drives`);
      setDrives(response.data);
    } catch (error) {
      toast.error('Failed to fetch drives');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setUploadStatus('');
    }
  };

  const handleUpload = async () => {
    if (!selectedDrive) {
      toast.error('Please select a drive');
      return;
    }
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.split('\n').filter(row => row.trim());
        
        if (rows.length < 2) {
          toast.error('CSV file is empty or invalid');
          setLoading(false);
          return;
        }

        // Parse CSV rows (skip header)
        const updates = rows.slice(1).map(row => {
          const cols = row.split(',').map(col => col.trim());
          return {
            email: cols[0],
            status: cols[1]?.toLowerCase()
          };
        }).filter(item => item.email && item.status);

        let successCount = 0;
        let failCount = 0;
        const statusBreakdown = {
          shortlisted: 0,
          selected: 0,
          rejected: 0,
          waitlisted: 0
        };

        // Fetch all applications for this drive
        const appsResponse = await axios.get(`${API_URL}/applications`);
        const driveApplications = appsResponse.data.filter(
          app => app.drive_id === selectedDrive
        );

        for (const update of updates) {
          try {
            const application = driveApplications.find(
              app => app.student_email.toLowerCase() === update.email.toLowerCase()
            );

            if (application) {
              // Validate status
              const validStatuses = ['shortlisted', 'selected', 'rejected', 'waitlisted', 'interview'];
              const status = validStatuses.includes(update.status) ? update.status : 'shortlisted';
              
              await axios.put(`${API_URL}/applications/${application.id}/status`, {
                status: status
              });
              successCount++;
              if (statusBreakdown[status] !== undefined) {
                statusBreakdown[status]++;
              }
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
          }
        }

        const breakdown = Object.entries(statusBreakdown)
          .filter(([_, count]) => count > 0)
          .map(([status, count]) => `${count} ${status}`)
          .join(', ');

        setUploadStatus(
          `✅ ${successCount} applications updated successfully${breakdown ? ` (${breakdown})` : ''}. ${failCount > 0 ? `❌ ${failCount} not found or failed.` : ''}`
        );
        toast.success(`Status updated for ${successCount} applications`);
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error('Failed to process file');
      setUploadStatus('');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'email,status\nstudent@college.edu,shortlisted\nalice@college.edu,selected\nbob@college.edu,rejected\ncarol@college.edu,waitlisted';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'status_update_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Bulk Status Update</h2>
        <p className="text-muted-foreground">Update application status for multiple students at once</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>Upload a CSV file with student emails and their status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="drive">Select Placement Drive *</Label>
              <select
                id="drive"
                value={selectedDrive}
                onChange={(e) => setSelectedDrive(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md"
              >
                <option value="">Choose a drive...</option>
                {drives.map((drive) => (
                  <option key={drive.id} value={drive.id}>
                    {drive.company_name} - {drive.job_role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="file">CSV File *</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-1"
              />
              {file && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {uploadStatus && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-line">{uploadStatus}</p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={loading || !selectedDrive || !file}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Upload & Update Status'}
              <Upload className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>How to bulk update application status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium">Download Template</p>
                  <p className="text-sm text-muted-foreground">Get the CSV template with correct format</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium">Fill Student Data</p>
                  <p className="text-sm text-muted-foreground">Add email and status for each student</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium">Select Drive & Upload</p>
                  <p className="text-sm text-muted-foreground">Choose the placement drive and upload your CSV file</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">📧 Notifications</p>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Students will be notified via the platform when their status changes. Make sure email/notification system is configured to send updates.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full"
            >
              Download CSV Template
              <Download className="w-4 h-4 ml-2" />
            </Button>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-3">CSV Format:</p>
              <code className="text-xs block space-y-1">
                <div className="text-primary font-semibold">email,status</div>
                <div>student@college.edu,shortlisted</div>
                <div>alice@college.edu,selected</div>
                <div>bob@college.edu,rejected</div>
                <div>carol@college.edu,waitlisted</div>
              </code>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-medium mb-2">Valid Status Values:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">shortlisted</Badge>
                  <Badge variant="success">selected</Badge>
                  <Badge variant="destructive">rejected</Badge>
                  <Badge variant="default">waitlisted</Badge>
                  <Badge variant="default">interview</Badge>
                </div>
              </div>
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
  } else if (path.includes('/shortlist')) {
    activeTab = 'shortlist';
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
          <Route path="/all-applicants" element={<AllApplicants />} />
          <Route path="/shortlist" element={<UploadShortlist />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  );
}
