import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authMessage = document.getElementById('authMessage');
const tableWrap = document.getElementById('tableWrap');

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('refreshBtn').addEventListener('click', loadReservations);

async function login() {
  const email = document.getElementById('admin_email').value.trim();
  const password = document.getElementById('admin_password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authMessage.textContent = error.message;
    return;
  }

  authMessage.textContent = 'Logged in successfully.';
  await loadReservations();
}

async function logout() {
  await supabase.auth.signOut();
  authMessage.textContent = 'Logged out.';
  tableWrap.innerHTML = '';
}

async function loadReservations() {
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    authMessage.textContent = 'Please log in first.';
    return;
  }

  const { data, error } = await supabase
    .from('equipment_reservations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    tableWrap.innerHTML = `<p>Error loading reservations: ${error.message}</p>`;
    return;
  }

  renderTable(data || []);
}

function renderTable(rows) {
  if (!rows.length) {
    tableWrap.innerHTML = '<p>No reservations yet.</p>';
    return;
  }

  tableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Equipment</th>
          <th>Qty</th>
          <th>Date</th>
          <th>Time</th>
          <th>Purpose</th>
          <th>Status</th>
          <th>Remarks</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.id}</td>
            <td>${escapeHtml(r.full_name)}<br><small>${escapeHtml(r.section || '')}</small></td>
            <td>${escapeHtml(r.equipment)}</td>
            <td>${r.quantity}</td>
            <td>${r.date_needed}</td>
            <td>${r.time_start} - ${r.time_end}</td>
            <td>${escapeHtml(r.purpose || '')}</td>
            <td>
              <select data-id="${r.id}" class="statusSelect">
                ${['pending','approved','rejected','borrowed','returned'].map(s => `
                  <option value="${s}" ${r.status === s ? 'selected' : ''}>${s}</option>
                `).join('')}
              </select>
            </td>
            <td>
              <input data-id="${r.id}" class="remarksInput" value="${escapeAttr(r.remarks || '')}" />
            </td>
            <td>
              <button data-id="${r.id}" class="saveBtn">Save</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.querySelectorAll('.saveBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const status = document.querySelector(`.statusSelect[data-id="${id}"]`).value;
      const remarks = document.querySelector(`.remarksInput[data-id="${id}"]`).value;

      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('equipment_reservations')
        .update({
          status,
          remarks,
          updated_by: userData.user?.id || null
        })
        .eq('id', id);

      if (error) {
        alert(`Update failed: ${error.message}`);
        return;
      }

      alert('Updated successfully.');
      await loadReservations();
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

(async function init() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    authMessage.textContent = 'Session active.';
    loadReservations();
  }
})();