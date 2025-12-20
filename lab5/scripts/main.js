
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

  logToConsole() {
    console.group("Данные формы");
    console.log(this);
    console.groupEnd();
  }
}

function validateField(inputElement, validationFunction, errorMessage) {
  if (!inputElement) return false;

  const formField = inputElement.closest(".frog-form__field");
  if (!formField) return false;

  const hintId = `${inputElement.id}-hint`;
  let hintNode = formField.querySelector(`#${hintId}`);

  const valueForValidation =
    inputElement.type === "checkbox" ? inputElement.checked : inputElement.value;

  const isValid = validationFunction(valueForValidation);

  if (isValid) {
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

const isNameValid = (name) => name.trim().length >= 4;
const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isAgreeValid = (checked) => checked === true;

function initDynamicValidation(form) {
  const nameInput = form.querySelector("#name");
  const emailInput = form.querySelector("#email");
  const agreeInput = form.querySelector("#agree");

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      validateField(nameInput, isNameValid, "Имя должно содержать не менее 4 символов");
    });
  }

  if (emailInput) {
    emailInput.addEventListener("input", () => {
      validateField(emailInput, isEmailValid, "Введите корректный E-mail");
    });
  }

  if (agreeInput) {
    agreeInput.addEventListener("change", () => {
      validateField(agreeInput, isAgreeValid, "Необходимо согласие");
    });
  }
}

function validateForm(form) {
  const isNameOk = validateField(form.querySelector("#name"), isNameValid, "Имя должно содержать не менее 4 символов");
  const isEmailOk = validateField(form.querySelector("#email"), isEmailValid, "Введите корректный E-mail");
  const isAgreeOk = validateField(form.querySelector("#agree"), isAgreeValid, "Необходимо согласие");

  return isNameOk && isEmailOk && isAgreeOk;
}

function initFrogForm() {
  const form = document.querySelector("#frog-observation-form");
  if (!form) return;

  initDynamicValidation(form);
  const statusNode = form.querySelector(".frog-form__status");

  let statusTimerId = null;

  function clearStatus(ms) {
    if (!statusNode) return;

    if (statusTimerId) clearTimeout(statusTimerId);

    statusTimerId = setTimeout(() => {
      statusNode.textContent = "";
      statusNode.classList.remove("frog-form__status--visible", "frog-form__status--error");
      statusTimerId = null;
    }, ms);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm(form)) {
        if (statusNode) {
            statusNode.textContent = 'Исправьте ошибки в форме';
            statusNode.classList.add("frog-form__status--visible", "frog-form__status--error");
          
          clearStatus(10000);
        }
        return; 
    }

    if (statusNode) {
        statusNode.textContent = 'Отправка данных...';
        statusNode.classList.add("frog-form__status--visible");
        statusNode.classList.remove("frog-form__status--error");

      if (statusTimerId) {
        clearTimeout(statusTimerId);
        statusTimerId = null;
      }
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
        
        if (statusNode) {
            statusNode.textContent = 'Данные успешно сохранены';
            statusNode.classList.add("frog-form__status--visible");
            statusNode.classList.remove("frog-form__status--error");

          clearStatus(10000);
        }
        form.reset();
    } catch (error) {
        console.error("Ошибка при отправке:", error);
        if (statusNode) {
            statusNode.textContent = `Ошибка сервера: ${error.message}.`;
            statusNode.classList.add("frog-form__status--visible", "frog-form__status--error");
          
            clearStatus(15000);
        }
    }
  });
}

function setTableStatus(statusNode, text, { isError = false, showSpinner = false } = {}) {
  if (!statusNode) return;

  statusNode.classList.toggle("table-status--error", isError);

  statusNode.replaceChildren();

  if (showSpinner) {
    const spinner = document.createElement("span");
    spinner.className = "loader";
    spinner.setAttribute("aria-hidden", "true");
    statusNode.appendChild(spinner);
  }

  statusNode.appendChild(document.createTextNode(text));
}

function makeMessageRow({ text, withSpinner = false, isError = false }) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 5;
  td.className = "align-center";

  if (isError) td.classList.add("table-error")

  if (withSpinner) {
    const spinner = document.createElement("span");
    spinner.className = "loader";
    spinner.setAttribute("aria-hidden", "true");
    td.appendChild(spinner);
  }

  td.appendChild(document.createTextNode(text));
  tr.appendChild(td);
  return tr;
}

function makeFrogRow(frog) {
  const tr = document.createElement("tr");

  const td1 = document.createElement("td");
  td1.className = "align-left";

  const strong = document.createElement("strong");
  strong.textContent = frog.name;

  const em = document.createElement("em");
  em.textContent = frog.latinName;

  td1.appendChild(strong);
  td1.appendChild(document.createTextNode(" ("));
  td1.appendChild(em);
  td1.appendChild(document.createTextNode(")"));

  const td2 = document.createElement("td");
  td2.className = "align-right";
  td2.textContent = frog.size;

  const td3 = document.createElement("td");
  td3.className = "align-left";
  td3.textContent = frog.habitat;

  const td4 = document.createElement("td");
  td4.className = "align-left";
  td4.textContent = frog.area;

  const td5 = document.createElement("td");
  td5.className = "align-center";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = frog.status;
  td5.appendChild(tag);

  tr.append(td1, td2, td3, td4, td5);
  return tr;
}

async function fetchFrogData(targetSelector, { isInitial = false } = {}) {
  const tbody = document.querySelector(targetSelector);
  if (!tbody) return;

  const statusNode = document.querySelector("#frog-table-status");

  if (isInitial) {
    tbody.replaceChildren(
      makeMessageRow({ text: "Загрузка данных...", withSpinner: true })
    );
  } else {
    setTableStatus(statusNode, "Обновление...", { showSpinner: true });
  }

  tbody.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(`${SERVER_URL}/frogs`);
    if (!response.ok) {
      throw new Error(`Ошибка подключения: ${response.status}`);
    }

    const frogs = await response.json();

    if (!Array.isArray(frogs) || frogs.length === 0) {
      tbody.replaceChildren(
        makeMessageRow({ text: "Данные отсутствуют" })
      );
      setTableStatus(statusNode, "Данные отсутствуют");
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const frog of frogs) {
      fragment.appendChild(makeFrogRow(frog));
    }
    tbody.replaceChildren(fragment);

    const t = new Date().toLocaleTimeString();
    console.log(`[${t}] Данные таблицы обновлены.`);
    setTableStatus(statusNode, `Обновлено в ${t}`);
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);

    if (isInitial) {
      tbody.replaceChildren(
        makeMessageRow({
          text: `Ошибка подключения к серверу (${SERVER_URL}).`,
          isError: true
        })
      );
    }

    setTableStatus(statusNode, `Ошибка обновления: ${error.message}`, { isError: true });
  } finally {
    tbody.setAttribute("aria-busy", "false");
  }
}



function initPeriodicDataFetch(targetSelector, intervalMs) {
  if (!document.querySelector(targetSelector)) return;

  let isFirst = true;
  let inFlight = false;

  const tick = async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      await fetchFrogData(targetSelector, { isInitial: isFirst });
    } finally {
      inFlight = false;
      isFirst = false;
    }
  };

  tick();
  setInterval(tick, intervalMs);
}

document.addEventListener("DOMContentLoaded", () => {
  initFrogForm();
  
  initPeriodicDataFetch("#frog-data-tbody", 10000); 
});
