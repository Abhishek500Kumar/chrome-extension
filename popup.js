document.addEventListener("DOMContentLoaded", () => {
  const resultsElement = document.getElementById("results");

  // Create the loader
  const loader = createLoader();

  // Add the loader to the popup
  const contentBox = document.querySelector(".description");
  contentBox.innerHTML = ""; // Clear any existing content
  contentBox.appendChild(loader);

  // Show the loader for 4 seconds, then show the actual text
  setTimeout(() => {
    chrome.runtime.sendMessage({ action: "getCurrentText" }, (response) => {
      if (response && response.text) {
        resultsElement.textContent = response.text;
      } else {
        resultsElement.textContent = "[No text yet]";
      }

      // Remove the loader and show the actual content
      contentBox.innerHTML = "";
      contentBox.appendChild(resultsElement);
    });
  }, 4000); // Wait for 4 seconds before showing the results

  const icon2 = document.querySelector(".icon-small:nth-of-type(2)");
  icon2.addEventListener("click", () => {
    window.close(); // Close the popup when "Icon 2" is clicked
  });
});

// Loader creation function
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
