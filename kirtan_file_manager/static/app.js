let files = [];
let mode = "create";
let editingName = null;

const modal = document.getElementById("modalBackdrop");
const nameInput = document.getElementById("fileName");
const contentInput = document.getElementById("fileContent");
const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const saveBtn = document.getElementById("saveBtn");

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

async function loadFiles() {
  try {
    files = await api("/api/files");
    document.getElementById("fileCount").textContent = files.length;
    renderFiles();
  } catch (err) {
    toast(err.message, true);
  }
}

function renderFiles() {
  const query = document.getElementById("searchInput").value.toLowerCase().trim();
  const list = document.getElementById("fileList");
  const filtered = files.filter(f => f.name.toLowerCase().includes(query));

  if (!filtered.length) {
    list.innerHTML = `<div class="empty"><strong>${query ? "No matching files" : "No files yet"}</strong><span>${query ? "Try another search." : "Create your first file to get started."}</span></div>`;
    return;
  }

  list.innerHTML = filtered.map(file => `
    <div class="file-row">
      <div class="file-info">
        <div class="file-icon">▤</div>
        <div>
          <div class="file-name">${escapeHtml(file.name)}</div>
          <div class="file-size">${formatBytes(file.size)}</div>
        </div>
      </div>
      <div class="actions">
        <button class="action" onclick="openFile('${encodeURIComponent(file.name)}')">Open</button>
        <button class="action" onclick="editFile('${encodeURIComponent(file.name)}')">Edit</button>
        <button class="action" onclick="downloadFile('${encodeURIComponent(file.name)}')">Download</button>
        <button class="action delete" onclick="deleteFile('${encodeURIComponent(file.name)}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function openCreateModal() {
  mode = "create";
  editingName = null;
  modalTitle.textContent = "Create new file";
  modalSubtitle.textContent = "Give your file a name and add its content.";
  saveBtn.textContent = "Create File";
  nameInput.value = "";
  nameInput.disabled = false;
  contentInput.value = "";
  modal.classList.remove("hidden");
  nameInput.focus();
}

async function editFile(encodedName) {
  const name = decodeURIComponent(encodedName);
  try {
    const data = await api(`/api/files/${encodeURIComponent(name)}`);
    mode = "edit";
    editingName = name;
    modalTitle.textContent = "Edit file";
    modalSubtitle.textContent = "Replace the current content with your new version.";
    saveBtn.textContent = "Save Changes";
    nameInput.value = name;
    nameInput.disabled = true;
    contentInput.value = data.content;
    modal.classList.remove("hidden");
    contentInput.focus();
  } catch (err) {
    toast(err.message, true);
  }
}

async function openFile(encodedName) {
  const name = decodeURIComponent(encodedName);
  try {
    const data = await api(`/api/files/${encodeURIComponent(name)}`);
    mode = "edit";
    editingName = name;
    modalTitle.textContent = `Open: ${name}`;
    modalSubtitle.textContent = "You can inspect and update the file content.";
    saveBtn.textContent = "Save Changes";
    nameInput.value = name;
    nameInput.disabled = true;
    contentInput.value = data.content;
    modal.classList.remove("hidden");
  } catch (err) {
    toast(err.message, true);
  }
}

async function saveFile() {
  const name = nameInput.value.trim();
  const content = contentInput.value;

  try {
    if (!name) throw new Error("Please enter a file name.");

    if (mode === "create") {
      await api("/api/files", {
        method: "POST",
        body: JSON.stringify({ name, content })
      });
      toast("File created successfully.");
    } else {
      await api(`/api/files/${encodeURIComponent(editingName)}`, {
        method: "PUT",
        body: JSON.stringify({ content })
      });
      toast("File updated successfully.");
    }

    closeModal();
    await loadFiles();
  } catch (err) {
    toast(err.message, true);
  }
}

async function deleteFile(encodedName) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

  try {
    await api(`/api/files/${encodeURIComponent(name)}`, { method: "DELETE" });
    toast("File deleted successfully.");
    await loadFiles();
  } catch (err) {
    toast(err.message, true);
  }
}

function downloadFile(encodedName) {
  const name = decodeURIComponent(encodedName);
  window.location.href = `/api/files/${encodeURIComponent(name)}/download`;
}

function closeModal() {
  modal.classList.add("hidden");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function toast(message, error = false) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = (error ? "⚠ " : "✓ ") + message;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

modal.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

loadFiles();
