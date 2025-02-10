document.addEventListener("DOMContentLoaded", () => {
  const resultsElement = document.getElementById("results");
  const contentBox = document.querySelector(".description");
  const loader = createLoader();
  const gearIcon = document.getElementById("gear-icon");
  const modelDropdown = document.getElementById("model-dropdown");
  const languageSelect = document.getElementById("language-select");
  const modelSelect = document.getElementById("model-select");
  const closeIcon = document.querySelector(".icon-small:nth-of-type(2)"); // X icon to close popup

  let currentIndex = 0;
  let apiResponse = null;
  let enteredText = ""; // Store the entered text globally

  // Toggle settings dropdown when gear icon is clicked
  // Get the reference to the input box

  const inputBox = document.querySelector("#input-box"); // Assuming the input box has the ID `input-box`

  if (gearIcon) {
    gearIcon.addEventListener("click", () => {
      modelDropdown.classList.toggle("hidden");
    });
  }

  // Close the popup and reset enteredText when the "X" icon is clicked
  if (closeIcon) {
    closeIcon.addEventListener("click", () => {
      enteredText = ""; // Reset entered text
      window.close(); // Close the popup
    });
  }

  // Load languages dynamically
  function loadLanguages() {
    fetch("languages.json")
      .then(response => response.json())
      .then(data => {
        // Clear out the old options (including the "Loading..." one)
        languageSelect.innerHTML = "";
  
        // Build new options
        data.languages.forEach((language, index) => {
          const option = document.createElement("option");
          option.value = language.toLowerCase();
          option.textContent = language;
          option.className = "options";
          // For the first language, auto‐select it
          if (index === 0) {
            option.selected = true;
          }
          languageSelect.appendChild(option);
        });
         // Now that the options are in place, default to the first one
      if (languageSelect.options.length > 0) {
        languageSelect.selectedIndex = 0; // or 1 if you keep a placeholder at index 0
      }
      })
      .catch(err => {
        console.error("Error fetching languages.json:", err);
        languageSelect.innerHTML = `<option value="" disabled>Error loading languages</option>`;
      });
  }
  

  // Handle Model or Language Change
  async function handleModelOrLanguageChange() {
    // Close the dropdown after selection
    modelDropdown.classList.add("hidden");

    // Show loader before making API call
    contentBox.innerHTML = "";
    contentBox.appendChild(loader);

    try {
      apiResponse = await callGrammarCheckAPI(enteredText);
       contentBox.innerHTML = ""; // Remove loader
       displaySuggestion(apiResponse);
    } catch (err) {
       console.error("Error calling API:", err);
       contentBox.innerHTML = "[Error fetching response]";
    }
  }

  // Event listeners for dropdowns (close dropdown & call API)
  modelSelect.addEventListener("change", handleModelOrLanguageChange);
  languageSelect.addEventListener("change", handleModelOrLanguageChange);

  // Load languages when the page loads
  loadLanguages();

  // Call API when the page loads
  contentBox.innerHTML = "";
  contentBox.appendChild(loader);

  chrome.runtime.sendMessage({ action: "getCurrentText" }, async (response) => {
    enteredText = response && response.text ? response.text : "";

    if (!apiResponse) {
      try {
        apiResponse = await callGrammarCheckAPI(enteredText);
        contentBox.innerHTML = "";
        displaySuggestion(apiResponse);
      } catch (err) {
        console.error("Error calling API:", err);
        contentBox.innerHTML = "[Error fetching response]";
      }
    }
    contentBox.innerHTML = "";



    if (apiResponse && apiResponse.suggestions) {

      displaySuggestion(apiResponse);

    } else {

      resultsElement.textContent = "[No response from API]";

      contentBox.appendChild(resultsElement);

    }
  });

  function displaySuggestion(data) {
    resultsElement.innerHTML = `
      <h3>Suggestions:</h3>
      <p>${data.suggestions[currentIndex]}</p>
    `;

    const pagination = document.createElement('div');
    pagination.classList.add('pagination-controls');

    const detailsGroup = document.createElement('div');
    detailsGroup.classList.add('details-group');

    const prevIcon = document.createElement('img');
    prevIcon.src = "https://cdn.builder.io/api/v1/image/assets/a5693eec7fa44ce89e83005cb2520e10/7a4492b5f92abee1f00d496caa83cfc332a191e2f07975f1c74cd0dff5635501?apiKey=a5693eec7fa44ce89e83005cb2520e10&";
    prevIcon.alt = "Previous Icon";
    prevIcon.classList.add('icon-count');
    prevIcon.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateSuggestion();
      }
    });

    const nextIcon = document.createElement('img');
    nextIcon.src = "https://cdn.builder.io/api/v1/image/assets/a5693eec7fa44ce89e83005cb2520e10/95098782961bfc5fd470012e75ec57f6ec1dccadbf19a6043e4ca95313985599?apiKey=a5693eec7fa44ce89e83005cb2520e10&";
    nextIcon.alt = "Next Icon";
    nextIcon.classList.add('sub-icon');
    nextIcon.addEventListener('click', () => {
      if (currentIndex < data.suggestions.length - 1) {
        currentIndex++;
        updateSuggestion();
      }
    });

    const countText = document.createElement('div');
    countText.classList.add('count-text');
    countText.textContent = `${currentIndex + 1}/${data.suggestions.length}`;

    detailsGroup.appendChild(prevIcon);
    detailsGroup.appendChild(countText);
    detailsGroup.appendChild(nextIcon);

    pagination.appendChild(detailsGroup);
    contentBox.appendChild(pagination);
    contentBox.appendChild(resultsElement);
    // Handle the "Ignore" button and close icon functionality

    const ignoreButton = document.querySelector(".button-ignore");

    if (ignoreButton) {

      ignoreButton.addEventListener("click", () => {

        window.close(); // Close the popup

      });

    }



    const icon2 = document.querySelector(".icon-small:nth-of-type(2)");

    icon2.addEventListener("click", () => {

      window.close(); // Close the popup when the close icon is clicked

    });



    // Apply the suggestion to the input box when "Apply" button is clicked

    const applyButton = document.querySelector(".button-apply");

    if (applyButton) {

      applyButton.addEventListener("click", (e) => {

        e.preventDefault();



        chrome.runtime.sendMessage({

          action: "applyTranslatedText",

          translatedText: data.suggestions[currentIndex]

        },

        (response) => {

          console.log("Response from content script:", response);

          // Optionally, close popup or show a "success" message

        });

    });
  }
}

  function updateSuggestion() {
    const data = apiResponse;
    console.log("data", data);

    const countText = document.querySelector('.count-text');
    countText.textContent = `${currentIndex + 1}/${data.suggestions.length}`;
    resultsElement.innerHTML = `
      <h3>Suggestions:</h3>
      <p>${data.suggestions[currentIndex]}</p>
    `;
  }

  async function callGrammarCheckAPI(content) {
    const selectedModel = modelSelect.value;
    const selectedLanguage = languageSelect.value || "english";

    const response = await fetch(
      "http://127.0.0.1:5000/patient_notes_language_translate_grammarCheck",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzNDUifQ.Q_eazHvQW_QdFmv6R18-abRFhvqtn7alcL26zPdvMg4"
        },
        body: JSON.stringify({
          content: content,
          model: selectedModel,
          target_language: selectedLanguage
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  }

  function createLoader() {
    const loader = document.createElement("div");
    loader.classList.add("loader");
    loader.style.width = "30px";
    loader.style.height = "30px";
    loader.style.border = "4px solid transparent";
    loader.style.borderTop = "4px solid rgb(243, 141, 7)";
    loader.style.borderRadius = "50%";
    loader.style.animation = "spin 1.5s linear infinite";
    loader.style.pointerEvents = "none";
    loader.style.margin = "auto";

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
});
