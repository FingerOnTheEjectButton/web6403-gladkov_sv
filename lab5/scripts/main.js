
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

        await response.json();
        
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

async function fetchFrogData(targetSelector) {
    const tbody = document.querySelector(targetSelector);
    if (!tbody) return;

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

        frogs.forEach((frog) => {
            const row = tbody.insertRow();

            row.innerHTML = `
                <td class="align-left"><strong>${frog.name}</strong> (<em>${frog.latinName}</em>)</td>
                <td class="align-right">${frog.size}</td>
                <td class="align-left">${frog.habitat}</td>
                <td class="align-left">${frog.area}</td>
                <td class="align-center"><span class="tag">${frog.status}</span></td>
            `;
        });
        
        console.log(`[${new Date().toLocaleTimeString()}] Данные таблицы обновлены.`);

    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        tbody.innerHTML = `
            <tr><td colspan="5" class="align-center" style="color:red">
                Ошибка подключения к серверу (${SERVER_URL}).
            </td></tr>
        `;
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

document.addEventListener("DOMContentLoaded", () => {
  initFrogForm();
  
  initPeriodicDataFetch("#frog-data-tbody", 300000); 
});
