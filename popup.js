document.addEventListener("DOMContentLoaded", () => {
  // ─────────────────────────────────────────────────────────
  //  1) Global variables and references
  // ─────────────────────────────────────────────────────────
  let isUserLoggedIn = false;
  let apiResponse = null;
  let enteredText = ""; // Store the entered text globally
  let currentIndex = 0;

  // DOM Elements
  const loginScreen = document.getElementById("login-screen");
  const mainContentScreen = document.getElementById("main-content-screen");
  const signInButton = document.getElementById("googleSignInButton");
  const profileImage = document.getElementById("profile-image");
  const profileDropdown = document.getElementById("profile-dropdown");
  const logoutButton = document.getElementById("logoutButton");

  const contentBox = document.querySelector(".description");
  const resultsElement = document.getElementById("results");
  const gearIcon = document.getElementById("gear-icon");
  const modelDropdown = document.getElementById("model-dropdown");
  const languageSelect = document.getElementById("language-select");
  const modelSelect = document.getElementById("model-select");
  const closeIcon = document.querySelector(".icon-small:nth-of-type(2)");
  const ignoreButton = document.querySelector(".button-ignore");
  const applyButton = document.querySelector(".button-apply");

  const loader = createLoader();

  // ─────────────────────────────────────────────────────────
  //  2) On popup load, check if user is logged in
  // ─────────────────────────────────────────────────────────
  chrome.runtime.sendMessage({ action: "getUserProfile" }, (response) => {
    if (response && response.profile) {
      isUserLoggedIn = true;
      displayUserProfile(response.profile);
      showMainScreen();
    } else {
      showLoginScreen();
    }
  });

  // ─────────────────────────────────────────────────────────
  //  3) Sign-In button
  // ─────────────────────────────────────────────────────────
  signInButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "signInWithGoogle" }, (res) => {
      if (res && res.profile) {
        isUserLoggedIn = true;
        displayUserProfile(res.profile);
        showMainScreen();
      } else {
        console.error("Sign-in failed or user canceled:", res?.error);
      }
    });
  });

  // ─────────────────────────────────────────────────────────
  //  4) Logout button
  // ─────────────────────────────────────────────────────────
  logoutButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "logout" }, (res) => {
      if (res?.success) {
        isUserLoggedIn = false;
        profileImage.src = "";
        profileDropdown.classList.remove("show");
        showLoginScreen();
      } else {
        console.error("Failed to logout or user was not logged in.");
      }
    });
  });

  // ─────────────────────────────────────────────────────────
  //  5) Screen toggles
  // ─────────────────────────────────────────────────────────
  function showLoginScreen() {
    loginScreen.style.display = "block";
    mainContentScreen.style.display = "none";
  }

  function showMainScreen() {
    loginScreen.style.display = "none";
    mainContentScreen.style.display = "block";

    // Once the main screen is visible, initialize content
    initMainContent();
  }

  // ─────────────────────────────────────────────────────────
  //  6) Main content initialization
  // ─────────────────────────────────────────────────────────
  async function initMainContent() {
    // 6a) Load languages once
    loadLanguages();

    // 6b) Retrieve the current text from the content script
    chrome.runtime.sendMessage({ action: "getCurrentText" }, async (response) => {
      enteredText = response?.text || "";

      // 6c) Now that we know user is logged in and have the text,
      //     we do an initial grammar check
      await updateGrammarCheck(enteredText);
    });

    // If the user changes model or language, re-check
    modelSelect.addEventListener("change", () => {
      if (isUserLoggedIn) {
        updateGrammarCheck(enteredText);
      }
    });
    languageSelect.addEventListener("change", () => {
      if (isUserLoggedIn) {
        updateGrammarCheck(enteredText);
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  //  7) Central place to call grammar check
  // ─────────────────────────────────────────────────────────
  async function updateGrammarCheck(text) {
    contentBox.innerHTML = "";
    contentBox.appendChild(loader);

    try {
      apiResponse = await callGrammarCheckAPI(text);
      contentBox.innerHTML = ""; // remove loader
      displaySuggestion(apiResponse);
    } catch (err) {
      console.error("Error calling API:", err);
      contentBox.innerHTML = "[Error fetching response]";
    }
  }

  // ─────────────────────────────────────────────────────────
  //  8) Display suggestions
  // ─────────────────────────────────────────────────────────
  function displaySuggestion(data) {
    if (!data || !data.suggestions) {
      resultsElement.textContent = "[No suggestions from API]";
      contentBox.appendChild(resultsElement);
      return;
    }

    currentIndex = 0; // Reset to first suggestion
    updateSuggestionUI(data);

    // Ignore button: close popup
    if (ignoreButton) {
      ignoreButton.onclick = () => window.close();
    }

    // Close icon: close popup
    if (closeIcon) {
      closeIcon.onclick = () => window.close();
    }

    // Apply button
    if (applyButton) {
      applyButton.onclick = (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage(
          {
            action: "applyTranslatedText",
            translatedText: data.suggestions[currentIndex],
          },
          (response) => {
            console.log("Response from content script:", response);
            // optionally close popup or show message
          }
        );
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  //  9) Update UI for next/prev suggestion
  // ─────────────────────────────────────────────────────────
  function updateSuggestionUI(data) {
    // Clear existing
    resultsElement.innerHTML = `
      <h3>Suggestions:</h3>
      <p>${data.suggestions[currentIndex]}</p>
    `;
    contentBox.innerHTML = "";
    contentBox.appendChild(resultsElement);

    // Build pagination controls
    const pagination = document.createElement("div");
    pagination.classList.add("pagination-controls");

    const detailsGroup = document.createElement("div");
    detailsGroup.classList.add("details-group");

    // Previous icon
    const prevIcon = document.createElement("img");
    prevIcon.src = "https://cdn.builder.io/api/v1/image/assets/a5693eec7fa44ce89e83005cb2520e10/7a4492b5f92abee1f00d496caa83cfc332a191e2f07975f1c74cd0dff5635501?apiKey=a5693eec7fa44ce89e83005cb2520e10&";  // replace with your own
    prevIcon.classList.add("icon-count");
    prevIcon.onclick = () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateSuggestionUI(data);
      }
    };

    // Next icon
    const nextIcon = document.createElement("img");
    nextIcon.src = "https://cdn.builder.io/api/v1/image/assets/a5693eec7fa44ce89e83005cb2520e10/95098782961bfc5fd470012e75ec57f6ec1dccadbf19a6043e4ca95313985599?apiKey=a5693eec7fa44ce89e83005cb2520e10&"; // replace with your own
    nextIcon.classList.add("sub-icon");
    nextIcon.onclick = () => {
      if (currentIndex < data.suggestions.length - 1) {
        currentIndex++;
        updateSuggestionUI(data);
      }
    };

    // Count
    const countText = document.createElement("div");
    countText.classList.add("count-text");
    countText.textContent = `${currentIndex + 1}/${data.suggestions.length}`;

    detailsGroup.appendChild(prevIcon);
    detailsGroup.appendChild(countText);
    detailsGroup.appendChild(nextIcon);

    pagination.appendChild(detailsGroup);
    contentBox.appendChild(pagination);
  }

  // ─────────────────────────────────────────────────────────
  // 10) Call your backend grammar check
  // ─────────────────────────────────────────────────────────
  async function callGrammarCheckAPI(content) {
    const selectedModel = modelSelect.value;
    const selectedLanguage = languageSelect.value || "english";

    const response = await fetch("http://127.0.0.1:5000/patient_notes_language_translate_grammarCheck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzNDUifQ.Q_eazHvQW_QdFmv6R18-abRFhvqtn7alcL26zPdvMg4"
      },
      body: JSON.stringify({
        content,
        model: selectedModel,
        target_language: selectedLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  }

  // ─────────────────────────────────────────────────────────
  // 11) Load languages dynamically
  // ─────────────────────────────────────────────────────────
  function loadLanguages() {
    fetch("languages.json")
      .then((response) => response.json())
      .then((data) => {
        languageSelect.innerHTML = ""; // Clear old options
        data.languages.forEach((lang, index) => {
          const option = document.createElement("option");
          option.value = lang.toLowerCase();
          option.textContent = lang;
          if (index === 0) option.selected = true;
          languageSelect.appendChild(option);
        });
      })
      .catch((err) => {
        console.error("Error fetching languages.json:", err);
        languageSelect.innerHTML = `<option disabled>Error loading languages</option>`;
      });
  }

  // ─────────────────────────────────────────────────────────
  // 12) Profile image dropdown toggle
  // ─────────────────────────────────────────────────────────
  profileImage.addEventListener("click", () => {
    profileDropdown.classList.toggle("show");
  });

  // ─────────────────────────────────────────────────────────
  // 13) Utility: Loader
  // ─────────────────────────────────────────────────────────
  function createLoader() {
    const loader = document.createElement("div");
    loader.classList.add("loader");
    loader.style.width = "30px";
    loader.style.height = "30px";
    loader.style.border = "4px solid transparent";
    loader.style.borderTop = "4px solid rgb(243, 141, 7)";
    loader.style.borderRadius = "50%";
    loader.style.animation = "spin 1.5s linear infinite";
    loader.style.margin = "auto";
    loader.style.pointerEvents = "none";

    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return loader;
  }

  // ─────────────────────────────────────────────────────────
  // 14) Utility: show user’s picture + name
  // ─────────────────────────────────────────────────────────
  function displayUserProfile(profile) {
    if (profileImage && profile.picture) {
      profileImage.src = profile.picture;
      profileImage.alt = profile.name || "Profile Picture";
    }
    const nameEl = document.getElementById("user-name");
    if (nameEl && profile.name) {
      nameEl.textContent = profile.name;
    }
  }
});
