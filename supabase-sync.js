// Conexão compartilhada da Festa da Olga — esta chave é pública por design.
// As regras no Supabase determinam quem pode realmente ler ou alterar dados.
const cloud = window.supabase.createClient(
  'https://wppofbdwmkmoqgxlljmn.supabase.co',
  'sb_publishable_sUQLzCH6gGX2fWF1xY9tEQ_PygncaDo'
);

const gate = document.querySelector('#authGate');
const message = document.querySelector('#authMessage');
let currentUser = null;

function showMessage(text, error = false) {
  message.textContent = text;
  message.className = `auth-message${error ? ' error' : ''}`;
}

async function loadSharedBoard() {
  const { data, error } = await cloud.from('party_boards').select('data').eq('id', 'olga').maybeSingle();
  if (error) return showMessage('Seu acesso ainda não foi autorizado. Confira o passo de segurança no Supabase.', true);
  if (data?.data?.length) {
    items = data.data;
    localStorage.setItem('olga-items', JSON.stringify(items));
  } else {
    const { error: createError } = await cloud.from('party_boards').upsert({ id: 'olga', data: items, updated_by: currentUser.id });
    if (createError) return showMessage('Não foi possível criar o planejamento compartilhado.', true);
  }
  renderAll();
  gate.classList.add('hidden');
  document.querySelector('#signOutBtn').hidden = false;
}

// Substitui o salvamento local pelo banco compartilhado, mantendo uma cópia local de segurança.
save = async function () {
  localStorage.setItem('olga-items', JSON.stringify(items));
  renderAll();
  if (!currentUser) return;
  const { error } = await cloud.from('party_boards').upsert({ id: 'olga', data: items, updated_by: currentUser.id });
  if (error) console.warn('Não foi possível sincronizar:', error.message);
};

cloud.auth.onAuthStateChange(async (_event, session) => {
  currentUser = session?.user || null;
  if (currentUser) await loadSharedBoard();
  else { gate.classList.remove('hidden'); document.querySelector('#signOutBtn').hidden = true; }
});

document.querySelector('#authForm').addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.querySelector('#authEmail').value.trim();
  const password = document.querySelector('#authPassword').value;
  showMessage('Entrando...');
  const { error } = await cloud.auth.signInWithPassword({ email, password });
  if (error) showMessage('E-mail ou senha não encontrados. Se for seu primeiro acesso, crie uma conta.', true);
});

document.querySelector('#signupBtn').addEventListener('click', async () => {
  const email = document.querySelector('#authEmail').value.trim();
  const password = document.querySelector('#authPassword').value;
  if (!email || password.length < 6) return showMessage('Informe seu e-mail e uma senha com pelo menos 6 caracteres.', true);
  showMessage('Criando acesso...');
  const { error } = await cloud.auth.signUp({ email, password, options: { emailRedirectTo: 'https://brunopazs.github.io/OlgaParty/' } });
  if (error) showMessage(error.message, true);
  else showMessage('Acesse o e-mail enviado pelo Supabase para confirmar sua conta.');
});

document.querySelector('#signOutBtn').addEventListener('click', () => cloud.auth.signOut());

cloud.channel('olga-party-board')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'party_boards', filter: 'id=eq.olga' }, payload => {
    if (payload.new?.data) { items = payload.new.data; localStorage.setItem('olga-items', JSON.stringify(items)); renderAll(); }
  }).subscribe();
