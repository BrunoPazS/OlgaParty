// Complementos de interação: exclusão deliberada e item cancelado.
const originalOpenEdit = window.openEdit;
window.openEdit = id => {
  originalOpenEdit(id);
  $('#deleteBtn').hidden = false;
};

$('#addBtn').onclick = () => {
  editId = null;
  selectedCategory = '';
  $('#deleteBtn').hidden = true;
  openModal();
};

$('#deleteBtn').onclick = () => {
  const item = items.find(x => x.id === editId);
  if (!item || !confirm(`Excluir “${item.title}”? Esta ação não pode ser desfeita.`)) return;
  items = items.filter(x => x.id !== editId);
  closeModal();
  save();
};
