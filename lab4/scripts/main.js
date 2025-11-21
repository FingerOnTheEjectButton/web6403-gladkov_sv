class FrogObservationFormData {
  constructor({ name, email, species, experience, attitude, agree, message }) {
    this.name = name;
    this.email = email;
    this.species = species;
    this.experience = experience;
    this.attitude = attitude;
    this.agree = agree;
    this.message = message;
  }

  format() {
    const lines = [
      "=== Форма наблюдений за лягушками ===",
      `Имя: ${this.name || "—"}`,
      `E-mail: ${this.email || "—"}`,
      `Любимый вид: ${this.species || "—"}`,
      `Опыт: ${this.experience || "—"}`,
      `Отношение: ${this.attitude || "—"}`,
      `Согласие на обработку данных: ${this.agree ? "да" : "нет"}`,
      "Сообщение:",
      this.message || "—",
      "====================================="
    ];
    return lines.join("\n");
  }

  logToConsole() {
    console.group("Данные формы (Лягушки)");
    console.log(this.format());
    console.groupEnd();
  }
}

function initFrogForm() {
  const form = document.querySelector("#frog-observation-form");
  if (!form) return;

  const statusNode = form.querySelector(".frog-form__status");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = new FrogObservationFormData({
      name: (formData.get("name") || "").toString().trim(),
      email: (formData.get("email") || "").toString().trim(),
      species: (formData.get("species") || "").toString(),
      experience: (formData.get("experience") || "").toString(),
      attitude: (formData.get("attitude") || "").toString(),
      agree: formData.get("agree") === "on",
      message: (formData.get("message") || "").toString().trim()
    });

    data.logToConsole();

    if (statusNode) {
      statusNode.textContent =
        'Данные успешно "отправлены". Откройте консоль браузера (F12 → Console), чтобы увидеть результат.';
      statusNode.classList.add("frog-form__status--visible");
    }
  });
}

function initFrogModal() {
  const modal = document.querySelector("#frog-form-modal");
  if (!modal) return;

  const openButtons = document.querySelectorAll('[data-modal-open="frog-form-modal"]');
  const closeButtons = modal.querySelectorAll("[data-modal-close]");
  const backdrop = modal.querySelector(".modal__backdrop");

  let lastFocusedElement = null;

  const focusableSelectors =
    'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';
  let focusableElements = [];
  let firstFocusableEl = null;
  let lastFocusableEl = null;

  function setFocusableElements() {
    focusableElements = Array.from(modal.querySelectorAll(focusableSelectors));
    firstFocusableEl = focusableElements[0] || null;
    lastFocusableEl = focusableElements[focusableElements.length - 1] || null;
  }

  function openModal() {
    lastFocusedElement = document.activeElement;

    modal.classList.add("modal--open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");

    setFocusableElements();
    if (firstFocusableEl) {
      firstFocusableEl.focus();
    }
  }

  function closeModal() {
    modal.classList.remove("modal--open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  openButtons.forEach((btn) => {
    btn.addEventListener("click", openModal);
  });

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  if (backdrop) {
    backdrop.addEventListener("click", closeModal);
  }

  document.addEventListener("keydown", (event) => {
    if (!modal.classList.contains("modal--open")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key === "Tab") {
      if (focusableElements.length === 0) return;

      if (event.shiftKey) {
        if (document.activeElement === firstFocusableEl) {
          event.preventDefault();
          lastFocusableEl && lastFocusableEl.focus();
        }
      } else {
        if (document.activeElement === lastFocusableEl) {
          event.preventDefault();
          firstFocusableEl && firstFocusableEl.focus();
        }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initFrogModal();
  initFrogForm();
});
