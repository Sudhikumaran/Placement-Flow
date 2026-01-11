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
  User, 
  Bell, 
  LogOut,
  Building2,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Upload,
  Edit,
  Users,
  FileText,
  Download,
  Plus,
  Trash2,
  X
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
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [filterLocation, setFilterLocation] = useState('');
  const [filterPackage, setFilterPackage] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');

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
      setSelectedDrive(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to apply');
    }
  };

  const appliedDriveIds = applications.map(app => app.drive_id);
  
  // Get unique locations for filter
  const locations = [...new Set(drives.map(d => d.location))];
  
  // Filter and sort drives
  const filteredDrives = drives
    .filter(drive => {
      const matchesSearch = drive.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drive.job_role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = !filterLocation || drive.location === filterLocation;
      
      let matchesPackage = true;
      if (filterPackage !== 'all') {
        const packageValue = parseFloat(drive.package.replace(/[^\d.]/g, ''));
        if (filterPackage === 'high') matchesPackage = packageValue >= 15;
        else if (filterPackage === 'medium') matchesPackage = packageValue >= 8 && packageValue < 15;
        else if (filterPackage === 'low') matchesPackage = packageValue < 8;
      }
      
      return matchesSearch && matchesLocation && matchesPackage;
    })
    .sort((a, b) => {
      if (sortBy === 'deadline') {
        return new Date(a.deadline) - new Date(b.deadline);
      } else if (sortBy === 'package') {
        return parseFloat(b.package.replace(/[^\d.]/g, '')) - parseFloat(a.package.replace(/[^\d.]/g, ''));
      } else if (sortBy === 'company') {
        return a.company_name.localeCompare(b.company_name);
      }
      return 0;
    });

  const appliedCount = applications.length;
  const availableCount = drives.length - appliedCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="available-drives">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Available Opportunities</h2>
          <p className="text-muted-foreground">Browse and apply to placement drives</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{availableCount}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{appliedCount}</p>
            <p className="text-xs text-muted-foreground">Applied</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
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

        <div className="flex flex-wrap gap-3">
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="">All Locations</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          <select
            value={filterPackage}
            onChange={(e) => setFilterPackage(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">All Packages</option>
            <option value="high">High (≥15 LPA)</option>
            <option value="medium">Medium (8-15 LPA)</option>
            <option value="low">Entry ({"<"}8 LPA)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="deadline">Sort by Deadline</option>
            <option value="package">Sort by Package</option>
            <option value="company">Sort by Company</option>
          </select>

          {(searchTerm || filterLocation || filterPackage !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterLocation('');
                setFilterPackage('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrives.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No drives match your filters</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLocation('');
                  setFilterPackage('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredDrives.map((drive) => {
            const hasApplied = appliedDriveIds.includes(drive.id);
            const daysUntilDeadline = Math.ceil((new Date(drive.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
            
            return (
              <Card 
                key={drive.id} 
                className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${isUrgent ? 'border-orange-500' : ''}`}
                onClick={() => setSelectedDrive(drive)}
                data-testid={`drive-card-${drive.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-col gap-1">
                      {hasApplied && (
                        <Badge variant="success" data-testid={`applied-badge-${drive.id}`}>
                          Applied
                        </Badge>
                      )}
                      {isUrgent && !hasApplied && (
                        <Badge variant="destructive" className="text-xs">
                          {daysUntilDeadline}d left
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="mb-1">{drive.company_name}</CardTitle>
                  <CardDescription className="text-base font-medium text-foreground">
                    {drive.job_role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600 font-bold text-lg">₹</span>
                      <span className="font-bold text-green-600">{drive.package}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{drive.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className={isUrgent ? 'text-orange-600 font-semibold' : ''}>
                        {new Date(drive.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {drive.job_description}
                  </p>

                  <Button
                    className="w-full rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      hasApplied ? setSelectedDrive(drive) : handleApply(drive.id);
                    }}
                    disabled={hasApplied}
                    data-testid={`apply-button-${drive.id}`}
                  >
                    {hasApplied ? 'View Details' : 'Apply Now'}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Drive Details Modal */}
      {selectedDrive && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDrive(null)}
        >
          <Card 
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={`https://logo.clearbit.com/${selectedDrive.company_domain}`}
                    alt={selectedDrive.company_name}
                    className="w-16 h-16 rounded-lg border border-border"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/64?text=' + selectedDrive.company_name[0];
                    }}
                  />
                  <div>
                    <CardTitle className="text-2xl">{selectedDrive.company_name}</CardTitle>
                    <CardDescription className="text-lg font-medium">
                      {selectedDrive.job_role}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDrive(null)}>
                  ✕
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-bold text-xl">₹</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Package</p>
                    <p className="font-bold text-green-600">{selectedDrive.package}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedDrive.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium">{new Date(selectedDrive.deadline).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={selectedDrive.status === 'active' ? 'success' : 'secondary'}>
                      {selectedDrive.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Job Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {selectedDrive.job_description}
                </p>
              </div>

              {!appliedDriveIds.includes(selectedDrive.id) && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleApply(selectedDrive.id)}
                >
                  Apply Now
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedApp, setSelectedApp] = useState(null);

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
      setSelectedApp(null);
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
        return 'default';
      case 'shortlisted':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'applied':
        return 'Your application is under review';
      case 'shortlisted':
        return 'Congratulations! You\'ve been shortlisted for the next round';
      case 'interview':
        return 'Interview scheduled - Check your email for details';
      case 'selected':
        return '🎉 Congratulations! You\'ve been selected';
      case 'rejected':
        return 'Better opportunities await you';
      case 'waitlisted':
        return 'You\'re on the waitlist - We\'ll update you soon';
      default:
        return 'Application status pending';
    }
  };

  // Filter and sort applications
  const filteredApplications = applications
    .filter(app => filterStatus === 'all' || app.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.applied_at) - new Date(a.applied_at);
      } else if (sortBy === 'oldest') {
        return new Date(a.applied_at) - new Date(b.applied_at);
      } else if (sortBy === 'company') {
        return a.company_name.localeCompare(b.company_name);
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  // Calculate statistics
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'applied').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    interview: applications.filter(a => a.status === 'interview').length,
    selected: applications.filter(a => a.status === 'selected').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    waitlisted: applications.filter(a => a.status === 'waitlisted').length
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

      {/* Statistics Cards */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </Card>
          <Card className="p-4 text-center bg-blue-50 dark:bg-blue-950/20">
            <p className="text-2xl font-bold text-blue-600">{stats.shortlisted}</p>
            <p className="text-xs text-muted-foreground">Shortlisted</p>
          </Card>
          <Card className="p-4 text-center bg-purple-50 dark:bg-purple-950/20">
            <p className="text-2xl font-bold text-purple-600">{stats.interview}</p>
            <p className="text-xs text-muted-foreground">Interview</p>
          </Card>
          <Card className="p-4 text-center bg-green-50 dark:bg-green-950/20">
            <p className="text-2xl font-bold text-green-600">{stats.selected}</p>
            <p className="text-xs text-muted-foreground">Selected</p>
          </Card>
          <Card className="p-4 text-center bg-orange-50 dark:bg-orange-950/20">
            <p className="text-2xl font-bold text-orange-600">{stats.waitlisted}</p>
            <p className="text-xs text-muted-foreground">Waitlisted</p>
          </Card>
          <Card className="p-4 text-center bg-red-50 dark:bg-red-950/20">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </Card>
        </div>
      )}

      {/* Filters and Sort */}
      {applications.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value="applied">Pending</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="selected">Selected</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="company">Company A-Z</option>
            <option value="status">By Status</option>
          </select>

          {filterStatus !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setFilterStatus('all')}>
              Clear Filter
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <LayoutDashboard className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No applications yet</p>
              <p className="text-sm text-muted-foreground mt-2">Apply to drives to see them here</p>
            </CardContent>
          </Card>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground">No applications with status: {filterStatus}</p>
              <Button variant="outline" className="mt-4" onClick={() => setFilterStatus('all')}>
                Show All
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((app) => {
            const daysSinceApplied = Math.floor((new Date() - new Date(app.applied_at)) / (1000 * 60 * 60 * 24));
            
            return (
              <Card 
                key={app.id} 
                className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => setSelectedApp(app)}
                data-testid={`application-card-${app.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{app.company_name}</CardTitle>
                        <Badge variant={getStatusVariant(app.status)} data-testid={`status-badge-${app.id}`}>
                          {getStatusIcon(app.status)}
                          <span className="ml-1 capitalize">{app.status}</span>
                        </Badge>
                      </div>
                      <CardDescription className="text-base font-medium text-foreground mb-2">
                        {app.job_role}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground italic">
                        {getStatusMessage(app.status)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Applied: </span>
                        <span className="font-medium">{new Date(app.applied_at).toLocaleDateString()}</span>
                        <span className="text-muted-foreground ml-2">({daysSinceApplied}d ago)</span>
                      </div>
                      {app.updated_at && app.updated_at !== app.applied_at && (
                        <div>
                          <span className="text-muted-foreground">Updated: </span>
                          <span className="font-medium">{new Date(app.updated_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                        }}
                      >
                        View Details
                      </Button>
                      {app.status === 'applied' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWithdraw(app.id);
                          }}
                          data-testid={`withdraw-button-${app.id}`}
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Application Details Modal */}
      {selectedApp && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedApp(null)}
        >
          <Card 
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <CardTitle className="text-2xl mb-2">{selectedApp.company_name}</CardTitle>
                  <CardDescription className="text-lg font-medium mb-3">
                    {selectedApp.job_role}
                  </CardDescription>
                  <Badge variant={getStatusVariant(selectedApp.status)} className="text-base py-1 px-3">
                    {getStatusIcon(selectedApp.status)}
                    <span className="ml-2 capitalize">{selectedApp.status}</span>
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedApp(null)}>
                  ✕
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Status Message</p>
                <p className="text-sm text-muted-foreground">{getStatusMessage(selectedApp.status)}</p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Timeline */}
              <div>
                <h3 className="font-semibold mb-4">Application Timeline</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      {selectedApp.status !== 'applied' && <div className="w-0.5 h-8 bg-border"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">Application Submitted</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedApp.applied_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {selectedApp.status !== 'applied' && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedApp.status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                          {selectedApp.status === 'rejected' ? 
                            <XCircle className="w-4 h-4 text-white" /> :
                            <Clock className="w-4 h-4 text-white" />
                          }
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">Status: {selectedApp.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedApp.updated_at ? new Date(selectedApp.updated_at).toLocaleString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedApp.status === 'applied' && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleWithdraw(selectedApp.id)}
                  >
                    Withdraw Application
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedApp(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      setProfile(response.data);
      setFormData({
        ...response.data,
        phone: response.data.phone || '',
        dob: response.data.dob || '',
        gender: response.data.gender || '',
        address: response.data.address || '',
        linkedin: response.data.linkedin || '',
        github: response.data.github || '',
        portfolio: response.data.portfolio || '',
        resume_link: response.data.resume_link || '',
        bio: response.data.bio || '',
        tenth_marks: response.data.tenth_marks || '',
        twelfth_marks: response.data.twelfth_marks || '',
        backlogs: response.data.backlogs || 0,
        languages: response.data.languages || [],
        certifications: response.data.certifications || [],
        projects: response.data.projects || []
      });
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompleteness = () => {
    if (!profile) return 0;
    const fields = [
      profile.name, profile.email, profile.department, profile.batch, profile.cgpa,
      profile.phone, profile.dob, profile.gender, profile.address, profile.bio,
      profile.linkedin, profile.github, profile.resume_link,
      profile.tenth_marks, profile.twelfth_marks,
      profile.skills?.length > 0, profile.languages?.length > 0,
      profile.certifications?.length > 0, profile.projects?.length > 0
    ];
    const completed = fields.filter(f => f && f !== '' && f !== 0).length;
    return Math.round((completed / fields.length) * 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      department: formData.department,
      batch: parseInt(formData.batch),
      cgpa: parseFloat(formData.cgpa),
      skills: formData.skills,
      phone: formData.phone,
      dob: formData.dob,
      gender: formData.gender,
      address: formData.address,
      linkedin: formData.linkedin,
      github: formData.github,
      portfolio: formData.portfolio,
      resume_link: formData.resume_link,
      bio: formData.bio,
      tenth_marks: formData.tenth_marks ? parseFloat(formData.tenth_marks) : null,
      twelfth_marks: formData.twelfth_marks ? parseFloat(formData.twelfth_marks) : null,
      backlogs: formData.backlogs ? parseInt(formData.backlogs) : 0,
      languages: formData.languages,
      certifications: formData.certifications,
      projects: formData.projects
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

  const completeness = calculateCompleteness();

  return (
    <div className="space-y-6" data-testid="profile-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">My Profile</h2>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} data-testid="edit-profile-button">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Completeness */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium">Profile Completeness</p>
              <p className="text-xs text-muted-foreground">Complete your profile to increase visibility</p>
            </div>
            <div className="text-2xl font-bold text-primary">{completeness}%</div>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Keep your profile updated to match with relevant opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
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
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                      data-testid="email-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      data-testid="phone-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      data-testid="dob-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      data-testid="gender-input"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Current Address</Label>
                    <Input
                      id="address"
                      placeholder="City, State, Country"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      data-testid="address-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">About Me</Label>
                  <Textarea
                    id="bio"
                    placeholder="Write a brief introduction about yourself..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    data-testid="bio-input"
                  />
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <select
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      required
                      data-testid="department-input"
                    >
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics and Communication">Electronics and Communication</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                      <option value="Biotechnology">Biotechnology</option>
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                      <option value="Data Science">Data Science</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch Year *</Label>
                    <select
                      id="batch"
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      required
                      data-testid="batch-input"
                    >
                      <option value="">Select Batch</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cgpa">Current CGPA *</Label>
                    <Input
                      id="cgpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g., 8.5"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      required
                      data-testid="cgpa-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backlogs">Active Backlogs</Label>
                    <Input
                      id="backlogs"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.backlogs}
                      onChange={(e) => setFormData({ ...formData, backlogs: e.target.value })}
                      data-testid="backlogs-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenth_marks">10th Grade Percentage</Label>
                    <Input
                      id="tenth_marks"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g., 95.5"
                      value={formData.tenth_marks}
                      onChange={(e) => setFormData({ ...formData, tenth_marks: e.target.value })}
                      data-testid="tenth-marks-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twelfth_marks">12th Grade Percentage</Label>
                    <Input
                      id="twelfth_marks"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g., 92.0"
                      value={formData.twelfth_marks}
                      onChange={(e) => setFormData({ ...formData, twelfth_marks: e.target.value })}
                      data-testid="twelfth-marks-input"
                    />
                  </div>
                </div>
              </div>

              {/* Skills & Languages */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Skills & Languages</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="skills">Technical Skills *</Label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          id="skill-input"
                          placeholder="Type a skill and press Enter"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = e.target.value.trim();
                              if (value && !formData.skills?.includes(value)) {
                                setFormData({ ...formData, skills: [...(formData.skills || []), value] });
                                e.target.value = '';
                              }
                            }
                          }}
                          data-testid="skill-input"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.getElementById('skill-input');
                            const value = input.value.trim();
                            if (value && !formData.skills?.includes(value)) {
                              setFormData({ ...formData, skills: [...(formData.skills || []), value] });
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills?.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="px-3 py-1 text-sm flex items-center gap-1"
                            data-testid={`skill-badge-${index}`}
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => {
                                const newSkills = formData.skills.filter((_, i) => i !== index);
                                setFormData({ ...formData, skills: newSkills });
                              }}
                              className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              data-testid={`remove-skill-${index}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      {(!formData.skills || formData.skills.length === 0) && (
                        <p className="text-sm text-muted-foreground">No skills added yet. Add skills like Python, JavaScript, React, etc.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="languages">Languages Known</Label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          id="language-input"
                          placeholder="Type a language and press Enter"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = e.target.value.trim();
                              if (value && !formData.languages?.includes(value)) {
                                setFormData({ ...formData, languages: [...(formData.languages || []), value] });
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.getElementById('language-input');
                            const value = input.value.trim();
                            if (value && !formData.languages?.includes(value)) {
                              setFormData({ ...formData, languages: [...(formData.languages || []), value] });
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.languages?.map((lang, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="px-3 py-1 text-sm flex items-center gap-1"
                          >
                            {lang}
                            <button
                              type="button"
                              onClick={() => {
                                const newLangs = formData.languages.filter((_, i) => i !== index);
                                setFormData({ ...formData, languages: newLangs });
                              }}
                              className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      {(!formData.languages || formData.languages.length === 0) && (
                        <p className="text-sm text-muted-foreground">No languages added yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Online Profiles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Online Profiles & Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      data-testid="linkedin-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub Profile</Label>
                    <Input
                      id="github"
                      type="url"
                      placeholder="https://github.com/yourusername"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      data-testid="github-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio Website</Label>
                    <Input
                      id="portfolio"
                      type="url"
                      placeholder="https://yourportfolio.com"
                      value={formData.portfolio}
                      onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                      data-testid="portfolio-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resume_link">Resume Link (Google Drive/Dropbox)</Label>
                    <Input
                      id="resume_link"
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={formData.resume_link}
                      onChange={(e) => setFormData({ ...formData, resume_link: e.target.value })}
                      data-testid="resume-link-input"
                    />
                  </div>
                </div>
              </div>

              {/* Projects */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Projects</h3>
                <div className="space-y-4">
                  {formData.projects?.map((project, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Project {index + 1}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newProjects = formData.projects.filter((_, i) => i !== index);
                              setFormData({ ...formData, projects: newProjects });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Project Title"
                          value={project.title || ''}
                          onChange={(e) => {
                            const newProjects = [...formData.projects];
                            newProjects[index] = { ...project, title: e.target.value };
                            setFormData({ ...formData, projects: newProjects });
                          }}
                        />
                        <Textarea
                          placeholder="Project Description"
                          value={project.description || ''}
                          onChange={(e) => {
                            const newProjects = [...formData.projects];
                            newProjects[index] = { ...project, description: e.target.value };
                            setFormData({ ...formData, projects: newProjects });
                          }}
                          rows={3}
                        />
                        <Input
                          placeholder="Project URL (optional)"
                          type="url"
                          value={project.url || ''}
                          onChange={(e) => {
                            const newProjects = [...formData.projects];
                            newProjects[index] = { ...project, url: e.target.value };
                            setFormData({ ...formData, projects: newProjects });
                          }}
                        />
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ 
                      ...formData, 
                      projects: [...(formData.projects || []), { title: '', description: '', url: '' }] 
                    })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </Button>
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Certifications</h3>
                <div className="space-y-2">
                  {formData.certifications?.map((cert, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={cert}
                        placeholder="e.g., AWS Certified Developer, Google Cloud Professional"
                        onChange={(e) => {
                          const newCerts = [...formData.certifications];
                          newCerts[index] = e.target.value;
                          setFormData({ ...formData, certifications: newCerts });
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newCerts = formData.certifications.filter((_, i) => i !== index);
                          setFormData({ ...formData, certifications: newCerts });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, certifications: [...(formData.certifications || []), ''] })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Certification
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
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
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-xs">Full Name</Label>
                    <p className="text-base font-medium mt-1">{profile?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <p className="text-base font-medium mt-1">{profile?.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Phone Number</Label>
                    <p className="text-base font-medium mt-1">{profile?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Date of Birth</Label>
                    <p className="text-base font-medium mt-1">
                      {profile?.dob ? new Date(profile.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Gender</Label>
                    <p className="text-base font-medium mt-1 capitalize">{profile?.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Address</Label>
                    <p className="text-base font-medium mt-1">{profile?.address || 'Not provided'}</p>
                  </div>
                </div>
                {profile?.bio && (
                  <div>
                    <Label className="text-muted-foreground text-xs">About Me</Label>
                    <p className="text-base mt-1 leading-relaxed text-muted-foreground">{profile.bio}</p>
                  </div>
                )}
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-xs">Department</Label>
                    <p className="text-base font-medium mt-1">{profile?.department || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Batch Year</Label>
                    <p className="text-base font-medium mt-1">{profile?.batch || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Current CGPA</Label>
                    <p className="text-base font-bold mt-1 font-mono text-primary">{profile?.cgpa || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">10th Grade %</Label>
                    <p className="text-base font-medium mt-1">{profile?.tenth_marks ? `${profile.tenth_marks}%` : 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">12th Grade %</Label>
                    <p className="text-base font-medium mt-1">{profile?.twelfth_marks ? `${profile.twelfth_marks}%` : 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Active Backlogs</Label>
                    <Badge variant={profile?.backlogs > 0 ? 'destructive' : 'success'} className="mt-1">
                      {profile?.backlogs || 0} Backlogs
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Skills & Languages */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Skills & Languages</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-xs mb-2 block">Technical Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile?.skills?.length > 0 ? (
                        profile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">{skill}</Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No skills added</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs mb-2 block">Languages Known</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile?.languages?.length > 0 ? (
                        profile.languages.map((lang, index) => (
                          <Badge key={index} variant="outline" className="text-sm">{lang}</Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No languages added</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Online Profiles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Online Profiles & Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile?.linkedin && (
                    <a 
                      href={profile.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">LinkedIn</p>
                        <p className="text-xs text-muted-foreground">View Profile →</p>
                      </div>
                    </a>
                  )}
                  {profile?.github && (
                    <a 
                      href={profile.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">GitHub</p>
                        <p className="text-xs text-muted-foreground">View Profile →</p>
                      </div>
                    </a>
                  )}
                  {profile?.portfolio && (
                    <a 
                      href={profile.portfolio} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Portfolio</p>
                        <p className="text-xs text-muted-foreground">View Website →</p>
                      </div>
                    </a>
                  )}
                  {profile?.resume_link && (
                    <a 
                      href={profile.resume_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Resume</p>
                        <p className="text-xs text-muted-foreground">Download →</p>
                      </div>
                    </a>
                  )}
                </div>
                {!profile?.linkedin && !profile?.github && !profile?.portfolio && !profile?.resume_link && (
                  <p className="text-muted-foreground text-sm">No links added yet</p>
                )}
              </div>

              {/* Projects */}
              {profile?.projects?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Projects</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {profile.projects.map((project, index) => (
                      <Card key={index} className="p-4">
                        <h4 className="font-semibold text-base mb-2">{project.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                        {project.url && (
                          <a 
                            href={project.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            View Project <FileText className="w-3 h-3" />
                          </a>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {profile?.certifications?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.certifications.map((cert, index) => (
                      <Badge key={index} variant="default" className="text-sm py-2 px-3">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
