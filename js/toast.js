// ================= TOAST =================
function showToast(message, success = true) {
  const toastEl = document.getElementById("liveToast");
  const toastBody = toastEl.querySelector(".toast-body");

  toastBody.textContent = message;

  toastEl.classList.remove("text-bg-success", "text-bg-danger");
  toastEl.classList.add(success ? "text-bg-success" : "text-bg-danger");

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
