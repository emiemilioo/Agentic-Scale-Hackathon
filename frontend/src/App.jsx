import { useEffect, useState } from "react";
import { AlertTriangle, Bot, Check, CircleDollarSign, Gauge, Send, ShieldCheck, Sparkles, WalletCards, X } from "lucide-react";
import { api } from "./api";

const example = "Gasté 25 dólares en comida ayer en Mi Comisariato";
const categories = ["Alimentación", "Transporte", "Vivienda", "Salud", "Educación", "Entretenimiento", "Servicios", "Otros"];

function MoneyCard({ label, value, icon: Icon, tone = "navy" }) {
  return (
    <article className={`money-card ${tone}`}>
      <div className="icon-wrap"><Icon size={20} /></div>
      <div><span>{label}</span><strong>{value}</strong></div>
    </article>
  );
}

function App() {
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState([]);
  const [summary, setSummary] = useState({ income: 1000, expenses: 0, balance: 1000, transaction_count: 0 });
  const [transactions, setTransactions] = useState([]);
  const [mode, setMode] = useState("Conectando...");
  const [budgets, setBudgets] = useState([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: "Alimentación", amount_limit: 100, threshold_pct: 80 });
  const [supportMessage, setSupportMessage] = useState("");
  const [supportResult, setSupportResult] = useState(null);
  const [ticketResult, setTicketResult] = useState(null);
  const [merchantCorrection, setMerchantCorrection] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const [summaryData, transactionData, health, budgetData] = await Promise.all([
      api.summary(), api.transactions(), api.health(), api.budgets(),
    ]);
    setSummary(summaryData);
    setTransactions(transactionData);
    setMode(health.agent_mode);
    setBudgets(budgetData);
  };

  useEffect(() => { refresh().catch(() => setMode("Backend desconectado")); }, []);

  const interpret = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    setLoading(true); setStatus("");
    try {
      const result = await api.interpret(message);
      setDraft(result.draft); setErrors(result.validation_errors); setMode(result.mode);
    } catch (error) { setStatus(error.message); }
    finally { setLoading(false); }
  };

  const confirm = async () => {
    setLoading(true);
    try {
      const result = await api.confirm(draft);
      setStatus(result.message); setDraft(null); setMessage(""); await refresh();
    } catch (error) { setStatus(error.message); }
    finally { setLoading(false); }
  };

  const completeCategory = (category) => {
    setDraft((current) => ({
      ...current,
      category,
      missing_fields: current.missing_fields.filter((field) => field !== "category"),
      requires_clarification: current.missing_fields.filter((field) => field !== "category").length > 0,
      clarification_question: null,
    }));
    setErrors((current) => current.filter((error) => !error.toLowerCase().includes("categoría")));
  };

  const completeMerchant = () => {
    const merchant = merchantCorrection.trim();
    if (merchant.length < 2) return;
    setDraft((current) => {
      const remaining = current.missing_fields.filter((field) => field !== "merchant");
      return {
        ...current,
        merchant,
        missing_fields: remaining,
        requires_clarification: remaining.length > 0,
        clarification_question: null,
      };
    });
    setErrors((current) => current.filter((error) => !error.toLowerCase().includes("comercio")));
    setMerchantCorrection("");
  };

  const saveBudget = async (event) => {
    event.preventDefault();
    const month = new Date().toISOString().slice(0, 7);
    try {
      const result = await api.saveBudget({ ...budgetForm, month });
      setStatus(result.message); setShowBudgetForm(false); await refresh();
    } catch (error) { setStatus(error.message); }
  };

  const askSupport = async (event) => {
    event.preventDefault();
    if (!supportMessage.trim()) return;
    try { setSupportResult(await api.support(supportMessage)); setTicketResult(null); }
    catch (error) { setStatus(error.message); }
  };

  const escalate = async () => {
    try {
      const ticket = await api.createTicket({
        case_type: supportResult.case_type,
        summary: supportMessage,
        history: `Usuario: ${supportMessage}\nAsistente: ${supportResult.answer}`,
        priority: supportResult.priority,
      });
      setTicketResult(ticket);
    } catch (error) { setStatus(error.message); }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">S</div><div><b>Saldo Claro</b><span>Finanzas que hablan contigo</span></div></div>
        <nav><button className="active"><Sparkles size={18}/> Mi espacio</button><button><WalletCards size={18}/> Presupuestos</button><button><ShieldCheck size={18}/> Soporte</button></nav>
        <div className="security-note"><ShieldCheck size={21}/><div><b>Acciones verificadas</b><span>La IA nunca guarda sin tu confirmación.</span></div></div>
      </aside>

      <main>
        <header><div><p className="eyebrow">BUEN DÍA, ANA</p><h1>Tu dinero, más claro.</h1><p>Registra un gasto como se lo contarías a una persona.</p></div><span className="mode"><span></span>{mode}</span></header>

        <section className="metrics">
          <MoneyCard label="Ingresos" value={`$${summary.income.toFixed(2)}`} icon={CircleDollarSign} tone="teal" />
          <MoneyCard label="Gastos" value={`$${summary.expenses.toFixed(2)}`} icon={WalletCards} tone="coral" />
          <MoneyCard label="Saldo disponible" value={`$${summary.balance.toFixed(2)}`} icon={ShieldCheck} />
        </section>

        <section className="workspace">
          <div className="chat-panel">
            <div className="panel-heading"><div><span className="bot-icon"><Bot size={20}/></span><div><h2>Agente financiero</h2><p>Entiendo lenguaje cotidiano y pregunto antes de actuar.</p></div></div></div>
            <div className="conversation">
              <div className="bubble agent">Hola, Ana. ¿Qué movimiento quieres registrar hoy?</div>
              {message && draft && <div className="bubble user">{message}</div>}
              {draft && <div className="draft-card">
                <div className="draft-title"><Sparkles size={17}/><b>Esto entendí</b><span>Borrador</span></div>
                <div className="draft-grid">
                  <div><small>Monto</small><strong>{draft.amount ? `$${draft.amount.toFixed(2)}` : "Falta"}</strong></div>
                  <div><small>Fecha</small><strong>{draft.date || "Falta"}</strong></div>
                  <div><small>Categoría</small><strong>{draft.category || "Falta"}</strong></div>
                  <div><small>Comercio</small><strong>{draft.merchant || "Falta"}</strong></div>
                </div>
                {draft.missing_fields.includes("category") && <div className="clarification-box">
                  <label htmlFor="category">{draft.clarification_question || "¿A qué categoría corresponde?"}</label>
                  <select id="category" defaultValue="" onChange={(event) => completeCategory(event.target.value)}>
                    <option value="" disabled>Selecciona una categoría</option>
                    {categories.map((category) => <option value={category} key={category}>{category}</option>)}
                  </select>
                </div>}
                {draft.missing_fields.includes("merchant") && <div className="clarification-box">
                  <label htmlFor="merchant">¿En qué comercio realizaste el gasto?</label>
                  <div className="correction-row">
                    <input id="merchant" value={merchantCorrection} onChange={(event) => setMerchantCorrection(event.target.value)} placeholder="Ejemplo: Tía" />
                    <button type="button" onClick={completeMerchant} disabled={merchantCorrection.trim().length < 2}>Aplicar</button>
                  </div>
                </div>}
                {errors.length > 0 && !draft.missing_fields.includes("category") && !draft.missing_fields.includes("merchant") && <div className="clarification">{errors[0]}</div>}
                {errors.length === 0 && <div className="draft-actions"><button className="confirm" onClick={confirm} disabled={loading}><Check size={17}/>Confirmar y registrar</button><button onClick={() => setDraft(null)}><X size={17}/>Cancelar</button></div>}
              </div>}
              {status && <div className="status-message">{status}</div>}
            </div>
            <form className="composer" onSubmit={interpret}>
              <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={example} />
              <button aria-label="Enviar" disabled={loading}><Send size={19}/></button>
            </form>
            <button className="example" onClick={() => setMessage(example)}>Usar mensaje de ejemplo</button>
          </div>

          <div className="activity-panel">
            <div className="activity-heading"><h2>Actividad reciente</h2><span>{summary.transaction_count} movimientos</span></div>
            {transactions.length === 0 ? <div className="empty"><WalletCards size={30}/><b>Aún no hay gastos</b><span>Confirma tu primer movimiento desde el chat.</span></div> : transactions.slice(0, 6).map((item) => <div className="transaction" key={item.id}><div className="merchant-avatar">{item.merchant[0]}</div><div><b>{item.merchant}</b><span>{item.category} · {item.transaction_date}</span></div><strong>-${item.amount.toFixed(2)}</strong></div>)}
          </div>
        </section>

        <section className="budget-section">
          <div className="section-title"><div><p className="eyebrow">CONTROL MENSUAL</p><h2>Presupuestos y alertas</h2></div><button onClick={() => setShowBudgetForm(!showBudgetForm)}>+ Crear presupuesto</button></div>
          {showBudgetForm && <form className="budget-form" onSubmit={saveBudget}>
            <label>Categoría<select value={budgetForm.category} onChange={(e) => setBudgetForm({...budgetForm, category: e.target.value})}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Límite mensual ($)<input type="number" min="1" step="0.01" value={budgetForm.amount_limit} onChange={(e) => setBudgetForm({...budgetForm, amount_limit: Number(e.target.value)})}/></label>
            <label>Alertar al (%)<input type="number" min="50" max="100" value={budgetForm.threshold_pct} onChange={(e) => setBudgetForm({...budgetForm, threshold_pct: Number(e.target.value)})}/></label>
            <button type="submit">Guardar presupuesto</button>
          </form>}
          {budgets.length === 0 ? <div className="budget-empty"><Gauge size={24}/><span>Crea un presupuesto para recibir alertas basadas en tus gastos reales.</span></div> : <div className="budget-grid">{budgets.map((budget) => <article className={`budget-card ${budget.status}`} key={budget.id}>
            <div className="budget-top"><div><b>{budget.category}</b><span>${budget.spent.toFixed(2)} de ${budget.amount_limit.toFixed(2)}</span></div>{budget.status !== "ok" && <AlertTriangle size={20}/>}</div>
            <div className="progress"><span style={{width: `${Math.min(budget.percentage, 100)}%`}}></span></div>
            <div className="budget-meta"><span>{budget.percentage}% utilizado</span><span>Alerta: {budget.threshold_pct}%</span></div>
            {budget.status === "warning" && <p className="budget-alert">Has usado ${budget.spent.toFixed(2)} de ${budget.amount_limit.toFixed(2)}. Superaste tu umbral de ${budget.threshold_amount.toFixed(2)}.</p>}
            {budget.status === "exceeded" && <p className="budget-alert">Excediste este presupuesto por ${(budget.spent - budget.amount_limit).toFixed(2)}.</p>}
          </article>)}</div>}
        </section>

        <section className="support-section">
          <div className="section-title"><div><p className="eyebrow">SOPORTE RESPONSABLE</p><h2>Centro de soporte</h2></div><span className="approved-badge"><ShieldCheck size={15}/>Base aprobada</span></div>
          <div className="support-layout">
            <form className="support-form" onSubmit={askSupport}>
              <label htmlFor="support-message">Pregunta sobre tu cuenta, procesos o documentos</label>
              <textarea id="support-message" value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder="Ejemplo: No reconozco una operación de $320 y quiero reclamar." />
              <div><button type="button" onClick={() => setSupportMessage("¿Qué documentos necesito para actualizar mis datos?")}>Pregunta informativa</button><button type="button" onClick={() => setSupportMessage("No reconozco una operación de $320 y quiero reclamar.")}>Caso sensible</button><button className="primary" type="submit">Consultar soporte</button></div>
            </form>
            <div className="support-response">
              {!supportResult && <div className="support-empty"><Bot size={26}/><span>La respuesta aparecerá aquí con su fuente o ruta de escalamiento.</span></div>}
              {supportResult && <>
                <div className={`intent ${supportResult.requires_human ? "sensitive" : "info"}`}>{supportResult.requires_human ? "Requiere atención humana" : "Consulta informativa"}</div>
                <p>{supportResult.answer}</p>
                {supportResult.sources.length > 0 && <small>Fuente: {supportResult.sources.join(", ")}</small>}
                {supportResult.requires_human && !ticketResult && <button className="escalate" onClick={escalate}>Crear ticket y transferir</button>}
                {ticketResult && <div className="ticket-success"><Check size={18}/><div><b>Ticket #{ticketResult.id} creado</b><span>Prioridad {ticketResult.priority} · Estado {ticketResult.status}</span></div></div>}
              </>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
