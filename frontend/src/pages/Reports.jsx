import { useState, useEffect } from "react";
import { api } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { BarChart3, Users, Wrench, Thermometer, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#06b6d4", "#f97316", "#10b981", "#ef4444", "#8b5cf6"];

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [jobsByStatus, setJobsByStatus] = useState({});
  const [jobsByEngineer, setJobsByEngineer] = useState([]);
  const [pmDueList, setPmDueList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, statusRes, engineerRes, pmRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/reports/jobs-by-status"),
        api.get("/reports/jobs-by-engineer"),
        api.get("/reports/pm-due-list"),
      ]);
      setStats(statsRes.data);
      setJobsByStatus(statusRes.data);
      setJobsByEngineer(engineerRes.data);
      setPmDueList(pmRes.data);
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const statusData = Object.entries(jobsByStatus).map(([status, count]) => ({
    name: status.replace("_", " "),
    value: count,
  }));

  const engineerData = jobsByEngineer.map((item) => ({
    name: item.engineer_name,
    jobs: item.count,
  }));

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 heading">Reports</h1>
        <p className="text-slate-500 text-sm">Business insights and analytics</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Jobs</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.total_jobs || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-cyan-100">
                <Wrench className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed This Week</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.completed_this_week || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Customers</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.total_customers || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Assets Tracked</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.total_assets || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <Thermometer className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="heading flex items-center gap-2">
              <PieChart className="h-5 w-5 text-cyan-600" />
              Jobs by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                No job data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jobs by Engineer */}
        <Card>
          <CardHeader>
            <CardTitle className="heading flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-600" />
              Jobs by Engineer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {engineerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engineerData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="jobs" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                No engineer data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PM Due List */}
      <Card>
        <CardHeader>
          <CardTitle className="heading flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-amber-600" />
            PM Due List
            {pmDueList.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800 ml-2">{pmDueList.length} due</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pmDueList.length > 0 ? (
            <div className="space-y-3">
              {pmDueList.slice(0, 10).map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                  data-testid={`pm-due-item-${asset.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Thermometer className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-slate-900">{asset.name}</p>
                      <p className="text-sm text-slate-500">
                        {asset.site?.name || "Unknown site"} • {asset.make} {asset.model}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-amber-100 text-amber-800">PM Due</Badge>
                    <p className="text-xs text-slate-500 mt-1">{asset.next_pm_due?.split("T")[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Thermometer className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No PM currently due</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
