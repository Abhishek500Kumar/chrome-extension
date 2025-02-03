let currentText = ""; // Ensure this stores the latest text

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openPopup") {
        console.log("[Background] Received openPopup message");
        chrome.action.openPopup();
        sendResponse({ status: "Popup opened" });

    } else if (message.action === "updatedText") {
        console.log("[Background] Received updatedText:", message.text);

        if (message.text) {
            currentText = message.text;  // Store the latest entered text
            console.log("[Background] Updated stored text:", currentText);
        }

        sendResponse({ status: "Text updated" });

    } else if (message.action === "getCurrentText") {
        console.log("[Background] Sending stored text:", currentText);
        sendResponse({ text: currentText }); // Return stored text
    }

    return true; // Keep message channel open
});
