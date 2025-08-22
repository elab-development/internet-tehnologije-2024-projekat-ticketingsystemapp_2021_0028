import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import useAuth from "../hooks/useAuth";


import { Doughnut, Bar, Line } from "react-chartjs-2";
import "chart.js/auto";

function Card({ title, right, children, className = "" }) {
  return (
    <div className={`card shadow-sm border-0 ${className}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="card-title mb-0">{title}</h5>
          {right}
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();

  
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [stats, setStats] = useState(null);            
  const [tasks, setTasks] = useState([]);              
  const [timeEntries, setTimeEntries] = useState([]);  
  const [hoursReport, setHoursReport] = useState([]);  
  const [projects, setProjects] = useState([]);        

  
  const [projectFilter, setProjectFilter] = useState("");

  
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr("");
      try {
        const [st, tk, pe, pr] = await Promise.allSettled([
          api.get("/statistics"),
          api.get("/tasks", { params: { per_page: 999 } }),
          api.get("/time-entries"),
          api.get("/report/hours"),
        ]);
        const pj = await api.get("/projects");

        if (cancelled) return;

        
        if (st.status === "fulfilled") setStats(st.value.data);
        
        if (tk.status === "fulfilled") {
          const arr = Array.isArray(tk.value.data) ? tk.value.data : (tk.value.data?.data || []);
          setTasks(arr);
        }
        
        if (pe.status === "fulfilled") setTimeEntries(pe.value.data || []);
        
        if (pr.status === "fulfilled") setHoursReport(pr.value.data || []);

        const projItems = Array.isArray(pj.data) ? pj.data : (pj.data?.data || []);
        setProjects(projItems);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load analytics data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const role = user?.role || "employee";
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isEmployee = role === "employee";

  
  const tasksForProjectFilter = useMemo(() => {
    if (!projectFilter) return tasks;
    return tasks.filter(t => String(t.project_id) === String(projectFilter));
  }, [tasks, projectFilter]);

  const statusCounts = useMemo(() => {
    
    
    const source = (isEmployee || !stats) ? tasksForProjectFilter : tasksForProjectFilter;
    const base = { todo: 0, in_progress: 0, done: 0 };
    for (const t of source) {
      if (t.status === "todo") base.todo++;
      else if (t.status === "in_progress") base.in_progress++;
      else if (t.status === "done") base.done++;
    }
    return base;
  }, [stats, tasksForProjectFilter, isEmployee]);

  const openTasksByProject = useMemo(() => {
    
    const map = new Map();
    for (const t of tasks) {
      if (t.status === "done") continue;
      const key = t.project?.name || `#${t.project_id}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    
    return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 12);
  }, [tasks]);

  const hoursByUser = useMemo(() => {
    
    
    let arr = hoursReport || [];
    if (isEmployee) {
      arr = arr.filter(r => String(r.user_id) === String(user?.id));
    }
    
    return [...arr].sort((a,b)=> (Number(b.total_hours||0) - Number(a.total_hours||0))).slice(0, 12);
  }, [hoursReport, isEmployee, user]);

  const hoursByProjectForMe = useMemo(() => {
    
    if (!isEmployee && !isAdmin) return [];
    const map = new Map();
    for (const te of timeEntries) {
      const pName = te.task?.project?.name || (te.task?.project_id ? `#${te.task.project_id}` : "N/A");
      map.set(pName, (map.get(pName) || 0) + Number(te.hours || 0));
    }
    return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 12);
  }, [timeEntries, isEmployee, isAdmin]);

  const hoursTrendForMe = useMemo(() => {
    
    if (!isEmployee && !isAdmin) return [];
    const map = new Map();
    for (const te of timeEntries) {
      const d = te.work_date; 
      map.set(d, (map.get(d) || 0) + Number(te.hours || 0));
    }
    const arr = [...map.entries()]
      .map(([d,h])=> [new Date(d), h])
      .sort((a,b)=> a[0]-b[0])
      .slice(-30); 
    return arr;
  }, [timeEntries, isEmployee, isAdmin]);

  
  const palette = {
    blue: "#0d6efd",
    blueSoft: "rgba(13,110,253,0.15)",
    green: "#198754",
    yellow: "#ffc107",
    gray: "#6c757d",
    graySoft: "rgba(108,117,125,0.15)",
    red: "#dc3545",
  };

  const doughnutStatusData = {
    labels: ["To do", "In progress", "Done"],
    datasets: [{
      data: [statusCounts.todo, statusCounts.in_progress, statusCounts.done],
      backgroundColor: [palette.gray, palette.yellow, palette.green],
      borderWidth: 0
    }]
  };

  const barOpenTasksData = {
    labels: openTasksByProject.map(([name]) => name),
    datasets: [{
      label: "Open tasks",
      data: openTasksByProject.map(([,cnt]) => cnt),
      backgroundColor: palette.blue,
      borderWidth: 0
    }]
  };

  const barHoursByUserData = {
    labels: hoursByUser.map(r => r.name || `User #${r.user_id}`),
    datasets: [{
      label: "Hours",
      data: hoursByUser.map(r => Number(r.total_hours || 0)),
      backgroundColor: palette.blue,
      borderWidth: 0
    }]
  };

  const barHoursByProjectForMeData = {
    labels: hoursByProjectForMe.map(([name]) => name),
    datasets: [{
      label: "My hours",
      data: hoursByProjectForMe.map(([,h]) => Number(h || 0)),
      backgroundColor: palette.blue,
      borderWidth: 0
    }]
  };

  const lineHoursTrendForMeData = {
    labels: hoursTrendForMe.map(([d]) => d.toISOString().slice(0,10)),
    datasets: [{
      label: "Hours / day",
      data: hoursTrendForMe.map(([,h]) => Number(h || 0)),
      fill: true,
      backgroundColor: palette.blueSoft,
      borderColor: palette.blue,
      tension: 0.25,
      pointRadius: 2
    }]
  };

  
  if (loading) return <div className="container py-4">Loading…</div>;
  if (err) return <div className="container py-4"><div className="alert alert-danger">{err}</div></div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Analytics & Reports</h3>

        {(isAdmin || isManager) && (
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              style={{ minWidth: 240 }}
              value={projectFilter}
              onChange={(e)=>setProjectFilter(e.target.value)}
              title="Focus project for some charts"
            >
              <option value="">All projects (visible to you)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ROW 1: status distribution + open tasks per project (manager/admin) OR my hours by project (employee) */}
      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <Card title="Task status distribution">
            { (statusCounts.todo + statusCounts.in_progress + statusCounts.done) === 0 ? (
              <div className="text-muted small">No tasks to display.</div>
            ) : (
              <div style={{maxWidth: 420, margin: "0 auto"}}>
                <Doughnut
                  data={doughnutStatusData}
                  options={{ plugins:{ legend:{ position:"bottom" }}}}
                />
              </div>
            )}
          </Card>
        </div>

        {isEmployee ? (
          <div className="col-12 col-lg-8">
            <Card title="My hours by project (last entries)">
              {hoursByProjectForMe.length === 0 ? (
                <div className="text-muted small">No time entries.</div>
              ) : (
                <div style={{height: 320}}>
                  <Bar
                    data={barHoursByProjectForMeData}
                    options={{
                      maintainAspectRatio: false,
                      scales: { y: { beginAtZero: true } },
                      plugins: { legend: { display:false } }
                    }}
                  />
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="col-12 col-lg-8">
            <Card title="Open tasks by project (top 12)">
              {openTasksByProject.length === 0 ? (
                <div className="text-muted small">No open tasks.</div>
              ) : (
                <div style={{height: 320}}>
                  <Bar
                    data={barOpenTasksData}
                    options={{
                      maintainAspectRatio: false,
                      indexAxis: "y",
                      scales: { x: { beginAtZero: true } },
                      plugins: { legend: { display:false } }
                    }}
                  />
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* ROW 2: hours by user (manager/admin) OR my hours trend (employee/admin) */}
      <div className="row g-3 mt-1">
        {(isAdmin || isManager) && (
          <div className="col-12 col-lg-7">
            <Card title="Hours by user (top 12)">
              {hoursByUser.length === 0 ? (
                <div className="text-muted small">No hours to show.</div>
              ) : (
                <div style={{height: 360}}>
                  <Bar
                    data={barHoursByUserData}
                    options={{
                      maintainAspectRatio: false,
                      indexAxis: "y",
                      scales: { x: { beginAtZero: true } },
                      plugins: { legend: { display:false } }
                    }}
                  />
                </div>
              )}
            </Card>
          </div>
        )}

        {(isEmployee || isAdmin) && (
          <div className={isAdmin || isManager ? "col-12 col-lg-5" : "col-12"}>
            <Card title={isEmployee ? "My hours trend (last ~30 days)" : "Hours trend"}>
              {hoursTrendForMe.length === 0 ? (
                <div className="text-muted small">No time entries to chart.</div>
              ) : (
                <div style={{height: 300}}>
                  <Line
                    data={lineHoursTrendForMeData}
                    options={{
                      maintainAspectRatio: false,
                      scales: { y: { beginAtZero: true } },
                      plugins: { legend: { display:false } }
                    }}
                  />
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
