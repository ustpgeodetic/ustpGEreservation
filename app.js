import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('reservationForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  message.textContent = 'Submitting...';

  const payload = {
    full_name: document.getElementById('full_name').value.trim(),
    student_id: document.getElementById('student_id').value.trim(),
    section: document.getElementById('section').value.trim(),
    contact_number: document.getElementById('contact_number').value.trim(),
    email: document.getElementById('email').value.trim(),
    equipment: document.getElementById('equipment').value,
    quantity: Number(document.getElementById('quantity').value),
    date_needed: document.getElementById('date_needed').value,
    time_start: document.getElementById('time_start').value,
    time_end: document.getElementById('time_end').value,
    purpose: document.getElementById('purpose').value.trim(),
    status: 'pending'
  };

  if (payload.time_end <= payload.time_start) {
    message.textContent = 'End time must be later than start time.';
    return;
  }

  const { error } = await supabase
    .from('equipment_reservations')
    .insert([payload]);

  if (error) {
    console.error(error);
    message.textContent = `Error: ${error.message}`;
    return;
  }

  form.reset();
  document.getElementById('quantity').value = 1;
  message.textContent = 'Reservation submitted successfully.';
});