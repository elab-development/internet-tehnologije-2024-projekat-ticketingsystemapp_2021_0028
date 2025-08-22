import React from "react";
import { Link, useLocation } from "react-router-dom";


export default function Breadcrumbs({ trail }) {
  const location = useLocation();

  
  const autoTrail = React.useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const labelMap = {
      projects: "Projects",
      tasks: "Tasks",
      analytics: "Analytics",
      reports: "Reports",
      messages: "Messages",
      events: "Events",
      users: "Users",
    };

    const items = [];
    let acc = "";
    segments.forEach((seg, idx) => {
      acc += `/${seg}`;
      const isLast = idx === segments.length - 1;
      const isId = /^\d+$/.test(seg);
      const label = labelMap[seg] || (isId ? `#${seg}` : seg.replace(/-/g, " "));
      items.push({
        label,
        to: isLast ? undefined : acc,
      });
    });
    
    return items;
  }, [location.pathname]);

  const items = trail && trail.length ? trail : autoTrail;

  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb mb-2">
        {items.map((it, i) => {
          const isLast = i === items.length - 1;
          return (
            <li
              key={`${it.label}-${i}`}
              className={`breadcrumb-item ${isLast ? "active" : ""}`}
              aria-current={isLast ? "page" : undefined}
            >
              {isLast || !it.to ? (
                <span className="text-dark fw-semibold">{it.label}</span>
              ) : (
                <Link to={it.to} className="text-decoration-none">{it.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
