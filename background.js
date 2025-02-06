let currentText = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "applyTranslatedText") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "applyTranslatedText", translatedText: message.translatedText },
          (response) => {
            sendResponse(response);
          }
        );
      }
    });
    return true;
  }

  if (message.action === "openPopup") {;
    chrome.action.openPopup();
    sendResponse({ status: "Popup opened" });
  } else if (message.action === "updatedText") {

    if (message.text) {
      currentText = message.text;
    } else {
      currentText = "";
    }

    sendResponse({ status: "Text updated" });
  } else if (message.action === "getCurrentText") {
    sendResponse({ text: currentText });
  }

  return true;
});
