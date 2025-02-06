console.log("Content script loaded!");

let timeout;

function createLoader() {
  const loader = document.createElement("div");
  loader.classList.add("loader");

  loader.style.width = "30px"; 
  loader.style.height = "30px";
  loader.style.border = "4px solid transparent";
  loader.style.borderTop = "4px solid rgb(243, 141, 7)"; 
  loader.style.borderRadius = "50%";
  loader.style.animation = "spin 1.5s linear infinite"; 
  loader.style.pointerEvents = "none";

  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;
  document.head.appendChild(style);

  return loader;
}

const style = document.createElement("style");
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    33% { transform: rotate(120deg); }
    66% { transform: rotate(240deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

function createIntentionMarker() {
  console.log("Creating intention marker");
  const intention = document.createElement("div");
  intention.classList.add("intention-marker");

  intention.style.pointerEvents = "auto";

  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("icons/my-logo.png");
  img.alt = "Intention Icon";
  img.style.width = "20px";
  img.style.height = "20px";
  img.style.pointerEvents = "auto";

  img.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  img.addEventListener("click", (event) => {

    if (typeof chrome !== "undefined" && chrome.runtime) {
      console.log("Hello are we here?");
      chrome.runtime.sendMessage({ action: "openPopup" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError.message);
        } else {
          console.log("Message sent successfully.");
        }
      });
    } else {
      console.error("chrome.runtime is not available");
    }
  });

  intention.appendChild(img);
  intention.style.position = "absolute";
  intention.style.top = "50%";
  intention.style.transform = "translateY(-50%)";

  return intention;
}

function updateIconPosition(inputElement, icon) {
  const inputWidth = inputElement.offsetWidth;
  const paddingRight = 10;
  icon.style.right = `${paddingRight}px`;
}

function handleFocus(event) {
  const inputElement = event.target;
  if (
    !inputElement.matches(
      'textarea, input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="number"], input[type="tel"], input[type="url"], input[type="date"], input[type="time"], input[type="datetime-local"], [contenteditable="true"], .MuiInputBase-input'
    )
  ) {
    return;
  }
  if (!inputElement.dataset.hasIntention) {
    const intention = createIntentionMarker();
    const container = inputElement.closest("div") || inputElement.parentElement;
    if (container) {
      container.style.position = "relative";
      console.log("Appending marker to:", container);
      container.appendChild(intention);
      inputElement.dataset.hasIntention = "true";
      inputElement.intentionMarker = intention;

      updateIconPosition(inputElement, intention);
      window.addEventListener("resize", () =>
        updateIconPosition(inputElement, intention)
      );
    }
  }
}

function handleBlur(event) {
  const inputElement = event.target;
  if (
    !inputElement.matches(
      'textarea, input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="number"], input[type="tel"], input[type="url"], input[type="date"], input[type="time"], input[type="datetime-local"], [contenteditable="true"], .MuiInputBase-input'
    )
  ) {
    return;
  }
  const newFocusTarget = event.relatedTarget;
  if (
    newFocusTarget &&
    newFocusTarget.closest &&
    newFocusTarget.closest(".intention-marker")
  ) {
    return;
  }
  if (inputElement.dataset.hasIntention && inputElement.intentionMarker) {
    inputElement.intentionMarker.remove();
    delete inputElement.dataset.hasIntention;
    delete inputElement.intentionMarker;
  }
}

function attachListenersToFields() {
  document.addEventListener("focus", handleFocus, true);
  document.addEventListener("blur", handleBlur, true);
}

function observeForDynamicFields() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (
          node.nodeType === 1 && // Ensure it's an element
          (node.matches(
            'textarea, input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="number"], input[type="tel"], input[type="url"], input[type="date"], input[type="time"], input[type="datetime-local"], [contenteditable="true"], .MuiInputBase-input'
          ) ||
            node.querySelector(
              'textarea, input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="number"], input[type="tel"], input[type="url"], input[type="date"], input[type="time"], input[type="datetime-local"], [contenteditable="true"], .MuiInputBase-input'
            ))
        ) {
          attachListenersToFields();
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true, 
  });
}

window.addEventListener("load", () => {
  attachListenersToFields(); 
  observeForDynamicFields();
});

document.addEventListener(
  "input",
  (e) => {
    if (e.target.matches("textarea, input, [contenteditable='true']")) {
      console.log("[Content] Detected input change:", e.target.value);
      // handleInputChange(e);
      chrome.runtime.sendMessage(
        { action: "updatedText", text: e.target.value },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError.message);
          } else if (response && response.status) {
            console.log(
              "[Content] Message sent successfully:",
              response.status
            );
          } else {
            console.warn(
              "[Content] No response received from background script."
            );
          }
        }
      );
    }
  },
  true
);
let lastActiveField = null;

document.addEventListener("focus", (event) => {
  const inputElement = event.target;
  if (
    inputElement.matches(
      'textarea, input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="number"], input[type="tel"], input[type="url"], input[type="date"], input[type="time"], input[type="datetime-local"], [contenteditable="true"], .MuiInputBase-input'
    )
  ) {
    lastActiveField = inputElement;
  }
}, true);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "applyTranslatedText") {
    if (lastActiveField) {
      if (lastActiveField.value !== undefined) {
        lastActiveField.value = message.translatedText;
      } 
      else if (lastActiveField.isContentEditable) {
        lastActiveField.textContent = message.translatedText;
      }
    }
    sendResponse({ status: "Text applied successfully" });
  }
  return true;
});