import { useState, useEffect, useRef } from "react";
// Importamos el generador de QR local
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
// MANUAL ATTENDANCE MODAL
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
// SCREEN 2 — PROFESSOR DASHBOARD
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
// SCREEN 3 — STUDENT SCREEN (VALIDACIÓN CORREGIDA: IP Ó LOCALIZACIÓN)
// ═══════════════════════════════════════════════════════════════════════════════
function StudentScreen({ courseId, token, onRegisterSuccess }) {
  const [step, setStep] = useState("validating");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [checked, setChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [validationMethod, setValidationMethod] = useState(""); // Indica qué método salvó la validación

  const courseObj = COURSES.find(c => c.id === courseId);

  useEffect(() => {
    // 1. Simulación de validación de IP (En producción puedes hacer un fetch a un servicio de IP)
    // Para entornos locales de prueba, simulamos un porcentaje alto de estar en la IP correcta,
    // o puedes cambiarlo temporalmente para forzar pruebas.
    const userIP = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
      ? IP_UNIVERSIDAD 
      : "186.4.12.34"; 

    const isIpValid = userIP === IP_UNIVERSIDAD;

    // Intentar geolocalización
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const distancia = haversineMetros(pos.coords.latitude, pos.coords.longitude, LAT_UNIVERSIDAD, LON_UNIVERSIDAD);
          const isGpsValid = distancia <= RANGO_TOLERANCIA_M;

          // LOGICA COMPARTIDA: IP Ó LOCALIZACIÓN (LÓGICA OR)
          if (isIpValid || isGpsValid) {
            setValidationMethod(isGpsValid ? "GPS Campus UCE" : "Red IP Universitaria");
            setStep("form");
          } else {
            setStep("error");
            setErrorMsg(`Validación fallida. Fuera de rango GPS (${Math.round(distancia)}m) y conectado desde una red IP externa.`);
          }
        },
        // Callback si falla el GPS (por permisos o hardware)
        () => {
          // Si el GPS falla, pero la IP es la correcta de la universidad, ¡deja pasar!
          if (isIpValid) {
            setValidationMethod("Red IP Universitaria (Permiso GPS omitido)");
            setStep("form");
          } else {
            setStep("error");
            setErrorMsg("No se pudo acceder al GPS y tu dirección IP no coincide con la red de la Universidad.");
          }
        },
        { timeout: 5000 }
      );
    } else {
      // Si el navegador viejo no tiene GPS, pero la IP es correcta:
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
        
        {step === "validating" && (
          <div style={{ padding:"40px 24px", textAlign:"center" }}>
            <Spinner size={36} color="#60a5fa" />
            <h3 style={{ color:"#fff", marginTop:16 }}>Verificando Entorno Seguro</h3>
            <p style={{ color:"#475569", fontSize:13 }}>Validando Coincidencia de IP institucional o cercanía por GPS...</p>
          </div>
        )}

        {step === "form" && (
          <div style={s.formArea}>
            <div style={s.grantedBanner}>
              <span>✔ Acceso Autorizado mediante: {validationMethod}.</span>
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

        {step === "success" && (
          <div style={s.successCard}>
            <div style={s.successCheck}><Icon.Check /></div>
            <h3 style={{ color:"#fff", margin:0 }}>¡Registro Exitoso!</h3>
            <p style={{ color:"#94a3b8", fontSize:13, marginTop:8 }}>Tu asistencia ha sido transmitida en tiempo real al panel del docente.</p>
          </div>
        )}

        {step === "error" && (
          <div style={{ padding:"40px 24px", textAlign:"center" }}>
            <div style
