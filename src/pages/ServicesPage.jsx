import { useCallback, useEffect, useState } from 'react';
import { api, readError } from '../api/client.js';
import { EmptyState, ErrorAlert } from '../components/Layout.jsx';
import { ConfirmModal, Modal } from '../components/Modal.jsx';
import { TextField } from '../components/Field.jsx';
import { useToast } from '../components/Toast.jsx';
import { brl } from '../lib/format.js';

export function ServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/services', { params: { includeInactive: 'true' } });
      setServices(data);
    } catch (err) {
      setError(readError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmRemove = async () => {
    setBusy(true);
    try {
      const { status } = await api.delete(`/services/${removing.id}`);
      toast.success(
        status === 200
          ? `${removing.name} foi desativado.`
          : `${removing.name} foi removido.`,
        status === 200
          ? 'O serviço tem histórico de atendimentos, então continua no sistema — só não aparece mais para novos agendamentos.'
          : undefined
      );
      setRemoving(null);
      load();
    } catch (err) {
      toast.error('Não foi possível remover.', readError(err).message);
      setRemoving(null);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (service) => {
    try {
      await api.put(`/services/${service.id}`, {
        name: service.name,
        durationMin: service.durationMin,
        priceCents: service.priceCents,
        active: !service.active,
      });
      toast.success(service.active ? 'Serviço desativado.' : 'Serviço reativado.');
      load();
    } catch (err) {
      toast.error('Não foi possível atualizar.', readError(err).message);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Serviços</h1>
          <p>O que a barbearia oferece. Serviços desativados somem da tela de agendamento.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('novo')}>
          Novo serviço
        </button>
      </div>

      <ErrorAlert message={error} />

      <div className="card">
        {loading ? (
          <div className="loading">Carregando serviços...</div>
        ) : services.length === 0 ? (
          <EmptyState
            title="Nenhum serviço cadastrado"
            message="Cadastre corte, barba e o que mais a barbearia oferecer."
            action={
              <button className="btn btn-primary" onClick={() => setEditing('novo')}>
                Novo serviço
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th className="num">Duração</th>
                  <th className="num">Preço</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} style={service.active ? undefined : { opacity: 0.6 }}>
                    <td><strong>{service.name}</strong></td>
                    <td className="num">{service.durationMin} min</td>
                    <td className="num">{brl(service.priceCents)}</td>
                    <td>
                      <span className={`pill pill-${service.active ? 'CONCLUIDO' : 'CANCELADO'}`}>
                        {service.active ? 'Ativo' : 'Desativado'}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <button className="btn btn-quiet btn-sm" onClick={() => setEditing(service)}>
                        Editar
                      </button>
                      <button className="btn btn-quiet btn-sm" onClick={() => toggleActive(service)}>
                        {service.active ? 'Desativar' : 'Reativar'}
                      </button>
                      <button className="btn btn-quiet btn-sm" onClick={() => setRemoving(service)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <ServiceModal
          service={editing === 'novo' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {removing && (
        <ConfirmModal
          title="Remover serviço"
          message={`Remover "${removing.name}"? Se ele já aparece em algum atendimento, será apenas desativado, para não apagar o histórico da agenda.`}
          confirmLabel="Remover serviço"
          busy={busy}
          onConfirm={confirmRemove}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  );
}

function ServiceModal({ service, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: service?.name ?? '',
    durationMin: service?.durationMin ?? 30,
    price: service ? (service.priceCents / 100).toFixed(2) : '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});

    const payload = {
      name: form.name,
      durationMin: Number(form.durationMin),
      priceCents: Math.round(Number(String(form.price).replace(',', '.')) * 100),
      active: service ? service.active : true,
    };

    try {
      if (service) {
        await api.put(`/services/${service.id}`, payload);
        toast.success('Serviço atualizado.');
      } else {
        await api.post('/services', payload);
        toast.success('Serviço cadastrado.');
      }
      onSaved();
    } catch (err) {
      const parsed = readError(err);
      setError(Object.keys(parsed.fields).length ? '' : parsed.message);
      setFieldErrors(parsed.fields);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={service ? 'Editar serviço' : 'Novo serviço'} onClose={onClose} maxWidth="450px">
      <form onSubmit={submit} className="form-grid">
        <ErrorAlert message={error} />

        <TextField
          label="Nome do serviço"
          value={form.name}
          onChange={set('name')}
          error={fieldErrors.name}
          placeholder="Corte + barba"
          required
        />

        <div className="form-row">
          <TextField
            label="Duração (minutos)"
            type="number"
            min="5"
            step="5"
            value={form.durationMin}
            onChange={set('durationMin')}
            error={fieldErrors.durationMin}
            required
          />
          <TextField
            label="Preço (R$)"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={set('price')}
            error={fieldErrors.priceCents}
            placeholder="75.00"
            required
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Salvando...' : service ? 'Salvar alteracoes' : 'Cadastrar serviço'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
