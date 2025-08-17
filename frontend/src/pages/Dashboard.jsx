import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";
import TaskList from "../components/TaskList";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectsTotal, setProjectsTotal] = useState(0);

  const [tasks, setTasks] = useState([]);
  const [tasksTotal, setTasksTotal] = useState(0);

  const [events, setEvents] = useState([]);
  const [eventsTotal, setEventsTotal] = useState(0);

  const [error, setError] = useState("");
  const [taskFilter, setTaskFilter] = useState({ q: "", status: "" });

  const extractListAndTotal = (res) => {
    if (Array.isArray(res.data)) {
      return { items: res.data, total: res.data.length };
    }
    return {
      items: res.data?.data || [],
      total: res.data?.total ?? (res.data?.data?.length || 0),
    };
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [meRes, projRes, taskRes, eventRes] = await Promise.all([
          api.get("/user"),
          api.get("/projects"),
          api.get("/tasks?per_page=20"),
          api.get("/events?upcoming=1&limit=10")
        ]);

        setMe(meRes.data);

        const proj = extractListAndTotal(projRes);
        setProjects(proj.items);
        setProjectsTotal(proj.total);

        const task = extractListAndTotal(taskRes);
        setTasks(task.items);
        setTasksTotal(task.total);

        const ev = extractListAndTotal(eventRes);
        setEvents(ev.items);
        setEventsTotal(ev.total);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === "done").length,
    [tasks]
  );

  return (
    <div className="container py-4">
      {/* hero */}
      <div
        className="rounded-4 p-4 mb-4 text-white"
        style={{ background: "linear-gradient(135deg, #0d6efd, #6610f2)" }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h1 className="h3 mb-1">Welcome{me ? `, ${me.name}` : ""} 👋</h1>
            <p className="mb-0 opacity-75">
              Quick overview of your projects, tasks and upcoming events.
            </p>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">Loading…</div>
      ) : (
        <>
          {/* stats */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg-3">
              <StatCard title="Projects" value={projectsTotal} icon={"📁"} />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <StatCard title="Tasks" value={tasksTotal} icon={"✅"} />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <StatCard title="Upcoming events" value={eventsTotal} icon={"🗓️"} />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <StatCard title="Completed (shown)" value={completedCount} icon={"🏁"} />
            </div>
          </div>

          <div className="row g-4">
            {/* projects */}
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">Your projects</h5>
                    <span className="text-muted small">
                      Shown {Math.min(projects.length, 6)} / {projectsTotal}
                    </span>
                  </div>
                  {projects.length === 0 ? (
                    <div className="text-muted">No projects yet.</div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {projects.slice(0, 6).map((p) => (
                        <li key={p.id} className="list-group-item">
                          <div className="fw-semibold">{p.name}</div>
                          <div className="small text-muted text-truncate">
                            {p.description || "—"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* tasks (filtriranje je već u TaskList) */}
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">Your tasks</h5>
                    <span className="text-muted small">
                      Shown {tasks.length} / {tasksTotal}
                    </span>
                  </div>
                  <TaskList
                    tasks={tasks}
                    filter={taskFilter}
                    onFilterChange={setTaskFilter}
                  />
                </div>
              </div>
            </div>

            {/* events */}
            <div className="col-12">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">Upcoming events</h5>
                    <span className="text-muted small">
                      Shown {Math.min(events.length, 6)} / {eventsTotal}
                    </span>
                  </div>
                  {events.length === 0 ? (
                    <div className="text-muted">No upcoming events.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Project</th>
                            <th>Start</th>
                            <th>End</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.slice(0, 6).map((ev) => (
                            <tr key={ev.id}>
                              <td className="fw-semibold">{ev.title}</td>
                              <td>{ev.project?.name || "—"}</td>
                              <td>{ev.start_time ? new Date(ev.start_time).toLocaleString() : "—"}</td>
                              <td>{ev.end_time ? new Date(ev.end_time).toLocaleString() : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
