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
import { 
  LayoutDashboard, 
  Briefcase, 
  User, 
  Bell, 
  LogOut,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Upload
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Sidebar = ({ active }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`);
      const unread = response.data.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      // Silent fail
    }
  };

  const menuItems = [
    { id: 'drives', label: 'Available Drives', icon: Briefcase, path: '/dashboard' },
    { id: 'applications', label: 'My Applications', icon: LayoutDashboard, path: '/dashboard/applications' },
    { id: 'profile', label: 'Profile', icon: User, path: '/dashboard/profile' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/dashboard/notifications', badge: unreadCount }
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
        <p className="text-sm text-muted-foreground">Student Portal</p>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute right-3 top-3 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
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

const AvailableDrives = () => {
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      toast.error('Failed to fetch drives');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (driveId) => {
    try {
      await axios.post(`${API_URL}/applications`, { drive_id: driveId });
      toast.success('Application submitted successfully!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to apply');
    }
  };

  const appliedDriveIds = applications.map(app => app.drive_id);
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
    <div className="space-y-6" data-testid="available-drives">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Available Opportunities</h2>
        <p className="text-muted-foreground">Browse and apply to placement drives</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies or roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-drives-input"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrives.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No drives available for your profile</p>
            </CardContent>
          </Card>
        ) : (
          filteredDrives.map((drive) => {
            const hasApplied = appliedDriveIds.includes(drive.id);
            return (
              <Card key={drive.id} className="hover:shadow-lg transition-all duration-200" data-testid={`drive-card-${drive.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <img
                      src={`https://logo.clearbit.com/${drive.company_domain}`}
                      alt={drive.company_name}
                      className="w-12 h-12 rounded-lg border border-border"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/48?text=' + drive.company_name[0];
                      }}
                    />
                    {hasApplied && (
                      <Badge variant="success" data-testid={`applied-badge-${drive.id}`}>
                        Applied
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mb-1">{drive.company_name}</CardTitle>
                  <CardDescription className="text-base font-medium text-foreground">
                    {drive.job_role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{drive.package}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{drive.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Deadline: {new Date(drive.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {drive.job_description}
                  </p>

                  <Button
                    className="w-full rounded-full"
                    onClick={() => handleApply(drive.id)}
                    disabled={hasApplied}
                    data-testid={`apply-button-${drive.id}`}
                  >
                    {hasApplied ? 'Already Applied' : 'Apply Now'}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 30000); // Poll every 30s for status updates
    return () => clearInterval(interval);
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API_URL}/applications`);
      setApplications(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch applications');
      setLoading(false);
    }
  };

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;

    try {
      await axios.delete(`${API_URL}/applications/${appId}`);
      toast.success('Application withdrawn successfully');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to withdraw application');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'selected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'interview':
      case 'shortlisted':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'selected':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'interview':
      case 'shortlisted':
        return 'default';
      default:
        return 'secondary';
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
    <div className="space-y-6" data-testid="my-applications">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">My Applications</h2>
        <p className="text-muted-foreground">Track your application status</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <LayoutDashboard className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No applications yet</p>
              <p className="text-sm text-muted-foreground mt-2">Apply to drives to see them here</p>
            </CardContent>
          </Card>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow" data-testid={`application-card-${app.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="mb-1">{app.company_name}</CardTitle>
                    <CardDescription className="text-base font-medium text-foreground">
                      {app.job_role}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(app.status)}
                    <Badge variant={getStatusVariant(app.status)} data-testid={`status-badge-${app.id}`}>
                      {app.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Applied on: {new Date(app.applied_at).toLocaleDateString()}
                  </div>
                  {app.status === 'applied' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleWithdraw(app.id)}
                      data-testid={`withdraw-button-${app.id}`}
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      department: formData.department,
      batch: parseInt(formData.batch),
      cgpa: parseFloat(formData.cgpa),
      skills: formData.skills
    };

    try {
      await axios.put(`${API_URL}/profile`, payload);
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="profile-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">My Profile</h2>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} data-testid="edit-profile-button">
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Keep your profile updated to match with relevant opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    data-testid="email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    placeholder="e.g., Computer Science"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    data-testid="department-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch Year *</Label>
                  <Input
                    id="batch"
                    type="number"
                    placeholder="e.g., 2025"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    required
                    data-testid="batch-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cgpa">CGPA *</Label>
                  <Input
                    id="cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.cgpa}
                    onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                    required
                    data-testid="cgpa-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills *</Label>
                <div className="space-y-2">
                  {formData.skills?.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={skill}
                        onChange={(e) => {
                          const newSkills = [...formData.skills];
                          newSkills[index] = e.target.value;
                          setFormData({ ...formData, skills: newSkills });
                        }}
                        data-testid={`skill-input-${index}`}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newSkills = formData.skills.filter((_, i) => i !== index);
                          setFormData({ ...formData, skills: newSkills });
                        }}
                        data-testid={`remove-skill-${index}`}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, skills: [...(formData.skills || []), ''] })}
                    data-testid="add-skill-button"
                  >
                    Add Skill
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setFormData(profile);
                  }}
                  data-testid="cancel-button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} data-testid="save-profile-button">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="text-lg font-medium mt-1">{profile?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="text-lg font-medium mt-1">{profile?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="text-lg font-medium mt-1">{profile?.department || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Batch Year</Label>
                  <p className="text-lg font-medium mt-1">{profile?.batch || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">CGPA</Label>
                  <p className="text-lg font-medium mt-1 font-mono">{profile?.cgpa || 'Not set'}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile?.skills?.length > 0 ? (
                    profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No skills added</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await axios.put(`${API_URL}/notifications/${notifId}/read`);
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`);
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark all as read');
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
    <div className="space-y-6" data-testid="notifications-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Notifications</h2>
          <p className="text-muted-foreground">Stay updated with placement activities</p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button onClick={handleMarkAllAsRead} variant="outline" data-testid="mark-all-read-button">
            Mark All as Read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`cursor-pointer transition-all ${
                notif.read ? 'opacity-60' : 'border-primary/50 shadow-sm'
              }`}
              onClick={() => !notif.read && handleMarkAsRead(notif.id)}
              data-testid={`notification-${notif.id}`}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Bell className={`w-5 h-5 mt-1 ${notif.read ? 'text-muted-foreground' : 'text-primary'}`} />
                    <div className="flex-1">
                      <p className={notif.read ? 'text-muted-foreground' : 'font-medium'}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default function StudentDashboard() {
  const location = useLocation();
  const path = location.pathname;

  let activeTab = 'drives';
  if (path.includes('/applications')) {
    activeTab = 'applications';
  } else if (path.includes('/profile')) {
    activeTab = 'profile';
  } else if (path.includes('/notifications')) {
    activeTab = 'notifications';
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar active={activeTab} />
      <main className="flex-1 p-8">
        <Routes>
          <Route path="/" element={<AvailableDrives />} />
          <Route path="/applications" element={<MyApplications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </main>
    </div>
  );
}
