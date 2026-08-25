import { useCallback, useEffect, useState } from 'react';
import { api, readError } from '../api/client.js';
import { EmptyState, ErrorAlert } from '../components/Layout.jsx';
import { ConfirmModal, Modal } from '../components/Modal.jsx';
import { TextField, TextAreaField } from '../components/Field.jsx';
import { useToast } from '../components/Toast.jsx';

const blank = { name: '', email: '', phone: '', notes: '' };

export function ClientsPage() {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // objeto ou 'novo'
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (term) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/clients', { params: term ? { q: term } : {} });
      setClients(data);
    } catch (err) {
      setError(readError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search, load]);

  const confirmRemove = async () => {
    setBusy(true);
    try {
      await api.delete(`/clients/${removing.id}`);
      toast.success(`${removing.name} foi removido.`);
      setRemoving(null);
      load(search.trim());
    } catch (err) {
      toast.error('Não foi possível remover.', readError(err).message);
      setRemoving(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clientes</h1>
          <p>O e-mail cadastrado aqui é para onde vai a confirmação de cada agendamento.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('novo')}>
          Novo cliente
        </button>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar por nome, e-mail ou telefone"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ maxWidth: 340 }}
          aria-label="Buscar cliente"
        />
      </div>

      <ErrorAlert message={error} />

      <div className="card">
        {loading ? (
          <div className="loading">Carregando clientes...</div>
        ) : clients.length === 0 ? (
          <EmptyState
            title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            message={
              search
                ? `Nada corresponde a "${search}". Tente outro termo.`
                : 'Cadastre o primeiro cliente para comecar a marcar horários.'
            }
            action={
              !search && (
                <button className="btn btn-primary" onClick={() => setEditing('novo')}>
                  Novo cliente
                </button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Observações</th>
                  <th className="num">Atendimentos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td><strong>{client.name}</strong></td>
                    <td>{client.email}</td>
                    <td>{client.phone || '—'}</td>
                    <td style={{ color: 'var(--muted)', maxWidth: 260 }}>
                      {client.notes || '—'}
                    </td>
                    <td className="num">{client.appointmentsCount ?? 0}</td>
                    <td className="cell-actions">
                      <button className="btn btn-quiet btn-sm" onClick={() => setEditing(client)}>
                        Editar
                      </button>
                      <button className="btn btn-quiet btn-sm" onClick={() => setRemoving(client)}>
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
        <ClientModal
          client={editing === 'novo' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load(search.trim());
          }}
        />
      )}

      {removing && (
        <ConfirmModal
          title="Remover cliente"
          message={`Remover ${removing.name} do cadastro? O histórico de atendimentos também sai da ficha.`}
          confirmLabel="Remover cliente"
          busy={busy}
          onConfirm={confirmRemove}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  );
}

function ClientModal({ client, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(
    client
      ? {
          name: client.name,
          email: client.email,
          phone: client.phone ?? '',
          notes: client.notes ?? '',
        }
      : blank
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      if (client) {
        await api.put(`/clients/${client.id}`, form);
        toast.success('Cliente atualizado.');
      } else {
        await api.post('/clients', form);
        toast.success('Cliente cadastrado.');
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
    <Modal title={client ? 'Editar cliente' : 'Novo cliente'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <ErrorAlert message={error} />

        <TextField
          label="Nome"
          value={form.name}
          onChange={set('name')}
          error={fieldErrors.name}
          required
        />
        <TextField
          label="E-mail"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={fieldErrors.email}
          hint="A confirmação do agendamento e enviada para este endereço."
          required
        />
        <TextField
          label="Telefone"
          value={form.phone}
          onChange={set('phone')}
          error={fieldErrors.phone}
          placeholder="(11) 90000-0000"
        />
        <TextAreaField
          label="Observações"
          value={form.notes}
          onChange={set('notes')}
          error={fieldErrors.notes}
          placeholder="Preferencias, alergias, tipo de corte de costume..."
        />

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Salvando...' : client ? 'Salvar alteracoes' : 'Cadastrar cliente'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
