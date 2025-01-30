console.log("Content script loaded!");

// Function to create the intention marker with an icon
function createIntentionMarker() {
  console.log("Creating intention marker");
  const intention = document.createElement("div");
  intention.classList.add("intention-marker");

  intention.style.pointerEvents = "auto";
  
  // Create an image element for the icon
  const img = document.createElement("img");
  img.src =
    "https://media.istockphoto.com/id/1306552437/vector/abstract-letter-b-modern-logo-icon-design-concept-creative-bright-gradient-symbol-logotype.jpg?s=612x612&w=0&k=20&c=BTl_8Li8b5DgnJ_Ii8UV_8JTdzVvkZsDCxQYXSgTCa8="; // Replace with your icon URL or local path
  img.alt = "Intention Icon";
  img.style.width = "20px";
  img.style.height = "20px";

  // Also ensure the image can receive clicks:
  img.style.pointerEvents = "auto";

  img.addEventListener('mousedown', (event) => {
    // Prevent the input from losing focus
    event.preventDefault();
    // Do NOT stopPropagation here, so the click can still happen
  });
  
  img.addEventListener('click', (event) => {
    console.log('Icon clicked!');
    // For example, open your popup
    if (typeof chrome.runtime !== 'undefined') {
      chrome.runtime.sendMessage({ action: 'openPopup' });
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
    newFocusTarget &&            // not null
    newFocusTarget.closest &&    // function exists
    newFocusTarget.closest('.intention-marker')
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
document.addEventListener("input", (e) => {
      // console.log("");
      
      chrome.runtime.sendMessage({
        action: "updatedText",
        text: e.target.value,
      });
});
