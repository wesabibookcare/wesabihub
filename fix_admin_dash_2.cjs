const fs = require('fs');

let file = 'src/pages/admin/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix brackets replacing
content = content.replace(/useState<any\[\]>\(\[\*\//g, "useState<any[]>([]);");
content = content.replace(/\}\], \[\*\//g, "}, []);");
content = content.replace(/\]\); \/\//g, "}); //");

// Replace fetchDashboardData
content = content.replace(/const fetchDashboardData = async \(\) => \{[\s\S]*?const handleSanitize/m,
`const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await analyticsService.getControlCenterDashboard().catch(err => {
        console.error("Dashboard core fetch failed", err);
        return null;
      });
      const { adminEngine } = require('../../engines/AdminEngine');
      const stats = await adminEngine.getDashboardStats();
      const recentNotifications = stats.notifications || [];
      const recentComplaints = stats.complaints || [];

      if (!dashboardData) {
        throw new Error("Unable to retrieve vital platform command statistics. Please check database permissions.");
      }
      setData(dashboardData);
      setNotifications(recentNotifications.slice(0, 5));
      setComplaints(recentComplaints);
    } catch (err: any) {
      console.error('Error loading operations data:', err);
      setError(err?.message || 'Failed to connect to the administration database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSanitize`);

fs.writeFileSync(file, content, 'utf8');
