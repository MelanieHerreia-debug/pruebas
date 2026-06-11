import { useState, useEffect, useRef } from "react";
// 1. Importamos el generador de QR local
import { QRCodeSVG } from "qrcode.react";

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY CONSTANTS — Production values
// ═══════════════════════════════════════════════════════════════════════════════
const IP_UNIVERSIDAD     = "149.50.194.73";
const LAT_UNIVERSIDAD    = -0.199764;
const LON_UNIVERSIDAD    = -78.504938;
const RANGO_TOLERANCIA_M = 500;

// ═══════════════════════════════════════════════════════════════════════════════
// STATIC DATA
// ═══════════════════════════════════════════════════════════════════════════════
const PROFESSORS = [
  { id: "prof001", username: "melanie.docente",  password: "profe2026", name: "Dra. Melanie Ortiz",   dept: "Ingeniería de Sistemas" },
  { id: "prof002", username: "e.vasquez",         password: "profe2026", name: "Dr. Elena Vásquez",    dept: "Ingeniería de Sistemas" },
  { id: "prof003", username: "m.herrera",         password: "profe2026", name: "Dr. Marco Herrera",    dept: "Ciencias Exactas" },
];

const COURSES = [
  { id: "CS301",  name: "Estructuras de Datos",              credits: 4, schedule: "Lun/Mié 08:00–10:00" },
  { id: "CS405",  name: "Redes de Computadoras",             credits: 3, schedule: "Mar/Jue 10:00–12:00" },
  { id: "CS512",  name: "Inteligencia Artificial",           credits: 4, schedule: "Vie 14:00–18:00"    },
  { id: "MAT202", name: "Cálculo Diferencial",               credits: 3, schedule: "Lun/Mié/Vie 07:00–08:00" },
  { id: "CS220",  name: "Programación Orientada a Objetos",  credits: 3, schedule: "Mar/Jue 16:00–18:00" },
];

const MOCK_STUDENTS = [
  { id: "1725384910", name: "Carlos Mendoza",  sessions: { CS301: 14, CS405: 10, CS512: 9,  MAT202: 12, CS220: 13 } },
  { id: "1756294011", name: "Sofía Ramírez",   sessions: { CS301: 15, CS405: 14, CS512: 11, MAT202: 15, CS220: 15 } },
  { id: "1719384022", name: "Diego Fuentes",   sessions: { CS301: 8,  CS405: 7,  CS512: 6,  MAT202: 9,  CS220: 10 } },
  { id: "1728493011", name: "Valentina Cruz",  sessions: { CS301: 13, CS405: 12, CS512: 10, MAT202: 11, CS220: 14 } },
  { id: "1709483922", name: "Andrés Paredes",  sessions: { CS301: 5,  CS405: 6,  CS512: 4,  MAT202: 6,  CS220: 7  } },
  { id: "1759302944", name: "Isabella Torres", sessions: { CS301: 15, CS405: 13, CS512: 12, MAT202: 14, CS220: 15 } },
  { id: "1720394811", name: "Mateo Gómez",     sessions: { CS301: 11, CS405: 10, CS512: 9,  MAT202: 10, CS220: 12 } },
];

const TOTAL_SESSIONS = 16;

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
function haversineMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseQRParams() {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("materia") || params.get("course");
  const token    = params.get("token");
  return { courseId, token };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE SVG ICONS
// ═══════════════════════════════════════════════════════════════════════════════
const Icon = {
  Lock:       () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  User:       () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  QR:         () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 21h.01M21 14v.01M21 18v.01M21 21v.01"/></svg>,
  Wifi:       ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill={color||"currentColor"}/></svg>,
  MapPin:     ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Shield:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  ShieldOff:  () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"/><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Check:      () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Chart:      () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  Bell:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Play:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  PlusCircle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  AlertTri:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  X:          () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Refresh:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Logout:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

function Spinner({ size = 28, color = "#3b82f6" }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: size, height: size, border: `3px solid rgba(59,130,246,0.15)`, borderTopColor: color, borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
    </div>
  );
}

function useQRTimer(active, interval = 30) {
  const [token, setToken] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());
  const [secondsLeft, setSecondsLeft] = useState(interval);
  useEffect(() => {
    if (!active) return;
    const tick = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { setToken(Math.random().toString(36).slice(2, 10).toUpperCase()); return interval; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [active, interval]);
  return { token, secondsLeft };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANUAL ATTENDANCE MODAL (Módulo Emergencia)
// ═══════════════════════════════════════════════════════════════════════════════
function ManualModal({ courses, onSave, onClose }) {
  const [courseId,   setCourseId]   = useState(courses[0].id);
  const [studentId,  setStudentId]  = useState("");
  const [studentName,setStudentName]= useState("");
  const [reason,     setReason]     = useState("falla_tecnica");
  const [saving,     setSaving]     = useState(false);
  const [done,       setDone]       = useState(false);

  const handleSave = () => {
    if (!studentId.trim() || !studentName.trim()) return;
    setSaving(true);
    setTimeout(() => {
      onSave({
        studentId: studentId.trim(),
        studentName: studentName.trim(),
        courseId,
        date: new Date().toISOString(),
      });
      setSaving(false);
      setDone(true);
      setTimeout(onClose, 1200);
    }, 800);
  };

  return (
    <div style={s.modalOverlay}>
      <div style={s.modalCard}>
        <div style={s.modalHeader}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ color:"#f59e0b" }}><Icon.AlertTri /></div>
            <div>
              <div style={s.modalTitle}>Asistencia Manual — Emergencia</div>
              <div style={s.modalSub}>Registro directo por contingencia</div>
            </div>
          </div>
          <button style={s.modalClose} onClick={onClose}><Icon.X /></button>
        </div>

        {done ? (
          <div style={{ padding:"32px 24px", textAlign:"center" }}>
            <div style={{ fontSize:44, marginBottom:12 }}>✅</div>
            <div style={{ color:"#22c55e", fontWeight:700, fontSize:18 }}>Registro guardado</div>
          </div>
        ) : (
          <div style={{ padding:"24px" }}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Asignatura</label>
              <div style={s.selectWrapper}>
                <select style={s.select} value={courseId} onChange={e => setCourseId(e.target.value)}>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Número de Cédula *</label>
              <div style={s.inputWrapper}>
                <span style={s.inputIcon}><Icon.Lock /></span>
                <input style={s.input} placeholder="Ej. 1725384910" value={studentId} onChange={e => setStudentId(e.target.value)} />
              </div>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Nombre Completo *</label>
              <div style={s.inputWrapper}>
                <span style={s.inputIcon}><Icon.User /></span>
                <input style={s.input} placeholder="Nombres y Apellidos" value={studentName} onChange={e => setStudentName(e.target.value)} />
              </div>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Motivo de Contingencia</label>
              <div style={s.selectWrapper}>
                <select style={s.select} value={reason} onChange={e => setReason(e.target.value)}>
                  <option value="falla_tecnica">Falla de dispositivo móvil</option>
                  <option value="sin_gps">Error de geolocalización / GPS</option>
                  <option value="red_diferente">Inconveniente de red IP</option>
                </select>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:12 }}>
              <button style={{ ...s.ghostBtn, flex:1 }} onClick={onClose}>Cancelar</button>
              <button style={{ ...s.warningBtn, flex:2 }} onClick={handleSave} disabled={saving || !studentId.trim() || !studentName.trim()}>
                {saving ? <Spinner size={18} color="#000" /> : "Registrar Asistencia"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 1 — PROFESSOR LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = () => {
    setError("");
    if (!username || !password) { setError("Completa todos los campos."); return; }
    setLoading(true);
    setTimeout(() => {
      const prof = PROFESSORS.find(p => p.username === username.trim() && p.password === password);
      if (prof) { onLogin(prof); }
      else { setError("Usuario o contraseña incorrectos."); setLoading(false); }
    }, 1000);
  };

  return (
    <div style={s.loginBg}>
      <div style={s.gridOverlay} />
      <div style={s.glowOrb} />
      <div style={s.loginCard}>
        <div style={s.loginLogo}>
          <div style={s.logoMark}><Icon.QR /></div>
          <div>
            <div style={s.logoTitle}>AttendAI</div>
            <div style={s.logoSub}>Universidad Central del Ecuador</div>
          </div>
        </div>
        <div style={s.loginDivider} />
        <h2 style={s.loginHeading}>Acceso Docente</h2>
        <p style={s.loginSubheading}>Ingresa al portal de control de asistencia</p>

        {error && <div style={s.errorBanner}><span style={{ marginRight:8 }}><Icon.AlertTri /></span>{error}</div>}

        <div style={s.fieldGroup}>
          <label style={s.label}>Usuario Institucional</label>
          <div style={s.inputWrapper}>
            <span style={s.inputIcon}><Icon.User /></span>
            <input style={s.input} placeholder="melanie.docente" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
        </div>

        <div style={s.fieldGroup}>
          <label style={s.label}>Contraseña</label>
          <div style={s.inputWrapper}>
            <span style={s.inputIcon}><Icon.Lock /></span>
            <input style={s.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        </div>

        <button style={s.primaryBtn} onClick={handleSubmit} disabled={loading}>
          {loading ? <Spinner size={20} color="#fff" /> : "Iniciar Sesión"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 2 — PROFESSOR DASHBOARD (Renderizado local del QR corregido)
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardScreen({ professor, onLogout, attendanceLog, onManualSave, studentsList }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [classActive,    setClassActive]    = useState(false);
  const [showDashboard,  setShowDashboard]  = useState(false);
  const [showManual,     setShowManual]     = useState(false);
  const [courseFilter,   setCourseFilter]   = useState(COURSES[0].id);

  const { token, secondsLeft } = useQRTimer(classActive);
  const activeCourse = COURSES.find(c => c.id === selectedCourse);

  const baseUrl  = window.location.href.split("?")[0];
  // URL Dinámica y segura de la sesión
  const qrTarget = activeCourse ? `${baseUrl}?materia=${activeCourse.id}&token=${token}` : "";

  const logForCourse = attendanceLog.filter(r => r.courseId === courseFilter);
  const liveCountMap = {};
  logForCourse.forEach(r => { liveCountMap[r.studentId] = (liveCountMap[r.studentId] || 0) + 1; });

  const dashRows = studentsList.map(st => {
    const base  = st.sessions[courseFilter] || 0;
    const live  = liveCountMap[st.id] || 0;
    const total = base + live;
    const pct   = Math.round((total / TOTAL_SESSIONS) * 100);
    return { ...st, total, pct };
  }).sort((a, b) => b.pct - a.pct);

  return (
    <div style={s.dashBg}>
      <header style={s.navbar}>
        <div style={s.navBrand}>
          <div style={s.logoMarkSm}><Icon.QR /></div>
          <span style={s.navBrandText}>AttendAI</span>
          <span style={s.navBadge}>PANEL DOCENTE</span>
        </div>
        <div style={s.navRight}>
          <button style={{ ...s.navBtn, background: showDashboard ? "rgba(59,130,246,0.15)" : "transparent" }} onClick={() => setShowDashboard(!showDashboard)}>
            <Icon.Chart /><span style={{ marginLeft:6 }}>Dashboard</span>
          </button>
          <button style={{ ...s.navBtn, color:"#f59e0b" }} onClick={() => setShowManual(true)}>
            <Icon.AlertTri /><span style={{ marginLeft:6 }}>Asistencia Manual</span>
          </button>
          <button style={{ ...s.navBtn, color:"#ef4444" }} onClick={onLogout}><Icon.Logout /></button>
        </div>
      </header>

      <main style={s.dashMain}>
        {!showDashboard ? (
          <div style={s.qrLayout}>
            <div style={s.qrControls}>
              <div style={s.sectionTag}>CONTROL GENERAL</div>
              <h1 style={s.dashTitle}>Código QR de<br /><span style={s.titleAccent}>Asistencia</span></h1>
              <p style={s.dashSubtitle}>Elige la materia para habilitar el escaneo en tiempo real de los alumnos.</p>

              <div style={s.fieldGroup}>
                <label style={s.label}>Asignatura Activa</label>
                <div style={s.selectWrapper}>
                  <select style={s.select} value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setClassActive(false); }}>
                    <option value="">— Seleccionar materia —</option>
                    {COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {activeCourse && (
                <div style={s.courseCard}>
                  <div style={s.courseCardRow}><span>Horario:</span><strong>{activeCourse.schedule}</strong></div>
                  <div style={s.courseCardRow}><span>Docente:</span><strong>{professor.name}</strong></div>
                </div>
              )}

              <button style={{ ...s.startBtn, ...(classActive ? s.startBtnActive : {}) }} disabled={!selectedCourse} onClick={() => setClassActive(!classActive)}>
                {classActive ? "Detener Generación QR" : "Iniciar Clase / Generar QR"}
              </button>
            </div>

            <div style={s.qrDisplayArea}>
              {!classActive ? (
                <div style={s.qrPlaceholder}>
                  <Icon.QR />
                  <p style={{ color:"#475569", marginTop:16 }}>Inicia la clase para desplegar el código dinámico</p>
                </div>
              ) : (
                <div style={s.qrActiveCard}>
                  <div style={s.livePill}><div style={s.liveDot} />ESCANEO ACTIVO</div>
                  <div style={s.qrCourseName}>{activeCourse?.name}</div>
                  
                  {/* CONTENEDOR DEL QR CORREGIDO CON LA LIBRERÍA LOCAL */}
                  <div style={s.qrFrame}>
                    <QRCodeSVG
                      value={qrTarget}
                      size={240}
                      bgColor={"#040812"}
                      fgColor={"#60a5fa"}
                      level={"H"}
                      includeMargin={false}
                    />
                  </div>
                  
                  <div style={s.timerRow}>
                    <span style={{ fontSize:13, color:"#94a3b8" }}>Próxima rotación de token seguro en: <strong>{secondsLeft}s</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={s.reportPanel}>
            <div style={s.reportHeader}>
              <h2 style={s.reportTitle}>Dashboard de Control de <span style={s.titleAccent}>Asistencias</span></h2>
              <div>
                <select style={{ ...s.select, minWidth:200 }} value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
                  {COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr style={s.tableHead}>
                    <th style={s.th}>Cédula / ID</th>
                    <th style={s.th}>Estudiante</th>
                    <th style={s.th}>Asistencias</th>
                    <th style={s.th}>% de Asistencia</th>
                    <th style={s.th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {dashRows.map(row => (
                    <tr key={row.id} style={s.tr}>
                      <td style={s.td}><span style={s.idBadge}>{row.id}</span></td>
                      <td style={s.td}><strong style={{ color:"#f8fafc" }}>{row.name}</strong></td>
                      <td style={s.td}>{row.total} / {TOTAL_SESSIONS}</td>
                      <td style={s.td}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={s.progressTrack}>
                            <div style={{ ...s.progressFill, width: `${row.pct}%`, background: row.pct >= 75 ? "#22c55e" : "#ef4444" }} />
                          </div>
                          <span>{row.pct}%</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.statusPill, color: row.pct >= 75 ? "#22c55e" : "#ef4444" }}>
                          {row.pct >= 75 ? "Regular" : "Alerta Corto"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showManual && <ManualModal courses={COURSES} onClose={() => setShowManual(false)} onSave={onManualSave} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 3 — STUDENT SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 3 — STUDENT SCREEN (CORREGIDO: IP Ó LOCALIZACIÓN)
// ═══════════════════════════════════════════════════════════════════════════════
function StudentScreen({ courseId, token, onRegisterSuccess }) {
  const [step, setStep] = useState("validating");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [checked, setChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // Estado para guardar cómo se validó (IP o GPS) para el banner informativo
  const [validationMethod, setValidationMethod] = useState("");

  const courseObj = COURSES.find(c => c.id === courseId);

  useEffect(() => {
    // 1. Simulación de validación de IP institucional 
    // (Si estás en localhost toma la IP permitida para pruebas; si no, simula una externa)
    const userIP = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
      ? IP_UNIVERSIDAD 
      : "186.4.12.34"; 

    const isIpValid = userIP === IP_UNIVERSIDAD;

    // 2. Intentar obtener la Geolocalización (GPS)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const distancia = haversineMetros(pos.coords.latitude, pos.coords.longitude, LAT_UNIVERSIDAD, LON_UNIVERSIDAD);
          const isGpsValid = distancia <= RANGO_TOLERANCIA_M;

          // LÓGICA FLEXIBLE: Entra si la IP es correcta O si el GPS está en rango
          if (isIpValid || isGpsValid) {
            setValidationMethod(isGpsValid ? "GPS Campus UCE" : "Red IP Universitaria");
            setStep("form");
          } else {
            setStep("error");
            setErrorMsg(`Validación fallida: Te encuentras fuera del rango GPS del campus (${Math.round(distancia)}m) y conectado a una red externa.`);
          }
        },
        // Si el estudiante tiene el GPS apagado, no da permisos o el hardware falla:
        () => {
          // Si el GPS falló pero está conectado a la IP de la universidad, ¡lo dejamos pasar!
          if (isIpValid) {
            setValidationMethod("Red IP Universitaria (GPS no disponible)");
            setStep("form");
          } else {
            setStep("error");
            setErrorMsg("No se pudo acceder al GPS y tu dirección IP no pertenece a la Universidad.");
          }
        },
        { timeout: 6000 } // Espera máxima de respuesta del GPS
      );
    } else {
      // Si el navegador es antiguo y no soporta geolocalización, valida únicamente por IP
      if (isIpValid) {
        setValidationMethod("Red IP Universitaria");
        setStep("form");
      } else {
        setStep("error");
        setErrorMsg("El navegador no soporta geolocalización y tu IP no pertenece a la Universidad.");
      }
    }
  }, [courseId, token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentId.trim() || !studentName.trim() || !checked) return;

    onRegisterSuccess({
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      courseId: courseId,
      date: new Date().toISOString()
    });
    setStep("success");
  };

  return (
    <div style={s.studentBg}>
      <div style={s.gridOverlay} />
      <div style={s.studentCard}>
        
        {/* PASO 1: VALIDANDO ENTRADA */}
        {step === "validating" && (
          <div style={{ padding:"40px 24px", textAlign:"center" }}>
            <Spinner size={36} color="#60a5fa" />
            <h3 style={{ color:"#fff", marginTop:16 }}>Verificando Entorno de Seguridad</h3>
            <p style={{ color:"#475569", fontSize:13 }}>Validando red IP institucional o cercanía por GPS...</p>
          </div>
        )}

        {/* PASO 2: FORMULARIO AUTORIZADO */}
        {step === "form" && (
          <div style={s.formArea}>
            <div style={s.grantedBanner}>
              <span>✔ Acceso Autorizado mediante: <strong>{validationMethod}</strong>.</span>
            </div>
            <h3 style={{ color:"#fff", margin:0 }}>Formulario de Asistencia</h3>
            <p style={{ color:"#60a5fa", fontSize:14, marginBottom:20 }}>{courseObj?.name || courseId}</p>

            <form onSubmit={handleSubmit}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Número de Cédula</label>
                <div style={s.inputWrapper}>
                  <span style={s.inputIcon}><Icon.Lock /></span>
                  <input style={s.input} required placeholder="Ej. 1725384910" value={studentId} onChange={e => setStudentId(e.target.value)} />
                </div>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Nombre Completo</label>
                <div style={s.inputWrapper}>
                  <span style={s.inputIcon}><Icon.User /></span>
                  <input style={s.input} required placeholder="Nombres y Apellidos" value={studentName} onChange={e => setStudentName(e.target.value)} />
                </div>
              </div>

              <div style={{ margin:"16px 0", display:"flex", alignItems:"center", gap:8 }}>
                <input type="checkbox" id="checkAsis" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ transform:"scale(1.2)", accentColor:"#3b82f6" }} />
                <label htmlFor="checkAsis" style={{ color:"#94a3b8", fontSize:13, cursor:"pointer" }}>Registrar mi presencia en la clase de hoy</label>
              </div>

              <button type="submit" style={s.primaryBtn} disabled={!checked}>Enviar Registro de Asistencia</button>
            </form>
          </div>
        )}

        {/* PASO 3: REGISTRO EXITOSO */}
        {step === "success" && (
          <div style={s.successCard}>
            <div style={s.successCheck}><Icon.Check /></div>
            <h3 style={{ color:"#fff", margin:0 }}>¡Registro Exitoso!</h3>
            <p style={{ color:"#94a3b8", fontSize:13, marginTop:8 }}>Tu asistencia ha sido transmitida en tiempo real al panel del docente.</p>
          </div>
        )}

        {/* PASO 4: ERROR DE ENTORNO */}
        {step === "error" && (
          <div style={{ padding:"40px 24px", textAlign:"center" }}>
            <div style={{ color:"#ef4444", fontSize:40, marginBottom:10 }}>✕</div>
            <h3 style={{ color:"#fff", marginTop:12 }}>Error de Validación</h3>
            <p style={{ color:"#f87171", fontSize:14, lineHeight:"1.4" }}>{errorMsg}</p>
            <button style={{ ...s.ghostBtn, width:"100%", marginTop:20 }} onClick={() => window.location.reload()}>Reintentar Escaneo</button>
          </div>
        )}

      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ROOT APPLICATION
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [professor, setProfessor] = useState(null);
  const [attendanceLog, setAttendanceLog] = useState([]);

  // 1. EXTRAER PARAMETROS DEL QR DE LA URL
  const { courseId, token } = parseQRParams();

  // 2. ¡PRIMERA PRIORIDAD!: Si la URL tiene 'materia', es un alumno escaneando
  if (courseId) {
    return (
      <StudentScreen 
        courseId={courseId} 
        token={token} 
        onRegisterSuccess={(newRecord) => {
          // Aquí guardas el registro que viene del alumno
          setAttendanceLog(prev => [...prev, { ...newRecord, method: "qr" }]);
        }} 
      />
    );
  }

  // 3. SEGUNDA PRIORIDAD: Si no es alumno, procedemos con el flujo del docente
  if (!professor) {
    return <LoginScreen onLogin={(prof) => setProfessor(prof)} />;
  }

  // 4. Si el docente ya inició sesión, ve al Dashboard
  return (
    <DashboardScreen 
      professor={professor} 
      attendanceLog={attendanceLog}
      onLogout={() => setProfessor(null)}
      onManualSave={(record) => setAttendanceLog(prev => [...prev, record])}
    />
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// EXACT CSS STYLES PRESERVED FROM TXT (Ajustado qrFrame para centrado perfecto)
// ═══════════════════════════════════════════════════════════════════════════════
const s = {
  loginBg: { position:"relative", width:"100vw", height:"100vh", background:"#02040a", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", fontFamily:"system-ui, sans-serif" },
  dashBg: { position:"relative", width:"100vw", minHeight:"100vh", background:"#02040a", color:"#f8fafc", fontFamily:"system-ui, sans-serif" },
  studentBg: { position:"relative", width:"100vw", height:"100vh", background:"#02040a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui, sans-serif" },
  gridOverlay: { position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize:"24px 24px" },
  glowOrb: { position:"absolute", width:350, height:350, background:"radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)", top:"20%", left:"50%", transform:"translate(-50%, -50%)" },
  loginCard: { position:"relative", width:"100%", maxWidth:400, background:"rgba(10,15,30,0.75)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:32, backdropFilter:"blur(16px)" },
  studentCard: { position:"relative", width:"100%", maxWidth:420, background:"rgba(10,15,30,0.85)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:4, backdropFilter:"blur(20px)" },
  loginLogo: { display:"flex", alignItems:"center", gap:14 },
  logoMark: { width:44, height:44, borderRadius:10, background:"linear-gradient(135deg, #3b82f6, #1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" },
  logoMarkSm: { width:32, height:32, borderRadius:7, background:"linear-gradient(135deg, #3b82f6, #1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" },
  logoTitle: { color:"#fff", fontSize:20, fontWeight:800 },
  logoSub: { color:"#475569", fontSize:11, marginTop:2 },
  loginDivider: { height:1, background:"linear-gradient(90deg, rgba(255,255,255,0.06), transparent)", margin:"16px 0" },
  loginHeading: { color:"#fff", fontSize:22, margin:0 },
  loginSubheading: { color:"#475569", fontSize:13, marginTop:4, marginBottom:20 },
  navbar: { height:64, borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"between", padding:"0 24px", background:"rgba(2,4,10,0.8)", backdropFilter:"blur(12px)", justifyContent:"space-between" },
  navBrand: { display:"flex", alignItems:"center", gap:10 },
  navBrandText: { fontSize:18, fontWeight:800, color:"#fff" },
  navBadge: { background:"rgba(59,130,246,0.1)", color:"#60a5fa", fontSize:10, padding:"2px 6px", borderRadius:4 },
  navRight: { display:"flex", alignItems:"center", gap:12 },
  navBtn: { height:36, padding:"0 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.05)", background:"transparent", color:"#94a3b8", fontSize:13, display:"flex", alignItems:"center", gap:6, cursor:"pointer" },
  dashMain: { padding:24, maxWidth:1200, margin:"0 auto" },
  qrLayout: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 },
  qrControls: { background:"rgba(10,15,30,0.4)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:14, padding:24 },
  sectionTag: { color:"#3b82f6", fontSize:11, fontWeight:700 },
  dashTitle: { fontSize:28, fontWeight:800, color:"#fff", margin:"8px 0" },
  titleAccent: { background:"linear-gradient(90deg, #60a5fa, #a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" },
  dashSubtitle: { color:"#475569", fontSize:13, margin:"0 0 20px 0" },
  fieldGroup: { marginBottom:16 },
  label: { display:"block", color:"#94a3b8", fontSize:12, marginBottom:6 },
  inputWrapper: { position:"relative", display:"flex", alignItems:"center" },
  inputIcon: { position:"absolute", left:12, color:"#475569", display:"flex" },
  input: { width:"100%", height:40, background:"rgba(4,8,18,0.5)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"0 12px 0 36px", color:"#fff", outline:"none" },
  selectWrapper: { position:"relative" },
  select: { width:"100%", height:40, background:"rgba(4,8,18,0.5)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"0 12px", color:"#e2e8f0", outline:"none" },
  courseCard: { background:"rgba(4,8,18,0.4)", borderRadius:8, padding:12, marginBottom:16, border:"1px solid rgba(255,255,255,0.02)" },
  courseCardRow: { display:"flex", justifyContent:"space-between", fontSize:13, padding:"4px 0" },
  startBtn: { width:"100%", height:42, borderRadius:8, border:"none", background:"#3b82f6", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" },
  startBtnActive: { background:"#ef4444" },
  primaryBtn: { width:"100%", height:42, borderRadius:8, border:"none", background:"linear-gradient(135deg, #3b82f6, #1d4ed8)", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer" },
  ghostBtn: { height:40, borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", color:"#94a3b8", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 },
  warningBtn: { height:40, borderRadius:8, border:"none", background:"#f59e0b", color:"#02040a", fontWeight:700, cursor:"pointer" },
  errorBanner: { background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#f87171", padding:10, borderRadius:8, fontSize:13, display:"flex", alignItems:"center", marginBottom:16 },
  qrDisplayArea: { background:"rgba(10,15,30,0.25)", border:"1px solid rgba(255,255,255,0.03)", borderRadius:14, padding:24, display:"flex", alignItems:"center", justifyContent:"center", minHeight:360 },
  qrPlaceholder: { display:"flex", flexDirection:"column", alignItems:"center" },
  qrActiveCard: { width:"100%", maxWidth:320, textAlign:"center" },
  livePill: { display:"inline-flex", alignItems:"center", gap:6, background:"rgba(34,197,94,0.1)", color:"#22c55e", fontSize:10, padding:"3px 8px", borderRadius:20 },
  liveDot: { width:6, height:6, borderRadius:"50%", background:"#22c55e" },
  qrCourseName: { color:"#fff", fontSize:16, fontWeight:700, marginTop:10, marginBottom:16 },
  qrFrame: { display:"flex", alignItems:"center", justifyContent:"center", width:280, height:280, margin:"0 auto", background:"#040812", borderRadius:8 },
  timerRow: { marginTop:14 },
  reportPanel: { background:"rgba(10,15,30,0.3)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:14, padding:24 },
  reportHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 },
  reportTitle: { fontSize:20, fontWeight:800, color:"#fff", margin:0 },
  tableWrap: { overflowX:"auto" },
  table: { width:"100%", borderCollapse:"collapse", textAlign:"left" },
  tableHead: { borderBottom:"1px solid rgba(255,255,255,0.05)" },
  th: { padding:"12px", color:"#475569", fontSize:12, fontWeight:700 },
  tr: { borderBottom:"1px solid rgba(255,255,255,0.02)" },
  td: { padding:"12px", verticalAlign:"middle", color:"#94a3b8", fontSize:14 },
  idBadge: { fontFamily:"monospace", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", padding:"2px 6px", borderRadius:4 },
  progressTrack: { width:80, height:6, background:"rgba(255,255,255,0.05)", borderRadius:3, overflow:"hidden" },
  progressFill: { height:"100%" },
  statusPill: { fontWeight:600, fontSize:12 },
  modalOverlay: { position:"fixed", inset:0, background:"rgba(2,4,10,0.8)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 },
  modalCard: { width:"100%", maxWidth:440, background:"#0b101f", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, overflow:"hidden" },
  modalHeader: { padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center" },
  modalTitle: { color:"#fff", fontSize:15, fontWeight:700 },
  modalSub: { color:"#475569", fontSize:11 },
  modalClose: { background:"transparent", border:"none", color:"#475569", cursor:"pointer" },
  formArea: { padding:"24px" },
  grantedBanner: { background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:8, padding:10, color:"#22c55e", fontSize:12, marginBottom:16 },
  successCard: { padding:"32px 16px", textAlign:"center" },
  successCheck: { width:52, height:52, borderRadius:"50%", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", display:"flex", alignItems:"center", justifyContent:"center", color:"#22c55e", margin:"0 auto 12px" }
};
