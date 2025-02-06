document.addEventListener("DOMContentLoaded", () => {
  const resultsElement = document.getElementById("results");
  const contentBox = document.querySelector(".description");
  const loader = createLoader();
  const gearIcon = document.getElementById("gear-icon");
  const modelDropdown = document.getElementById("model-dropdown");
  const modelSelect = document.getElementById("model-select");

  let currentIndex = 0;  // To track the current suggestion
  let apiResponse = null;  // Store the API response here

  // Get the reference to the input box
  const inputBox = document.querySelector("#input-box"); // Assuming the input box has the ID `input-box`

  if (gearIcon) {
    gearIcon.addEventListener("click", () => {
      modelDropdown.classList.toggle("hidden");
    });
  }

  contentBox.innerHTML = "";
  contentBox.appendChild(loader);

  chrome.runtime.sendMessage({ action: "getCurrentText" }, async (response) => {
    let enteredText = response && response.text ? response.text : "";

    if (!apiResponse) {
      try {
        apiResponse = await callGrammarCheckAPI(enteredText); // Call the API only once
      } catch (err) {
        console.error("Error calling API:", err);
        return;
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
    // Display the current suggestion
    resultsElement.innerHTML = `
      <h3>Suggestions:</h3>
      <p>${data.suggestions[currentIndex]}</p>
    `;

    // Create pagination controls
    const pagination = document.createElement('div');
    pagination.classList.add('pagination-controls');  // Use a new class for pagination

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
      applyButton.addEventListener("click", () => {
        inputBox.value = data.suggestions[currentIndex];  // Set the suggestion text into the input box
        window.close();  // Close the popup after applying
      });
    }
  }

  function updateSuggestion() {
    const data = apiResponse;
    const countText = document.querySelector('.count-text');
    countText.textContent = `${currentIndex + 1}/${data.suggestions.length}`;  // Update the count dynamically
    resultsElement.innerHTML = `
      <h3>Suggestions:</h3>
      <p>${data.suggestions[currentIndex]}</p>
    `;
  }

  /**
   * Call your grammar-check API
   * @param {string} content - The text content from the user
   * @returns {Promise<any>}
   */
  async function callGrammarCheckAPI(content) {
    const selectedModel = document.getElementById("model-select").value;

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
          target_language: "English"
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
