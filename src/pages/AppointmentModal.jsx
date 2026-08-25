import { useEffect, useState } from 'react';
import { api, readError } from '../api/client.js';
import { Modal } from '../components/Modal.jsx';
import { SelectField, TextField, TextAreaField } from '../components/Field.jsx';
import { ErrorAlert } from '../components/Layout.jsx';
import { useToast } from '../components/Toast.jsx';
import { brl, STATUS, STATUS_KEYS } from '../lib/format.js';

const empty = { clientId: '', serviceId: '', date: '', time: '', notes: '', status: 'AGENDADO' };

export function AppointmentModal({ appointment, defaultDate, onClose, onSaved }) {
  const toast = useToast();
  const editing = Boolean(appointment);

  const [form, setForm] = useState(
    editing
      ? {
          clientId: appointment.client.id,
          serviceId: appointment.service.id,
          date: appointment.when.date,
          time: appointment.when.time,
          notes: appointment.notes ?? '',
          status: appointment.status,
        }
      : { ...empty, date: defaultDate }
  );

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    Promise.all([api.get('/clients'), api.get('/services')])
      .then(([clientsRes, servicesRes]) => {
        setClients(clientsRes.data);
        setServices(servicesRes.data);
      })
      .catch((err) => setError(readError(err).message))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});

    const payload = {
      clientId: form.clientId,
      serviceId: form.serviceId,
      date: form.date,
      time: form.time,
      notes: form.notes,
      ...(editing ? { status: form.status } : {}),
    };

    try {
      if (editing) {
        await api.put(`/appointments/${appointment.id}`, payload);
        toast.success('Agendamento atualizado.');
      } else {
        const { data } = await api.post('/appointments', payload);
        toast.success(
          'Agendamento criado.',
          `Confirmação enviada para ${data.client.email}.`
        );
      }
      onSaved();
    } catch (err) {
      const parsed = readError(err);
      // O 409 do banco aparece grudado no campo de horário, não num alerta solto.
      if (parsed.code === 'HORARIO_OCUPADO') {
        setFieldErrors({ time: parsed.message });
      } else {
        setError(parsed.message);
        setFieldErrors(parsed.fields);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={editing ? 'Editar agendamento' : 'Novo agendamento'} onClose={onClose}>
      {loading ? (
        <div className="loading">Carregando clientes e serviços...</div>
      ) : (
        <form onSubmit={submit} className="form-grid">
          <ErrorAlert message={error} />

          <SelectField
            label="Cliente"
            value={form.clientId}
            onChange={set('clientId')}
            error={fieldErrors.clientId}
            required
          >
            <option value="">Selecione o cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Serviço"
            value={form.serviceId}
            onChange={set('serviceId')}
            error={fieldErrors.serviceId}
            required
          >
            <option value="">Selecione o serviço</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} — {brl(service.priceCents)} ({service.durationMin} min)
              </option>
            ))}
          </SelectField>

          <div className="form-row">
            <TextField
              label="Data"
              type="date"
              value={form.date}
              onChange={set('date')}
              error={fieldErrors.date}
              required
            />
            <TextField
              label="Horário"
              type="time"
              step="900"
              value={form.time}
              onChange={set('time')}
              error={fieldErrors.time}
              required
            />
          </div>

          {editing && (
            <SelectField label="Status" value={form.status} onChange={set('status')}>
              {STATUS_KEYS.map((key) => (
                <option key={key} value={key}>
                  {STATUS[key].label}
                </option>
              ))}
            </SelectField>
          )}

          <TextAreaField
            label="Observações"
            value={form.notes}
            onChange={set('notes')}
            placeholder="Opcional — alguma preferência do cliente para este atendimento."
          />

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Salvando...' : editing ? 'Salvar alteracoes' : 'Criar agendamento'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
