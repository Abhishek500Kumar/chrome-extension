console.log("Content script loaded!");

let timeout;

function createLoader() {
  const loader = document.createElement("div");
  loader.classList.add("loader");

  // Style to create a beautiful circular indeterminate loader
  loader.style.width = "30px"; // Increase the size of the loader
  loader.style.height = "30px";
  loader.style.border = "4px solid transparent";
  loader.style.borderTop = "4px solid rgb(243, 141, 7)"; // Beautiful blue color
  loader.style.borderRadius = "50%";
  loader.style.animation = "spin 1.5s linear infinite"; // Set the time for continuous rotation
  loader.style.pointerEvents = "none";

  // Inject the keyframes animation into the document's head
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

// Add a keyframe animation for spinning 3 times
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

// Function to create the intention marker with an icon
function createIntentionMarker() {
  console.log("Creating intention marker");
  const intention = document.createElement("div");
  intention.classList.add("intention-marker");

  intention.style.pointerEvents = "auto";

  // Create an image element for the icon
  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("icons/my-logo.png"); // ✅ Use local image
  img.alt = "Intention Icon";
  img.style.width = "20px";
  img.style.height = "20px";

  // Also ensure the image can receive clicks:
  img.style.pointerEvents = "auto";

  img.addEventListener("mousedown", (event) => {
    // Prevent the input from losing focus
    event.preventDefault();
    // Do NOT stopPropagation here, so the click can still happen
  });

  img.addEventListener("click", (event) => {
    console.log("Icon clicked!");

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

  // Append the image to the marker
  intention.appendChild(img);

  // Style the intention marker
  intention.style.position = "absolute";
  intention.style.top = "50%";
  intention.style.transform = "translateY(-50%)";

  return intention;
}

// Adjust icon position dynamically
function updateIconPosition(inputElement, icon) {
  const inputWidth = inputElement.offsetWidth;
  const paddingRight = 10; // Space between text and icon
  icon.style.right = `${paddingRight}px`;
}

function handleInputChange(event) {
  const inputElement = event.target;
  console.log("inputElement", inputElement);

  // Hide the intention marker when loader is shown
  if (inputElement.intentionMarker) {
    inputElement.intentionMarker.style.display = "none"; // Hide intention marker
  }

  // Remove any existing loader before adding a new one
  const parentDiv = inputElement.parentElement;
  console.log("parentDiv", parentDiv);
  const loaderDivs = parentDiv.querySelectorAll("div.loader");
  console.log("inside the loaderDivs", loaderDivs);
  loaderDivs.forEach(function (loaderDiv) {
    loaderDiv.remove();
  });
  const loader = createLoader();
  console.log("loader", loader);

  // Ensure the parent container is relative
  const container = inputElement.closest("div") || inputElement.parentElement;
  if (container) {
    console.log("container inside the handleInput", container);

    container.style.position = "relative"; // Ensure relative positioning
    container.appendChild(loader); // Add the loader to the container
  }
  console.log("after add the container", container);

  // Clear the previous timeout to reset loader visibility
  clearTimeout(timeout);

  // Set timeout to remove loader and restore intention marker after 3 rotations (4.5s)
  timeout = setTimeout(() => {
    const parentDiv = inputElement.parentElement;
    console.log("parentDiv", parentDiv);
    const loaderDivs = parentDiv.querySelectorAll("div.loader");
    console.log("inside the loaderDivs", loaderDivs);
    loaderDivs.forEach(function (loaderDiv) {
      loaderDiv.remove();
    });

    // Show the intention marker again after loader disappears
    if (inputElement.intentionMarker) {
      inputElement.intentionMarker.style.display = "block"; // Show intention marker again
    }
  }, 4500); // 4.5s duration for 3 rotations (1.5s * 3)
}

// Add intention marker when a field is focused
function handleFocus(event) {
  const inputElement = event.target;

  // Ensure the element is a valid input or contenteditable
  if (
    !inputElement.matches(
      'textarea, input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="number"], input[type="tel"], input[type="url"], input[type="date"], input[type="time"], input[type="datetime-local"], [contenteditable="true"], .MuiInputBase-input'
    )
  ) {
    return;
  }

  // Add the marker if it doesn't already exist
  if (!inputElement.dataset.hasIntention) {
    const intention = createIntentionMarker();

    // Ensure the parent container is relative
    const container = inputElement.closest("div") || inputElement.parentElement;
    if (container) {
      container.style.position = "relative"; // Ensure relative positioning
      console.log("Appending marker to:", container);
      container.appendChild(intention); // Add the marker to the container
      inputElement.dataset.hasIntention = "true"; // Mark the field to avoid duplicates
      inputElement.intentionMarker = intention; // Attach the marker to the element for removal later

      // Adjust icon position dynamically
      updateIconPosition(inputElement, intention);

      // Adjust icon position on resize
      window.addEventListener("resize", () =>
        updateIconPosition(inputElement, intention)
      );
    }
  }
}

// Remove intention marker when the field loses focus
function handleBlur(event) {
  const inputElement = event.target;

  // Only act on valid text boxes
  if (
    !inputElement.matches(
      'textarea, input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="number"], input[type="tel"], input[type="url"], input[type="date"], input[type="time"], input[type="datetime-local"], [contenteditable="true"], .MuiInputBase-input'
    )
  ) {
    return;
  }

  // The element that is gaining focus (or null if none)
  const newFocusTarget = event.relatedTarget;

  // If the new focus is the icon (or inside .intention-marker), skip removal
  if (
    newFocusTarget && // not null
    newFocusTarget.closest && // function exists
    newFocusTarget.closest(".intention-marker")
  ) {
    // User is clicking on the marker -> don't remove it yet
    return;
  }

  // Otherwise, remove the marker
  if (inputElement.dataset.hasIntention && inputElement.intentionMarker) {
    inputElement.intentionMarker.remove();
    delete inputElement.dataset.hasIntention;
    delete inputElement.intentionMarker;
  }
}

// Attach event listeners to dynamically detect fields
function attachListenersToFields() {
  // Listen for focus and blur events on the document
  document.addEventListener("focus", handleFocus, true); // Use capture phase
  document.addEventListener("blur", handleBlur, true); // Use capture phase
}

// Observe DOM changes to handle dynamically added elements
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
          // Dynamically attach listeners to new nodes
          attachListenersToFields();
        }
      });
    });
  });

  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true, // Watch all levels of the DOM
  });
}

// Run the script when the page is fully loaded
window.addEventListener("load", () => {
  attachListenersToFields(); // Attach event listeners
  observeForDynamicFields(); // Start observing for dynamic fields
});

// Listen for input events on all desired text fields
document.addEventListener(
  "input",
  (e) => {
    if (e.target.matches("textarea, input, [contenteditable='true']")) {
      console.log("[Content] Detected input change:", e.target.value);
      handleInputChange(e);
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
