(() => {
    const launcher = document.getElementById("aiLauncher");
    const panel = document.getElementById("aiPanel");
    const closeButton = document.getElementById("aiClose");
    const form = document.getElementById("aiForm");
    const input = document.getElementById("aiInput");
    const messages = document.getElementById("aiMessages");
    const micButton = document.getElementById("aiMic");
    const voiceStatus = document.getElementById("aiVoiceStatus");
    const promptButtons = document.querySelectorAll("[data-ai-prompt]");

    if (!launcher || !panel || !form || !input || !messages) return;

    const addMessage = (text, type) => {
        const message = document.createElement("div");
        message.className = `ai-message ${type}`;
        message.textContent = text;
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
    };

    const addListingLinks = (listings) => {
        if (!Array.isArray(listings) || !listings.length) return;

        const listingLinks = document.createElement("div");
        listingLinks.className = "ai-listing-links";

        listings.slice(0, 4).forEach((listing) => {
            const link = document.createElement("a");
            link.className = "ai-listing-link";
            link.href = `/listings/${encodeURIComponent(listing.id)}`;

            const title = document.createElement("strong");
            title.textContent = listing.title;
            const details = document.createElement("span");
            details.textContent = `₹${Number(listing.price || 0).toLocaleString("en-IN")}/night · ${listing.location}, ${listing.country}`;

            link.append(title, details);
            listingLinks.appendChild(link);
        });

        messages.appendChild(listingLinks);
        messages.scrollTop = messages.scrollHeight;
    };

    const sendMessage = async (message) => {
        addMessage(message, "user");
        input.value = "";
        input.disabled = true;
        addMessage("Let me check WanderNest stays for you...", "bot");
        const loadingMessage = messages.lastElementChild;

        try {
            const response = await fetch("/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });
            const data = await response.json();
            loadingMessage.textContent = response.ok ? data.reply : (data.error || "I could not process that request.");
            if (response.ok) addListingLinks(data.listings);
        } catch (error) {
            loadingMessage.textContent = "I am unable to connect right now. Please try again in a moment.";
        } finally {
            input.disabled = false;
            input.focus();
        }
    };

    launcher.addEventListener("click", () => {
        panel.hidden = !panel.hidden;
        if (!panel.hidden) input.focus();
    });

    closeButton?.addEventListener("click", () => {
        panel.hidden = true;
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const message = input.value.trim();
        if (message) sendMessage(message);
    });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (micButton && voiceStatus && SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-IN";
        let isListening = false;

        const setListening = (value) => {
            isListening = value;
            micButton.classList.toggle("is-listening", value);
            micButton.setAttribute("aria-pressed", String(value));
            micButton.innerHTML = value
                ? '<i class="fa-solid fa-stop"></i>'
                : '<i class="fa-solid fa-microphone"></i>';
            voiceStatus.textContent = value ? "Listening... speak your question" : "";
        };

        micButton.addEventListener("click", () => {
            if (isListening) {
                recognition.stop();
                return;
            }
            input.focus();
            recognition.start();
        });

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0].transcript)
                .join("");
            input.value = transcript;
        };

        recognition.onerror = (event) => {
            voiceStatus.textContent = event.error === "not-allowed"
                ? "Microphone permission is required."
                : "Voice input could not be started. Try again.";
            setListening(false);
        };

        recognition.onend = () => setListening(false);
        recognition.onstart = () => setListening(true);
    } else if (micButton) {
        micButton.hidden = true;
    }

    promptButtons.forEach((button) => {
        button.addEventListener("click", () => sendMessage(button.dataset.aiPrompt));
    });
})();
