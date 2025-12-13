
const SERVER_URL = "http://localhost:8000";

class FrogObservationFormData {
  constructor({ name, email, species, experience, attitude, agree, message }) {
    this.name = name;
    this.email = email;
    this.species = species;
    this.experience = experience;
    this.attitude = attitude;
    this.agree = agree;
    this.message = message;
    this.date = new Date().toISOString(); 
  }

  format() {
    return `Наблюдение от ${this.name} (${this.email}): Вид - ${this.species}`;
  }

  logToConsole() {
    console.group("Данные формы");
    console.log(this);
    console.groupEnd();
  }
}

function validateField(inputElement, validationFunction, errorMessage) {
  const formField = inputElement.closest(".frog-form__field");
  if (!formField) return;

  const hintId = `${inputElement.id}-hint`;
  let hintNode = formField.querySelector(`#${hintId}`);

  if (validationFunction(inputElement.value)) {
    formField.classList.remove("frog-form__field--invalid");
    if (hintNode) hintNode.remove();
    inputElement.setCustomValidity("");
    return true;
  } else {
    formField.classList.add("frog-form__field--invalid");
    inputElement.setCustomValidity(errorMessage);

    if (!hintNode) {
      hintNode = document.createElement("p");
      hintNode.id = hintId;
      hintNode.classList.add("frog-form__hint");
      hintNode.setAttribute("aria-live", "polite");
      formField.appendChild(hintNode);
    }
    hintNode.textContent = errorMessage;
    return false;
  }
}

const isNameValid = (name) => name.trim().length >= 2;
const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function initDynamicValidation(form) {
  const nameInput = form.querySelector("#name");
  const emailInput = form.querySelector("#email");

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      validateField(nameInput, isNameValid, "Имя должно содержать не менее 2 символов");
    });
  }
  if (emailInput) {
    emailInput.addEventListener("input", () => {
      validateField(emailInput, isEmailValid, "Введите корректный E-mail");
    });
  }
}

function validateForm(form) {
  const isNameOk = validateField(form.querySelector("#name"), isNameValid, "Имя должно содержать не менее 2 символов");
  const isEmailOk = validateField(form.querySelector("#email"), isEmailValid, "Введите корректный E-mail");
  const isAgreeChecked = form.querySelector("#agree").checked;

  const agreeField = form.querySelector("#agree").closest(".frog-form__field");
  if (!isAgreeChecked) {
      agreeField.classList.add("frog-form__field--invalid");
      form.querySelector("#agree").setCustomValidity("Необходимо согласие");
  } else {
      agreeField.classList.remove("frog-form__field--invalid");
      form.querySelector("#agree").setCustomValidity("");
  }

  return isNameOk && isEmailOk && isAgreeChecked;
}

function initFrogForm() {
  const form = document.querySelector("#frog-observation-form");
  if (!form) return;

  initDynamicValidation(form);
  const statusNode = form.querySelector(".frog-form__status");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm(form)) {
        if (statusNode) {
            statusNode.textContent = 'Исправьте ошибки в форме';
            statusNode.classList.add("frog-form__status--visible", "frog-form__status--error");
        }
        return; 
    }

    if (statusNode) {
        statusNode.textContent = 'Отправка данных...';
        statusNode.classList.add("frog-form__status--visible");
        statusNode.classList.remove("frog-form__status--error");
    }

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

    try {
        const response = await fetch(`${SERVER_URL}/observations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const result = await response.json();
        
        if (statusNode) {
            statusNode.textContent = 'Данные успешно сохранены';
            statusNode.classList.add("frog-form__status--visible");
            statusNode.classList.remove("frog-form__status--error");
        }
        form.reset(); 
    } catch (error) {
        console.error("Ошибка при отправке:", error);
        if (statusNode) {
            statusNode.textContent = `Ошибка сервера: ${error.message}. mock-server запущен?`;
            statusNode.classList.add("frog-form__status--visible", "frog-form__status--error");
        }
    }
  });
}

async function fetchFrogData(targetSelector) {
    const tbody = document.querySelector(targetSelector);
    if (!tbody) return;

    // tbody.style.opacity = '0.5'; 

    try {
        const response = await fetch(`${SERVER_URL}/frogs`);
        
        if (!response.ok) {
            throw new Error(`Ошибка подключения: ${response.status}`);
        }

        const frogs = await response.json();
        
        tbody.innerHTML = ''; 

        if (!Array.isArray(frogs) || frogs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="align-center">Данные отсутствуют</td></tr>';
            return;
        }

        frogs.forEach((frog, index) => {
            const row = tbody.insertRow();
            row.style.background = index % 2 !== 0 ? 'var(--color-back)' : '#fff'; 

            row.innerHTML = `
                <td class="align-left"><strong>${frog.name}</strong> (<em>${frog.latinName}</em>)</td>
                <td class="align-right">${frog.size}</td>
                <td class="align-left">${frog.habitat}</td>
                <td class="align-left">${frog.area}</td>
                <td class="align-center"><span class="tag">${frog.status}</span></td>
            `;
        });
        
        // tbody.style.opacity = '1';
        console.log(`[${new Date().toLocaleTimeString()}] Данные таблицы обновлены.`);

    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="align-center" style="color:red">
            Ошибка подключения к серверу (${SERVER_URL}).<br>mock-server запущен?.
        </td></tr>`;
    }
}

function initPeriodicDataFetch(targetSelector, intervalMs) {
    if (document.querySelector(targetSelector)) {
        fetchFrogData(targetSelector);
        setInterval(() => {
            fetchFrogData(targetSelector);
        }, intervalMs);
    }
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
  
  initPeriodicDataFetch("#frog-data-tbody", 300000); 
});
