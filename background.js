let currentText = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    console.log("[Background] Received openPopup message");
    
    // Open the popup without creating a new window
    chrome.action.openPopup();

  } else if (message.action === "updatedText") {
    console.log("[Background] Received updatedText:", message);
    currentText = message.text;
  } else if (message.action === "getCurrentText") {
    sendResponse({ text: currentText });
  }
});
