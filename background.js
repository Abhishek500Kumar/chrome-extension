let currentText = "";
let userProfile = null;
let accessToken = null;

chrome.runtime.onStartup.addListener(() => {
  console.log("Extension restarted: Resetting text memory");
  currentText = ""; // Reset stored text when the extension restarts
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {


  if (message.action === "logout") {
    chrome.storage.local.remove(["userProfile", "accessToken"], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  // ===================
  // 1) Sign-In Handler
  // ===================
  if (message.action === "signInWithGoogle") {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error("Error during getAuthToken:", chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: "Bearer " + token }
      })
        .then((r) => r.json())
        .then((profile) => {
          userProfile = profile;
          accessToken = token;
          chrome.storage.local.set({ userProfile, accessToken });
          checkUserProfileData(token, userProfile);
          sendResponse({ success: true, profile });
        })
        .catch((err) => {
          console.error("Error fetching user profile:", err);
          sendResponse({ error: err.toString() });
        });
    });

    return true; // Keep sendResponse channel open (async)
  }


  async function checkUserProfileData(content, userinfo) {
    //const token = modelSelect.value;
    //const selectedLanguage = languageSelect.value || "english";
    try {
    const response = await fetch(`${CONFIG.API_URL}/verify_userProfile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          `Bearer ${content}`
      },
      body: JSON.stringify({
        content,
        userinfo
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const jsonResponse = await response.json();
        //console.log("API JSON Response:", jsonResponse);
        braidedToken = jsonResponse.token;
        // console.log("braidedToken:- ", braidedToken);
        chrome.storage.local.set({ braidedToken });
        return jsonResponse;
    } catch (error) {
        console.error("Error calling API:", error);
        throw error;
    }
  }

  // ===================
  // 2) Return User Profile
  // ===================
// When checking user profile, refresh token if needed
function refreshAuthToken(callback) {
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (chrome.runtime.lastError) {
      console.error("Error refreshing token:", chrome.runtime.lastError);
      callback(null);
      return;
    }
    
    accessToken = token;
    chrome.storage.local.set({ accessToken });
    callback(token);
  });
}


if (message.action === "getUserProfile") {
  chrome.storage.local.get(["userProfile"], (data) => {
    if (data.userProfile) {
      refreshAuthToken((newToken) => {
        if (newToken) {
          sendResponse({ profile: data.userProfile });
        } else {
          sendResponse({ profile: null }); // If token refresh fails, ask user to log in
        }
      });
    } else {
      sendResponse({ profile: null });
    }
  });
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