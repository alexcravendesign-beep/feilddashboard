import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../App";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const priorityColors = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#3b82f6",
  low: "#64748b",
};

const Scheduler = () => {
  const [jobs, setJobs] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, engineersRes, customersRes, sitesRes] = await Promise.all([
        api.get("/jobs/scheduled"),
        api.get("/users/engineers"),
        api.get("/customers"),
        api.get("/sites"),
      ]);
      setJobs(jobsRes.data);
      setEngineers(engineersRes.data);
      setCustomers(customersRes.data);
      setSites(sitesRes.data);
    } catch (error) {
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const events = useMemo(() => {
    return jobs
      .filter((job) => job.scheduled_date)
      .map((job) => {
        const customer = customers.find((c) => c.id === job.customer_id);
        const engineer = engineers.find((e) => e.id === job.assigned_engineer_id);
        const startDate = new Date(job.scheduled_date);
        if (job.scheduled_time) {
          const [hours, minutes] = job.scheduled_time.split(":");
          startDate.setHours(parseInt(hours), parseInt(minutes));
        } else {
          startDate.setHours(9, 0);
        }
        const endDate = new Date(startDate.getTime() + (job.estimated_duration || 60) * 60000);

        return {
          id: job.id,
          title: `${job.job_number} - ${customer?.company_name || "Unknown"}`,
          start: startDate,
          end: endDate,
          resource: job,
          engineer: engineer?.name,
        };
      });
  }, [jobs, customers, engineers]);

  const handleSelectEvent = (event) => {
    setSelectedJob(event.resource);
    setDialogOpen(true);
  };

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const updateJobEngineer = async (jobId, engineerId) => {
    try {
      await api.put(`/jobs/${jobId}`, { assigned_engineer_id: engineerId || null });
      toast.success("Engineer updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update engineer");
    }
  };

  const eventStyleGetter = (event) => {
    const priority = event.resource?.priority || "medium";
    return {
      style: {
        backgroundColor: priorityColors[priority],
        borderRadius: "6px",
        border: "none",
        color: "white",
        fontSize: "12px",
        padding: "2px 6px",
      },
    };
  };

  const CustomToolbar = ({ label, onNavigate, onView, view }) => (
    <div className="flex items-center justify-between mb-4 p-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onNavigate("PREV")} data-testid="calendar-prev">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => onNavigate("NEXT")} data-testid="calendar-next">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => onNavigate("TODAY")} data-testid="calendar-today">
          Today
        </Button>
        <span className="text-lg font-semibold text-slate-900 ml-4">{label}</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant={view === "day" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("day")}
          className={view === "day" ? "bg-cyan-600" : ""}
          data-testid="view-day"
        >
          Day
        </Button>
        <Button
          variant={view === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("week")}
          className={view === "week" ? "bg-cyan-600" : ""}
          data-testid="view-week"
        >
          Week
        </Button>
        <Button
          variant={view === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("month")}
          className={view === "month" ? "bg-cyan-600" : ""}
          data-testid="view-month"
        >
          Month
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const site = selectedJob ? sites.find((s) => s.id === selectedJob.site_id) : null;
  const customer = selectedJob ? customers.find((c) => c.id === selectedJob.customer_id) : null;

  return (
    <div className="space-y-6" data-testid="scheduler-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 heading">Scheduler</h1>
        <p className="text-slate-500 text-sm">Manage job schedules and engineer assignments</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-500">Priority:</span>
        {Object.entries(priorityColors).map(([priority, color]) => (
          <div key={priority} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
            <span className="capitalize">{priority}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            views={["month", "week", "day"]}
            view={view}
            onView={setView}
            date={date}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomToolbar,
            }}
            selectable
            data-testid="calendar"
          />
        </CardContent>
      </Card>

      {/* Job Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="heading flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-cyan-600" />
              {selectedJob?.job_number}
            </DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-slate-500">Customer</p>
                <p className="font-medium">{customer?.company_name}</p>
              </div>
              {site && (
                <div>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Site
                  </p>
                  <p className="font-medium">{site.name}</p>
                  <p className="text-sm text-slate-600">{site.address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Date & Time
                  </p>
                  <p className="font-medium">{selectedJob.scheduled_date}</p>
                  {selectedJob.scheduled_time && <p className="text-sm">{selectedJob.scheduled_time}</p>}
                </div>
                <div>
                  <p className="text-sm text-slate-500">Duration</p>
                  <p className="font-medium">{selectedJob.estimated_duration} mins</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Description</p>
                <p className="text-slate-700">{selectedJob.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    selectedJob.priority === "urgent"
                      ? "bg-red-100 text-red-800"
                      : selectedJob.priority === "high"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-blue-100 text-blue-800"
                  }
                >
                  {selectedJob.priority}
                </Badge>
                <Badge variant="outline">{selectedJob.job_type?.replace("_", " ")}</Badge>
                <Badge
                  className={
                    selectedJob.status === "completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }
                >
                  {selectedJob.status?.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                  <User className="h-3 w-3" /> Assigned Engineer
                </p>
                <Select value={selectedJob.assigned_engineer_id || "unassigned"} onValueChange={(v) => updateJobEngineer(selectedJob.id, v === "unassigned" ? null : v)}>
                  <SelectTrigger data-testid="scheduler-engineer-select">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {engineers.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.open(`/jobs/${selectedJob.id}`, "_blank")}
                  data-testid="view-job-detail-btn"
                >
                  View Full Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scheduler;
