let currentText = "";
let userProfile = null;
let accessToken = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {


  if (message.action === "logout") {
    // Clear out your stored variables
    userProfile = null;
    accessToken = null;

    // Optionally remove cached auth token from Chrome, so they must re-login
    chrome.identity.clearAllCachedAuthTokens((callback) => {
      // Or use removeCachedAuthToken if you prefer
      sendResponse({ success: true });
    });

    return true; // Make sure to keep the channel open for async
  }

  // ===================
  // 1) Sign-In Handler
  // ===================
  if (message.action === "signInWithGoogle") {
    // This triggers the OAuth flow
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error("Error during getAuthToken:", chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      // Store token
      accessToken = token;
      console.log("Got access token:", token);

      // Fetch user info (name, picture, etc.)
      fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: "Bearer " + token }
      })
        .then((r) => r.json())
        .then((profile) => {
          userProfile = profile;
          console.log("User profile:", userProfile);
          // Respond to popup with the user profile
          sendResponse({ success: true, profile });
        })
        .catch((err) => {
          console.error("Error fetching user profile:", err);
          sendResponse({ error: err.toString() });
        });
    });

    return true; // Keep sendResponse channel open (async)
  }

  // ===================
  // 2) Return User Profile
  // ===================
  if (message.action === "getUserProfile") {
    sendResponse({ profile: userProfile });
    return true;
  }

  // ===================
  // 3) Existing Code
  // ===================
  if (message.action === "applyTranslatedText") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "applyTranslatedText",
            translatedText: message.translatedText
          },
          (response) => {
            sendResponse(response);
          }
        );
      }
    });
    return true;
  }

  if (message.action === "openPopup") {
    chrome.action.openPopup();
    sendResponse({ status: "Popup opened" });
  } else if (message.action === "updatedText") {
    currentText = message.text ? message.text : "";
    sendResponse({ status: "Text updated" });
  } else if (message.action === "getCurrentText") {
    sendResponse({ text: currentText });
  }

  return true;
});
