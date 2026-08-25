import { useCallback, useEffect, useState } from 'react';
import { api, readError } from '../api/client.js';
import { StatusPill } from '../components/StatusPill.jsx';
import { EmptyState, ErrorAlert } from '../components/Layout.jsx';
import { ConfirmModal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { AppointmentModal } from './AppointmentModal.jsx';
import { addDays, brl, longDate, relativeDayLabel, shortDate, today } from '../lib/format.js';

export function AgendaPage() {
  const toast = useToast();
  const [date, setDate] = useState(today());
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [agenda, week] = await Promise.all([
        api.get('/appointments', { params: { date } }),
        api.get('/appointments/summary', { params: { from: addDays(today(), -6), to: today() } }),
      ]);
      setAppointments(agenda.data);
      setSummary(week.data);
    } catch (err) {
      setError(readError(err).message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (appointment, status) => {
    try {
      const { data } = await api.patch(`/appointments/${appointment.id}/status`, { status });
      setAppointments((current) =>
        current.map((item) => (item.id === data.id ? data : item))
      );
      toast.success('Status atualizado.');
      api
        .get('/appointments/summary', { params: { from: addDays(today(), -6), to: today() } })
        .then(({ data: fresh }) => setSummary(fresh))
        .catch(() => {});
    } catch (err) {
      toast.error('Não foi possível mudar o status.', readError(err).message);
    }
  };

  const confirmRemove = async () => {
    setBusy(true);
    try {
      await api.delete(`/appointments/${removing.id}`);
      setRemoving(null);
      toast.success('Agendamento removido.');
      load();
    } catch (err) {
      toast.error('Não foi possível remover.', readError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const relative = relativeDayLabel(date);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Agenda</h1>
          <p>Os horários do dia, em ordem. Clique no status para atualizar o atendimento.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          Novo agendamento
        </button>
      </div>

      {summary && (
        <div className="stats">
          <div className="stat">
            <div className="k">Concluídos (7 dias)</div>
            <div className="v num">{summary.byStatus.CONCLUIDO}</div>
          </div>
          <div className="stat">
            <div className="k">Faturamento (7 dias)</div>
            <div className="v num">{brl(summary.revenueCents)}</div>
          </div>
          <div className="stat">
            <div className="k">Não compareceram</div>
            <div className="v num">{summary.byStatus.NAO_COMPARECEU}</div>
          </div>
          <div className="stat">
            <div className="k">Serviço mais pedido</div>
            <div className="v" style={{ fontSize: '1.05rem', paddingTop: 6 }}>
              {summary.topServices[0]?.name ?? '—'}
            </div>
            {summary.topServices[0] && (
              <div className="sub">{summary.topServices[0].total} atendimentos</div>
            )}
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="date-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => setDate(addDays(date, -1))}>
            &larr; Dia anterior
          </button>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-label="Escolher data da agenda"
          />
          <button className="btn btn-ghost btn-sm" onClick={() => setDate(addDays(date, 1))}>
            Próximo dia &rarr;
          </button>
          {date !== today() && (
            <button className="btn btn-quiet btn-sm" onClick={() => setDate(today())}>
              Voltar para hoje
            </button>
          )}
        </div>
      </div>

      <ErrorAlert message={error} />

      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <div className="day-label">
            {relative ? `${relative} — ` : ''}
            {longDate(date)} <span>({shortDate(date)})</span>
          </div>
        </div>

        {loading ? (
          <div className="loading">Carregando a agenda...</div>
        ) : appointments.length === 0 ? (
          <EmptyState
            title="Nenhum agendamento neste dia"
            message="A agenda está livre. Marque um horário para começar."
            action={
              <button className="btn btn-primary" onClick={() => setCreating(true)}>
                Novo agendamento
              </button>
            }
          />
        ) : (
          <div className="agenda">
            {appointments.map((appointment) => {
              const off =
                appointment.status === 'CANCELADO' ||
                appointment.status === 'NAO_COMPARECEU';

              return (
                <div className={`slot${off ? ' is-off' : ''}`} key={appointment.id}>
                  <div className="slot-time">
                    {appointment.when.time}
                    <small>{appointment.service.durationMin} MIN</small>
                  </div>

                  <div className="slot-who">
                    <strong>{appointment.client.name}</strong>
                    <span>
                      {appointment.service.name} · {brl(appointment.service.priceCents)}
                      {appointment.notes ? ` · ${appointment.notes}` : ''}
                    </span>
                  </div>

                  <div className="slot-actions">
                    <StatusPill
                      status={appointment.status}
                      onChange={(status) => changeStatus(appointment, status)}
                    />
                    <button
                      className="btn btn-quiet btn-sm"
                      onClick={() => setEditing(appointment)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-quiet btn-sm"
                      onClick={() => setRemoving(appointment)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {creating && (
        <AppointmentModal
          defaultDate={date}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}

      {editing && (
        <AppointmentModal
          appointment={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {removing && (
        <ConfirmModal
          title="Remover agendamento"
          message={`Remover o horário das ${removing.when.time} de ${removing.client.name}? Se o cliente apenas desmarcou, prefira mudar o status para "Cancelado" — assim o histórico e mantido.`}
          confirmLabel="Remover"
          busy={busy}
          onConfirm={confirmRemove}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  );
}
