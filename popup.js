document.addEventListener("DOMContentLoaded", () => {
  console.log("[Popup] Requesting current text...");
  chrome.runtime.sendMessage({ action: "getCurrentText" }, (response) => {
    console.log("[Popup] Got response:", response);
    if (response && response.text) {
      document.getElementById("results").textContent = response.text;
    } else {
      document.getElementById("results").textContent = "[No text yet]";
    }
  });
});
